package nvt.vn.student_web_core.controller.staff;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.ViewStatus;
import nvt.vn.student_web_core.payload.staff.StudyResourceRequest;
import nvt.vn.student_web_core.service.StudyResourceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** API quản lý góc học tập cho nhân viên (STAFF). */
@RestController
@RequestMapping("/api/staff/study-resources")
@RequiredArgsConstructor
public class StaffStudyResourceController {
    private final StudyResourceService studyResourceService;

    @GetMapping
    public Object list() { return studyResourceService.list(); }

    @GetMapping("/{id}")
    public Object detail(@PathVariable Integer id) { return studyResourceService.detail(id); }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Object create(@RequestPart("data") StudyResourceRequest data,
                         @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        return studyResourceService.create(data, files);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Object update(@PathVariable Integer id,
                         @RequestPart("data") StudyResourceRequest data,
                         @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        return studyResourceService.update(id, data, files);
    }

    @PatchMapping("/{id}/visibility")
    public Object visibility(@PathVariable Integer id, @RequestParam ViewStatus status) {
        return studyResourceService.setVisibility(id, status);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) { studyResourceService.delete(id); }
}