import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { clearForgotOtpError, resendForgotOtp, setForgotOtpError, setForgotStep, verifyForgotOtp } from "../../store/action/action";
import { FOCUS_DELAY_MS, StepFooter, StepHeader } from "./AuthParts";
import OtpInput from "./OtpInput";
import { FORGOT_STEP } from "../../utils/forgotPasswordUtils";


const emptyDigits = () => Array(6).fill("");

const formatCountdown = (totalSeconds) => {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${m}:${s}`;
};

export default function StepVerifyOtp({ active }) {
    const dispatch = useDispatch();
    const account = useSelector((state) => state.forgotPassword.account);
    const { maskedEmail, expiresAt, resendAt, error, attemptsLeft, blocked, verifying, resending } = useSelector(
        (state) => state.forgotPassword.otp,
    );

    const firstRef = useRef(null);
    const [digits, setDigits] = useState(emptyDigits);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (!active) return;
        const t = setTimeout(() => firstRef.current?.focus({ preventScroll: true }), FOCUS_DELAY_MS);
        return () => clearTimeout(t);
    }, [active]);

    const expiresLeft = Math.max(0, Math.ceil((expiresAt - now) / 1000));
    const resendLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));
    const expired = expiresAt > 0 && expiresLeft === 0;
    const needResend = blocked || expired;
    const shownError = error || (expired ? "Mã OTP của bạn đã hết hạn" : "");

    const handleDigitsChange = (next) => {
        setDigits(next);
        if (error) dispatch(clearForgotOtpError());
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (verifying || needResend) return;

        const otp = digits.join("");
        if (otp.length < 6) {
            dispatch(setForgotOtpError(otp.length === 0 ? "Vui lòng nhập mã OTP" : "Vui lòng nhập đủ 6 chữ số của mã OTP"));
            firstRef.current?.focus();
            return;
        }

        const result = await dispatch(verifyForgotOtp(account, otp, toast));
        if (!result.ok && result.code === "OTP_INVALID") {
            setDigits(emptyDigits());
            firstRef.current?.focus();
        }
    };

    const handleResend = async () => {
        if (resending) return;
        const sent = await dispatch(resendForgotOtp(account, toast));
        if (sent) {
            setDigits(emptyDigits());
            firstRef.current?.focus();
        }
    };

    const resendDisabled = resending || (!needResend && resendLeft > 0);

    return (
        <>
            <StepHeader
                title="XÁC MINH OTP"
                subtitle={
                    <>
                        Mã gồm 6 chữ số đã được gửi đến <strong>{maskedEmail}</strong>
                    </>
                }
                onBack={() => dispatch(setForgotStep(FORGOT_STEP.INFO))}
                backLabel="Quay lại nhập thông tin"
            />

            <form onSubmit={handleVerify} noValidate>
                <div className="mb-2 text-[0.85rem] text-auth-muted">Mã OTP</div>
                <OtpInput
                    digits={digits}
                    onChange={handleDigitsChange}
                    error={!!shownError}
                    disabled={needResend || verifying}
                    firstRef={firstRef}
                />

                <div className="mt-2 min-h-5 text-[0.85rem]" aria-live="polite">
                    {shownError && (
                        <span className="text-auth-error" role="alert">
                            {shownError}
                        </span>
                    )}
                    {attemptsLeft !== null && !needResend && (
                        <span className="ml-1 text-auth-muted">(còn {attemptsLeft} lần thử)</span>
                    )}
                </div>

                <div className="mt-3 mb-[var(--auth-field-gap)] flex items-center justify-between gap-3 text-[0.95rem] text-auth-muted">
                    <span className="tabular-nums">
                        {expired ? "Mã đã hết hạn" : `Mã có hiệu lực trong ${formatCountdown(expiresLeft)}`}
                    </span>
                    {!needResend && (
                        <Button
                            variant="text"
                            onClick={handleResend}
                            disabled={resendDisabled}
                            sx={{
                                height: "auto",
                                minWidth: 0,
                                px: 1,
                                py: 0.5,
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                                color: "var(--color-auth-btn)",
                            }}
                        >
                            {resendLeft > 0 ? `Gửi lại mã (${resendLeft}s)` : "Gửi lại mã"}
                        </Button>
                    )}
                </div>

                <Button
                    type={needResend ? "button" : "submit"}
                    variant="contained"
                    fullWidth
                    onClick={needResend ? handleResend : undefined}
                    disabled={needResend ? resending : verifying}
                    startIcon={
                        (needResend ? resending : verifying) ? <CircularProgress size={18} color="inherit" /> : null
                    }
                >
                    {needResend
                        ? resending ? "Đang gửi lại..." : "Gửi lại mã"
                        : verifying ? "Đang xác minh..." : "Xác minh"}
                </Button>
            </form>

            <StepFooter />
        </>
    );
}
