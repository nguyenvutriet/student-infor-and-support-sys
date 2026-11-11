package nvt.vn.student_web_core.payload.staff;

import java.time.LocalDateTime;
import java.util.List;

public final class StaffStatisticsDto {
    private StaffStatisticsDto() {}

    public record DayCount(String date, long count) {}

    public record MessageStats(long total, long pending, long processing, long closed, long rejected,
                               long forwardedOut, long invited,
                               Long avgProcessMinutes, long closedSamples,
                               List<DayCount> daily, boolean empty) {}

    public record DocItem(Integer docId, String docNumber, String title, LocalDateTime createAt, String status) {}

    public record DocumentStats(long total, long visible, long hidden, long newInPeriod,
                                List<DayCount> daily, List<DocItem> items, boolean empty) {}

    public record StudyItem(Integer resourceId, String title, String type, LocalDateTime createAt, String status) {}

    public record StudyStats(long totalExams, long totalDocuments,
                             long examsVisible, long examsHidden, long docsVisible, long docsHidden,
                             long newInPeriod, List<DayCount> daily, List<StudyItem> items, boolean empty) {}

    public record ForumTop(Integer postId, String title, LocalDateTime createAt,
                           long comments, long reactions, long interactions) {}

    public record ForumStats(long posts, long comments, long reactions, long reportedPosts,
                             List<DayCount> daily, List<ForumTop> top, boolean empty) {}
}