/** Các bước của luồng Quên mật khẩu (trùng thứ tự slide trong Swiper) */
export const FORGOT_STEP = { INFO: 0, OTP: 1, RESET: 2 };

/**
 * Chuẩn hoá lỗi axios -> { message, field, code, retryAfterSeconds, requireResend, attemptsLeft }
 * field = tên ô input cần báo đỏ (username | email | otp | newPassword | confirmPassword)
 */
export const parseForgotError = (error) => {
    if (!error?.response) {
        return { message: "Không thể kết nối đến máy chủ", code: "NETWORK" };
    }
    const data = error.response.data ?? {};
    return {
        message: data.message || "Có lỗi xảy ra, vui lòng thử lại",
        field: data.field,
        code: data.code,
        retryAfterSeconds: Number(data.retryAfterSeconds) || 0,
        requireResend: Boolean(data.requireResend),
        attemptsLeft: data.attemptsLeft,
    };
};

/** Chuyển response của /request & /resend thành mốc thời gian tuyệt đối để đếm ngược ở UI */
export const toOtpMeta = (data) => {
    const now = Date.now();
    return {
        maskedEmail: data.maskedEmail,
        expiresAt: now + (Number(data.expiresInSeconds) || 0) * 1000,
        resendAt: now + (Number(data.resendAfterSeconds) || 0) * 1000,
    };
};
