package nvt.vn.student_web_core.security.services;

import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.User;
import nvt.vn.student_web_core.repository.UserRepo;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepo userRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        User user = userRepo.findById(username).orElseThrow(
                () -> new UsernameNotFoundException("User Not Found with username: " + username)
        );

        return UserDetailsImpl.build(user);
    }
}
