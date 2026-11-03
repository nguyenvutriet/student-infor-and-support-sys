package nvt.vn.student_web_core.handler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.AccountStatus;
import nvt.vn.student_web_core.model.User;
import nvt.vn.student_web_core.security.jwt.JwtUtils;
import nvt.vn.student_web_core.security.services.UserDetailsImpl;
import nvt.vn.student_web_core.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2SuccessHandler.class);

    private final UserService userRepo;
    private final JwtUtils jwtUtils;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${app.oauth2.allowed-email-domains:}")
    private String allowedEmailDomains;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        try {
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
            String email = oauth2User.getAttribute("email");
            Boolean emailVerified = oauth2User.getAttribute("email_verified");

            if (email == null || !Boolean.TRUE.equals(emailVerified)) {
                redirectToLoginWithError(response, "email_not_verified");
                return;
            }

            if (!isAllowedDomain(email)) {
                logger.warn("Google login rejected, domain not allowed: {}", email);
                redirectToLoginWithError(response, "domain_not_allowed");
                return;
            }

            Optional<User> userOpt = userRepo.getUserByEmail(email.trim());
            if (userOpt.isEmpty()) {
                logger.warn("Google login rejected, no account for email: {}", email);
                redirectToLoginWithError(response, "account_not_found");
                return;
            }

            User user = userOpt.get();
            if (user.getStatus() == AccountStatus.LOCKED) {
                logger.warn("Google login rejected, account locked: {}", user.getUserId());
                redirectToLoginWithError(response, "account_locked");
                return;
            }

            UserDetailsImpl userDetails = UserDetailsImpl.build(user);
            response.addHeader(HttpHeaders.SET_COOKIE, jwtUtils.generateJwtCookie(userDetails).toString());

            response.sendRedirect(frontendBase() + "/oauth2/redirect");
        } catch (Exception e) {
            logger.error("Google login failed unexpectedly", e);
            redirectToLoginWithError(response, "oauth_failed");
        } finally {
            SecurityContextHolder.clearContext();
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
        }
    }

    private boolean isAllowedDomain(String email) {
        if (allowedEmailDomains == null || allowedEmailDomains.isBlank()) {
            return true;
        }
        String lower = email.trim().toLowerCase(Locale.ROOT);
        return Arrays.stream(allowedEmailDomains.split(","))
                .map(d -> d.trim().toLowerCase(Locale.ROOT))
                .filter(d -> !d.isEmpty())
                .anyMatch(d -> lower.endsWith(d.startsWith("@") ? d : "@" + d));
    }

    private String frontendBase() {
        return frontendUrl.replaceAll("/+$", "");
    }

    private void redirectToLoginWithError(HttpServletResponse response, String code) throws IOException {
        String url = UriComponentsBuilder.fromUriString(frontendBase() + "/login")
                .queryParam("error", code)
                .build()
                .toUriString();
        response.sendRedirect(url);
    }
}
