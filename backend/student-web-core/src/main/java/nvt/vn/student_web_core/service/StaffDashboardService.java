package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.Request;
import nvt.vn.student_web_core.model.RequestStatus;
import nvt.vn.student_web_core.model.Staff;
import nvt.vn.student_web_core.payload.staff.StaffDashboardDto.*;
import nvt.vn.student_web_core.repository.DocumentRepo;
import nvt.vn.student_web_core.repository.RequestRepo;
import nvt.vn.student_web_core.repository.StaffRepo;
import nvt.vn.student_web_core.repository.StudyResourceRepo;
import nvt.vn.student_web_core.util.AuthUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/** Số liệu trang "Tổng quan" của nhân viên – tính theo đơn vị của nhân viên đang đăng nhập. */
@Service
@RequiredArgsConstructor
public class StaffDashboardService {

    private final RequestRepo requestRepo;
    private final StaffRepo staffRepo;
    private final DocumentRepo documentRepo;
    private final StudyResourceRepo studyResourceRepo;
    private final AuthUtil authUtil;

    @Transactional(readOnly = true)
    public Dashboard get() {
        Staff staff = staffRepo.findById(authUtil.loggedInUser().getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Không tìm thấy nhân viên"));
        if (staff.getDepartment() == null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa thuộc đơn vị nào");
        String deptId = staff.getDepartment().getDepartmentId();

        // Tab "Tiếp nhận yêu cầu": chờ tiếp nhận + lời mời hỗ trợ chưa tiếp nhận
        List<Request> pending = requestRepo.searchPendingForDepartment(deptId, "%%");
        long invitedPending = pending.stream().filter(r -> !isMine(r, deptId)).count();

        List<Request> accepted = requestRepo.searchConversationsForDepartment(deptId, List.of(RequestStatus.ACCEPTED), "%%");
        long processing = accepted.stream().filter(r -> isMine(r, deptId)).count();
        long supporting = accepted.size() - processing;

        long closed = requestRepo.searchConversationsForDepartment(deptId, List.of(RequestStatus.CLOSED), "%%")
                .stream().filter(r -> isMine(r, deptId)).count();

        long documents = documentRepo.findAllByDepartment(deptId).size();
        long study = studyResourceRepo.findAllByStaff(staff.getUserId()).size();

        // Yêu cầu gửi tới đơn vị trong 7 ngày gần nhất
        LocalDate today = LocalDate.now();
        Map<LocalDate, Long> byDay = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) byDay.put(today.minusDays(i), 0L);
        requestRepo.findByDepartmentCreatedSince(deptId, today.minusDays(6).atStartOfDay())
                .forEach(r -> byDay.computeIfPresent(r.getCreatedAt().toLocalDate(), (d, c) -> c + 1));
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");
        List<DayCount> weekly = byDay.entrySet().stream()
                .map(e -> new DayCount(e.getKey().format(fmt), e.getValue())).toList();

        List<PendingItem> recent = pending.stream()
                .sorted(Comparator.comparing(Request::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(r -> new PendingItem(r.getRequestId(), r.getSubject(), r.getStudent().getFullName(),
                        r.getStudent().getUserId(), r.getCreatedAt(), !isMine(r, deptId)))
                .toList();

        return new Dashboard(staff.getFullName(), staff.getDepartment().getName(),
                new Counts(pending.size(), invitedPending, processing, supporting, closed, documents, study),
                weekly, recent);
    }

    private static boolean isMine(Request r, String deptId) {
        return r.getToDepartment() != null && deptId.equals(r.getToDepartment().getDepartmentId());
    }
}