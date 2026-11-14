package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.payload.ChangePasswordRequest;

public interface AccountService {
    void changePassword(ChangePasswordRequest request);
}
