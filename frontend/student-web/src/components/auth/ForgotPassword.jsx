import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import background from "../../assets/logo_bg.jpg";
import { AUTH_FONT, buildBackground, getAuthCssVars } from "./authUi";
import { authMuiTheme } from "./authMuiTheme";
import StepRequestInfo from "./StepRequestInfo";
import StepVerifyOtp from "./StepVerifyOtp";
import StepResetPassword from "./StepResetPassword";
import { clearForgotPassword } from "../../store/action/action";
import logo from "../../assets/HCMUTE.jpg";
import { FORGOT_STEP } from "../../utils/forgotPasswordUtils";

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const isMobile = useMediaQuery("(max-width:600px)");

    const step = useSelector((state) => state.forgotPassword.step);
    const otpRound = useSelector((state) => state.forgotPassword.otp.round);
    const resetToken = useSelector((state) => state.forgotPassword.reset.token);

    const [swiper, setSwiper] = useState(null);

    useEffect(() => {
        swiper?.slideTo(step);
    }, [swiper, step]);

    useEffect(() => () => dispatch(clearForgotPassword()), [dispatch]);

    const slideClass = "px-[var(--auth-card-px)] py-[var(--auth-card-py)]";

    return (
        <ThemeProvider theme={authMuiTheme}>
            <div
                className="flex min-h-screen flex-col items-center bg-[#1c2a45] bg-cover bg-center bg-fixed px-4 pt-[var(--auth-page-pt)] pb-12"
                style={{
                    ...getAuthCssVars(isMobile),
                    fontFamily: AUTH_FONT,
                    backgroundImage: buildBackground(background),
                }}
            >
                <header className="mb-[var(--auth-header-mb)] text-center">
                    <img className="mx-auto mb-4 block h-auto w-[var(--auth-logo-w)]" src={logo} alt="Logo trường" />
                    <h1 className="mx-auto max-w-[620px] text-[length:clamp(1.25rem,2.6vw,1.9rem)] leading-[1.3] font-semibold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.45)]">
                        TRƯỜNG ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT TP.HCM
                    </h1>
                </header>

                <main className="w-full max-w-[var(--auth-card-max)]">
                    <Swiper
                        onSwiper={setSwiper}
                        autoHeight
                        speed={450}
                        slidesPerView={1}
                        allowTouchMove={false}
                        observer
                        observeParents
                        observeSlideChildren
                        className="rounded-[6px] border border-auth-line bg-white"
                    >
                        <SwiperSlide>
                            <div className={slideClass} inert={step !== FORGOT_STEP.INFO}>
                                <StepRequestInfo active={step === FORGOT_STEP.INFO} />
                            </div>
                        </SwiperSlide>

                        <SwiperSlide>
                            <div className={slideClass} inert={step !== FORGOT_STEP.OTP}>
                                <StepVerifyOtp key={otpRound} active={step === FORGOT_STEP.OTP} />
                            </div>
                        </SwiperSlide>

                        <SwiperSlide>
                            <div className={slideClass} inert={step !== FORGOT_STEP.RESET}>
                                <StepResetPassword key={resetToken || "no-token"} active={step === FORGOT_STEP.RESET} />
                            </div>
                        </SwiperSlide>
                    </Swiper>
                </main>
            </div>
        </ThemeProvider>
    );
};

export default ForgotPassword;
