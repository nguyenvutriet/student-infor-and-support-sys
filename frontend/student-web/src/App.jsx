import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeRedirect from "./components/commom/HomeRedirect";
import Login from "./components/auth/Login";
import { ROLES } from "./utils/roles";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "./components/commom/PrivateRoute";
import AccountManagement from "./components/admin/AccountManagement";
import AdminLayout from "./components/admin/AdminLayout";
import CommentReportManagement from "./components/admin/CommentReportManagement";

function AdminDashboard() {
    return (
        <AdminLayout activeKey="dashboard">
            <h1>Giao diện ADMIN</h1>
        </AdminLayout>
    );
}

function AdminAccounts() {
    return (
        <AdminLayout activeKey="accounts">
            <AccountManagement />
        </AdminLayout>
    );
}

function AdminCommentReports() {
    return (
        <AdminLayout activeKey="reports">
            <CommentReportManagement />
        </AdminLayout>
    );
}

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

                    <Route element={<PrivateRoute allowedRoles={[ROLES.STAFF]} />}>
                        <Route path="/staff" element={<div>Giao diện STAFF Ở ĐÂY NÈ NHA</div>} />
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.ADMIN]} />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/accounts" element={<AdminAccounts />} />
                        <Route path="/admin/reports" element={<AdminCommentReports />} />
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
