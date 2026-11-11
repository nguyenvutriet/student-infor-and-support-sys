package nvt.vn.student_web_core.payload.student;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ScheduleEventRequest {

    @NotBlank
    private String title;
    private String subject;

    @NotNull
    private LocalDate startTime;

    @NotNull
    private LocalDate endTime;
    private String note;


}
