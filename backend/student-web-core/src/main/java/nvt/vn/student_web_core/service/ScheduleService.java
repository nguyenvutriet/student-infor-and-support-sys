package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.payload.student.ScheduleEventRequest;
import nvt.vn.student_web_core.payload.student.ScheduleEventResponse;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleService {
    List<ScheduleEventResponse> getSchedules(String userId, LocalDate start, LocalDate end);

    ScheduleEventResponse createSchedule(String userId, ScheduleEventRequest request);

    ScheduleEventResponse updateSchedule(String userId, Integer scheduleId, ScheduleEventRequest request);

    void deleteSchedule(String userId, Integer scheduleId);
}
