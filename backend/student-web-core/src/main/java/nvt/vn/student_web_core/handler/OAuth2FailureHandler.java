package nvt.vn.student_web_core.handler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2FailureHandler.class);

    @Value("${frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        logger.warn("Google login failed: {}", exception.getMessage());

        String code = "access_denied".equals(request.getParameter("error")) ? "access_denied" : "oauth_failed";
        String url = UriComponentsBuilder.fromUriString(frontendUrl.replaceAll("/+$", "") + "/login")
                .queryParam("error", code)
                .build()
                .toUriString();
        response.sendRedirect(url);
    }
}
