import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACK_END_URL}/api`,
    withCredentials: true,
})

export const setupApiInterceptors = (store) => {
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            const status = error.response?.status;
            const url = error.config?.url || "";
            const skip = url.startsWith("/auth/") || error.config?.skipAuthRedirect;

            if (status === 401 && !skip && store.getState().auth?.isAuthenticated) {
                store.dispatch({ type: "LOGOUT_USER", payload: { reason: "expired" } });
                toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại", { id: "session-expired" });
            }
            return Promise.reject(error);
        }
    );
};


export default api;