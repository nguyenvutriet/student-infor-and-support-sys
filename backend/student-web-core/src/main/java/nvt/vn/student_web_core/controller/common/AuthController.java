package nvt.vn.student_web_core.controller.common;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.payload.AuthResult;
import nvt.vn.student_web_core.security.request.LoginRequest;
import nvt.vn.student_web_core.security.response.MessageResponse;
import nvt.vn.student_web_core.service.AuthService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest){
        AuthResult result = authService.login(loginRequest);
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE,
                        result.getJwtCookie().toString())
                .body(result.getResponse());

    }

    @GetMapping("/user")
    public ResponseEntity<?> currentUser(Authentication authentication){

        if(authentication == null || authentication instanceof AnonymousAuthenticationToken || !authentication.isAuthenticated()){
            return new ResponseEntity<>(new MessageResponse("Chưa đăng nhập hoặc phiên đã hết hạn"), HttpStatus.UNAUTHORIZED);
        }

        return ResponseEntity.ok(authService.getCurrentUser(authentication));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(){
        ResponseCookie cookie = authService.logoutUser();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE,
                cookie.toString())
                .body(new MessageResponse("Log out successful!"));
    }

}
