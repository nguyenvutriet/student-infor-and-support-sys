package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.handler.TooManyLoginAttemptsException;
import nvt.vn.student_web_core.payload.AuthResult;
import nvt.vn.student_web_core.repository.UserRepo;
import nvt.vn.student_web_core.security.jwt.JwtUtils;
import nvt.vn.student_web_core.security.request.LoginRequest;
import nvt.vn.student_web_core.security.response.UserInfoResponse;
import nvt.vn.student_web_core.security.services.UserDetailsImpl;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService{

    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;
    private final LoginAttemptService loginAttemptService;

    @Value("${app.auth.expose-jwt}")
    private boolean exposeJwt;

    @Override
    public AuthResult login(LoginRequest loginRequest) {

        String key = loginRequest.getUsername().trim().toLowerCase();

        if (loginAttemptService.isBlocked(key)) {
            throw new TooManyLoginAttemptsException(loginAttemptService.getSecondsLeft(key));
        }

        Authentication auth;
        try{
            auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );
        } catch(BadCredentialsException e){
            loginAttemptService.loginFailed(key);
            if (loginAttemptService.isBlocked(key)) {
                throw new TooManyLoginAttemptsException(loginAttemptService.getSecondsLeft(key));
            }
            throw e;
        }

        loginAttemptService.loginSucceeded(key);

        SecurityContextHolder.getContext().setAuthentication(auth);
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();

        ResponseCookie jwtCookie = jwtUtils.generateJwtCookie(userDetails);
        String role = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("");

        UserInfoResponse response = new UserInfoResponse(
                userDetails.getUsername(),
                userDetails.getFullName(),
                userDetails.getEmail(),
                exposeJwt ? jwtCookie.toString() : null,
                role
        );

        return new AuthResult(response, jwtCookie);
    }

    @Override
    public UserInfoResponse getCurrentUser(Authentication authentication) {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        String role = userDetails.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .findFirst()
                                .orElse("");

        UserInfoResponse response = new UserInfoResponse(
                userDetails.getUsername(),
                userDetails.getFullName(),
                userDetails.getEmail(),
                role
        );

        return response;
    }

    @Override
    public ResponseCookie logoutUser() {
        return jwtUtils.getCleanJwtCookie();
    }
}
