package nvt.vn.student_web_core.payload.staff;

import java.util.List;

public record StudyResourceRequest(
        String title,
        String description,
        String resourceType,           // EXAM | DOCUMENT
        List<String> keepFileIds) {    // id các tập tin cũ còn giữ khi cập nhật
}

