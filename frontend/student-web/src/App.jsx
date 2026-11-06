import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeRedirect from "./components/commom/HomeRedirect";
import Login from "./components/auth/Login";
import { ROLES } from "./utils/roles";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "./components/commom/PrivateRoute";
import OAuth2Redirect from "./components/auth/OAuth2Redirect";
import AdminLayout from "./components/admin/AdminLayout";
import ReportManagement from "./components/admin/ReportManagement.jsx";
import AccountManagement from "./components/admin/AccountManagement";
import StatisticsDashboard from "./components/admin/StatisticsDashboard";
import DocumentManagement from "./components/staff/DocumentManagement";
import AppLayout from "./components/commom/AppLayout";
import StudyManagement from "./components/staff/StudyManagement.jsx";
import ForumPage from "./components/commom/forum/ForumPage.jsx";
import { useSelector } from "react-redux";
import ChatPage from "./components/chat/ChatPage";
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

function AdminReports() {
    return (
        <AdminLayout activeKey="reports">
            <ReportManagement />
        </AdminLayout>
    );
}

function AdminStatistics() {
    return (
        <AdminLayout activeKey="statistics">
            <StatisticsDashboard />
        </AdminLayout>
    );
}

function AdminForum() {
    const { user } = useSelector((state) => state.auth);
    return (
        <AdminLayout
            activeKey="forums"
            user={{ name: user?.fullName, code: user?.userId, avatar: user?.avatar }}
        >
            <ForumPage />
        </AdminLayout>
    );
}

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
                        <Route path="/reset-password" element={<div>Đặt lại mật khẩu</div>} />
                        <Route path="/forum" element={<ForumPage />} />
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.STAFF]} />}>
                        <Route element={<AppLayout />}>
                            <Route path="/staff/documents" element={<DocumentManagement />} />
                            <Route path="/staff/study" element={<StudyManagement />} />
                            <Route path="/staff/forum" element={<ForumPage />} />
                            <Route path="/staff/requests" element={<ChatPage key="requests" initialTab="REQUESTS" />} />
                            <Route path="/staff/messages" element={<ChatPage key="messages" initialTab="MESSAGES" />} />
                        </Route>
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.ADMIN]} />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/accounts" element={<AdminAccounts />} />
                        <Route path="/admin/reports" element={<AdminReports />} />
                        <Route path="/admin/statistics" element={<AdminStatistics />} />
                        <Route path="/admin/posts" element={<AdminForum />} />
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.STUDENT]} />}>
                        <Route element={<AppLayout />}>
                        <Route path="/student" element={<div>Giao diện STUDENT Ở ĐÂY NÈ MẤY NÍ ƠI</div>} />
                        <Route path="/student/requests" element={<ChatPage key="requests" />} />
                        <Route path="/student/messages" element={<ChatPage key="messages" />} />
                        <Route path="/student/forum" element={<ForumPage />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<HomeRedirect />} />
                </Routes>
            </Router>

            <Toaster position="bottom-center" />
        </>
    );
}

export default App;
