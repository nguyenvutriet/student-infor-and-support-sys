import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeRedirect from "./components/commom/HomeRedirect";
import Login from "./components/auth/Login";
import { ROLES } from "./utils/roles";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "./components/commom/PrivateRoute";
import DocumentManagement from "./components/staff/DocumentManagement";
import AppLayout from "./components/commom/AppLayout";


function App() {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/" element={<HomeRedirect />} />

                    <Route element={<PrivateRoute publicPage />}>
                        <Route path="/login" element={<Login />} />
                        <Route path="/forgot-password" element={<div>Quên mật khẩu</div>} />
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.ADMIN]} />}>
                        <Route path="/admin" element={<div>Giao diện ADMIN Ở ĐÂY NÈ NHA</div>} />
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.ADMIN]} />}>
                        <Route element={<AppLayout />}>
                            <Route path="/admin" element={<div>Giao diện ADMIN Ở ĐÂY NÈ NHA</div>} />
                        </Route>
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.STAFF]} />}>
                        <Route element={<AppLayout />}>
                            <Route path="/staff/documents" element={<DocumentManagement />} />
                        </Route>
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
