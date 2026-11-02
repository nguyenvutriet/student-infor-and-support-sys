package nvt.vn.student_web_core.util;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.User;
import nvt.vn.student_web_core.repository.UserRepo;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthUtil {

    private final UserRepo userRepo;

    public String loggedInEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepo.findById(authentication.getName())
                .orElseThrow( () -> new RuntimeException("User not found"));
        return user.getEmail();
    }

    public User loggedInUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepo.findById(authentication.getName())
                .orElseThrow( () -> new RuntimeException("User not found"));
        return user;

    }

}
