
export const PASSWORD_RULES = [
    { id: "length", label: "Ít nhất 8 ký tự", test: (p) => p.length >= 8 },
    { id: "upper", label: "Có chữ hoa (A-Z)", test: (p) => /[A-Z]/.test(p) },
    { id: "lower", label: "Có chữ thường (a-z)", test: (p) => /[a-z]/.test(p) },
    { id: "digit", label: "Có chữ số (0-9)", test: (p) => /\d/.test(p) },
    { id: "special", label: "Có ký tự đặc biệt (! @ # $ % ...)", test: (p) => /[!-/:-@[-`{-~]/.test(p) },
];

export const PASSWORD_RULE_MESSAGE =
    "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt";

export const countPassedRules = (password) =>
    PASSWORD_RULES.filter((rule) => rule.test(password)).length;

export const isStrongPassword = (password) =>
    PASSWORD_RULES.every((rule) => rule.test(password));


export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_REQUIREMENTS = [
    { key: "length", label: "Ít nhất 8 ký tự", test: (v) => v.length >= PASSWORD_MIN_LENGTH },
    { key: "upper", label: "Ít nhất 1 chữ hoa", test: (v) => /[A-Z]/.test(v) },
    { key: "lower", label: "Ít nhất 1 chữ thường", test: (v) => /[a-z]/.test(v) },
    { key: "digit", label: "Ít nhất 1 chữ số", test: (v) => /\d/.test(v) },
    { key: "special", label: "Ít nhất 1 ký tự đặc biệt", test: (v) => /[!-/:-@[-`{-~]/.test(v) },
];

export const isStrongPasswordCP = (value = "") => PASSWORD_REQUIREMENTS.every((r) => r.test(value));

export const PASSWORD_MESSAGES = {
    REQUIRED_CURRENT: "Vui lòng nhập mật khẩu hiện tại",
    REQUIRED_NEW: "Vui lòng nhập mật khẩu mới",
    REQUIRED_CONFIRM: "Vui lòng xác nhận lại mật khẩu mới",
    WEAK: "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt",
    CONFIRM_WRONG: "Mật khẩu xác nhận lại không chính xác",
    SAME_AS_CURRENT: "Mật khẩu mới phải khác mật khẩu hiện tại",
    CURRENT_WRONG: "Mật khẩu hiện tại không chính xác",
    SUCCESS: "Đổi mật khẩu thành công",
    NETWORK: "Không thể kết nối đến máy chủ",
    GENERIC: "Đổi mật khẩu không thành công, vui lòng thử lại",
};

export const validateChangePassword = ({ currentPassword, newPassword, confirmPassword }) => {
    const errors = {};

    if (!currentPassword) errors.currentPassword = PASSWORD_MESSAGES.REQUIRED_CURRENT;
    if (!newPassword) errors.newPassword = PASSWORD_MESSAGES.REQUIRED_NEW;
    if (!confirmPassword) errors.confirmPassword = PASSWORD_MESSAGES.REQUIRED_CONFIRM;
    if (Object.keys(errors).length) return errors;


    if (!isStrongPasswordCP(newPassword)) errors.newPassword = PASSWORD_MESSAGES.WEAK;
    else if (newPassword === currentPassword) errors.newPassword = PASSWORD_MESSAGES.SAME_AS_CURRENT;
    if (newPassword !== confirmPassword) errors.confirmPassword = PASSWORD_MESSAGES.CONFIRM_WRONG;

    return errors;
};
