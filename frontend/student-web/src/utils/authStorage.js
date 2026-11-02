/**
 * Lưu thông tin user (KHÔNG gồm token) vào localStorage để F5 không bị mất đăng nhập.
 * Token thật nằm trong cookie HttpOnly do backend quản lý.
 */
const KEY = "auth_user";

export const loadUser = () => {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const saveUser = (user) => {
    try {
        localStorage.setItem(KEY, JSON.stringify(user));
    } catch {
        /* bỏ qua nếu trình duyệt chặn localStorage */
    }
};

export const clearUser = () => {
    try {
        localStorage.removeItem(KEY);
    } catch {
        /* bỏ qua */
    }
};
