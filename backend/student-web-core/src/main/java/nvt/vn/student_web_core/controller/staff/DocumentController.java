package nvt.vn.student_web_core.controller.staff;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.payload.*;
import nvt.vn.student_web_core.model.ViewStatus;
import nvt.vn.student_web_core.service.DocumentService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/staff/documents")
@RequiredArgsConstructor
public class DocumentController {
    private final DocumentService documentService;
    @GetMapping
    public Object list(@RequestParam(required = false) String title) {
        return documentService.staffList(title);
    }

    @GetMapping("/{id}")
    public Object detail(@PathVariable Integer id) {
        return documentService.staffDetail(id);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Object create(@RequestPart("data") DocumentRequest data,
                         @RequestPart(value = "files", required = false)
                         List<MultipartFile> files) {
        return documentService.create(data, files);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Object update(@PathVariable Integer id,
                         @RequestPart("data") DocumentRequest data,
                         @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        return documentService.update(id, data, files);
    }

    @PatchMapping("/{id}/visibility")
    public Object visibility(@PathVariable Integer id, @RequestParam ViewStatus status) {
        return documentService.setVisibility(id, status);
    }
}
