package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.User;
import nvt.vn.student_web_core.payload.ChangePasswordRequest;
import nvt.vn.student_web_core.repository.UserRepo;
import nvt.vn.student_web_core.util.AuthUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService{

    private final AuthUtil authUtil;
    private final PasswordEncoder passwordEncoder;
    private final UserRepo userRepo;
    private static final Pattern PASSWORD_RULE = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*\\p{Punct}).{8,}$");

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {

        if(request.getConfirmPassword() == null || request.getNewPassword() == null || request.getCurrentPassword() == null){
            throw new IllegalArgumentException("Vui lòng điền đầy đủ thông tin");
        }

        User user = authUtil.loggedInUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");
        }

        if(passwordEncoder.matches(request.getConfirmPassword(), user.getPassword())){
            throw new IllegalArgumentException("Mật khẩu mới không được trùng với mật khẩu hiện tại");
        }

        if(!request.getNewPassword().equals(request.getConfirmPassword())){
            throw new IllegalArgumentException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        if(!PASSWORD_RULE.matcher(request.getNewPassword()).matches()){
            throw new IllegalArgumentException("Mật khẩu mới không hợp lệ. Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepo.save(user);
    }
}
