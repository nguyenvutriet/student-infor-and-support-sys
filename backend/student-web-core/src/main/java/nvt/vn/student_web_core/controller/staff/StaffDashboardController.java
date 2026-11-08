package nvt.vn.student_web_core.controller.staff;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.payload.staff.StaffDashboardDto.Dashboard;
import nvt.vn.student_web_core.service.StaffDashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff/dashboard")
@RequiredArgsConstructor
public class StaffDashboardController {

    private final StaffDashboardService dashboardService;

    @GetMapping
    public Dashboard get() {
        return dashboardService.get();
    }
}