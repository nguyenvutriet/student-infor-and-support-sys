package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.payload.admin.StatisticsDashboardDTO;
import nvt.vn.student_web_core.model.*;
import nvt.vn.student_web_core.repository.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminStatisticsService {

    private final UserRepo userRepo;
    private final RequestRepo requestRepo;
    private final ForumPostRepo forumPostRepo;
    private final CommentRepo commentRepo;
    private final ReportRepo reportRepo;

    public StatisticsDashboardDTO getDashboard(
            LocalDate fromDate,
            LocalDate toDate
    ) {
        if ((fromDate == null) != (toDate == null)) {
            throw new IllegalArgumentException(
                    "Phải chọn đầy đủ ngày bắt đầu và ngày kết thúc."
            );
        }

        if (fromDate != null && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException(
                    "Ngày bắt đầu không được lớn hơn ngày kết thúc."
            );
        }

        LocalDateTime from = fromDate == null
                ? null
                : fromDate.atStartOfDay();

        LocalDateTime to = toDate == null
                ? null
                : toDate.plusDays(1).atStartOfDay().minusNanos(1);

        // 1. Tài khoản
        long totalUsers = userRepo.count();

        long students = userRepo.countByRole(Role.STUDENT);
        long staffs = userRepo.countByRole(Role.STAFF);
        long admins = userRepo.countByRole(Role.ADMIN);

        long activeUsers = userRepo.countByStatus(AccountStatus.ACTIVE);
        long lockedUsers = userRepo.countByStatus(AccountStatus.LOCKED);

        // 2. Yêu cầu hỗ trợ
        List<Object[]> requestStatusRows = from == null
                ? requestRepo.countAllByStatus()
                : requestRepo.countByStatusBetween(from, to);

        List<StatisticsDashboardDTO.StatusStat> requestStatuses =
                requestStatusRows.stream()
                        .map(row -> new StatisticsDashboardDTO.StatusStat(
                                String.valueOf(row[0]),
                                ((Number) row[1]).longValue()
                        ))
                        .toList();

        long totalRequests = requestStatuses.stream()
                .mapToLong(StatisticsDashboardDTO.StatusStat::count)
                .sum();

        List<Object[]> departmentRows = from == null
                ? requestRepo.countAllByDepartment()
                : requestRepo.countByDepartmentBetween(from, to);

        List<StatisticsDashboardDTO.DepartmentStat> departments =
                departmentRows.stream()
                        .map(row -> new StatisticsDashboardDTO.DepartmentStat(
                                String.valueOf(row[0]),
                                ((Number) row[1]).longValue()
                        ))
                        .toList();

        // 3. Diễn đàn
        List<Object[]> postStatusRows = from == null
                ? forumPostRepo.countAllByStatus()
                : forumPostRepo.countByStatusBetween(from, to);

        long visiblePosts = 0;
        long hiddenPosts = 0;

        for (Object[] row : postStatusRows) {
            ViewStatus status = (ViewStatus) row[0];
            long count = ((Number) row[1]).longValue();

            if (status == ViewStatus.VISIBLE) {
                visiblePosts = count;
            } else if (status == ViewStatus.HIDDEN) {
                hiddenPosts = count;
            }
        }

        long totalPosts = visiblePosts + hiddenPosts;

        long totalComments = from == null
                ? commentRepo.count()
                : commentRepo.countCreatedBetween(from, to);

        long activeComments = from == null
                ? commentRepo.countByIsActiveTrue()
                : commentRepo.countActiveBetween(from, to);

        // 4. Báo cáo vi phạm
        long postReports = from == null
                ? reportRepo.countPostReports()
                : reportRepo.countPostReportsBetween(from, to);

        long commentReports = from == null
                ? reportRepo.countCommentReports()
                : reportRepo.countCommentReportsBetween(from, to);

        long resolved = from == null
                ? reportRepo.countResolved()
                : reportRepo.countResolvedBetween(from, to);

        long pending = from == null
                ? reportRepo.countPending()
                : reportRepo.countPendingBetween(from, to);

        long totalReports = resolved + pending;

        // 5. Hoạt động theo tháng
        Map<String, long[]> monthlyMap = new TreeMap<>();

        addMonthlyData(
                monthlyMap,
                from == null
                        ? requestRepo.countMonthlyRequests()
                        : requestRepo.countMonthlyRequestsBetween(from, to),
                0
        );

        addMonthlyData(
                monthlyMap,
                from == null
                        ? forumPostRepo.countMonthlyPosts()
                        : forumPostRepo.countMonthlyPostsBetween(from, to),
                1
        );

        addMonthlyData(
                monthlyMap,
                from == null
                        ? commentRepo.countMonthlyComments()
                        : commentRepo.countMonthlyCommentsBetween(from, to),
                2
        );

        List<StatisticsDashboardDTO.MonthlyStat> monthlyActivities =
                monthlyMap.entrySet().stream()
                        .map(entry -> new StatisticsDashboardDTO.MonthlyStat(
                                entry.getKey(),
                                entry.getValue()[0],
                                entry.getValue()[1],
                                entry.getValue()[2]
                        ))
                        .toList();

        // 6. Tổng quan
        var overview = new StatisticsDashboardDTO.Overview(
                totalUsers,
                students,
                staffs,
                admins,
                activeUsers,
                lockedUsers,
                totalRequests,
                totalPosts,
                totalComments,
                totalReports
        );

        var forum = new StatisticsDashboardDTO.ForumStat(
                visiblePosts,
                hiddenPosts,
                activeComments
        );

        var reports = new StatisticsDashboardDTO.ReportStat(
                postReports,
                commentReports,
                resolved,
                pending
        );

        return new StatisticsDashboardDTO(
                overview,
                requestStatuses,
                departments,
                monthlyActivities,
                forum,
                reports
        );
    }

    private void addMonthlyData(
            Map<String, long[]> monthlyMap,
            List<Object[]> rows,
            int index
    ) {
        for (Object[] row : rows) {
            String month = String.valueOf(row[0]);
            long count = ((Number) row[1]).longValue();

            monthlyMap.computeIfAbsent(month, key -> new long[3])[index] = count;
        }
    }
}