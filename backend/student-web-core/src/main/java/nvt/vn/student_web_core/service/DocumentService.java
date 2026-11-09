package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.payload.DocumentRequest;
import nvt.vn.student_web_core.payload.DocumentResponse;
import nvt.vn.student_web_core.model.*;
import nvt.vn.student_web_core.repository.*;
import nvt.vn.student_web_core.util.AuthUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {
    private final DocumentRepo documentRepo;
    private final DocumentRelationRepo relationRepo;
    private final DepartmentRepo departmentRepo;
    private final AuthUtil authUtil;
    private final CloudinaryService cloudinaryService;
    private final NotificationService notificationService;

    public List<Map<String, String>> departments() {
        requireStudent();
        return departmentRepo.findAll().stream()
                .map(d -> Map.of("departmentId", d.getDepartmentId(),
                        "name", d.getName() == null ? "" : d.getName())).toList();
    }

    public List<DocumentResponse> studentList(String departmentId, String title) {
        requireStudent();
        List<Document> docs = (title == null || title.isBlank())
                ? documentRepo.findAllByDepartmentAndStatus(departmentId, ViewStatus.VISIBLE)
                : documentRepo.searchByDepartmentAndStatus(departmentId, ViewStatus.VISIBLE, title.trim());
        return toResponses(docs);
    }

    public DocumentResponse studentDetail(Integer id) {
        requireStudent();
        Document d = documentRepo.findById(id)
                .filter(x -> x.getStatus() == ViewStatus.VISIBLE)
                .orElseThrow(() -> new NoSuchElementException("Văn bản không tồn tại"));
        return toResponse(d);
    }

    public List<DocumentResponse> staffList(String title) {
        Staff staff = currentStaff();
        String departmentId = staff.getDepartment().getDepartmentId();
        List<Document> docs = (title == null || title.isBlank())
                ? documentRepo.findAllByDepartment(departmentId)
                : documentRepo.searchByDepartment(departmentId, title.trim());
        return toResponses(docs);
    }

    public DocumentResponse staffDetail(Integer id) { return toResponse(ownedDocument(id)); }

    @Transactional
    public DocumentResponse create(DocumentRequest req, List<MultipartFile> files) {
        Staff staff = currentStaff();
        validate(req, null);
        Document d = new Document();
        d.setDocNumber(req.docNumber().trim());
        d.setTitle(req.title().trim());
        d.setContent(req.content().trim());
        d.setValidity(parseValidity(req.validity()));
        d.setCreateAt(LocalDateTime.now());
        d.setUpdateAt(LocalDateTime.now());
        d.setStatus(ViewStatus.VISIBLE);
        d.setStaff(staff);
        d.setDepartment(staff.getDepartment());
        List<String> uploaded = new ArrayList<>();
        try {
            if (files != null) {
                for (MultipartFile f : files) {
                    d.getAttachments().add(uploadAttachment(d, f, uploaded));
                }
            }
            Document saved = documentRepo.save(d);
            applyRelations(saved, req.relations(), staff.getDepartment().getDepartmentId());
            saved = documentRepo.save(saved);
            notificationService.send(staff.getUserId(), NotificationType.NEW_DOCUMENT, "Ban vừa đăng tải một văn bản mới: " + saved.getTitle());
            return toResponse(saved);
        } catch (RuntimeException e) {
            uploaded.forEach(this::safeDelete);
            throw e;
        }
    }

    @Transactional
    public DocumentResponse update(Integer id, DocumentRequest req, List<MultipartFile> files) {
        Document d = ownedDocument(id);
        validate(req, id);
        Set<String> keep = req.keepAttachmentIds() == null ? Set.of()
                : new HashSet<>(req.keepAttachmentIds());
        List<FileAttachment> removed = d.getAttachments().stream()
                .filter(a -> !keep.contains(a.getFileId())).toList();
        if (keep.stream()
                .anyMatch(k -> d.getAttachments().stream()
                        .noneMatch(a -> a.getFileId().equals(k)))) {
            throw new IllegalArgumentException("Tập tin giữ lại không hợp lệ");
        }
        List<String> uploaded = new ArrayList<>();
        try {
            d.setDocNumber(req.docNumber().trim());
            d.setTitle(req.title().trim());
            d.setContent(req.content().trim());

            boolean isReplaced = relationRepo.findIncoming(List.of(d.getDocId())).stream()
                    .anyMatch(r -> r.getRelationType() == DocumentRelationType.REPLACES);
            if (isReplaced) {
                d.setValidity(ValidityStatus.EXPIRED);
            } else {
                d.setValidity(parseValidity(req.validity()));
            }

            d.setUpdateAt(LocalDateTime.now());
            d.getAttachments().removeAll(removed);
            if (files != null) {
                for (MultipartFile f : files) {
                    d.getAttachments().add(uploadAttachment(d, f, uploaded));
                }
            }

            d.getRelatedDocuments().clear();
            documentRepo.saveAndFlush(d);

            applyRelations(d, req.relations(), d.getDepartment().getDepartmentId());
            Document saved = documentRepo.save(d);
            removed.forEach(a -> safeDelete(a.getFileId()));
            return toResponse(saved);
        } catch (RuntimeException e) {
            uploaded.forEach(this::safeDelete);
            throw e;
        }
    }

    @Transactional
    public DocumentResponse setVisibility(Integer id, ViewStatus status) {
        Document d = ownedDocument(id); d.setStatus(status); d.setUpdateAt(LocalDateTime.now());
        return toResponse(documentRepo.save(d));
    }

    private void requireStudent() {
        if (authUtil.loggedInUser() == null)
            throw new SecurityException("Vui lòng đăng nhập để thực hiện chức năng này");
    }

    private Staff currentStaff() {
        User user = authUtil.loggedInUser();
        if (!(user instanceof Staff staff))
            throw new SecurityException("Chỉ nhân viên mới được thực hiện chức năng này");
        if (staff.getDepartment() == null)
            throw new IllegalStateException("Nhân viên chưa được gán đơn vị phụ trách");
        return staff;
    }

    private Document ownedDocument(Integer id) {
        Staff staff = currentStaff();
        Document d = documentRepo.findById(id).orElseThrow(()
                -> new NoSuchElementException("Văn bản không tồn tại"));
        if (!d.getDepartment().getDepartmentId()
                .equals(staff.getDepartment().getDepartmentId()))
            throw new SecurityException("Bạn không có quyền thao tác văn bản này");
        return d;
    }

    private void validate(DocumentRequest r, Integer id) {
        if (r == null || blank(r.docNumber()) || blank(r.title()) || blank(r.content()))
            throw new IllegalArgumentException("Vui lòng điền đầy đủ thông tin bắt buộc");
        boolean duplicate = id == null ?
                documentRepo.existsByDocNumberIgnoreCase(r.docNumber().trim())
                : documentRepo.existsByDocNumberIgnoreCaseAndDocIdNot(r.docNumber().trim(), id);
        if (duplicate) throw new IllegalArgumentException("Số hiệu văn bản đã tồn tại");
    }

    private boolean blank(String s) { return s == null || s.isBlank(); }

    private FileAttachment uploadAttachment(Document d, MultipartFile file, List<String> uploaded) {
        CloudinaryService.UploadedFile up = cloudinaryService.upload(file, "attachments");
        uploaded.add(up.publicId());
        FileAttachment a = new FileAttachment();
        a.setFileId(up.publicId());
        a.setFileName(file.getOriginalFilename());
        a.setFileUrl(up.url());
        a.setFileType(file.getContentType());
        a.setFileSize((int) up.bytes());
        a.setCreateAt(LocalDateTime.now());
        a.setDocument(d);
        return a;
    }

    private void safeDelete(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        try {
            cloudinaryService.deleteFile(publicId);
        } catch (Exception e) {
            System.err.println("Không thể xóa file trên Cloudinary: " + publicId);
            e.printStackTrace();
        }
    }

    private void applyRelations(Document d, List<DocumentRequest.RelationRequest> relations,
                                String deptId) {
        if (relations == null) return;
        Set<Integer> seen = new HashSet<>();
        for (var r : relations) {
            if (r.docId() == null) {
                throw new IllegalArgumentException("Văn bản liên quan không hợp lệ");
            }
            if (d.getDocId() != null && Objects.equals(r.docId(), d.getDocId())) {
                throw new IllegalArgumentException("Văn bản không thể tự liên kết với chính nó");
            }
            if (!seen.add(r.docId())) {
                throw new IllegalArgumentException("Không được trùng lặp quan hệ với cùng một văn bản");
            }
            Document related = documentRepo.findById(r.docId()).orElseThrow(()
                    -> new NoSuchElementException("Không tìm thấy văn bản liên quan"));
            if (related.getDepartment() == null || !related.getDepartment().getDepartmentId().equals(deptId)) {
                throw new IllegalArgumentException("Chỉ được thiết lập quan hệ giữa các văn bản trong cùng Khoa/Viện");
            }
            DocumentRelationType type = parseRelation(r.type());

            if (d.getDocId() != null) {
                boolean reverseExists = relationRepo.findByDocumentIdAndRelatedDocumentId(related.getDocId(), d.getDocId()).isPresent();
                if (reverseExists) {
                    throw new IllegalArgumentException("Đã tồn tại mối quan hệ giữa hai văn bản này");
                }
            }

            DocumentRelation rel = new DocumentRelation();
            rel.setDocument(d);
            rel.setRelatedDocument(related);
            rel.setRelationType(type);
            d.getRelatedDocuments().add(rel);

            if (type == DocumentRelationType.REPLACES) {
                related.setValidity(ValidityStatus.EXPIRED);
                related.setUpdateAt(LocalDateTime.now());
                documentRepo.save(related);
            }
        }
    }

    private DocumentRelationType parseRelation(String type) {
        if (type == null) throw new IllegalArgumentException("Thiếu loại quan hệ văn bản");
        return switch (type.trim().toUpperCase()) {
            case "REPLACE", "REPLACES" -> DocumentRelationType.REPLACES;
            case "AMEND", "AMENDS" -> DocumentRelationType.AMENDS;
            case "SUPPLEMENT", "SUPPLEMENTS" -> DocumentRelationType.SUPPLEMENTS;
            default -> throw new IllegalArgumentException("Loại quan hệ không hợp lệ: " + type);
        };
    }

    private ValidityStatus parseValidity(String v) {
        if (v == null || v.isBlank()) return ValidityStatus.IN_EFFECT;
        try {
            return ValidityStatus.valueOf(v.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Tình trạng hiệu lực không hợp lệ");
        }
    }

    private List<DocumentResponse> toResponses(List<Document> docs) {
        if (docs.isEmpty()) return List.of();
        Map<Integer, List<DocumentRelation>> incoming = relationRepo
                .findIncoming(docs.stream().map(Document::getDocId).toList()).stream()
                .collect(Collectors.groupingBy(r -> r.getRelatedDocument().getDocId()));
        return docs.stream()
                .map(d -> toResponse(d, incoming.getOrDefault(d.getDocId(), List.of()))).toList();
    }

    private DocumentResponse toResponse(Document d) {
        if (d.getDocId() == null) {
            return toResponse(d, List.of());
        }
        return toResponse(d, relationRepo.findIncoming(List.of(d.getDocId())));
    }


    private DocumentResponse toResponse(Document d, List<DocumentRelation> incoming) {
        List<DocumentResponse.Attachment> attachments = d.getAttachments().stream()
                .map(a -> new DocumentResponse.Attachment(a.getFileId(), a.getFileName(),
                        a.getFileSize(), a.getFileUrl(), a.getFileType())).toList();

        List<DocumentResponse.Relation> relations = new ArrayList<>();
        for (DocumentRelation r : d.getRelatedDocuments()) {
            Document o = r.getRelatedDocument();
            if (o != null) {
                relations.add(new DocumentResponse.Relation(
                        o.getDocId(), r.getRelationType().name(), o.getTitle(), o.getDocNumber(), false));
            }
        }
        for (DocumentRelation r : incoming) {
            Document o = r.getDocument();
            if (o != null) {
                relations.add(new DocumentResponse.Relation(
                        o.getDocId(), r.getRelationType().inverseName(), o.getTitle(), o.getDocNumber(), true));
            }
        }

        boolean replaced = incoming.stream()
                .anyMatch(r -> r.getRelationType() == DocumentRelationType.REPLACES);
        ValidityStatus selected = d.getValidity() == null ? ValidityStatus.IN_EFFECT : d.getValidity();
        ValidityStatus effective = replaced ? ValidityStatus.EXPIRED : selected;

        return new DocumentResponse(d.getDocId(), d.getDocNumber(), d.getTitle(),
                d.getContent(), d.getCreateAt(), d.getUpdateAt(), d.getStatus().name(),
                effective.name(), selected.name(),
                d.getDepartment() == null ? "" : d.getDepartment().getName(),
                d.getStaff() == null ? "" : d.getStaff().getFullName(),
                attachments, relations);
    }
}
