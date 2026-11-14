package nvt.vn.student_web_core.controller.common;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.payload.ChangePasswordRequest;
import nvt.vn.student_web_core.security.response.MessageResponse;
import nvt.vn.student_web_core.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping("/change-password")
    public ResponseEntity<MessageResponse> changePassword(@RequestBody ChangePasswordRequest request){

        accountService.changePassword(request);
        return ResponseEntity.ok(new MessageResponse("Đổi mật khẩu thành công"));
    }

}
