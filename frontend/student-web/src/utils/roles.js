/**
 * Cấu hình role của hệ thống: student, staff, admin.
 * Muốn đổi đường dẫn trang chủ của từng role thì chỉ sửa ROLE_HOME ở đây.
 */
export const ROLES = {
    ADMIN: "admin",
    STAFF: "staff",
    STUDENT: "student",
};

// Trang chủ của từng role (khớp với route trong App.jsx)
export const ROLE_HOME = {
    [ROLES.ADMIN]: "/admin",
    [ROLES.STAFF]: "/staff",
    [ROLES.STUDENT]: "/student",
};

// Nếu một user có nhiều role (trường hợp backend trả mảng) thì ưu tiên role cao hơn
const ROLE_PRIORITY = [ROLES.ADMIN, ROLES.STAFF, ROLES.STUDENT];

/**
 * Chuẩn hoá giá trị role từ backend về "admin" | "staff" | "student" | null.
 * Chấp nhận: "ROLE_ADMIN", "ADMIN", "admin", ["ROLE_STAFF"], ...
 */
export const normalizeRole = (rawRole) => {
    const list = Array.isArray(rawRole) ? rawRole : [rawRole];
    const normalized = list
        .filter((r) => typeof r === "string")
        .map((r) => r.trim().replace(/^ROLE_/i, "").toLowerCase());
    return ROLE_PRIORITY.find((r) => normalized.includes(r)) ?? null;
};

// Lấy role của user trong Redux (backend trả trường "role")
export const getUserRole = (user) => normalizeRole(user?.role ?? user?.roles);

// Trang chủ theo role của user, hoặc null nếu role không hợp lệ
export const getHomePath = (user) => {
    const role = getUserRole(user);
    return role ? ROLE_HOME[role] : null;
};
