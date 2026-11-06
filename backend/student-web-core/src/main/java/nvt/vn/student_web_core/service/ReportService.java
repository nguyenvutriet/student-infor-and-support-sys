package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.payload.ReportRequest;
import nvt.vn.student_web_core.payload.ReportResponse;

public interface ReportService {

    ReportResponse reportPostOrComment(ReportRequest request, String userId);
}
