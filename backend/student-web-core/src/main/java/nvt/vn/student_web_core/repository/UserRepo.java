package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import nvt.vn.student_web_core.model.Role;
import nvt.vn.student_web_core.model.AccountStatus;

import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<User, String> {

    public Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByRole(Role role);

    long countByStatus(AccountStatus status);
}
