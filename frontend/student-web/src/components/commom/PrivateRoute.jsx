import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Navigate, Outlet } from "react-router-dom";
import { getHomePath, getUserRole } from "../../utils/roles";


export const PrivateRoute = ({ publicPage = false, allowedRoles }) => {
    const { user } = useSelector((state) => state.auth);
    const location = useLocation();

    const role = getUserRole(user);
    const homePath = getHomePath(user);

    if (publicPage) {
        return user && homePath ? <Navigate to={homePath} replace /> : <Outlet />;
    }

    if (!user || !role) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to={homePath} replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;