
package nvt.vn.student_web_core.controller.staff;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.service.StaffStatisticsService;
import nvt.vn.student_web_core.service.StaffStatisticsService.StatsException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/statistics")
@RequiredArgsConstructor
public class StaffStatisticsController {

    private final StaffStatisticsService statisticsService;

    @GetMapping("/{group}")
    public ResponseEntity<?> getStatistics(
            @PathVariable String group,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to
    ) {
        try {
            Object result = switch (group.toLowerCase()) {
                case "messages" -> statisticsService.messages(from, to);
                case "documents" -> statisticsService.documents(from, to);
                case "study" -> statisticsService.study(from, to);
                case "forum" -> statisticsService.forum(from, to);
                default -> throw new StatsException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "Nhóm thống kê không hợp lệ"
                );
            };

            return ResponseEntity.ok(result);

        } catch (StatsException e) {
            return ResponseEntity.status(e.getStatus())
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
