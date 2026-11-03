package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.model.User;

import java.util.Optional;

public interface UserService {
    public Optional<User> getUserByEmail(String email);
}
