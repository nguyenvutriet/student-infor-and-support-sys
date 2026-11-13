import { FORGOT_STEP } from "../../utils/forgotPasswordUtils";

const initialOtp = {
    maskedEmail: "",
    expiresAt: 0,          
    resendAt: 0,         
    round: 0,           
    error: "",
    attemptsLeft: null,
    blocked: false,     
    verifying: false,
    resending: false,
};

const initialInfo = { loading: false, errors: {} };
const initialReset = { token: "", loading: false, errors: {} };

const initialState = {
    step: FORGOT_STEP.INFO,
    account: { username: "", email: "" },
    info: initialInfo,
    otp: initialOtp,
    reset: initialReset,
};

export const forgotPasswordReducer = (state = initialState, action) => {
    const p = action.payload;
    switch (action.type) {
        case "FORGOT_STEP_SET":
            return { ...state, step: p };

        case "FORGOT_ERRORS_SET":
            return { ...state, [p.scope]: { ...state[p.scope], errors: p.errors } };
        case "FORGOT_ERROR_CLEAR": {
            const errors = { ...state[p.scope].errors };
            delete errors[p.field];
            return { ...state, [p.scope]: { ...state[p.scope], errors } };
        }

        case "FORGOT_INFO_REQUEST":
            return { ...state, info: { loading: true, errors: {} } };
        case "FORGOT_INFO_SUCCESS":
            return {
                ...state,
                step: FORGOT_STEP.OTP,
                account: p.account,
                info: initialInfo,
                otp: { ...initialOtp, ...p.meta, round: state.otp.round + 1 },
            };
        case "FORGOT_INFO_FAILURE":
            return { ...state, info: { loading: false, errors: p.errors } };

        case "FORGOT_OTP_ERROR_SET":
            return { ...state, otp: { ...state.otp, error: p } };
        case "FORGOT_OTP_ERROR_CLEAR":
            return { ...state, otp: { ...state.otp, error: "" } };

        case "FORGOT_OTP_VERIFY_REQUEST":
            return { ...state, otp: { ...state.otp, verifying: true } };
        case "FORGOT_OTP_VERIFY_SUCCESS":
            return {
                ...state,
                step: FORGOT_STEP.RESET,
                otp: { ...state.otp, verifying: false, error: "", attemptsLeft: null },
                reset: { ...initialReset, token: p.resetToken },
            };
        case "FORGOT_OTP_VERIFY_FAILURE":
            return {
                ...state,
                otp: {
                    ...state.otp,
                    verifying: false,
                    error: p.message ?? state.otp.error,
                    attemptsLeft: p.attemptsLeft ?? null,
                    blocked: p.blocked || state.otp.blocked,
                },
            };

        case "FORGOT_OTP_RESEND_REQUEST":
            return { ...state, otp: { ...state.otp, resending: true } };
        case "FORGOT_OTP_RESEND_SUCCESS":
            return {
                ...state,
                otp: { ...state.otp, ...p, resending: false, error: "", attemptsLeft: null, blocked: false },
            };
        case "FORGOT_OTP_RESEND_FAILURE":
            return { ...state, otp: { ...state.otp, resending: false, resendAt: p?.resendAt ?? state.otp.resendAt } };

        case "FORGOT_RESET_REQUEST":
            return { ...state, reset: { ...state.reset, loading: true, errors: {} } };
        case "FORGOT_RESET_FAILURE":
            return { ...state, reset: { ...state.reset, loading: false, errors: p.errors } };

        case "FORGOT_SESSION_EXPIRED":
            return { ...initialState, otp: { ...initialOtp, round: state.otp.round }, account: state.account };
            
        case "FORGOT_CLEAR":
            return initialState;

        default:
            return state;
    }
};
