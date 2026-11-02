import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { getHomePath } from "../../utils/roles";


const HomeRedirect = () => {
    const { user } = useSelector((state) => state.auth);
    return <Navigate to={user ? getHomePath(user) || "/login" : "/login"} replace />;
};

export default HomeRedirect;
