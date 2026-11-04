package nvt.vn.student_web_core.payload;

import java.time.LocalDateTime;
import java.util.List;

public record StudyResourceResponse(
        Integer id, String title, String description,
        String resourceType, String status,
        LocalDateTime createAt,
        String staffName, List<FileInfo> files) {
    public record FileInfo(String id, String name, long size, String url, String fileType) {}
}