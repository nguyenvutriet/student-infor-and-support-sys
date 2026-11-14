
const LEGACY_KEY = "auth_user";

export const purgeLegacyAuthStorage = () => {
    try {
        localStorage.removeItem(LEGACY_KEY);
    } catch (error) {
        console.error("Error purging legacy auth storage:", error);
    }
};
