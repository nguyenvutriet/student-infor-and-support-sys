package nvt.vn.student_web_core.payload.student;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ScheduleEventResponse {

    private Integer scheduleId;
    private String title;
    private String subject;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String note;

}
