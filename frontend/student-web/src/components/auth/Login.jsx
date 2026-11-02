import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { authUser } from "../../store/action/action";
import toast from "react-hot-toast";
import logo from "../../assets/HCMUTE.jpg";
import background from "../../assets/logo_bg.jpg";
import '../../styles/Login.css';


const GoogleIcon = () => (
    <svg className="login-google-icon" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

const Login = () => {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [loader, setLoader] = useState(false);
    const [form, setForm] = useState({ username: "", password: "" });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.username.trim()) newErrors.username = "Vui lòng nhập tên đăng nhập";
        if (!form.password) newErrors.password = "Vui lòng nhập mật khẩu";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (!validate()) return;
        const data = { username: form.username.trim(), password: form.password };
        dispatch(authUser(data, toast, navigate, setLoader));
    };

    
    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_BACK_END_URL}/oauth2/authorization/google`;
    };

    return (
        <div className="login-page" style={{ "--login-bg": `url(${background})` }}>
            <header className="login-header">
                <img className="login-logo" src={logo} alt="Logo trường" />
                <h1 className="login-school">
                    TRƯỜNG ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT TP.HCM
                </h1>
            </header>

            <main className="login-card">
                <h2 className="login-title">ĐĂNG NHẬP</h2>
                <p className="login-subtitle">Cổng thông tin hỗ trợ</p>

                <form onSubmit={handleLogin} noValidate>
                    <div className={`login-field ${errors.username ? "has-error" : ""}`}>
                        <label htmlFor="username">Tên đăng nhập</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            value={form.username}
                            onChange={handleChange}
                            aria-invalid={!!errors.username}
                            aria-describedby={errors.username ? "username-error" : undefined}
                        />
                        {errors.username && (
                            <span id="username-error" className="login-error" role="alert">
                                {errors.username}
                            </span>
                        )}
                    </div>

                    <div className={`login-field ${errors.password ? "has-error" : ""}`}>
                        <label htmlFor="password">Mật khẩu</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={form.password}
                            onChange={handleChange}
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? "password-error" : undefined}
                        />
                        {errors.password && (
                            <span id="password-error" className="login-error" role="alert">
                                {errors.password}
                            </span>
                        )}
                    </div>

                    <button type="submit" className="login-btn-primary" disabled={loader}>
                        {loader ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>
                </form>

                <button
                    type="button"
                    className="login-btn-google"
                    onClick={handleGoogleLogin}
                    disabled={loader}
                >
                    <GoogleIcon />
                    Đăng nhập với Google
                </button>

                <hr className="login-divider" />

                <Link to="/forgot-password" className="login-forgot">
                    Quên mật khẩu
                </Link>
            </main>
        </div>
    );
}

export default Login;