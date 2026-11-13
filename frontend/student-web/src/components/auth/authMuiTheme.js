import { createTheme } from "@mui/material/styles";
import { AUTH_FONT } from "./authUi";


const c = (name) => `var(--color-auth-${name})`;

export const authMuiTheme = createTheme({
    palette: {
        primary: { main: "#00538f", dark: "#004273" },
        error: { main: "#d32f2f" },
    },
    typography: {
        fontFamily: AUTH_FONT,
        button: { textTransform: "none" },
    },
    components: {
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    height: "var(--auth-input-h)",
                    fontSize: "var(--auth-input-fs)",
                    color: "#111827",
                    backgroundColor: c("field"),
                    borderRadius: 4,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: c("field-border"), borderWidth: 1 },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: c("field-border") },
                    "&.Mui-focused": { boxShadow: "0 0 0 2px rgba(0, 83, 143, 0.25)" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: c("btn"), borderWidth: 1 },
                    "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: c("error") },
                    "&.Mui-error.Mui-focused": { boxShadow: "0 0 0 2px rgba(211, 47, 47, 0.25)" },
                },
                input: {
                    height: "100%",
                    padding: "0 18px",
                    boxSizing: "border-box",
                    "&:-webkit-autofill": {
                        WebkitBoxShadow: "0 0 0 100px #e8effc inset",
                        WebkitTextFillColor: "#111827",
                    },
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: c("muted"),
                    "&.Mui-focused": { color: c("muted") },
                    "&.Mui-error": { color: c("error") },
                },
            },
        },
        MuiFormHelperText: {
            styleOverrides: {
                root: {
                    marginLeft: 0,
                    marginRight: 0,
                    marginTop: 6,
                    fontSize: "0.85rem",
                    "&.Mui-error": { color: c("error") },
                },
            },
        },
        MuiButton: {
            defaultProps: { disableElevation: true, disableRipple: false },
            styleOverrides: {
                root: {
                    height: "var(--auth-btn-h)",
                    fontSize: "1.05rem",
                    borderRadius: 4,
                    boxShadow: "none",
                },
                containedPrimary: {
                    fontWeight: 600,
                    backgroundColor: c("btn"),
                    "&:hover": { backgroundColor: c("btn-hover"), boxShadow: "none" },
                    "&.Mui-disabled": { backgroundColor: c("btn"), color: "#fff", opacity: 0.65 },
                },
                outlinedPrimary: {
                    fontWeight: 500,
                    color: c("btn"),
                    borderColor: c("field-border"),
                    backgroundColor: "#fff",
                    "&:hover": { backgroundColor: "#f4f7fd", borderColor: c("btn") },
                },
            },
        },
    },
});
