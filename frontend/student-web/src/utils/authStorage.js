
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
    } catch(error) {
        console.error("Error saving user to localStorage:", error);
    }
};

export const clearUser = () => {
    try {
        localStorage.removeItem(KEY);
    } catch(error) {
        console.error("Error clearing user from localStorage:", error);
    }
};
