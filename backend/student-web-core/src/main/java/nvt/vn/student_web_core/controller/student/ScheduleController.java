package nvt.vn.student_web_core.controller.student;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.payload.student.ScheduleEventRequest;
import nvt.vn.student_web_core.payload.student.ScheduleEventResponse;
import nvt.vn.student_web_core.service.ScheduleService;
import nvt.vn.student_web_core.util.AuthUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.function.support.RouterFunctionMapping;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/student/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;
    private final AuthUtil authUtil;
    private final RouterFunctionMapping routerFunctionMapping;

    @GetMapping
    public ResponseEntity<List<ScheduleEventResponse>> getSchedules(@RequestParam String from, @RequestParam String to){

        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);

        String userId = authUtil.loggedInUser().getUserId();
        List<ScheduleEventResponse> schedules = scheduleService.getSchedules(userId, fromDate, toDate);
        return new ResponseEntity<>(schedules, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<ScheduleEventResponse> createSchedule(@RequestBody ScheduleEventRequest request){
        String userId = authUtil.loggedInUser().getUserId();
        System.out.println("User ID: " + userId);
        ScheduleEventResponse scheduleEventResponse = scheduleService.createSchedule(userId, request);
        return new ResponseEntity<>(scheduleEventResponse, HttpStatus.CREATED);
    }

    @PutMapping("/{scheduleId}")
    public  ResponseEntity<ScheduleEventResponse> updateSchedule(@PathVariable Integer scheduleId, @RequestBody ScheduleEventRequest request){
        String userId = authUtil.loggedInUser().getUserId();
        ScheduleEventResponse scheduleEventResponse = scheduleService.updateSchedule(userId, scheduleId, request);
        return new ResponseEntity<>(scheduleEventResponse, HttpStatus.OK);
    }

    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Integer scheduleId) {
        String userId = authUtil.loggedInUser().getUserId();
        scheduleService.deleteSchedule(userId, scheduleId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

}
