package nvt.vn.student_web_core.controller.student;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.ResourceType;
import nvt.vn.student_web_core.payload.student.*;
import nvt.vn.student_web_core.service.DepartmentService;
import nvt.vn.student_web_core.service.StudyService;
import nvt.vn.student_web_core.util.AuthUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/study")
@RequiredArgsConstructor
public class StudyController {

    private final StudyService studyService;
    private final AuthUtil authUtil;
    private final DepartmentService departmentService;

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentSummaryResponse>> getDepartments(){
        return new ResponseEntity<>(departmentService.getAllDepartment(), HttpStatus.OK);
    }

    @GetMapping("/resources/latest")
    public ResponseEntity<List<StudyResourceSummaryResponse>> getLatestResource(@RequestParam(defaultValue = "10") Integer limit){
        return new ResponseEntity<>(studyService.getHotResources(limit), HttpStatus.OK);
    }

    @GetMapping("/departments/{departmentId}")
    public ResponseEntity<DepartmentDetailResponse> getDepartment(@PathVariable String departmentId){
        return new ResponseEntity<>(departmentService.findDepartment(departmentId), HttpStatus.OK);
    }

    @GetMapping("/departments/{departmentId}/resources")
    public ResponseEntity<ResourceSearchResponse> lookupResourceByDepartment(@PathVariable String departmentId, @RequestParam ResourceType type, @RequestParam(required = false) String keyword, @RequestParam(required = false, defaultValue = "0") int year){

        ResourceSearchResponse response = studyService.lookupResourceByDepartment(departmentId, type, keyword, year);
        return new ResponseEntity<>(response, HttpStatus.OK);

    }

    @GetMapping("/resources/{resourceId}")
    public ResponseEntity<StudyResourceDetailResponse> getResourceDetail(@PathVariable Integer resourceId){
        StudyResourceDetailResponse response = studyService.getResourceDetail(resourceId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }








}
