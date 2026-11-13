import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { resetForgotPassword, setForgotErrors, clearForgotError } from "../../store/action/action";
import { isStrongPassword, countPassedRules, PASSWORD_RULES, PASSWORD_RULE_MESSAGE } from "../../utils/passwordRules";
import { AuthTextField, Field, FOCUS_DELAY_MS, StepFooter, StepHeader } from "./AuthParts";

const strengthColor = (passed) => (passed <= 2 ? "#d32f2f" : passed < 5 ? "#ed8a00" : "#2e7d32");

export default function StepResetPassword({ active }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const account = useSelector((state) => state.forgotPassword.account);
    const { token: resetToken, loading, errors } = useSelector((state) => state.forgotPassword.reset);

    const firstRef = useRef(null);
    const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
    const [visible, setVisible] = useState({ newPassword: false, confirmPassword: false });

    useEffect(() => {
        if (!active) return;
        const t = setTimeout(() => firstRef.current?.focus({ preventScroll: true }), FOCUS_DELAY_MS);
        return () => clearTimeout(t);
    }, [active]);

    const passed = countPassedRules(form.newPassword);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) dispatch(clearForgotError("reset", name));
    };

    const toggle = (name) => setVisible((prev) => ({ ...prev, [name]: !prev[name] }));

    const validate = () => {
        const next = {};
        if (!form.newPassword) next.newPassword = "Vui lòng nhập mật khẩu mới";
        else if (!isStrongPassword(form.newPassword)) next.newPassword = PASSWORD_RULE_MESSAGE;

        if (!form.confirmPassword) next.confirmPassword = "Vui lòng xác nhận mật khẩu";
        else if (form.confirmPassword !== form.newPassword) next.confirmPassword = "Mật khẩu xác nhận không chính xác";

        dispatch(setForgotErrors("reset", next));
        return Object.keys(next).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading || !validate()) return;

        dispatch(
            resetForgotPassword(
                {
                    username: account.username,
                    resetToken,
                    newPassword: form.newPassword,
                    confirmPassword: form.confirmPassword,
                },
                toast,
                navigate,
            ),
        );
    };

    const eye = (name, label) => ({
        input: {
            endAdornment: (
                <InputAdornment position="end">
                    <IconButton
                        aria-label={visible[name] ? `Ẩn ${label}` : `Hiện ${label}`}
                        onClick={() => toggle(name)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        sx={{ color: "var(--color-auth-muted)" }}
                    >
                        {visible[name] ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                </InputAdornment>
            ),
        },
    });

    return (
        <>
            <StepHeader title="ĐẶT LẠI MẬT KHẨU" subtitle="Tạo mật khẩu mới cho tài khoản của bạn" />

            <form onSubmit={handleSubmit} noValidate>
                <Field>
                    <AuthTextField
                        id="fp-new-password"
                        name="newPassword"
                        label="Mật khẩu mới"
                        type={visible.newPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={form.newPassword}
                        onChange={handleChange}
                        error={!!errors.newPassword}
                        helperText={errors.newPassword}
                        inputRef={firstRef}
                        slotProps={eye("newPassword", "mật khẩu mới")}
                    />

                    <LinearProgress
                        variant="determinate"
                        value={(passed / PASSWORD_RULES.length) * 100}
                        aria-label="Độ mạnh mật khẩu"
                        sx={{
                            mt: 1.5,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "var(--color-auth-line)",
                            "& .MuiLinearProgress-bar": { backgroundColor: strengthColor(passed), borderRadius: 3 },
                        }}
                    />
                    <ul className="m-0 mt-3 grid list-none grid-cols-1 gap-1 p-0 min-[480px]:grid-cols-2">
                        {PASSWORD_RULES.map((rule) => {
                            const ok = rule.test(form.newPassword);
                            return (
                                <li
                                    key={rule.id}
                                    className={`flex items-center gap-1.5 text-[0.85rem] ${ok ? "text-auth-ok" : "text-auth-muted"}`}
                                >
                                    {ok ? (
                                        <CheckCircleIcon sx={{ fontSize: 18 }} />
                                    ) : (
                                        <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />
                                    )}
                                    {rule.label}
                                </li>
                            );
                        })}
                    </ul>
                </Field>

                <Field>
                    <AuthTextField
                        id="fp-confirm-password"
                        name="confirmPassword"
                        label="Xác nhận mật khẩu"
                        type={visible.confirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                        slotProps={eye("confirmPassword", "mật khẩu xác nhận")}
                    />
                </Field>

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                >
                    {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
                </Button>
            </form>

            <StepFooter />
        </>
    );
}
