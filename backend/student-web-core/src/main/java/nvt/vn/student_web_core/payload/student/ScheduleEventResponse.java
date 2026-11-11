package nvt.vn.student_web_core.payload.student;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ScheduleEventResponse {

    private Integer scheduleId;
    private String title;
    private String subject;
    private LocalDate startTime;
    private LocalDate endTime;
    private String note;

}
