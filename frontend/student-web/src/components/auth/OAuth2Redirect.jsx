import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loadOAuthUser } from "../../store/action/action";


const OAuth2Redirect = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const called = useRef(false);

    useEffect(() => {
        if (called.current) return;
        called.current = true;
        dispatch(loadOAuthUser(toast, navigate));
    }, [dispatch, navigate]);

    return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
            Đang hoàn tất đăng nhập...
        </div>
    );
};

export default OAuth2Redirect;