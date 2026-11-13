/**
 * Ràng buộc mật khẩu theo đặc tả (Main Flow bước 7):
 * tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.
 * PHẢI khớp với PASSWORD_RULE trong ForgotPasswordService.java (backend).
 */
export const PASSWORD_RULES = [
    { id: "length", label: "Ít nhất 8 ký tự", test: (p) => p.length >= 8 },
    { id: "upper", label: "Có chữ hoa (A-Z)", test: (p) => /[A-Z]/.test(p) },
    { id: "lower", label: "Có chữ thường (a-z)", test: (p) => /[a-z]/.test(p) },
    { id: "digit", label: "Có chữ số (0-9)", test: (p) => /\d/.test(p) },
    // ASCII punctuation, giống \p{Punct} bên Java
    { id: "special", label: "Có ký tự đặc biệt (! @ # $ % ...)", test: (p) => /[!-/:-@[-`{-~]/.test(p) },
];

export const PASSWORD_RULE_MESSAGE =
    "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt";

export const countPassedRules = (password) =>
    PASSWORD_RULES.filter((rule) => rule.test(password)).length;

export const isStrongPassword = (password) =>
    PASSWORD_RULES.every((rule) => rule.test(password));
