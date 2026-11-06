package nvt.vn.student_web_core.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CloudinaryService {
    private final Cloudinary cloudinary;
    private static final Set<String> ALLOWED = Set.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip");
    private static final long MAX_SIZE = 10L * 1024 * 1024;
    public static final Set<String> CHAT_ALLOWED = Set.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip",
            "png", "jpg", "jpeg", "gif", "webp", "txt");
    private static final Set<String> IMAGE_EXT = Set.of("png", "jpg", "jpeg", "gif", "webp");
    private static final Set<String> VIDEO_EXT = Set.of("mp4", "webm", "mov");

    public record UploadedFile(String publicId, String url, String resourceType, String format, long bytes) {}

    public UploadedFile upload(MultipartFile file, String folder) {
        validate(file);
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "student-hub/" + folder,
                    "public_id", UUID.randomUUID() + "." + extension(file.getOriginalFilename()),
                    "resource_type", "raw",
                    "use_filename", false,
                    "unique_filename", true));
            return new UploadedFile(
                    String.valueOf(result.get("public_id")),
                    String.valueOf(result.get("secure_url")),
                    "raw",
                    String.valueOf(result.containsKey("format") ? result.get("format") : extension(file.getOriginalFilename())),
                    ((Number) (result.containsKey("bytes") ? result.get("bytes") : file.getSize())).longValue());
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tải tập tin lên Cloudinary", e);
        }
    }

    public UploadedFile uploadChat(MultipartFile file) {
        String ext = extension(file.getOriginalFilename());
        boolean image = IMAGE_EXT.contains(ext);
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "student-hub/chat",
                    "public_id", image ? UUID.randomUUID().toString() : UUID.randomUUID() + "." + ext,
                    "resource_type", image ? "image" : "raw",
                    "use_filename", false,
                    "unique_filename", true));
            return new UploadedFile(
                    String.valueOf(result.get("public_id")),
                    String.valueOf(result.get("secure_url")),
                    image ? "image" : "raw",
                    ext,
                    ((Number) (result.containsKey("bytes") ? result.get("bytes") : file.getSize())).longValue());
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tải tập tin lên Cloudinary", e);
        }
    }

    public UploadedFile uploadForum(MultipartFile file) {
        String ext = extension(file.getOriginalFilename());
        String type = IMAGE_EXT.contains(ext) ? "image" : VIDEO_EXT.contains(ext) ? "video" : "raw";
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "student-hub/forum",
                    "public_id", "raw".equals(type) ? UUID.randomUUID() + "." + ext : UUID.randomUUID().toString(),
                    "resource_type", type,
                    "use_filename", false,
                    "unique_filename", true));
            return new UploadedFile(
                    String.valueOf(result.get("public_id")),
                    String.valueOf(result.get("secure_url")),
                    type,
                    ext,
                    ((Number) (result.containsKey("bytes") ? result.get("bytes") : file.getSize())).longValue());
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tải tập tin lên Cloudinary", e);
        }
    }

    public void delete(String publicId, String resourceType) {
        if (publicId == null || publicId.isBlank()) return;
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", resourceType == null ? "raw" : resourceType));
        } catch (Exception e) {
            throw new IllegalStateException("Không thể xóa tập tin trên Cloudinary", e);
        }
    }

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Tập tin không được để trống");
        if (file.getSize() > MAX_SIZE) throw new IllegalArgumentException("Mỗi tập tin không được vượt quá 10 MB");
        String ext = extension(file.getOriginalFilename());
        if (!ALLOWED.contains(ext)) throw new IllegalArgumentException("Định dạng tập tin không được hỗ trợ");
    }

    public String extension(String name) {
        if (name == null || !name.contains(".")) return "";
        return name.substring(name.lastIndexOf('.') + 1).toLowerCase();
    }

    public void deleteFile(String publicId) {
        try {
            cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.emptyMap()
            );
        } catch (Exception e) {
            throw new RuntimeException("Không thể xóa file trên Cloudinary", e);
        }
    }
}