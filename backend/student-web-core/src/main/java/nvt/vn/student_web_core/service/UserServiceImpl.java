package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.User;
import nvt.vn.student_web_core.repository.UserRepo;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService{

    private final UserRepo userRepo;

    @Override
    public Optional<User> getUserByEmail(String email) {

        Optional<User> user = userRepo.findByEmail(email);
        if(user != null){
            return user;
        }
        return null;
    }
}
