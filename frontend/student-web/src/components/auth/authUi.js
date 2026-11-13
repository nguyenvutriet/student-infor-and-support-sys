
export const AUTH_SIZE = "compact"; // "default" | "compact"

const PRESETS = {
    default: {
        "--auth-card-max": "690px",
        "--auth-card-py": "40px",
        "--auth-card-px": "40px",
        "--auth-title-size": "2.25rem",
        "--auth-subtitle-mb": "40px",
        "--auth-field-gap": "30px",
        "--auth-input-h": "70px",
        "--auth-input-fs": "1.15rem",
        "--auth-btn-h": "52px",
        "--auth-logo-w": "120px",
        "--auth-header-mb": "28px",
        "--auth-page-pt": "32px",
    },
    compact: {
        "--auth-card-max": "560px",
        "--auth-card-py": "32px",
        "--auth-card-px": "32px",
        "--auth-title-size": "1.9rem",
        "--auth-subtitle-mb": "28px",
        "--auth-field-gap": "24px",
        "--auth-input-h": "58px",
        "--auth-input-fs": "1.05rem",
        "--auth-btn-h": "48px",
        "--auth-logo-w": "96px",
        "--auth-header-mb": "20px",
        "--auth-page-pt": "24px",
    },
};

const MOBILE_OVERRIDES = {
    "--auth-card-py": "28px",
    "--auth-card-px": "20px",
    "--auth-title-size": "1.8rem",
    "--auth-subtitle-mb": "30px",
    "--auth-input-h": "58px",
    "--auth-input-fs": "1rem",
    "--auth-logo-w": "90px",
    "--auth-page-pt": "20px",
};

export const getAuthCssVars = (isMobile) => ({
    ...PRESETS[AUTH_SIZE],
    ...(isMobile ? MOBILE_OVERRIDES : {}),
});

export const AUTH_FONT = '"Inter", "Segoe UI", Roboto, Arial, sans-serif';

export const buildBackground = (imageUrl) =>
    `linear-gradient(rgba(10, 25, 50, 0.45), rgba(10, 25, 50, 0.45)), url(${imageUrl})`;
