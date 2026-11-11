package nvt.vn.student_web_core.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.*;
import nvt.vn.student_web_core.payload.staff.StaffStatisticsDto.*;
import nvt.vn.student_web_core.repository.*;
import nvt.vn.student_web_core.util.AuthUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffStatisticsService {

    public static class StatsException extends RuntimeException {
        private final HttpStatus status;
        public StatsException(HttpStatus status, String message) { super(message); this.status = status; }
        public HttpStatus getStatus() { return status; }
    }

    private static final String ACT_CREATE = "Tạo yêu cầu";
    private static final String ACT_ACCEPT = "Tiếp nhận yêu cầu";
    private static final String ACT_CLOSE = "Đóng trao đổi";

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd/MM");

    private final StaffRepo staffRepo;
    private final RequestRepo requestRepo;
    private final RequestStatusHistoryRepo historyRepo;
    private final ForwardingLogRepo forwardingLogRepo;
    private final SupportInvitationRepo invitationRepo;
    private final DocumentRepo documentRepo;
    private final StudyResourceRepo studyResourceRepo;
    private final AuthUtil authUtil;

    @PersistenceContext
    private EntityManager em;

    private record Ctx(Department dept, LocalDate fromDate, LocalDate toDate, LocalDateTime from, LocalDateTime to) {
        String deptId() { return dept.getDepartmentId(); }
    }

    private Ctx ctx(LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now();
        LocalDate f = from != null ? from : today.withDayOfMonth(1);
        LocalDate t = to != null ? to : today;
        if (f.isAfter(t)) throw new StatsException(HttpStatus.BAD_REQUEST, "Khoảng thời gian không hợp lệ, vui lòng chọn lại");
        if (ChronoUnit.DAYS.between(f, t) > 366) throw new StatsException(HttpStatus.BAD_REQUEST, "Chỉ xem được tối đa 1 năm mỗi lần");
        Staff staff = staffRepo.findById(authUtil.loggedInUser().getUserId())
                .orElseThrow(() -> new StatsException(HttpStatus.FORBIDDEN, "Không tìm thấy nhân viên"));
        if (staff.getDepartment() == null) throw new StatsException(HttpStatus.FORBIDDEN, "Tài khoản chưa thuộc đơn vị nào");
        return new Ctx(staff.getDepartment(), f, t, f.atStartOfDay(), t.atTime(LocalTime.MAX));
    }

    private List<DayCount> daily(Ctx c, Collection<LocalDateTime> times) {
        Map<LocalDate, Long> m = new LinkedHashMap<>();
        for (LocalDate d = c.fromDate(); !d.isAfter(c.toDate()); d = d.plusDays(1)) m.put(d, 0L);
        for (LocalDateTime t : times) m.computeIfPresent(t.toLocalDate(), (d, n) -> n + 1);
        return m.entrySet().stream().map(e -> new DayCount(e.getKey().format(DAY), e.getValue())).toList();
    }

    @Transactional(readOnly = true)
    public MessageStats messages(LocalDate fromDate, LocalDate toDate) {
        Ctx c = ctx(fromDate, toDate);
        String deptId = c.deptId();

        List<Object[]> events = new ArrayList<>(historyRepo.requestsCreatedTo(ACT_CREATE, c.dept().getName(), c.from(), c.to()));
        events.addAll(forwardingLogRepo.forwardedTo(deptId, c.from(), c.to()));

        Set<Integer> ids = events.stream().map(e -> (Integer) e[0]).collect(Collectors.toSet());
        List<Request> requests = ids.isEmpty() ? List.of()
                : requestRepo.findAllById(ids).stream().filter(r -> !r.isDeleted()).toList();
        Set<Integer> valid = requests.stream().map(Request::getRequestId).collect(Collectors.toSet());

        long pending = 0, processing = 0, closed = 0, rejected = 0;
        for (Request r : requests) {
            if (r.getToDepartment() == null || !deptId.equals(r.getToDepartment().getDepartmentId())) continue; // đã chuyển đi nơi khác
            switch (r.getStatus()) {
                case PENDING -> pending++;
                case ACCEPTED -> processing++;
                case CLOSED -> closed++;
                case REJECTED -> rejected++;
                default -> { }
            }
        }

        Set<String> seen = new HashSet<>();
        List<LocalDateTime> times = new ArrayList<>();
        for (Object[] e : events) {
            if (!valid.contains((Integer) e[0])) continue;
            LocalDateTime t = (LocalDateTime) e[1];
            if (seen.add(e[0] + "|" + t.toLocalDate())) times.add(t);
        }

        long forwardedOut = forwardingLogRepo.countForwardedFrom(deptId, c.from(), c.to());
        long invited = invitationRepo.countInvited(deptId, c.from(), c.to());

        List<RequestStatusHistory> closes = historyRepo.findByActionAndDepartment(ACT_CLOSE, c.dept().getName(), c.from(), c.to());
        Map<Integer, List<RequestStatusHistory>> byRequest = closes.isEmpty() ? Map.of()
                : historyRepo.findByRequest_RequestIdIn(closes.stream().map(h -> h.getRequest().getRequestId()).collect(Collectors.toSet()))
                .stream().collect(Collectors.groupingBy(h -> h.getRequest().getRequestId()));
        long sum = 0, n = 0;
        for (RequestStatusHistory close : closes) {
            Optional<RequestStatusHistory> accept = byRequest.getOrDefault(close.getRequest().getRequestId(), List.of()).stream()
                    .filter(h -> ACT_ACCEPT.equals(h.getAction()) && c.dept().getName().equals(h.getDepartmentName())
                            && !h.getCreateAt().isAfter(close.getCreateAt()))
                    .max(Comparator.comparing(RequestStatusHistory::getCreateAt));
            if (accept.isPresent()) {
                sum += Math.max(0, Duration.between(accept.get().getCreateAt(), close.getCreateAt()).toMinutes());
                n++;
            }
        }

        boolean empty = valid.isEmpty() && forwardedOut == 0 && invited == 0;
        return new MessageStats(valid.size(), pending, processing, closed, rejected, forwardedOut, invited,
                n == 0 ? null : sum / n, n, daily(c, times), empty);
    }

    @Transactional(readOnly = true)
    public DocumentStats documents(LocalDate fromDate, LocalDate toDate) {
        Ctx c = ctx(fromDate, toDate);
        long visible = 0, hidden = 0;
        for (Object[] row : documentRepo.countByStatusForDepartment(c.deptId())) {
            if (row[0] == ViewStatus.HIDDEN) hidden += (Long) row[1]; else visible += (Long) row[1];
        }
        List<Document> docs = documentRepo.findByDepartmentCreatedBetween(c.deptId(), c.from(), c.to());
        List<DocItem> items = docs.stream().limit(200)
                .map(d -> new DocItem(d.getDocId(), d.getDocNumber(), d.getTitle(), d.getCreateAt(),
                        d.getStatus() == null ? ViewStatus.VISIBLE.name() : d.getStatus().name()))
                .toList();
        return new DocumentStats(visible + hidden, visible, hidden, docs.size(),
                daily(c, docs.stream().map(Document::getCreateAt).toList()), items, docs.isEmpty());
    }

    @Transactional(readOnly = true)
    public StudyStats study(LocalDate fromDate, LocalDate toDate) {
        Ctx c = ctx(fromDate, toDate);
        long examsVisible = 0, examsHidden = 0, docsVisible = 0, docsHidden = 0;
        for (Object[] row : studyResourceRepo.countByDepartment(c.deptId())) {
            boolean exam = row[0] == ResourceType.EXAM;
            boolean hidden = row[1] == ViewStatus.HIDDEN;
            long n = (Long) row[2];
            if (exam) { if (hidden) examsHidden += n; else examsVisible += n; }
            else { if (hidden) docsHidden += n; else docsVisible += n; }
        }

        List<StudyResource> posted = studyResourceRepo.findByDepartmentCreatedBetween(c.deptId(), c.from(), c.to());
        List<StudyItem> items = posted.stream().limit(200)
                .map(r -> new StudyItem(r.getResourceId(), r.getTitle(),
                        r.getResourceType() == null ? null : r.getResourceType().name(), r.getCreateAt(),
                        r.getStatus() == null ? ViewStatus.VISIBLE.name() : r.getStatus().name()))
                .toList();

        return new StudyStats(examsVisible + examsHidden, docsVisible + docsHidden,
                examsVisible, examsHidden, docsVisible, docsHidden,
                posted.size(), daily(c, posted.stream().map(StudyResource::getCreateAt).toList()), items, posted.isEmpty());
    }

    @Transactional(readOnly = true)
    public ForumStats forum(LocalDate fromDate, LocalDate toDate) {
        Ctx c = ctx(fromDate, toDate);
        List<Staff> staffs = staffRepo.findByDepartment_DepartmentId(c.deptId());
        List<String> staffIds = staffs.stream().map(Staff::getUserId).toList();
        if (staffIds.isEmpty()) return new ForumStats(0, 0, 0, 0, daily(c, List.of()), List.of(), true);

        List<Object[]> posts = em.createQuery("""
                SELECT p.postId, p.title, p.createAt FROM ForumPost p
                WHERE p.author.userId IN :ids AND p.createAt BETWEEN :from AND :to
                ORDER BY p.createAt DESC""", Object[].class)
                .setParameter("ids", staffIds).setParameter("from", c.from()).setParameter("to", c.to()).getResultList();
        List<Integer> postIds = posts.stream().map(p -> (Integer) p[0]).toList();

        Map<Integer, Long> comments = new HashMap<>(), reactions = new HashMap<>();
        if (!postIds.isEmpty()) {
            em.createQuery("SELECT c.forumPost.postId, COUNT(c) FROM Comment c WHERE c.forumPost.postId IN :p AND c.isActive = true GROUP BY c.forumPost.postId", Object[].class)
                    .setParameter("p", postIds).getResultList().forEach(r -> comments.put((Integer) r[0], (Long) r[1]));
            em.createQuery("SELECT v.forumPost.postId, COUNT(v) FROM Vote v WHERE v.forumPost.postId IN :p GROUP BY v.forumPost.postId", Object[].class)
                    .setParameter("p", postIds).getResultList().forEach(r -> reactions.put((Integer) r[0], (Long) r[1]));
        }
        long totalComments = comments.values().stream().mapToLong(Long::longValue).sum();
        long totalReactions = reactions.values().stream().mapToLong(Long::longValue).sum();
        
        long reported = em.createQuery("""
                SELECT COUNT(DISTINCT r.forumPost.postId) FROM Report r
                WHERE r.forumPost.author.userId IN :ids AND r.createAt BETWEEN :from AND :to""", Long.class)
                .setParameter("ids", staffIds).setParameter("from", c.from()).setParameter("to", c.to()).getSingleResult();

        List<ForumTop> top = posts.stream().map(p -> {
            long cm = comments.getOrDefault((Integer) p[0], 0L), rc = reactions.getOrDefault((Integer) p[0], 0L);
            return new ForumTop((Integer) p[0], (String) p[1], (LocalDateTime) p[2], cm, rc, cm + rc);
        }).sorted(Comparator.comparingLong(ForumTop::interactions).reversed()).limit(5).toList();

        boolean empty = posts.isEmpty() && reported == 0;
        return new ForumStats(posts.size(), totalComments, totalReactions, reported,
                daily(c, posts.stream().map(p -> (LocalDateTime) p[2]).toList()), top, empty);
    }
}