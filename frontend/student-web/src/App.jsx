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

import StaffDashboard from "./components/staff/StaffDashboard";
import DocumentManagement from "./components/staff/DocumentManagement";
import AppLayout from "./components/commom/AppLayout";
import StudyManagement from "./components/staff/StudyManagement.jsx";
import StaffStatistics from "./components/staff/StaffStatistics";

import ForumPage from "./components/commom/forum/ForumPage.jsx";
import { useSelector } from "react-redux";
import ChatPage from "./components/chat/ChatPage";
import NotificationPage from "./components/commom/notification/NotificationPage";
import StudyCorner from "./components/student/study/StudyCorner";
import DepartmentPage from "./components/student/study/DepartmentPage";
import ResourceDetailPage from "./components/student/study/ResourceDetailPage";
import ForgotPassword from "./components/auth/ForgotPassword.jsx";





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

function AdminNotifications() {
       const { user } = useSelector((state) => state.auth);
       return (
           <AdminLayout activeKey="notifications" user={{ name: user?.fullName, code: user?.userId, avatar: user?.avatar }}>
               <NotificationPage />
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
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/forum" element={<ForumPage />} />
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.STAFF]} />}>
                        <Route element={<AppLayout />}>
                            <Route path="/staff" element={<StaffDashboard />} />
                            <Route path="/staff/documents" element={<DocumentManagement />} />
                            <Route path="/staff/study" element={<StudyManagement />} />
                            <Route path="/staff/forum" element={<ForumPage />} />
                            <Route path="/staff/notifications" element={<NotificationPage />} />
                            <Route path="/staff/requests" element={<ChatPage key="requests" initialTab="REQUESTS" />} />
                            <Route path="/staff/messages" element={<ChatPage key="messages" initialTab="MESSAGES" />} />
                            <Route path="/staff/statistics" element={<StaffStatistics />} />
                        </Route>
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.ADMIN]} />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/accounts" element={<AdminAccounts />} />
                        <Route path="/admin/reports" element={<AdminReports />} />
                        <Route path="/admin/statistics" element={<AdminStatistics />} />
                        <Route path="/admin/posts" element={<AdminForum />} />
                        <Route path="/admin/notifications" element={<AdminNotifications />} /> 
                        <Route path="/admin/forum" element={<AdminForum />} />
                    </Route>

                    <Route element={<PrivateRoute allowedRoles={[ROLES.STUDENT]} />}>
                        <Route element={<AppLayout />}>
                        <Route path="/student/requests" element={<ChatPage key="requests" />} />
                        <Route path="/student/messages" element={<ChatPage key="messages" />} />
                        <Route path="/student/forum" element={<ForumPage />} />
                        <Route path="/student/notifications" element={<NotificationPage />} />
                        <Route path="/student/study" element={<StudyCorner initialTab="resources" />} />
                        <Route path="/student/study/departments/:departmentId" element={<DepartmentPage />} />
                        <Route path="/student/study/resources/:resourceId" element={<ResourceDetailPage />} />
                        <Route path="/student/schedule" element={<StudyCorner initialTab="schedule" />} />
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
