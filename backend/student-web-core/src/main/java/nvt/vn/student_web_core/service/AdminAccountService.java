package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.model.*;
import nvt.vn.student_web_core.payload.admin.AdminAccountCreateRequest;
import nvt.vn.student_web_core.payload.admin.AdminAccountResponse;
import nvt.vn.student_web_core.payload.admin.AdminAccountUpdateRequest;
import nvt.vn.student_web_core.repository.UserRepo;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class AdminAccountService {
    private final UserRepo userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public AdminAccountService(UserRepo userRepository, PasswordEncoder passwordEncoder, NotificationService notificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<AdminAccountResponse> list(String keyword, String role, String status) {
        return userRepository.findAll().stream()
            .filter(u -> blank(keyword) ||
                safe(u.getUserId()).toLowerCase(Locale.ROOT).contains(keyword.toLowerCase(Locale.ROOT)) ||
                safe(u.getFullName()).toLowerCase(Locale.ROOT).contains(keyword.toLowerCase(Locale.ROOT)) ||
                safe(u.getEmail()).toLowerCase(Locale.ROOT).contains(keyword.toLowerCase(Locale.ROOT)))
            .filter(u -> blank(role) || u.getRole().name().equalsIgnoreCase(role))
            .filter(u -> blank(status) || u.getStatus().name().equalsIgnoreCase(status))
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public AdminAccountResponse detail(String userId) {
        return toResponse(find(userId));
    }

    public AdminAccountResponse create(AdminAccountCreateRequest request) {
        if (userRepository.existsById(request.userId()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã tài khoản đã tồn tại");
        Role role = parseRole(request.role());
        User user = switch (role) {
            case STUDENT -> new Student();
            case STAFF -> new Staff();
            case ADMIN -> new Admin();
        };
        user.setUserId(request.userId().trim());
        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(role);
        user.setStatus(parseStatus(request.status()));
        return toResponse(userRepository.save(user));
    }

    public AdminAccountResponse update(String userId, AdminAccountUpdateRequest request) {
        User user = find(userId);
        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim());
        if (request.password() != null && !request.password().isBlank())
            user.setPassword(passwordEncoder.encode(request.password()));
        if (request.status() != null && !request.status().isBlank())
            user.setStatus(parseStatus(request.status()));
        return toResponse(userRepository.save(user));
    }

    public AdminAccountResponse changeStatus(String userId, String rawStatus) {
        User user = find(userId);
        user.setStatus(parseStatus(rawStatus));
        if(user.getStatus() == AccountStatus.ACTIVE){
            notificationService.send(userId, NotificationType.ACCOUNT_UNLOCKED, "Tài khoản của bạn đã được mở khóa. Bạn có thể đăng nhập và sử dụng hệ thống.");
        }else{
            notificationService.send(userId, NotificationType.ACCOUNT_LOCKED, "Tài khoản của bạn đã bị khóa. Bạn không thể đăng nhập và sử dụng hệ thống.");
        }
        return toResponse(userRepository.save(user));
    }

    private User find(String id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
    }

    private Role parseRole(String value) {
        try { return Role.valueOf(value.trim().toUpperCase(Locale.ROOT)); }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ"); }
    }

    private AccountStatus parseStatus(String value) {
        if (value == null || value.isBlank()) return AccountStatus.ACTIVE;
        try { return AccountStatus.valueOf(value.trim().toUpperCase(Locale.ROOT)); }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ"); }
    }

    private AdminAccountResponse toResponse(User u) {
        String major = u instanceof Student s ? s.getMajor() : null;
        String department = null;
        if (u instanceof Staff s && s.getDepartment() != null)
            department = s.getDepartment().getName();
        return new AdminAccountResponse(u.getUserId(), u.getFullName(), u.getEmail(),
            u.getRole().name(), u.getStatus().name(), major, department);
    }

    private boolean blank(String s) { return s == null || s.isBlank(); }
    private String safe(String s) { return s == null ? "" : s; }
}
