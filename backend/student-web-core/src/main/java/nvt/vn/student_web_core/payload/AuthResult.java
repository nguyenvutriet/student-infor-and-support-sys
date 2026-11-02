package nvt.vn.student_web_core.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import nvt.vn.student_web_core.security.response.UserInfoResponse;
import org.springframework.http.ResponseCookie;

@Data
@AllArgsConstructor
public class AuthResult {
    private final UserInfoResponse response;
    private final ResponseCookie jwtCookie;
}
