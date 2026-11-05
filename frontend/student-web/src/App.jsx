import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeRedirect from "./components/commom/HomeRedirect";
import Login from "./components/auth/Login";
import { ROLES } from "./utils/roles";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "./components/commom/PrivateRoute";
import OAuth2Redirect from "./components/auth/OAuth2Redirect";
import AdminLayout from "./components/admin/AdminLayout";
import CommentReportManagement from "./components/admin/CommentReportManagement";
import ReportPostManagement from "./components/admin/ReportPostManagement";
import AccountManagement from "./components/admin/AccountManagement";
import StatisticsDashboard from "./components/admin/StatisticsDashboard";
import DocumentManagement from "./components/staff/DocumentManagement";
import AppLayout from "./components/commom/AppLayout";
import StudyManagement from "./components/staff/StudyManagement.jsx";
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

function AdminCommentReports() {
    return (
        <AdminLayout activeKey="reports">
            <CommentReportManagement />
        </AdminLayout>
    );
}

function AdminPostReports() {
    return (
        <AdminLayout activeKey="posts">
            <ReportPostManagement />
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

                    <Route element={<PrivateRoute allowedRoles={[ROLES.STAFF]} />}>
                        <Route element={<AppLayout />}>
                            <Route path="/staff/documents" element={<DocumentManagement />} />
                            <Route path="/staff/study" element={<StudyManagement />} />
                            <Route path="/staff/requests" element={<ChatPage key="requests" initialTab="REQUESTS" />} />
                            <Route path="/staff/messages" element={<ChatPage key="messages" initialTab="MESSAGES" />} />
                        </Route>
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.ADMIN]} />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/accounts" element={<AdminAccounts />} />
                        <Route path="/admin/reports" element={<AdminCommentReports />} />
                        <Route path="/admin/report-posts" element={<AdminPostReports />} />
                        <Route path="/admin/statistics" element={<AdminStatistics />} />
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.STUDENT]} />}>
                        <Route path="/student" element={<div>Giao diện STUDENT Ở ĐÂY NÈ MẤY NÍ ƠI</div>} />
                        <Route path="/student/requests" element={<ChatPage key="requests" />} />
                        <Route path="/student/messages" element={<ChatPage key="messages" />} />
                    </Route>

                    <Route path="*" element={<HomeRedirect />} />
                </Routes>
            </Router>

            <Toaster position="bottom-center" />
        </>
    );
}

export default App;
