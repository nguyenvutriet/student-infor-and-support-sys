package nvt.vn.student_web_core.payload.admin;

import java.util.List;

public record StatisticsDashboardDTO(
        Overview overview,
        List<StatusStat> requestStatuses,
        List<DepartmentStat> departments,
        List<MonthlyStat> monthlyActivities,
        ForumStat forum,
        ReportStat reports
) {
    public record Overview(
            long totalUsers,
            long students,
            long staffs,
            long admins,
            long activeUsers,
            long lockedUsers,
            long totalRequests,
            long totalPosts,
            long totalComments,
            long totalReports
    ) {}

    public record StatusStat(
            String status,
            long count
    ) {}

    public record DepartmentStat(
            String department,
            long count
    ) {}

    public record MonthlyStat(
            String month,
            long requests,
            long posts,
            long comments
    ) {}

    public record ForumStat(
            long visiblePosts,
            long hiddenPosts,
            long activeComments
    ) {}

    public record ReportStat(
            long postReports,
            long commentReports,
            long resolved,
            long pending
    ) {}
}