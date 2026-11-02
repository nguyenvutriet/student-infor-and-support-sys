import api from "../../api/api";
import { getUserRole, ROLE_HOME } from "../../utils/roles";
import { clearUser, saveUser } from "../../utils/authStorage";




export const authUser = (sendData, toast, navigate, setLoader) => async (dispatch) => {

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
        if(error.response && error.response.data){
            toast.error(error.response.data.message);
        }
        let message = "Không thể kết nối đến máy chủ";

        if (error.response) {
            message =
                error.response.data?.message ||
                (error.response.status === 401
                    ? "Tên đăng nhập hoặc mật khẩu không đúng"
                    : "Đăng nhập thất bại, vui lòng thử lại");
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