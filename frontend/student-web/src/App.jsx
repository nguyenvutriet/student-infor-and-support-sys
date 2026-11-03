import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeRedirect from "./components/commom/HomeRedirect";
import Login from "./components/auth/Login";
import { ROLES } from "./utils/roles";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "./components/commom/PrivateRoute";
import OAuth2Redirect from "./components/auth/OAuth2Redirect";



function App() {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/" element={<HomeRedirect />} />

                    <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />

                    <Route element={<PrivateRoute publicPage />}>
                        <Route path="/login" element={<Login />} />
                        <Route path="/forgot-password" element={<div>Quên mật khẩu</div>} />
                        
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.ADMIN]} />}>
                        <Route path="/admin" element={<div>Giao diện ADMIN Ở ĐÂY NÈ NHA</div>} />
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.STAFF]} />}>
                        <Route path="/staff" element={<div>Giao diện STAFF ĐƯA VÀO ĐÂY NHA MẤY NÍ</div>} />
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.STUDENT]} />}>
                        <Route path="/student" element={<div>Giao diện STUDENT Ở ĐÂY NÈ MẤY NÍ ƠI</div>} />
                    </Route>

                    <Route path="*" element={<HomeRedirect />} />
                </Routes>
            </Router>

            <Toaster position="bottom-center" />
        </>
    );
}

export default App;
