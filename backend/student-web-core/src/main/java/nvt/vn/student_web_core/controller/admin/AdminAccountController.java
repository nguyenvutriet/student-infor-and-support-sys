/*
 * PATCH BACKEND: đặt file tại controller/admin/AdminAccountController.java
 * Package/import entity cần khớp với package thực tế của dự án.
 * API contract mới do module này đề xuất:
 * GET    /api/admin/accounts
 * GET    /api/admin/accounts/{userId}
 * POST   /api/admin/accounts
 * PUT    /api/admin/accounts/{userId}
 * PATCH  /api/admin/accounts/{userId}/status
 */
package nvt.vn.student_web_core.controller.admin;

import jakarta.validation.Valid;
import nvt.vn.student_web_core.dto.admin.*;
import nvt.vn.student_web_core.service.AdminAccountService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/accounts")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAccountController {
    private final AdminAccountService service;

    public AdminAccountController(AdminAccountService service) {
        this.service = service;
    }

    @GetMapping
    public List<AdminAccountResponse> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        return service.list(keyword, role, status);
    }

    @GetMapping("/{userId}")
    public AdminAccountResponse detail(@PathVariable String userId) {
        return service.detail(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminAccountResponse create(@Valid @RequestBody AdminAccountCreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{userId}")
    public AdminAccountResponse update(@PathVariable String userId,
                                       @Valid @RequestBody AdminAccountUpdateRequest request) {
        return service.update(userId, request);
    }

    @PatchMapping("/{userId}/status")
    public AdminAccountResponse changeStatus(@PathVariable String userId,
                                             @Valid @RequestBody ChangeAccountStatusRequest request) {
        return service.changeStatus(userId, request.status());
    }
}
