package nvt.vn.student_web_core.payload;

import lombok.Data;

@Data
public class ForgotPasswordErrorBody {

    private int status;
    private String message;
    private String code;
    private String field;
    private long retryAfterSeconds;
    private boolean requireResend;
    private Integer attemptsLeft;

}
