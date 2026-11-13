import { Link as RouterLink } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import MuiLink from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export function StepHeader({ title, subtitle, onBack, backLabel = "Quay lại" }) {
    return (
        <div>
            <div className="mb-2 flex items-center gap-1">
                {onBack && (
                    <IconButton
                        aria-label={backLabel}
                        title={backLabel}
                        onClick={onBack}
                        edge="start"
                        sx={{ color: "var(--color-auth-muted)", "&:hover": { color: "var(--color-auth-btn)" } }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                )}
                <h2 className="text-[length:var(--auth-title-size)] font-semibold tracking-[0.01em] text-auth-title">
                    {title}
                </h2>
            </div>
            <p className="mb-[var(--auth-subtitle-mb)] text-[1.05rem] text-auth-muted">{subtitle}</p>
        </div>
    );
}

export function StepFooter() {
    return (
        <>
            <div className="mt-[30px] mb-6 border-t border-auth-line" />
            <MuiLink
                component={RouterLink}
                to="/login"
                underline="hover"
                sx={{
                    fontSize: "1.05rem",
                    color: "var(--color-auth-muted)",
                    "&:hover": { color: "var(--color-auth-btn)" },
                }}
            >
                Quay lại đăng nhập
            </MuiLink>
        </>
    );
}

export function AuthTextField({ slotProps, ...props }) {
    return (
        <TextField
            fullWidth
            variant="outlined"
            slotProps={{ ...slotProps, inputLabel: { shrink: true, ...slotProps?.inputLabel } }}
            {...props}
        />
    );
}

export function Field({ children }) {
    return <div className="mb-[var(--auth-field-gap)]">{children}</div>;
}

export const FOCUS_DELAY_MS = 520;
