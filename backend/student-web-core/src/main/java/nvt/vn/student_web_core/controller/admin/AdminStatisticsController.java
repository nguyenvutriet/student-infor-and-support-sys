package nvt.vn.student_web_core.controller.admin;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.payload.admin.StatisticsDashboardDTO;
import nvt.vn.student_web_core.service.AdminStatisticsPdfService;

import nvt.vn.student_web_core.service.AdminStatisticsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/statistics")
@RequiredArgsConstructor
public class AdminStatisticsController {

    private final AdminStatisticsPdfService statisticsPdfService;
    private final AdminStatisticsService statisticsService;

    @GetMapping("/export-pdf")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to
    ) {
        // Hai ngày phải cùng có hoặc cùng không có
        if ((from == null) != (to == null)) {
            return ResponseEntity.badRequest().build();
        }

        // Kiểm tra khoảng ngày
        if (from != null && from.isAfter(to)) {
            return ResponseEntity.badRequest().build();
        }

        byte[] pdf = statisticsPdfService.generate(from, to);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=admin-statistics.pdf"
                )
                .body(pdf);
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StatisticsDashboardDTO> getDashboard(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to
    ) {
        return ResponseEntity.ok(
                statisticsService.getDashboard(from, to)
        );
    }
}