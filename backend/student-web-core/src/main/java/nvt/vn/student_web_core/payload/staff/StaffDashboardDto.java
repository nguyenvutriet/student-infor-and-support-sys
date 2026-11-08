package nvt.vn.student_web_core.payload.staff;

import java.time.LocalDateTime;
import java.util.List;

public final class StaffDashboardDto {
    private StaffDashboardDto() {}

    public record Dashboard(String staffName, String departmentName, Counts counts,
                            List<DayCount> weekly, List<PendingItem> recentPending) {}

    /**
     * pending: số yêu cầu ở tab "Tiếp nhận yêu cầu" (gồm cả lời mời hỗ trợ chưa tiếp nhận);
     * processing: yêu cầu đơn vị mình đang xử lý; supporting: yêu cầu đang hỗ trợ đơn vị khác;
     * closed: yêu cầu đơn vị mình đã xử lý xong.
     */
    public record Counts(long pending, long invitedPending, long processing, long supporting,
                         long closed, long documents, long studyResources) {}

    public record DayCount(String date, long count) {}

    public record PendingItem(Integer requestId, String subject, String studentName, String studentId,
                              LocalDateTime createdAt, boolean invited) {}
}