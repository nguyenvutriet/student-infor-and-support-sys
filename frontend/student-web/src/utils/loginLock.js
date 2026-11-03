const KEY = "login_lock";

export const loadLock = () => {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const lock = JSON.parse(raw);
        if (!lock?.username || typeof lock.until !== "number" || lock.until <= Date.now()) {
            localStorage.removeItem(KEY);
            return null;
        }
        return lock;
    } catch {
        return null;
    }
};

export const saveLock = (lock) => {
    try {
        localStorage.setItem(KEY, JSON.stringify(lock));
    } catch (error) {
        console.error("Error saving login lock:", error);
    }
};

export const clearLock = () => {
    try {
        localStorage.removeItem(KEY);
    } catch (error) {
        console.error("Error clearing login lock:", error);
    }
};