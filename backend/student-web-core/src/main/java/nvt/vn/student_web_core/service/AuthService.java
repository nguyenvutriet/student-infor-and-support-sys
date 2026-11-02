package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.payload.AuthResult;
import nvt.vn.student_web_core.security.request.LoginRequest;
import nvt.vn.student_web_core.security.response.UserInfoResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;

public interface AuthService {
    AuthResult login(LoginRequest loginRequest);
    UserInfoResponse getCurrentUser(Authentication authentication);
    ResponseCookie logoutUser();
}
