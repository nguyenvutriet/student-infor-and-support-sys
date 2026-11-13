import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { requestForgotOtp, setForgotErrors, clearForgotError } from "../../store/action/action";
import { AuthTextField, Field, FOCUS_DELAY_MS, StepFooter, StepHeader } from "./AuthParts";

export default function StepRequestInfo({ active }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, errors } = useSelector((state) => state.forgotPassword.info);

    const usernameRef = useRef(null);
    const [form, setForm] = useState({ username: "", email: "" });

    useEffect(() => {
        if (!active) return;
        const t = setTimeout(() => usernameRef.current?.focus({ preventScroll: true }), FOCUS_DELAY_MS);
        return () => clearTimeout(t);
    }, [active]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) dispatch(clearForgotError("info", name));
    };

    const validate = () => {
        const next = {};
        if (!form.username.trim()) next.username = "Vui lòng nhập tên tài khoản";
        if (!form.email.trim()) next.email = "Vui lòng nhập email";
        dispatch(setForgotErrors("info", next));
        return Object.keys(next).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading || !validate()) return;
        dispatch(requestForgotOtp({ username: form.username.trim(), email: form.email.trim() }, toast));
    };

    return (
        <>
            <StepHeader
                title="QUÊN MẬT KHẨU"
                subtitle="Nhập tên tài khoản và email để nhận mã xác minh"
                onBack={() => navigate("/login")}
                backLabel="Quay lại trang đăng nhập"
            />

            <form onSubmit={handleSubmit} noValidate>
                <Field>
                    <AuthTextField
                        id="fp-username"
                        name="username"
                        label="Tên tài khoản"
                        autoComplete="username"
                        value={form.username}
                        onChange={handleChange}
                        error={!!errors.username}
                        helperText={errors.username}
                        inputRef={usernameRef}
                    />
                </Field>

                <Field>
                    <AuthTextField
                        id="fp-email"
                        name="email"
                        label="Email"
                        autoComplete="email"
                        value={form.email}
                        onChange={handleChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        slotProps={{ htmlInput: { inputMode: "email" } }}
                    />
                </Field>

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                >
                    {loading ? "Đang gửi mã..." : "Xác nhận"}
                </Button>
            </form>

            <StepFooter />
        </>
    );
}
