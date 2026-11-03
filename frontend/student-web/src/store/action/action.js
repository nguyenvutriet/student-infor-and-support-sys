import api from "../../api/api";
import { getUserRole, ROLE_HOME } from "../../utils/roles";
import { clearUser, saveUser } from "../../utils/authStorage";
import { AUTH_MESSAGES } from "../../utils/authMessages";




export const authUser = (sendData, toast, navigate, setLoader, onLocked) => async (dispatch) => {

    try{
        setLoader(true);
        const {data} = await api.post("/auth/login", sendData);
        const user = {...data};
        delete user.jwtToken;
        const role = getUserRole(user);
        if (!role) {
            toast.error("Tài khoản chưa được phân quyền hợp lệ, vui lòng liên hệ quản trị viên");
            return;
        }


        saveUser(user);

        dispatch({
            type: "LOGIN_USER",
            payload: data
        });
        navigate(ROLE_HOME[role], { replace: true });
    } catch (error) {
        let message = "Không thể kết nối đến máy chủ";

        if (error.response) {
            const { status, data } = error.response;

            if (status === 429) {
                
                const retryAfter = Number(
                    data?.retryAfterSeconds ?? error.response.headers?.["retry-after"]
                );
                message = data?.message || "Bạn đã nhập sai quá nhiều lần, vui lòng thử lại sau";
                if (onLocked && Number.isFinite(retryAfter) && retryAfter > 0) {
                    onLocked(retryAfter, message);
                }
            } else if (status === 401) {
                message = "Tên đăng nhập hoặc mật khẩu không đúng";
            } else {
                message = data?.message || "Đăng nhập thất bại, vui lòng thử lại";
            }
        }
        toast.error(message);
    }finally{
        setLoader(false);
    }

}

export const logoutUser = (navigate) => async (dispatch) => {
    try{
        await api.post("/auth/logout");
    } catch (error) {
        console.error("Logout error:", error);
    }
    clearUser();
    dispatch({
        type: "LOGOUT_USER"
    });
    navigate("/login", { replace: true });
}

export const loadOAuthUser = (toast, navigate) => async (dispatch) => {
    try {
        const { data } = await api.get("/auth/user");
        const user = { ...data };
        delete user.jwtToken;

        const role = getUserRole(user);
        if (!role) {
            clearUser();
            toast.error("Tài khoản chưa được phân quyền hợp lệ, vui lòng liên hệ quản trị viên");
            navigate("/login", { replace: true });
            return;
        }

        saveUser(user);
        dispatch({
            type: "LOGIN_USER",
            payload: user
        });
        navigate(ROLE_HOME[role], { replace: true });
    } catch (error) {
        console.error("OAuth2 login error:", error);
        clearUser();
        toast.error("Không thể hoàn tất đăng nhập bằng Google, vui lòng thử lại");
        navigate("/login", { replace: true });
    }
}