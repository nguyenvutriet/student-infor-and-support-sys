package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.handler.ChatException;
import nvt.vn.student_web_core.model.*;
import nvt.vn.student_web_core.payload.chat.ChatDto.*;
import nvt.vn.student_web_core.repository.*;
import nvt.vn.student_web_core.util.AuthUtil;
import nvt.vn.student_web_core.websocket.ChatEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Nghiệp vụ nhắn tin / yêu cầu hỗ trợ (UC 21–31).
 * Mọi thay đổi đều kiểm tra quyền + trạng thái ngay trong transaction (có khóa dòng),
 * sau khi commit mới đẩy sự kiện realtime qua WebSocket.
 *
 * Quy ước: mỗi đơn vị chỉ có 1 nhân viên → nhân viên của đơn vị tiếp nhận (toDepartment) chính là người phụ trách.
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_FILES = 5;
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final int MAX_CONTENT = 255;
    private static final int MAX_NOTE = 200;

    private final RequestRepo requestRepo;
    private final MessageRepo messageRepo;
    private final ConversationRepo conversationRepo;
    private final DepartmentRepo departmentRepo;
    private final StaffRepo staffRepo;
    private final StudentRepo studentRepo;
    private final UserRepo userRepo;
    private final NotificationRepo notificationRepo;
    private final RequestStatusHistoryRepo historyRepo;
    private final ForwardingLogRepo forwardingLogRepo;
    private final SupportInvitationRepo invitationRepo;
    private final FileRepo fileRepo;
    private final CloudinaryService cloudinaryService;
    private final ChatEventPublisher publisher;
    private final AuthUtil authUtil;

    /** OWNER: sinh viên tạo; DEPT: nhân viên đơn vị tiếp nhận; INVITED: đơn vị được mời đã tiếp nhận; INVITED_PENDING: được mời nhưng chưa tiếp nhận. */
    private enum Access { OWNER, DEPT, INVITED, INVITED_PENDING }

    private record Actor(User user, Student student, Staff staff) {
        String id() { return user.getUserId(); }
        String departmentId() { return staff.getDepartment().getDepartmentId(); }
        String departmentName() { return staff.getDepartment().getName(); }
        boolean isStudent() { return student != null; }
    }

    // ------------------------------------------------------------------ tiện ích chung

    private Actor actor() {
        User u = authUtil.loggedInUser();
        if (u.getRole() == Role.STUDENT) {
            return new Actor(u, studentRepo.findById(u.getUserId())
                    .orElseThrow(() -> ChatException.forbidden("Không tìm thấy sinh viên")), null);
        }
        if (u.getRole() == Role.STAFF) {
            Staff s = staffRepo.findById(u.getUserId())
                    .orElseThrow(() -> ChatException.forbidden("Không tìm thấy nhân viên"));
            if (s.getDepartment() == null) throw ChatException.forbidden("Tài khoản chưa thuộc đơn vị nào");
            return new Actor(u, null, s);
        }
        throw ChatException.forbidden("Không có quyền sử dụng chức năng nhắn tin");
    }

    private Access accessOf(Actor a, Request r) {
        if (a.isStudent()) {
            return r.getStudent().getUserId().equals(a.id()) ? Access.OWNER : null;
        }
        String dept = a.departmentId();
        if (r.getToDepartment() != null && r.getToDepartment().getDepartmentId().equals(dept)) return Access.DEPT;
        return invitationRepo.findByRequest_RequestIdAndDepartment_DepartmentId(r.getRequestId(), dept)
                .map(si -> si.isAccepted() ? Access.INVITED : Access.INVITED_PENDING)
                .orElse(null);
    }

    private record Loaded(Request request, Access access) {}

    private Loaded load(Actor a, Integer id, boolean forUpdate) {
        Optional<Request> opt = forUpdate ? requestRepo.findByIdForUpdate(id) : requestRepo.findById(id);
        Request r = opt.filter(x -> !x.isDeleted())
                .orElseThrow(() -> ChatException.notFound("Yêu cầu không còn tồn tại"));
        Access acc = accessOf(a, r);
        if (acc == null) throw ChatException.forbidden("Bạn không có quyền truy cập yêu cầu này");
        return new Loaded(r, acc);
    }

    private Set<String> recipients(Request r, String... extraDepartmentIds) {
        Set<String> ids = new LinkedHashSet<>();
        ids.add(r.getStudent().getUserId());
        Set<String> depts = new LinkedHashSet<>();
        if (r.getToDepartment() != null) depts.add(r.getToDepartment().getDepartmentId());
        invitationRepo.findByRequest_RequestId(r.getRequestId())
                .forEach(si -> depts.add(si.getDepartment().getDepartmentId()));
        depts.addAll(Arrays.asList(extraDepartmentIds));
        depts.forEach(d -> staffRepo.findByDepartment_DepartmentId(d).forEach(s -> ids.add(s.getUserId())));
        return ids;
    }

    private void emit(String type, Request r, Object payload, Collection<String> to) {
        publisher.publish(to, new ChatEvent(type, r.getRequestId(), payload));
    }

    private void notifyUsers(Collection<String> userIds, NotificationType type, String content) {
        LocalDateTime now = LocalDateTime.now();
        for (String uid : userIds) {
            Notification n = new Notification();
            n.setUser(userRepo.getReferenceById(uid));
            n.setType(type);
            n.setContent(content);
            n.setCreateAt(now);
            notificationRepo.save(n);
        }
    }

    private List<String> staffIdsOf(String departmentId) {
        return staffRepo.findByDepartment_DepartmentId(departmentId).stream().map(Staff::getUserId).toList();
    }

    private void addHistory(Request r, RequestStatus status, String action, Actor a, String deptName, String note) {
        RequestStatusHistory h = new RequestStatusHistory();
        h.setRequest(r);
        h.setStatus(status);
        h.setAction(action);
        h.setActorName(a.user().getFullName());
        h.setDepartmentName(deptName);
        h.setNote(note == null || note.isBlank() ? null : note);
        h.setCreateAt(LocalDateTime.now());
        historyRepo.save(h);
    }

    private Message saveMessage(Conversation c, User sender, String content, MessageType type) {
        Message m = new Message();
        m.setConversation(c);
        m.setSender(sender);
        m.setContent(content);
        m.setType(type);
        m.setSendAt(LocalDateTime.now());
        return messageRepo.save(m);
    }

    /** Lưu dòng log hệ thống trong đoạn chat và đẩy realtime. */
    private void systemLine(Request r, Actor a, String text, Collection<String> to) {
        Message sys = saveMessage(r.getConversation(), a.user(), text, MessageType.SYSTEM);
        emit("MESSAGE_CREATED", r, toMessage(sys, r.getRequestId()), to);
    }

    private static String blank(String s) { return s == null ? "" : s.trim(); }

    /** Ghi chú / lý do: tối đa 200 ký tự, chỉ hiển thị kèm lịch sử xử lý. */
    private static String note(String s) {
        String n = blank(s);
        if (n.length() > MAX_NOTE) throw ChatException.badRequest("Ghi chú không được vượt quá " + MAX_NOTE + " ký tự");
        return n;
    }

    // ------------------------------------------------------------------ DTO

    /** Thời điểm hoạt động gần nhất = max(ngày tạo, tin nhắn cuối, lịch sử cuối) – Request không có cột updatedAt. */
    private Map<Integer, LocalDateTime> lastActivity(List<Request> rs) {
        Map<Integer, LocalDateTime> res = new HashMap<>();
        if (rs.isEmpty()) return res;
        Map<Integer, Integer> conToReq = new HashMap<>();
        for (Request r : rs) {
            res.put(r.getRequestId(), r.getCreatedAt());
            if (r.getConversation() != null) conToReq.put(r.getConversation().getConId(), r.getRequestId());
        }
        if (!conToReq.isEmpty()) {
            for (Object[] row : messageRepo.lastMessageTimes(new ArrayList<>(conToReq.keySet())))
                res.merge(conToReq.get((Integer) row[0]), (LocalDateTime) row[1], ChatService::later);
        }
        for (Object[] row : historyRepo.lastHistoryTimes(rs.stream().map(Request::getRequestId).toList()))
            res.merge((Integer) row[0], (LocalDateTime) row[1], ChatService::later);
        return res;
    }

    private static LocalDateTime later(LocalDateTime a, LocalDateTime b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isAfter(b) ? a : b;
    }

    private RequestSummary toSummary(Request r, LocalDateTime updatedAt, boolean deletable) {
        Department d = r.getToDepartment();
        return new RequestSummary(r.getRequestId(), r.getSubject(), r.getStatus().name(),
                r.getCreatedAt(), updatedAt,
                r.getStudent().getUserId(), r.getStudent().getFullName(),
                d == null ? null : d.getDepartmentId(), d == null ? null : d.getName(), deletable);
    }

    /** Chỉ được xóa khi đang chờ tiếp nhận VÀ chưa từng được tiếp nhận (chuyển tiếp / trả về cũng quay lại "chờ tiếp nhận" nhưng không được xóa). */
    private boolean deletable(Request r) {
        return r.getStatus() == RequestStatus.PENDING
                && !historyRepo.existsByRequest_RequestIdAndStatus(r.getRequestId(), RequestStatus.ACCEPTED);
    }

    private Permissions permissions(Access acc, Request r) {
        RequestStatus st = r.getStatus();
        boolean accepting = (acc == Access.DEPT && st == RequestStatus.PENDING)
                || (acc == Access.INVITED_PENDING && st == RequestStatus.ACCEPTED);
        boolean lead = acc == Access.DEPT && st == RequestStatus.ACCEPTED;
        boolean open = st == RequestStatus.ACCEPTED && !r.getConversation().isClosed() && acc != Access.INVITED_PENDING;
        return new Permissions(accepting, accepting, lead, lead, lead, open,
                acc == Access.OWNER && deletable(r));
    }

    private RequestDetail toDetail(Request r, Access acc) {
        Department d = r.getToDepartment();
        List<DepartmentOption> invited = invitationRepo.findByRequest_RequestId(r.getRequestId()).stream()
                .map(si -> new DepartmentOption(si.getDepartment().getDepartmentId(), si.getDepartment().getName()))
                .toList();
        List<RequestStatusHistory> histories = historyRepo.findByRequest_RequestIdOrderByCreateAtDescHistoryIdDesc(r.getRequestId());
        List<HistoryItem> hist = histories.stream()
                .map(x -> new HistoryItem(x.getAction(), x.getStatus() == null ? null : x.getStatus().name(),
                        x.getCreateAt(), x.getActorName(), x.getDepartmentName(), x.getNote())).toList();
        RequestStatus st = r.getStatus();
        Staff h = (d != null && (st == RequestStatus.ACCEPTED || st == RequestStatus.CLOSED))
                ? staffRepo.findByDepartment_DepartmentId(d.getDepartmentId()).stream().findFirst().orElse(null) : null;
        return new RequestDetail(r.getRequestId(), r.getSubject(), r.getDescription(), st.name(),
                r.getCreatedAt(), lastActivity(List.of(r)).get(r.getRequestId()),
                r.getStudent().getUserId(), r.getStudent().getFullName(),
                d == null ? null : d.getDepartmentId(), d == null ? null : d.getName(),
                h == null ? null : h.getUserId(), h == null ? null : h.getFullName(),
                null, null, invited, hist, acc.name(), permissions(acc, r));
    }

    private MessageDto toMessage(Message m, Integer requestId) {
        boolean rec = m.isRecalled();
        List<AttachmentDto> files = rec ? List.of() : m.getAttachments().stream()
                .map(f -> new AttachmentDto(f.getFileId(), f.getFileName(), f.getFileUrl(), f.getFileType(), f.getFileSize()))
                .toList();
        User s = m.getSender();
        return new MessageDto(m.getMessId(), requestId, s.getUserId(), s.getFullName(),
                s.getRole() == null ? null : s.getRole().name(),
                (m.getType() == null ? MessageType.USER : m.getType()).name(),
                rec ? null : m.getContent(), m.getSendAt(), rec, files);
    }

    // ------------------------------------------------------------------ UC21 truy cập / danh sách

    @Transactional(readOnly = true)
    public List<DepartmentOption> departments() {
        return departmentRepo.findAll().stream()
                .map(d -> new DepartmentOption(d.getDepartmentId(), d.getName()))
                .sorted(Comparator.comparing(DepartmentOption::name, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    /** tab (chỉ nhân viên): REQUESTS = cần tiếp nhận, MESSAGES = đã tiếp nhận / đang tham gia. */
    @Transactional(readOnly = true)
    public List<RequestSummary> list(String tab, String status, String q) {
        Actor a = actor();
        String kw = "%" + blank(q).toLowerCase(Locale.ROOT) + "%";
        List<RequestStatus> statuses;
        if (blank(status).isEmpty()) {
            statuses = Arrays.asList(RequestStatus.values());
        } else {
            try { statuses = List.of(RequestStatus.valueOf(status.trim())); }
            catch (IllegalArgumentException e) { throw ChatException.badRequest("Trạng thái không hợp lệ"); }
        }
        List<Request> rs;
        if (a.isStudent()) {
            rs = requestRepo.searchForStudent(a.id(), statuses, kw);
        } else if ("REQUESTS".equalsIgnoreCase(tab)) {
            rs = requestRepo.searchPendingForDepartment(a.departmentId(), kw);
        } else {
            rs = requestRepo.searchConversationsForDepartment(a.departmentId(), statuses, kw);
        }
        Map<Integer, LocalDateTime> act = lastActivity(rs);
        Set<Integer> accepted = rs.isEmpty() ? Set.of()
                : new HashSet<>(historyRepo.findAcceptedRequestIds(rs.stream().map(Request::getRequestId).toList()));
        return rs.stream().map(r -> toSummary(r, act.get(r.getRequestId()),
                        r.getStatus() == RequestStatus.PENDING && !accepted.contains(r.getRequestId())))
                .sorted(Comparator.comparing(RequestSummary::updatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    // ------------------------------------------------------------------ UC22 tạo yêu cầu

    @Transactional
    public RequestDetail create(CreateRequestBody b) {
        Actor a = actor();
        if (!a.isStudent()) throw ChatException.forbidden("Chỉ sinh viên mới được tạo yêu cầu");
        String subject = blank(b == null ? null : b.subject());
        String desc = blank(b == null ? null : b.description());
        String deptId = blank(b == null ? null : b.departmentId());
        if (subject.isEmpty() || desc.isEmpty() || deptId.isEmpty())
            throw ChatException.badRequest("Vui lòng nhập đầy đủ đơn vị tiếp nhận, tiêu đề và nội dung");
        if (subject.length() > 255) throw ChatException.badRequest("Tiêu đề không được vượt quá 255 ký tự");
        if (desc.length() > MAX_CONTENT) throw ChatException.badRequest("Nội dung không được vượt quá " + MAX_CONTENT + " ký tự");
        Department dept = departmentRepo.findById(deptId)
                .orElseThrow(() -> ChatException.badRequest("Đơn vị tiếp nhận không tồn tại"));

        LocalDateTime now = LocalDateTime.now();
        Conversation c = new Conversation();
        c.setSubject(subject);
        c.setCreatedAt(now);
        conversationRepo.save(c);

        Request r = new Request();
        r.setSubject(subject);
        r.setDescription(desc);
        r.setCreatedAt(now);
        r.setStatus(RequestStatus.PENDING);
        r.setStudent(a.student());
        r.setConversation(c);
        r.setToDepartment(dept);
        requestRepo.save(r);

        // Nội dung yêu cầu chính là tin nhắn đầu tiên của đoạn chat
        saveMessage(c, a.user(), desc, MessageType.USER);
        addHistory(r, RequestStatus.PENDING, "Tạo yêu cầu", a, dept.getName(), null);

        notifyUsers(staffIdsOf(dept.getDepartmentId()), NotificationType.NEW_REQUEST_RECEIVED,
                a.user().getFullName() + " gửi yêu cầu hỗ trợ: " + subject);
        emit("REQUEST_CREATED", r, null, recipients(r));
        return toDetail(r, Access.OWNER);
    }

    // ------------------------------------------------------------------ UC23 xóa yêu cầu

    @Transactional
    public void delete(Integer id) {
        Actor a = actor();
        Loaded l = load(a, id, true);
        Request r = l.request();
        if (l.access() != Access.OWNER) throw ChatException.forbidden("Chỉ người tạo mới được xóa yêu cầu");
        if (!deletable(r))
            throw ChatException.conflict("Yêu cầu đã được xử lý nên không thể xóa");
        Set<String> to = recipients(r);
        r.setDeleted(true);
        emit("REQUEST_DELETED", r, null, to);
    }

    // ------------------------------------------------------------------ UC24 xem tin nhắn

    @Transactional(readOnly = true)
    public RequestDetail detail(Integer id) {
        Loaded l = load(actor(), id, false);
        return toDetail(l.request(), l.access());
    }

    @Transactional(readOnly = true)
    public List<MessageDto> thread(Integer id) {
        Loaded l = load(actor(), id, false);
        Request r = l.request();
        return messageRepo.findThread(r.getConversation().getConId()).stream()
                .map(m -> toMessage(m, r.getRequestId())).toList();
    }

    // ------------------------------------------------------------------ UC25 nhắn tin

    @Transactional
    public MessageDto send(Integer id, String content, List<MultipartFile> files) {
        Actor a = actor();
        Loaded l = load(a, id, true);
        Request r = l.request();
        if (l.access() == Access.INVITED_PENDING && r.getStatus() == RequestStatus.ACCEPTED)
            throw ChatException.conflict("Đơn vị bạn cần tiếp nhận lời mời hỗ trợ trước khi nhắn tin");
        if (!permissions(l.access(), r).canSend())
            throw ChatException.conflict("Yêu cầu không còn trong trạng thái trao đổi");

        String text = blank(content);
        List<MultipartFile> real = files == null ? List.of() : files.stream().filter(f -> f != null && !f.isEmpty()).toList();
        if (text.isEmpty() && real.isEmpty()) throw ChatException.badRequest("Không thể gửi tin nhắn trống");
        if (text.length() > MAX_CONTENT) throw ChatException.badRequest("Tin nhắn không được vượt quá " + MAX_CONTENT + " ký tự");
        if (real.size() > MAX_FILES) throw ChatException.badRequest("Mỗi tin nhắn chỉ đính kèm tối đa " + MAX_FILES + " tệp");
        for (MultipartFile f : real) {
            if (!CloudinaryService.CHAT_ALLOWED.contains(cloudinaryService.extension(f.getOriginalFilename())))
                throw ChatException.badRequest("Định dạng tệp không được hỗ trợ");
            if (f.getSize() > MAX_FILE_SIZE) throw ChatException.badRequest("Tệp vượt quá dung lượng cho phép");
        }

        Message m = saveMessage(r.getConversation(), a.user(), text.isEmpty() ? null : text, MessageType.USER);
        List<CloudinaryService.UploadedFile> uploaded = new ArrayList<>();
        try {
            for (MultipartFile f : real) {
                CloudinaryService.UploadedFile up = cloudinaryService.uploadChat(f);
                uploaded.add(up);
                FileAttachment fa = new FileAttachment();
                fa.setFileId(up.publicId());
                fa.setFileName(f.getOriginalFilename());
                fa.setFileUrl(up.url());
                fa.setFileType(f.getContentType());
                fa.setFileSize((int) up.bytes());
                fa.setCreateAt(LocalDateTime.now());
                fa.setMessage(m);
                fa.setRequest(r);
                // Không gọi fileRepo.save(): Message.attachments có cascade ALL nên file được lưu cùng tin nhắn khi flush.
                // (save() thêm một lần nữa sẽ gây NonUniqueObjectException vì id là String gán tay)
                m.getAttachments().add(fa);
            }
        } catch (RuntimeException e) {
            uploaded.forEach(u -> safeDelete(u.publicId(), u.resourceType()));
            throw e;
        }

        MessageDto dto = toMessage(m, r.getRequestId());
        Set<String> to = recipients(r);
        Set<String> others = new LinkedHashSet<>(to);
        others.remove(a.id());
        notifyUsers(others, NotificationType.NEW_MESSAGE, "Tin nhắn mới trong yêu cầu: " + r.getSubject());
        emit("MESSAGE_CREATED", r, dto, to);
        return dto;
    }

    // ------------------------------------------------------------------ UC26 thu hồi

    @Transactional
    public void recall(Integer id, Integer messId) {
        Actor a = actor();
        Loaded l = load(a, id, true);
        Request r = l.request();
        Message m = messageRepo.findById(messId).orElse(null);
        if (m == null || !m.getConversation().getConId().equals(r.getConversation().getConId())
                || !m.getSender().getUserId().equals(a.id())
                || m.getType() == MessageType.SYSTEM || m.isRecalled()
                || r.getStatus() != RequestStatus.ACCEPTED)
            throw ChatException.conflict("Thu hồi tin nhắn không thành công");

        m.setRecalled(true);
        m.setContent(null);
        List<FileAttachment> files = new ArrayList<>(m.getAttachments());
        m.getAttachments().clear();
        fileRepo.deleteAll(files);
        files.forEach(f -> safeDelete(f.getFileId(),
                f.getFileType() != null && f.getFileType().startsWith("image/") ? "image" : "raw"));
        emit("MESSAGE_RECALLED", r, Map.of("messId", messId), recipients(r));
    }

    private void safeDelete(String publicId, String resourceType) {
        try { cloudinaryService.delete(publicId, resourceType); } catch (RuntimeException ignored) { }
    }

    // ------------------------------------------------------------------ UC27 tiếp nhận

    @Transactional
    public RequestDetail accept(Integer id) {
        Actor a = actor();
        requireStaff(a);
        Loaded l = load(a, id, true);
        Request r = l.request();

        // Đơn vị được mời hỗ trợ bấm tiếp nhận → bắt đầu được tham gia nhắn tin
        if (l.access() == Access.INVITED_PENDING) {
            if (r.getStatus() != RequestStatus.ACCEPTED)
                throw ChatException.conflict("Yêu cầu không còn trong trạng thái xử lý");
            SupportInvitation si = invitationRepo.findByRequest_RequestIdAndDepartment_DepartmentId(r.getRequestId(), a.departmentId())
                    .orElseThrow(() -> ChatException.notFound("Lời mời hỗ trợ không còn tồn tại"));
            si.setAccepted(true);
            si.setAcceptedAt(LocalDateTime.now());
            addHistory(r, RequestStatus.ACCEPTED, "Tiếp nhận lời mời hỗ trợ", a, a.departmentName(), null);
            notifyUsers(staffIdsOf(r.getToDepartment().getDepartmentId()), NotificationType.REQUEST_ACCEPTED,
                    a.departmentName() + " đã tiếp nhận lời mời hỗ trợ yêu cầu \"" + r.getSubject() + "\"");
            Set<String> to = recipients(r);
            systemLine(r, a, a.departmentName() + " đã tham gia hỗ trợ", to);
            emit("REQUEST_CHANGED", r, null, to);
            return toDetail(r, Access.INVITED);
        }
        if (l.access() != Access.DEPT) throw ChatException.forbidden("Bạn không có quyền tiếp nhận yêu cầu này");
        if (r.getStatus() != RequestStatus.PENDING)
            throw ChatException.conflict("Yêu cầu không còn ở trạng thái chờ tiếp nhận");

        r.setStatus(RequestStatus.ACCEPTED);
        addHistory(r, RequestStatus.ACCEPTED, "Tiếp nhận yêu cầu", a, r.getToDepartment().getName(), null);
        notifyUsers(List.of(r.getStudent().getUserId()), NotificationType.REQUEST_ACCEPTED,
                "Yêu cầu của bạn đã được tiếp nhận");
        emit("REQUEST_CHANGED", r, null, recipients(r));
        return toDetail(r, Access.DEPT);
    }

    // ------------------------------------------------------------------ UC28 từ chối

    /**
     * - Đơn vị được mời từ chối lời mời → lời mời bị gỡ.
     * - Đơn vị tiếp nhận từ chối: nếu yêu cầu từng được chuyển tiếp tới (theo ForwardingLog) thì TRẢ VỀ đơn vị đã chuyển (chờ tiếp nhận lại);
     *   nếu không có đơn vị trước đó thì yêu cầu chuyển sang "Từ chối tiếp nhận".
     * Trả về null khi người thực hiện không còn quyền truy cập yêu cầu sau thao tác.
     */
    @Transactional
    public RequestDetail reject(Integer id, String reason) {
        Actor a = actor();
        requireStaff(a);
        String why = note(reason);
        if (why.isEmpty()) throw ChatException.badRequest("Vui lòng nhập lý do từ chối");
        Loaded l = load(a, id, true);
        Request r = l.request();

        if (l.access() == Access.INVITED_PENDING) {
            if (r.getStatus() != RequestStatus.ACCEPTED)
                throw ChatException.conflict("Yêu cầu không còn trong trạng thái xử lý");
            SupportInvitation si = invitationRepo.findByRequest_RequestIdAndDepartment_DepartmentId(r.getRequestId(), a.departmentId())
                    .orElseThrow(() -> ChatException.notFound("Lời mời hỗ trợ không còn tồn tại"));
            invitationRepo.delete(si);
            addHistory(r, RequestStatus.ACCEPTED, "Từ chối lời mời hỗ trợ", a, a.departmentName(), why);
            notifyUsers(staffIdsOf(r.getToDepartment().getDepartmentId()), NotificationType.REQUEST_REJECTED,
                    a.departmentName() + " từ chối lời mời hỗ trợ yêu cầu \"" + r.getSubject() + "\". Lý do: " + why);
            Set<String> to = recipients(r, a.departmentId());
            systemLine(r, a, a.departmentName() + " đã từ chối lời mời hỗ trợ", to);
            emit("REQUEST_CHANGED", r, null, to);
            return null;
        }
        if (l.access() != Access.DEPT) throw ChatException.forbidden("Bạn không có quyền từ chối yêu cầu này");
        if (r.getStatus() != RequestStatus.PENDING)
            throw ChatException.conflict("Yêu cầu không còn ở trạng thái chờ tiếp nhận");

        Department current = r.getToDepartment();
        Department previous = previousDepartment(r);
        addHistory(r, RequestStatus.PENDING, "Từ chối tiếp nhận", a, current.getName(), why);

        if (previous != null) {
            r.setToDepartment(previous);              // trả về đơn vị đã chuyển tiếp, vẫn chờ tiếp nhận
            notifyUsers(staffIdsOf(previous.getDepartmentId()), NotificationType.REQUEST_REJECTED,
                    current.getName() + " từ chối tiếp nhận và trả lại yêu cầu \"" + r.getSubject() + "\". Lý do: " + why);
            Set<String> to = recipients(r, current.getDepartmentId());
            systemLine(r, a, current.getName() + " đã từ chối tiếp nhận, yêu cầu được trả về " + previous.getName(), to);
            emit("REQUEST_CHANGED", r, null, to);
            return null;
        }

        r.setStatus(RequestStatus.REJECTED);
        notifyUsers(List.of(r.getStudent().getUserId()), NotificationType.REQUEST_REJECTED,
                "Yêu cầu \"" + r.getSubject() + "\" bị từ chối tiếp nhận. Lý do: " + why);
        emit("REQUEST_CHANGED", r, null, recipients(r));
        return toDetail(r, Access.DEPT);
    }

    /** Đơn vị gần nhất đã chuyển tiếp yêu cầu tới đơn vị hiện tại (dựa vào log chuyển tiếp). */
    private Department previousDepartment(Request r) {
        if (r.getToDepartment() == null) return null;
        String cur = r.getToDepartment().getDepartmentId();
        return forwardingLogRepo.findByRequest_RequestIdOrderByForwardAtDescForwardIdDesc(r.getRequestId()).stream()
                .filter(f -> f.getForwardTo() != null && f.getForwardTo().getDepartmentId().equals(cur))
                .map(ForwardingLog::getReceiveFrom)
                .filter(Objects::nonNull)
                .findFirst().orElse(null);
    }

    // ------------------------------------------------------------------ UC29 chuyển tiếp

    @Transactional
    public RequestDetail forward(Integer id, ForwardBody b) {
        Actor a = actor();
        requireStaff(a);
        String targetId = blank(b == null ? null : b.departmentId());
        if (targetId.isEmpty()) throw ChatException.badRequest("Vui lòng chọn đơn vị nhận");
        String note = note(b == null ? null : b.note());
        Loaded l = load(a, id, true);
        Request r = l.request();
        if (l.access() != Access.DEPT) throw ChatException.forbidden("Chỉ đơn vị phụ trách mới được chuyển tiếp");
        if (r.getStatus() != RequestStatus.ACCEPTED)
            throw ChatException.conflict("Yêu cầu không còn trong trạng thái xử lý");
        Department target = departmentRepo.findById(targetId)
                .orElseThrow(() -> ChatException.badRequest("Đơn vị nhận không tồn tại"));
        Department old = r.getToDepartment();
        if (old.getDepartmentId().equals(target.getDepartmentId()))
            throw ChatException.badRequest("Đơn vị nhận phải khác đơn vị hiện tại");

        ForwardingLog log = new ForwardingLog();
        log.setRequest(r);
        log.setForwardTo(target);
        log.setReceiveFrom(old);
        log.setNote(note.isEmpty() ? null : note);
        log.setForwardAt(LocalDateTime.now());
        forwardingLogRepo.save(log);

        // Đơn vị nhận trở thành đơn vị tiếp nhận chính → bỏ lời mời hỗ trợ (nếu có) của đơn vị đó
        invitationRepo.findByRequest_RequestIdAndDepartment_DepartmentId(r.getRequestId(), target.getDepartmentId())
                .ifPresent(invitationRepo::delete);

        r.setToDepartment(target);
        r.setStatus(RequestStatus.PENDING);
        addHistory(r, RequestStatus.PENDING, "Chuyển tiếp yêu cầu", a, target.getName(), note);

        notifyUsers(staffIdsOf(target.getDepartmentId()), NotificationType.REQUEST_FORWARDED,
                "Yêu cầu \"" + r.getSubject() + "\" được chuyển tiếp đến đơn vị của bạn");
        notifyUsers(List.of(r.getStudent().getUserId()), NotificationType.REQUEST_FORWARDED,
                "Yêu cầu \"" + r.getSubject() + "\" đã được chuyển tiếp đến " + target.getName());

        Set<String> to = recipients(r, old.getDepartmentId());
        systemLine(r, a, "Yêu cầu đã được chuyển tiếp đến " + target.getName(), to);
        emit("REQUEST_CHANGED", r, null, to);
        return toDetail(r, Access.DEPT);
    }

    // ------------------------------------------------------------------ UC30 mời đơn vị hỗ trợ

    @Transactional
    public RequestDetail invite(Integer id, InviteBody b) {
        Actor a = actor();
        requireStaff(a);
        List<String> ids = b == null || b.departmentIds() == null ? List.of()
                : b.departmentIds().stream().filter(s -> s != null && !s.isBlank()).distinct().toList();
        if (ids.isEmpty()) throw ChatException.badRequest("Vui lòng chọn đơn vị cần mời");
        String msg = note(b.message());
        Loaded l = load(a, id, true);
        Request r = l.request();
        if (l.access() != Access.DEPT) throw ChatException.forbidden("Chỉ đơn vị phụ trách mới được mời đơn vị hỗ trợ");
        if (r.getStatus() != RequestStatus.ACCEPTED)
            throw ChatException.conflict("Yêu cầu không còn trong trạng thái xử lý");

        List<Department> added = new ArrayList<>();
        for (String did : ids) {
            Department d = departmentRepo.findById(did)
                    .orElseThrow(() -> ChatException.badRequest("Đơn vị được mời không tồn tại"));
            if (d.getDepartmentId().equals(r.getToDepartment().getDepartmentId())
                    || invitationRepo.existsByRequest_RequestIdAndDepartment_DepartmentId(r.getRequestId(), did)) continue;
            SupportInvitation si = new SupportInvitation();
            si.setRequest(r);
            si.setDepartment(d);
            si.setNote(msg.isEmpty() ? null : msg);
            si.setInvitedAt(LocalDateTime.now());
            si.setAccepted(false);
            invitationRepo.save(si);
            added.add(d);
        }
        if (added.isEmpty()) throw ChatException.badRequest("Các đơn vị đã chọn đã được mời hoặc là đơn vị đang phụ trách");

        String names = String.join(", ", added.stream().map(Department::getName).toList());
        addHistory(r, RequestStatus.ACCEPTED, "Mời đơn vị hỗ trợ", a, names, msg);
        for (Department d : added) {
            notifyUsers(staffIdsOf(d.getDepartmentId()), NotificationType.SUPPORT_UNIT_INVITED,
                    "Đơn vị của bạn được mời hỗ trợ yêu cầu \"" + r.getSubject() + "\"" + (msg.isEmpty() ? "" : ". Lời nhắn: " + msg));
        }
        Set<String> to = recipients(r);
        systemLine(r, a, names + " đã được mời tham gia hỗ trợ", to);
        emit("REQUEST_CHANGED", r, null, to);
        return toDetail(r, Access.DEPT);
    }

    // ------------------------------------------------------------------ UC31 đóng trao đổi

    @Transactional
    public RequestDetail close(Integer id, String note) {
        Actor a = actor();
        requireStaff(a);
        String n = note(note);
        Loaded l = load(a, id, true);
        Request r = l.request();
        if (l.access() != Access.DEPT) throw ChatException.forbidden("Chỉ đơn vị phụ trách mới được đóng trao đổi");
        if (r.getStatus() != RequestStatus.ACCEPTED)
            throw ChatException.conflict("Yêu cầu không còn trong trạng thái xử lý");

        Conversation c = r.getConversation();
        r.setStatus(RequestStatus.CLOSED);
        c.setClosed(true);
        c.setClosedAt(LocalDateTime.now());
        addHistory(r, RequestStatus.CLOSED, "Đóng trao đổi", a, r.getToDepartment().getName(), n);

        Set<String> to = recipients(r);
        Set<String> notify = new LinkedHashSet<>(to);
        notify.remove(a.id());
        notifyUsers(notify, NotificationType.REQUEST_CLOSED, "Trao đổi cho yêu cầu \"" + r.getSubject() + "\" đã được đóng");
        systemLine(r, a, "Trao đổi đã được đóng", to);
        emit("REQUEST_CHANGED", r, null, to);
        return toDetail(r, Access.DEPT);
    }

    private void requireStaff(Actor a) {
        if (a.isStudent()) throw ChatException.forbidden("Chức năng này chỉ dành cho nhân viên");
    }
}