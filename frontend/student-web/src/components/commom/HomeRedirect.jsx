import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { getHomePath } from "../../utils/roles";
import AuthSplash from "./AuthSplash";


const HomeRedirect = () => {
    const { user, isChecking } = useSelector((state) => state.auth);
    if (isChecking) return <AuthSplash />;
    return <Navigate to={user ? getHomePath(user) || "/login" : "/login"} replace />;
};

export default HomeRedirect;
