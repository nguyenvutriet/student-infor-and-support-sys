package nvt.vn.student_web_core.payload;

import lombok.Data;

@Data
public class ReportRequest {
    private String targetType;
    private Integer targetId;
    private String reasonType;
    private String reasonDetail;
    private String reason;

}
