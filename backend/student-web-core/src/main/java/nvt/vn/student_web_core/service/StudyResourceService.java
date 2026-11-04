package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.*;
import nvt.vn.student_web_core.payload.StudyResourceResponse;
import nvt.vn.student_web_core.payload.staff.StudyResourceRequest;
import nvt.vn.student_web_core.repository.StudyResourceRepo;
import nvt.vn.student_web_core.util.AuthUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

/** Quản lý góc học tập (nhân viên): đăng tải, cập nhật, ẩn/hiện, xóa tài liệu & đề thi. */
@Service
@RequiredArgsConstructor
public class StudyResourceService {
    static final int MAX_FILES = 10;
    static final int MAX_LENGTH = 255;

    private final StudyResourceRepo resourceRepo;
    private final AuthUtil authUtil;
    private final CloudinaryService cloudinaryService;

    public List<StudyResourceResponse> list() {
        Staff staff = currentStaff();
        return resourceRepo.findAllByStaff(staff.getUserId()).stream().map(this::toResponse).toList();
    }

    public StudyResourceResponse detail(Integer id) { return toResponse(owned(id)); }

    @Transactional
    public StudyResourceResponse create(StudyResourceRequest req, List<MultipartFile> files) {
        Staff staff = currentStaff();
        validate(req);
        List<MultipartFile> newFiles = files == null ? List.of() : files;
        checkFileCount(newFiles.size());

        StudyResource r = new StudyResource();
        apply(r, req);
        r.setCreateAt(LocalDateTime.now());
        r.setStatus(ViewStatus.VISIBLE);
        r.setStaff(staff);

        List<String> uploaded = new ArrayList<>();
        try {
            for (MultipartFile f : newFiles) r.getFiles().add(upload(r, f, uploaded));
            return toResponse(resourceRepo.save(r));
        } catch (RuntimeException e) {
            uploaded.forEach(this::safeDelete);
            throw e;
        }
    }

    @Transactional
    public StudyResourceResponse update(Integer id, StudyResourceRequest req, List<MultipartFile> files) {
        StudyResource r = owned(id);
        validate(req);
        List<MultipartFile> newFiles = files == null ? List.of() : files;
        Set<String> keep = req.keepFileIds() == null ? Set.of() : new HashSet<>(req.keepFileIds());
        if (keep.stream().anyMatch(k -> r.getFiles().stream().noneMatch(f -> f.getFileId().equals(k))))
            throw new IllegalArgumentException("Tập tin giữ lại không hợp lệ");
        checkFileCount(keep.size() + newFiles.size());

        List<FileAttachment> removed = r.getFiles().stream()
                .filter(f -> !keep.contains(f.getFileId())).toList();
        List<String> uploaded = new ArrayList<>();
        try {
            apply(r, req);
            r.getFiles().removeIf(f -> !keep.contains(f.getFileId()));
            for (MultipartFile f : newFiles) r.getFiles().add(upload(r, f, uploaded));
            StudyResource saved = resourceRepo.save(r);
            removed.forEach(f -> safeDelete(f.getFileId()));   // chỉ xóa trên Cloudinary sau khi lưu DB thành công
            return toResponse(saved);
        } catch (RuntimeException e) {
            uploaded.forEach(this::safeDelete);
            throw e;
        }
    }

    @Transactional
    public StudyResourceResponse setVisibility(Integer id, ViewStatus status) {
        StudyResource r = owned(id);
        r.setStatus(status);
        return toResponse(resourceRepo.save(r));
    }

    @Transactional
    public void delete(Integer id) {
        StudyResource r = owned(id);
        List<String> fileIds = r.getFiles().stream().map(FileAttachment::getFileId).toList();
        resourceRepo.delete(r);
        resourceRepo.flush();
        fileIds.forEach(this::safeDelete);
    }

    // ---------------------------------------------------------------- helpers

    private Staff currentStaff() {
        User user = authUtil.loggedInUser();
        if (!(user instanceof Staff staff))
            throw new SecurityException("Chỉ nhân viên mới được thực hiện chức năng này");
        return staff;
    }

    /** Chỉ nhân viên đã đăng tài liệu mới được xem chi tiết / sửa / ẩn-hiện / xóa. */
    private StudyResource owned(Integer id) {
        Staff staff = currentStaff();
        StudyResource r = resourceRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Tài liệu không tồn tại"));
        if (r.getStaff() == null || !Objects.equals(r.getStaff().getUserId(), staff.getUserId()))
            throw new SecurityException("Bạn không có quyền thao tác tài liệu này");
        return r;
    }

    private void validate(StudyResourceRequest req) {
        if (req == null || blank(req.title()))
            throw new IllegalArgumentException("Vui lòng điền đầy đủ thông tin bắt buộc");
        if (req.title().trim().length() > MAX_LENGTH)
            throw new IllegalArgumentException("Tiêu đề không được vượt quá " + MAX_LENGTH + " ký tự");
        if (req.description() != null && req.description().trim().length() > MAX_LENGTH)
            throw new IllegalArgumentException("Mô tả không được vượt quá " + MAX_LENGTH + " ký tự");
        parseType(req.resourceType());
    }

    private void apply(StudyResource r, StudyResourceRequest req) {
        r.setTitle(req.title().trim());
        r.setDescription(blank(req.description()) ? null : req.description().trim());
        r.setResourceType(parseType(req.resourceType()));
    }

    private ResourceType parseType(String type) {
        if (blank(type)) throw new IllegalArgumentException("Vui lòng chọn loại tài liệu");
        try {
            return ResourceType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Loại tài liệu không hợp lệ");
        }
    }

    /** Mỗi tài liệu cần ít nhất 1 tập tin và không quá MAX_FILES. */
    private void checkFileCount(int total) {
        if (total < 1) throw new IllegalArgumentException("Vui lòng chọn ít nhất một tập tin");
        if (total > MAX_FILES) throw new IllegalArgumentException("Mỗi tài liệu tối đa " + MAX_FILES + " tập tin");
    }

    private boolean blank(String s) { return s == null || s.isBlank(); }

    private FileAttachment upload(StudyResource r, MultipartFile file, List<String> uploaded) {
        CloudinaryService.UploadedFile up = cloudinaryService.upload(file, "study-resources");
        uploaded.add(up.publicId());
        FileAttachment a = new FileAttachment();
        a.setFileId(up.publicId());
        a.setFileName(file.getOriginalFilename());
        a.setFileUrl(up.url());
        a.setFileType(file.getContentType());
        a.setFileSize((int) up.bytes());
        a.setCreateAt(LocalDateTime.now());
        a.setStudyResource(r);
        return a;
    }

    private void safeDelete(String id) {
        try {
            cloudinaryService.delete(id, "raw");
        } catch (Exception ignored) { }
    }

    private StudyResourceResponse toResponse(StudyResource r) {
        List<StudyResourceResponse.FileInfo> files = r.getFiles().stream()
                .map(f -> new StudyResourceResponse.FileInfo(f.getFileId(), f.getFileName(),
                        f.getFileSize(), f.getFileUrl(), f.getFileType())).toList();
        return new StudyResourceResponse(r.getResourceId(), r.getTitle(), r.getDescription(),
                r.getResourceType() == null ? null : r.getResourceType().name(),
                r.getStatus() == null ? ViewStatus.VISIBLE.name() : r.getStatus().name(),
                r.getCreateAt(),
                r.getStaff() == null ? "" : r.getStaff().getFullName(), files);
    }
}