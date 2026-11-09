package nvt.vn.student_web_core.controller.student;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.payload.student.DepartmentSummaryResponse;
import nvt.vn.student_web_core.payload.student.StudyResourceSummaryResponse;
import nvt.vn.student_web_core.service.DepartmentService;
import nvt.vn.student_web_core.service.StudyService;
import nvt.vn.student_web_core.util.AuthUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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




}
