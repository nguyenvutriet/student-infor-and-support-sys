
export const AUTH_MESSAGES = {
    
    INVALID_CREDENTIALS: "Email hoặc mật khẩu không hợp lệ, vui lòng thử lại",
    
    TOO_MANY_ATTEMPTS: "Bạn đã đăng nhập sai quá 5 lần, vui lòng thử lại sau 5 phút",
    
    ACCOUNT_DISABLED: "Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên",
    NO_ROLE: "Tài khoản chưa được phân quyền hợp lệ, vui lòng liên hệ quản trị viên",
    NETWORK: "Không thể kết nối đến máy chủ",
    GENERIC: "Đăng nhập thất bại, vui lòng thử lại",
};


export const OAUTH_ERROR_MESSAGES = {
    google_not_registered: "Tài khoản Google này chưa được liên kết với tài khoản nào trong hệ thống",
    account_disabled: AUTH_MESSAGES.ACCOUNT_DISABLED,
    default: "Đăng nhập với Google không thành công, vui lòng thử lại",
};
