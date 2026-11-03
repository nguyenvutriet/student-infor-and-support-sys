package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;
import nvt.vn.student_web_core.model.*;
import nvt.vn.student_web_core.repository.*;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminStatisticsPdfService {

    private final UserRepo userRepo;
    private final RequestRepo requestRepo;
    private final DepartmentRepo departmentRepo;
    private final ForumPostRepo forumPostRepo;
    private final CommentRepo commentRepo;
    private final ReportRepo reportRepo;

    private static final float PAGE_WIDTH = PDRectangle.A4.getWidth();
    private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();

    private static final float MARGIN = 42;
    private static final float CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

    private static final Color NAVY = new Color(18, 59, 99);
    private static final Color BLUE = new Color(35, 112, 174);
    private static final Color LIGHT_BLUE = new Color(226, 239, 250);
    private static final Color GOLD = new Color(220, 165, 55);
    private static final Color GREEN = new Color(36, 145, 101);
    private static final Color RED = new Color(202, 76, 76);
    private static final Color PURPLE = new Color(126, 92, 170);
    private static final Color TEXT = new Color(48, 57, 68);
    private static final Color MUTED = new Color(112, 124, 138);
    private static final Color BORDER = new Color(222, 228, 235);
    private static final Color BACKGROUND = new Color(246, 248, 251);
    private static final Color WHITE = Color.WHITE;

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final DateTimeFormatter DATETIME_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private static final DateTimeFormatter MONTH_FORMAT =
            DateTimeFormatter.ofPattern("MM/yyyy");

    private PDDocument document;
    private PDType0Font regular;
    private PDType0Font bold;

    private PDPage currentPage;
    private PDPageContentStream content;

    private float y;
    private int pageNumber;

    public synchronized byte[] generate(
            LocalDate fromDate,
            LocalDate toDate
    ) {
        if ((fromDate == null) != (toDate == null)
                || (fromDate != null && fromDate.isAfter(toDate))) {
            throw new IllegalArgumentException(
                    "Khoảng thời gian xuất báo cáo không hợp lệ"
            );
        }

        // RESET TRẠNG THÁI CỦA LẦN XUẤT PDF TRƯỚC
        this.document = null;
        this.currentPage = null;
        this.content = null;
        this.pageNumber = 0;
        this.y = 0;

        LocalDateTime from = fromDate == null
                ? null
                : fromDate.atStartOfDay();

        LocalDateTime to = toDate == null
                ? null
                : toDate.plusDays(1)
                .atStartOfDay()
                .minusNanos(1);

        try (
                PDDocument pdf = new PDDocument();
                ByteArrayOutputStream output = new ByteArrayOutputStream();
                InputStream regularStream =
                        new ClassPathResource(
                                "fonts/NotoSans-Regular.ttf"
                        ).getInputStream();
                InputStream boldStream =
                        new ClassPathResource(
                                "fonts/NotoSans-Bold.ttf"
                        ).getInputStream()
        ) {
            this.document = pdf;

            regular = PDType0Font.load(pdf, regularStream);
            bold = PDType0Font.load(pdf, boldStream);

            ReportData data = collectData(from, to);

            createCover(data, fromDate, toDate);
            createAccountAndRequestPage(data);
            createDepartmentPage(data);
            createForumPage(data);
            createReportPage(data);

            closeCurrentPage();

            addPageNumbersAndFooter();

            pdf.save(output);

            return output.toByteArray();

        } catch (Exception e) {

            e.printStackTrace();

            throw new RuntimeException(
                    "Không thể tạo báo cáo PDF: " + e.getMessage(),
                    e
            );

        } finally {
            // Không giữ tham chiếu đến tài nguyên đã đóng
            this.content = null;
            this.currentPage = null;
            this.document = null;
            this.pageNumber = 0;
            this.y = 0;
        }
    }

    // =========================================================
    // 1. COLLECT DATABASE DATA
    // =========================================================

    private ReportData collectData(
            LocalDateTime from,
            LocalDateTime to
    ) {
        ReportData data = new ReportData();

        boolean allTime = from == null && to == null;

        // =====================================================
        // 1. THỐNG KÊ TÀI KHOẢN
        // Số liệu hiện tại, không phụ thuộc bộ lọc ngày
        // =====================================================

        data.totalUsers = userRepo.count();
        data.students = userRepo.countByRole(Role.STUDENT);
        data.staffs = userRepo.countByRole(Role.STAFF);
        data.admins = userRepo.countByRole(Role.ADMIN);

        data.activeUsers = userRepo.countByStatus(AccountStatus.ACTIVE);
        data.lockedUsers = userRepo.countByStatus(AccountStatus.LOCKED);


        // =====================================================
        // 2. THỐNG KÊ YÊU CẦU HỖ TRỢ
        // =====================================================

        if (allTime) {

            // Lấy số lượng theo từng trạng thái toàn thời gian
            List<Object[]> statusRows = requestRepo.countAllByStatus();

            for (Object[] row : statusRows) {
                String status = row[0].toString();
                long count = ((Number) row[1]).longValue();

                data.requestStatuses.add(
                        new LabelValue(status, count)
                );

                data.totalRequests += count;
            }

            // Lấy số lượng yêu cầu theo phòng ban toàn thời gian
            List<Object[]> departmentRows =
                    requestRepo.countAllByDepartment();

            for (Object[] row : departmentRows) {
                String departmentName = String.valueOf(row[0]);
                long count = ((Number) row[1]).longValue();

                data.departments.add(
                        new LabelValue(departmentName, count)
                );
            }

        } else {

            // Yêu cầu trong khoảng ngày
            data.totalRequests = requestRepo.countCreatedBetween(from, to);

            for (RequestStatus status : RequestStatus.values()) {
                long count = requestRepo.countByStatusBetween(
                        status, from, to
                );

                data.requestStatuses.add(
                        new LabelValue(status.name(), count)
                );
            }

            // Thống kê phòng ban trong khoảng ngày
            departmentRepo.findAll().forEach(department -> {
                long count = requestRepo.countByDepartmentBetween(
                        department.getDepartmentId(),
                        from,
                        to
                );

                data.departments.add(
                        new LabelValue(department.getName(), count)
                );
            });
        }

        data.departments.sort(
                (a, b) -> Long.compare(b.value, a.value)
        );


        // =====================================================
        // 3. THỐNG KÊ DIỄN ĐÀN
        // =====================================================

        if (allTime) {

            List<Object[]> forumStatusRows =
                    forumPostRepo.countAllByStatus();

            for (Object[] row : forumStatusRows) {
                String status = row[0].toString();
                long count = ((Number) row[1]).longValue();

                if (ViewStatus.VISIBLE.name().equals(status)) {
                    data.visiblePosts = count;
                } else if (ViewStatus.HIDDEN.name().equals(status)) {
                    data.hiddenPosts = count;
                }

                data.totalPosts += count;
            }

            data.totalComments = commentRepo.count();
            data.activeComments = commentRepo.countByIsActiveTrue();

        } else {

            data.totalPosts = forumPostRepo.countCreatedBetween(from, to);

            data.visiblePosts = forumPostRepo.countByStatusBetween(
                    ViewStatus.VISIBLE, from, to
            );

            data.hiddenPosts = forumPostRepo.countByStatusBetween(
                    ViewStatus.HIDDEN, from, to
            );

            data.totalComments = commentRepo.countCreatedBetween(from, to);

            data.activeComments = commentRepo.countActiveBetween(from, to);
        }


        // =====================================================
        // 4. THỐNG KÊ BÁO CÁO VI PHẠM
        // =====================================================

        if (allTime) {

            data.postReports = reportRepo.countPostReports();
            data.commentReports = reportRepo.countCommentReports();
            data.resolvedReports = reportRepo.countResolved();
            data.pendingReports = reportRepo.countPending();

        } else {

            data.postReports = reportRepo.countPostReportsBetween(from, to);
            data.commentReports = reportRepo.countCommentReportsBetween(from, to);
            data.resolvedReports = reportRepo.countResolvedBetween(from, to);
            data.pendingReports = reportRepo.countPendingBetween(from, to);
        }

        data.totalReports = data.resolvedReports + data.pendingReports;

        return data;
    }

    private static class ReportData {
        long totalUsers;
        long students;
        long staffs;
        long admins;
        long activeUsers;
        long lockedUsers;

        long totalRequests;

        long totalPosts;
        long visiblePosts;
        long hiddenPosts;

        long totalComments;
        long activeComments;

        long postReports;
        long commentReports;
        long resolvedReports;
        long pendingReports;
        long totalReports;

        List<LabelValue> requestStatuses = new ArrayList<>();
        List<LabelValue> departments = new ArrayList<>();
    }

    private static class LabelValue {
        String label;
        long value;

        LabelValue(String label, long value) {
            this.label = label;
            this.value = value;
        }
    }

    // =========================================================
    // 2. COVER PAGE
    // =========================================================

    private void createCover(
            ReportData data,
            LocalDate from,
            LocalDate to
    ) throws Exception {

        startNewPage(false);

        // Nền đầu trang
        drawRect(
                0, PAGE_HEIGHT - 245,
                PAGE_WIDTH, 245,
                NAVY, null
        );

        drawText(
                MARGIN, PAGE_HEIGHT - 55,
                "HCMUTE",
                23, WHITE, bold
        );

        drawText(
                MARGIN, PAGE_HEIGHT - 83,
                "HỆ THỐNG GIẢI ĐÁP VÀ ĐỒNG HÀNH CÙNG SINH VIÊN",
                9, new Color(220, 232, 245), regular
        );

        drawLine(
                MARGIN, PAGE_HEIGHT - 105,
                PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 105,
                new Color(105, 140, 170), 1
        );

        drawText(
                MARGIN, PAGE_HEIGHT - 155,
                "BÁO CÁO",
                15, new Color(220, 232, 245), regular
        );

        drawText(
                MARGIN, PAGE_HEIGHT - 190,
                "THỐNG KÊ HỆ THỐNG",
                25, WHITE, bold
        );

        drawText(
                MARGIN, PAGE_HEIGHT - 216,
                "ADMINISTRATIVE STATISTICS REPORT",
                10, new Color(220, 232, 245), regular
        );

        y = PAGE_HEIGHT - 290;

        drawSectionTitle("THÔNG TIN BÁO CÁO");

        String periodText;

        if (from == null || to == null) {
            periodText = "TOÀN BỘ THỜI GIAN";
        } else {
            periodText = from.format(DATE_FORMAT)
                    + " - "
                    + to.format(DATE_FORMAT);
        }

        drawInfoRow(
                "Khoảng thời gian",
                periodText
        );

        drawInfoRow(
                "Ngày xuất báo cáo",
                LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"))
                        .format(DATETIME_FORMAT)
        );

        drawInfoRow(
                "Đối tượng sử dụng",
                "Ban quản trị hệ thống"
        );

        drawInfoRow(
                "Nguồn dữ liệu",
                "Cơ sở dữ liệu Student-Hub"
        );

        y -= 22;

        drawSectionTitle("TỔNG QUAN HỆ THỐNG");

        drawKpiCards(data);

        y -= 15;

        drawParagraph(
                "Báo cáo cung cấp thông tin tổng hợp về tình hình tài khoản, "
                        + "yêu cầu hỗ trợ, hoạt động diễn đàn và báo cáo vi phạm "
                        + "trong hệ thống. Các số liệu được truy vấn trực tiếp "
                        + "từ cơ sở dữ liệu tại thời điểm tạo báo cáo.",
                9,
                TEXT,
                15
        );

        closeCurrentPage();
    }

    // =========================================================
    // 3. ACCOUNT AND REQUEST PAGE
    // =========================================================

    private void createAccountAndRequestPage(ReportData data)
            throws Exception {

        startNewPage(true);

        drawPageTitle(
                "TÀI KHOẢN VÀ YÊU CẦU HỖ TRỢ",
                "Tổng hợp tình hình người dùng và tiếp nhận yêu cầu"
        );

        drawSectionTitle("01. THỐNG KÊ TÀI KHOẢN");

        drawTable(
                new String[]{"Nhóm tài khoản", "Số lượng"},
                new float[]{0.68f, 0.32f},
                new String[][]{
                        {"Tổng số tài khoản", number(data.totalUsers)},
                        {"Sinh viên", number(data.students)},
                        {"Nhân viên", number(data.staffs)},
                        {"Quản trị viên", number(data.admins)},
                        {"Đang hoạt động", number(data.activeUsers)},
                        {"Đã khóa", number(data.lockedUsers)}
                }
        );

        y -= 25;

        drawSectionTitle("02. THỐNG KÊ YÊU CẦU HỖ TRỢ");

        drawInfoRow("Tổng yêu cầu trong kỳ", number(data.totalRequests));

        y -= 12;

        drawDoughnutChart(
                "PHÂN BỐ TRẠNG THÁI YÊU CẦU",
                data.requestStatuses
        );

        closeCurrentPage();
    }

    // =========================================================
    // 4. DEPARTMENT PAGE
    // =========================================================

    private void createDepartmentPage(ReportData data)
            throws Exception {

        startNewPage(true);

        drawPageTitle(
                "THỐNG KÊ THEO PHÒNG BAN",
                "Phân tích số lượng yêu cầu được tiếp nhận"
        );

        drawSectionTitle("03. SỐ LƯỢNG YÊU CẦU THEO PHÒNG BAN");

        if (data.departments.isEmpty()) {
            drawEmptyMessage("Không có dữ liệu phòng ban.");
        } else {
            drawHorizontalBarChart(data.departments);
        }

        y -= 20;

        drawSectionTitle("BẢNG SỐ LIỆU CHI TIẾT");

        List<String[]> rows = new ArrayList<>();

        for (int i = 0; i < data.departments.size(); i++) {
            LabelValue item = data.departments.get(i);

            rows.add(new String[]{
                    String.valueOf(i + 1),
                    item.label,
                    number(item.value)
            });
        }

        drawTable(
                new String[]{"STT", "Phòng ban", "Số yêu cầu"},
                new float[]{0.12f, 0.58f, 0.30f},
                rows.toArray(new String[0][])
        );

        closeCurrentPage();
    }

    // =========================================================
    // 5. FORUM PAGE
    // =========================================================

    private void createForumPage(ReportData data)
            throws Exception {

        startNewPage(true);

        drawPageTitle(
                "HOẠT ĐỘNG DIỄN ĐÀN",
                "Thống kê bài viết và tương tác của người dùng"
        );

        drawSectionTitle("04. TỔNG HỢP HOẠT ĐỘNG");

        drawKpiCards(
                new String[]{
                        "BÀI VIẾT MỚI",
                        "BÀI VIẾT HIỂN THỊ",
                        "BÀI VIẾT BỊ ẨN",
                        "BÌNH LUẬN MỚI"
                },
                new long[]{
                        data.totalPosts,
                        data.visiblePosts,
                        data.hiddenPosts,
                        data.totalComments
                }
        );

        y -= 28;

        drawSectionTitle("05. BIỂU ĐỒ HOẠT ĐỘNG DIỄN ĐÀN");

        drawBarChart(
                "SỐ LƯỢNG BÀI VIẾT VÀ BÌNH LUẬN",
                List.of(
                        new LabelValue("Bài viết mới", data.totalPosts),
                        new LabelValue("Bài viết hiển thị", data.visiblePosts),
                        new LabelValue("Bài viết bị ẩn", data.hiddenPosts),
                        new LabelValue("Bình luận mới", data.totalComments),
                        new LabelValue("Bình luận hoạt động", data.activeComments)
                )
        );

        y -= 25;

        drawSectionTitle("NHẬN XÉT SỐ LIỆU");

        drawParagraph(
                "Trong kỳ báo cáo, hệ thống ghi nhận "
                        + number(data.totalPosts) + " bài viết mới và "
                        + number(data.totalComments) + " bình luận mới. "
                        + "Có " + number(data.visiblePosts)
                        + " bài viết đang ở trạng thái hiển thị và "
                        + number(data.hiddenPosts)
                        + " bài viết ở trạng thái ẩn.",
                9, TEXT, 15
        );

        closeCurrentPage();
    }

    // =========================================================
    // 6. REPORT PAGE
    // =========================================================

    private void createReportPage(ReportData data)
            throws Exception {

        startNewPage(true);

        drawPageTitle(
                "BÁO CÁO VI PHẠM",
                "Tổng hợp tình hình tiếp nhận và xử lý vi phạm"
        );

        drawSectionTitle("06. TỔNG HỢP BÁO CÁO");

        drawKpiCards(
                new String[]{
                        "TỔNG BÁO CÁO",
                        "BÁO CÁO BÀI VIẾT",
                        "BÁO CÁO BÌNH LUẬN",
                        "CHƯA XỬ LÝ"
                },
                new long[]{
                        data.totalReports,
                        data.postReports,
                        data.commentReports,
                        data.pendingReports
                }
        );

        y -= 25;

        drawSectionTitle("07. TÌNH TRẠNG XỬ LÝ");

        drawDoughnutChart(
                "PHÂN BỐ TRẠNG THÁI BÁO CÁO",
                List.of(
                        new LabelValue("Đã xử lý", data.resolvedReports),
                        new LabelValue("Chưa xử lý", data.pendingReports)
                )
        );

        y -= 15;

        drawSectionTitle("08. BẢNG TỔNG HỢP");

        drawTable(
                new String[]{"Loại báo cáo", "Số lượng"},
                new float[]{0.68f, 0.32f},
                new String[][]{
                        {"Báo cáo bài viết", number(data.postReports)},
                        {"Báo cáo bình luận", number(data.commentReports)},
                        {"Đã xử lý", number(data.resolvedReports)},
                        {"Chưa xử lý", number(data.pendingReports)},
                        {"Tổng cộng", number(data.totalReports)}
                }
        );

        y -= 25;

        drawSectionTitle("GHI CHÚ");

        drawParagraph(
                "Các số liệu về yêu cầu hỗ trợ, bài viết, bình luận và báo cáo "
                        + "được tính theo ngày tạo trong khoảng thời gian được chọn. "
                        + "Số lượng tài khoản là số liệu hiện tại tại thời điểm "
                        + "xuất báo cáo. Báo cáo được tổng hợp tự động từ dữ liệu "
                        + "trong hệ thống.",
                9, TEXT, 15
        );

        closeCurrentPage();
    }

    // =========================================================
    // 7. PAGE MANAGEMENT
    // =========================================================

    private void startNewPage(boolean withHeader) throws Exception {

        closeCurrentPage();

        currentPage = new PDPage(PDRectangle.A4);
        document.addPage(currentPage);

        pageNumber++;

        content = new PDPageContentStream(document, currentPage);

        y = PAGE_HEIGHT - MARGIN;

        if (withHeader) {
            drawHeader();
        }
    }

    private void closeCurrentPage() throws Exception {
        if (content != null) {
            content.close();
            content = null;
        }
    }

    private void ensureSpace(float requiredHeight) throws Exception {
        if (y - requiredHeight < 65) {
            startNewPage(true);
        }
    }

    private void drawHeader() throws Exception {

        drawRect(
                0, PAGE_HEIGHT - 48,
                PAGE_WIDTH, 48,
                NAVY, null
        );

        drawText(
                MARGIN, PAGE_HEIGHT - 29,
                "HCMUTE | STUDENT SUPPORT SYSTEM",
                9, WHITE, bold
        );

        drawText(
                PAGE_WIDTH - MARGIN - 90,
                PAGE_HEIGHT - 29,
                "ADMIN REPORT",
                8, new Color(220, 232, 245), regular
        );

        drawLine(
                MARGIN, PAGE_HEIGHT - 58,
                PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 58,
                BORDER, 0.7f
        );

        y = PAGE_HEIGHT - 82;
    }

    private void addPageNumbersAndFooter() throws Exception {

        int totalPages = document.getNumberOfPages();

        for (int i = 0; i < totalPages; i++) {

            PDPage page = document.getPage(i);

            try (PDPageContentStream footer = new PDPageContentStream(
                    document,
                    page,
                    PDPageContentStream.AppendMode.APPEND,
                    true,
                    true
            )) {
                footer.setStrokingColor(BORDER);
                footer.setLineWidth(0.7f);

                footer.moveTo(MARGIN, 43);
                footer.lineTo(PAGE_WIDTH - MARGIN, 43);
                footer.stroke();

                writeText(
                        footer,
                        MARGIN, 28,
                        "HỆ THỐNG GIẢI ĐÁP VÀ ĐỒNG HÀNH CÙNG SINH VIÊN",
                        7, MUTED, regular
                );

                String pageText = "Trang " + (i + 1) + "/" + totalPages;

                float width = bold.getStringWidth(pageText) / 1000 * 8;

                writeText(
                        footer,
                        PAGE_WIDTH - MARGIN - width,
                        28,
                        pageText,
                        8, NAVY, bold
                );
            }
        }
    }

    // =========================================================
    // 8. TEXT AND SECTION
    // =========================================================

    private void drawPageTitle(String title, String subtitle)
            throws Exception {

        drawText(MARGIN, y, title, 18, NAVY, bold);
        y -= 21;

        drawText(MARGIN, y, subtitle, 9, MUTED, regular);
        y -= 28;
    }

    private void drawSectionTitle(String title) throws Exception {

        ensureSpace(38);

        drawRect(
                MARGIN, y - 17,
                4, 19,
                GOLD, null
        );

        drawText(
                MARGIN + 12, y - 12,
                title,
                11, NAVY, bold
        );

        y -= 34;
    }

    private void drawInfoRow(String label, String value)
            throws Exception {

        ensureSpace(25);

        drawText(MARGIN + 5, y, label, 9, MUTED, regular);

        drawText(
                MARGIN + 185, y,
                value, 9, TEXT, bold
        );

        y -= 22;
    }

    private void drawParagraph(
            String text,
            float fontSize,
            Color color,
            float lineHeight
    ) throws Exception {

        String[] words = text.split("\\s+");
        StringBuilder line = new StringBuilder();

        for (String word : words) {

            String candidate = line.isEmpty()
                    ? word
                    : line + " " + word;

            if (textWidth(candidate, fontSize, regular) > CONTENT_WIDTH - 12) {

                ensureSpace(lineHeight);

                drawText(
                        MARGIN + 5, y,
                        line.toString(),
                        fontSize, color, regular
                );

                y -= lineHeight;
                line = new StringBuilder(word);

            } else {
                line = new StringBuilder(candidate);
            }
        }

        if (!line.isEmpty()) {
            ensureSpace(lineHeight);

            drawText(
                    MARGIN + 5, y,
                    line.toString(),
                    fontSize, color, regular
            );

            y -= lineHeight;
        }
    }

    private void drawText(
            float x,
            float y,
            String text,
            float size,
            Color color,
            PDType0Font font
    ) throws Exception {

        if (text == null || text.isBlank()) return;

        content.beginText();
        content.setNonStrokingColor(color);
        content.setFont(font, size);
        content.newLineAtOffset(x, y);
        content.showText(text);
        content.endText();
    }

    private float textWidth(
            String text,
            float size,
            PDType0Font font
    ) throws Exception {
        return font.getStringWidth(text) / 1000f * size;
    }

    // =========================================================
    // 9. RECTANGLES AND LINES
    // =========================================================

    private void drawRect(
            float x,
            float y,
            float width,
            float height,
            Color fill,
            Color stroke
    ) throws Exception {

        if (fill != null) {
            content.setNonStrokingColor(fill);
            content.addRect(x, y, width, height);
            content.fill();
        }

        if (stroke != null) {
            content.setStrokingColor(stroke);
            content.setLineWidth(0.7f);
            content.addRect(x, y, width, height);
            content.stroke();
        }
    }

    private void drawLine(
            float x1,
            float y1,
            float x2,
            float y2,
            Color color,
            float width
    ) throws Exception {

        content.setStrokingColor(color);
        content.setLineWidth(width);
        content.moveTo(x1, y1);
        content.lineTo(x2, y2);
        content.stroke();
    }

    // =========================================================
    // 10. KPI CARDS
    // =========================================================

    private void drawKpiCards(ReportData data) throws Exception {

        drawKpiCards(
                new String[]{
                        "TỔNG TÀI KHOẢN",
                        "YÊU CẦU HỖ TRỢ",
                        "BÀI VIẾT",
                        "BÁO CÁO VI PHẠM"
                },
                new long[]{
                        data.totalUsers,
                        data.totalRequests,
                        data.totalPosts,
                        data.totalReports
                }
        );
    }

    private void drawKpiCards(
            String[] labels,
            long[] values
    ) throws Exception {

        ensureSpace(100);

        float gap = 10;
        float cardWidth = (CONTENT_WIDTH - gap * 3) / 4;
        float cardHeight = 76;

        Color[] colors = {BLUE, GOLD, GREEN, RED};

        for (int i = 0; i < 4; i++) {

            float x = MARGIN + i * (cardWidth + gap);

            drawRect(
                    x, y - cardHeight,
                    cardWidth, cardHeight,
                    BACKGROUND, BORDER
            );

            drawRect(
                    x, y - cardHeight,
                    4, cardHeight,
                    colors[i], null
            );

            drawText(
                    x + 11, y - 20,
                    labels[i],
                    7, MUTED, bold
            );

            drawText(
                    x + 11, y - 48,
                    number(values[i]),
                    18, NAVY, bold
            );
        }

        y -= cardHeight + 18;
    }

    // =========================================================
    // 11. TABLE
    // =========================================================

    private void drawTable(
            String[] headers,
            float[] ratios,
            String[][] rows
    ) throws Exception {

        float headerHeight = 29;
        float rowHeight = 27;

        drawTableHeader(headers, ratios, headerHeight);

        for (int i = 0; i < rows.length; i++) {

            ensureSpace(rowHeight + 5);

            float rowY = y;

            if (i % 2 == 0) {
                drawRect(
                        MARGIN, rowY - rowHeight,
                        CONTENT_WIDTH, rowHeight,
                        BACKGROUND, null
                );
            }

            float x = MARGIN;

            for (int j = 0; j < headers.length; j++) {

                float columnWidth = CONTENT_WIDTH * ratios[j];

                String value = rows[i][j] == null
                        ? ""
                        : rows[i][j];

                if (j == 0 && headers[j].equals("STT")) {
                    value = rows[i][j];
                }

                String fitted = fitText(
                        value,
                        columnWidth - 15,
                        8,
                        regular
                );

                drawText(
                        x + 8,
                        rowY - 17,
                        fitted,
                        8, TEXT, regular
                );

                x += columnWidth;
            }

            drawLine(
                    MARGIN, rowY - rowHeight,
                    PAGE_WIDTH - MARGIN, rowY - rowHeight,
                    BORDER, 0.5f
            );

            y -= rowHeight;
        }

        y -= 10;
    }

    private void drawTableHeader(
            String[] headers,
            float[] ratios,
            float height
    ) throws Exception {

        ensureSpace(height + 10);

        drawRect(
                MARGIN, y - height,
                CONTENT_WIDTH, height,
                NAVY, null
        );

        float x = MARGIN;

        for (int i = 0; i < headers.length; i++) {

            float columnWidth = CONTENT_WIDTH * ratios[i];

            drawText(
                    x + 8,
                    y - 19,
                    headers[i],
                    8, WHITE, bold
            );

            x += columnWidth;
        }

        y -= height;
    }

    private String fitText(
            String text,
            float maxWidth,
            float size,
            PDType0Font font
    ) throws Exception {

        if (textWidth(text, size, font) <= maxWidth) {
            return text;
        }

        String result = text;

        while (!result.isEmpty()
                && textWidth(result + "...", size, font) > maxWidth) {
            result = result.substring(0, result.length() - 1);
        }

        return result + "...";
    }

    // =========================================================
    // 12. DOUGHNUT CHART
    // =========================================================

    private void drawDoughnutChart(
            String title,
            List<LabelValue> values
    ) throws Exception {

        ensureSpace(245);

        drawText(
                MARGIN + 5, y,
                title,
                9, NAVY, bold
        );

        y -= 18;

        float centerX = MARGIN + 125;
        float centerY = y - 85;
        float radius = 66;

        long total = values.stream()
                .mapToLong(item -> item.value)
                .sum();

        if (total <= 0) {
            drawEmptyMessage("Không có dữ liệu để hiển thị biểu đồ.");
            return;
        }

        Color[] colors = {
                BLUE, GREEN, GOLD, RED, PURPLE,
                new Color(25, 150, 170)
        };

        float angle = 90;

        for (int i = 0; i < values.size(); i++) {

            LabelValue item = values.get(i);

            if (item.value <= 0) continue;

            float sweep = (float) (360.0 * item.value / total);

            drawDonutSector(
                    centerX,
                    centerY,
                    radius,
                    radius * 0.55f,
                    angle,
                    sweep,
                    colors[i % colors.length]
            );

            angle += sweep;
        }

        String totalText = number(total);

        float totalWidth = textWidth(totalText, 13, bold);

        drawText(
                centerX - totalWidth / 2,
                centerY + 2,
                totalText,
                13, NAVY, bold
        );

        String labelText = "Tổng";
        float labelWidth = textWidth(labelText, 7, regular);

        drawText(
                centerX - labelWidth / 2,
                centerY - 13,
                labelText,
                7, MUTED, regular
        );

        float legendX = MARGIN + 245;
        float legendY = y - 38;

        for (int i = 0; i < values.size(); i++) {

            LabelValue item = values.get(i);
            Color color = colors[i % colors.length];

            drawRect(
                    legendX, legendY - 4,
                    8, 8,
                    color, null
            );

            drawText(
                    legendX + 15,
                    legendY - 2,
                    fitText(item.label, 125, 8, regular),
                    8, TEXT, regular
            );

            drawText(
                    legendX + 15,
                    legendY - 15,
                    number(item.value) + " (" + percentage(item.value, total) + ")",
                    7, MUTED, regular
            );

            legendY -= 37;
        }

        y -= 178;
    }

    private void drawDonutSector(
            float cx,
            float cy,
            float outerRadius,
            float innerRadius,
            float startAngle,
            float sweepAngle,
            Color color
    ) throws Exception {

        if (sweepAngle <= 0) return;

        int segments = Math.max(
                1,
                (int) Math.ceil(sweepAngle / 90.0)
        );

        float segmentAngle = sweepAngle / segments;

        content.setNonStrokingColor(color);

        for (int i = 0; i < segments; i++) {

            double a1 = Math.toRadians(
                    startAngle + i * segmentAngle
            );

            double a2 = Math.toRadians(
                    startAngle + (i + 1) * segmentAngle
            );

            // Hệ số xấp xỉ cung tròn bằng Bezier
            float k = (float) (
                    4.0 / 3.0 * Math.tan((a2 - a1) / 4.0)
            );

            // Điểm trên đường tròn ngoài
            float x1 = cx + outerRadius * (float) Math.cos(a1);
            float y1 = cy + outerRadius * (float) Math.sin(a1);

            float x2 = cx + outerRadius * (float) Math.cos(a2);
            float y2 = cy + outerRadius * (float) Math.sin(a2);

            // Control points của cung ngoài
            float c1x = x1 - k * outerRadius * (float) Math.sin(a1);
            float c1y = y1 + k * outerRadius * (float) Math.cos(a1);

            float c2x = x2 + k * outerRadius * (float) Math.sin(a2);
            float c2y = y2 - k * outerRadius * (float) Math.cos(a2);

            // Điểm trên đường tròn trong
            float ix1 = cx + innerRadius * (float) Math.cos(a1);
            float iy1 = cy + innerRadius * (float) Math.sin(a1);

            float ix2 = cx + innerRadius * (float) Math.cos(a2);
            float iy2 = cy + innerRadius * (float) Math.sin(a2);

            // Control points của cung trong (đảo chiều)
            // Đây là phần đã sửa dấu so với code cũ
            float ic1x = ix2 + k * innerRadius * (float) Math.sin(a2);
            float ic1y = iy2 - k * innerRadius * (float) Math.cos(a2);

            float ic2x = ix1 - k * innerRadius * (float) Math.sin(a1);
            float ic2y = iy1 + k * innerRadius * (float) Math.cos(a1);

            // Vẽ một phần của doughnut
            content.moveTo(x1, y1);

            content.curveTo(
                    c1x, c1y,
                    c2x, c2y,
                    x2, y2
            );

            content.lineTo(ix2, iy2);

            content.curveTo(
                    ic1x, ic1y,
                    ic2x, ic2y,
                    ix1, iy1
            );

            content.closePath();
            content.fill();
        }
    }

    // =========================================================
    // 13. BAR CHART
    // =========================================================

    private void drawBarChart(
            String title,
            List<LabelValue> values
    ) throws Exception {

        ensureSpace(240);

        drawText(
                MARGIN + 5, y,
                title,
                9, NAVY, bold
        );

        y -= 30;

        if (values.isEmpty()) {
            drawEmptyMessage("Không có dữ liệu.");
            return;
        }

        float maxValue = Math.max(
                1,
                values.stream().mapToLong(item -> item.value).max().orElse(1)
        );

        float chartWidth = CONTENT_WIDTH - 20;
        float rowHeight = 34;

        for (int i = 0; i < values.size(); i++) {

            ensureSpace(rowHeight + 5);

            LabelValue item = values.get(i);

            drawText(
                    MARGIN + 5,
                    y,
                    fitText(item.label, 125, 8, regular),
                    8, TEXT, regular
            );

            float barX = MARGIN + 140;
            float barWidth = chartWidth - 175;

            drawRect(
                    barX, y - 5,
                    barWidth, 11,
                    BACKGROUND, null
            );

            float valueWidth = barWidth * item.value / maxValue;

            drawRect(
                    barX, y - 5,
                    valueWidth, 11,
                    BLUE, null
            );

            drawText(
                    barX + barWidth + 8,
                    y - 2,
                    number(item.value),
                    8, NAVY, bold
            );

            y -= rowHeight;
        }

        y -= 10;
    }

    private void drawHorizontalBarChart(List<LabelValue> values)
            throws Exception {

        drawBarChart("PHÂN BỐ YÊU CẦU THEO PHÒNG BAN", values);
    }

    // =========================================================
    // 14. EMPTY STATE
    // =========================================================

    private void drawEmptyMessage(String message) throws Exception {

        ensureSpace(35);

        drawRect(
                MARGIN, y - 28,
                CONTENT_WIDTH, 30,
                BACKGROUND, BORDER
        );

        drawText(
                MARGIN + 12, y - 18,
                message,
                8, MUTED, regular
        );

        y -= 40;
    }

    // =========================================================
    // 15. FORMAT HELPERS
    // =========================================================

    private String number(long value) {
        return String.format("%,d", value);
    }

    private String percentage(long value, long total) {

        if (total <= 0) return "0%";

        return String.format(
                "%.1f%%",
                value * 100.0 / total
        );
    }

    private void writeText(
            PDPageContentStream stream,
            float x,
            float y,
            String text,
            float size,
            Color color,
            PDType0Font font
    ) throws Exception {

        if (text == null || text.isBlank()) {
            return;
        }

        stream.beginText();
        stream.setNonStrokingColor(color);
        stream.setFont(font, size);
        stream.newLineAtOffset(x, y);
        stream.showText(text);
        stream.endText();
    }
}