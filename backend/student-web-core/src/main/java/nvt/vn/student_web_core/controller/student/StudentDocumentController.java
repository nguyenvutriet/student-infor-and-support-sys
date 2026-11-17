package nvt.vn.student_web_core.controller.student;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.payload.DocumentResponse;
import nvt.vn.student_web_core.service.DocumentService;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student/documents")
@RequiredArgsConstructor
public class StudentDocumentController {

    private final DocumentService documentService;

    @GetMapping("/departments")
    public List<Map<String, String>> departments() {
        return documentService.departments();
    }

    @GetMapping
    public List<DocumentResponse> list(@RequestParam(required = false) String departmentId,
                                       @RequestParam(required = false) String title) {
        if (departmentId != null && !departmentId.isBlank()) {
            return documentService.studentList(departmentId, title);
        }
        return documentService.departments().stream()
                .flatMap(d -> documentService.studentList(d.get("departmentId"), title).stream())
                .sorted(Comparator.comparing(DocumentResponse::createAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @GetMapping("/{id}")
    public DocumentResponse detail(@PathVariable Integer id) {
        return documentService.studentDetail(id);
    }
}
