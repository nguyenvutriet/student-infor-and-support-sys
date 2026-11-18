export const MODULE_LABELS = {
  student: 'Sinh viên',
  staff: 'Nhân viên',
  admin: 'Quản trị viên',
}

export const MENUS = {
  student: [
    { key: 'home', label: 'Trang chủ', icon: 'home', path: '/student' },
    { key: 'notifications', label: 'Thông báo cá nhân', icon: 'bell', path: '/student/notifications' },
    { group: 'Hỗ trợ' },
    { key: 'forum', label: 'Diễn đàn', icon: 'forum', path: '/student/forum' },
    { key: 'messages', label: 'Tin nhắn', icon: 'chat', path: '/student/messages' },
    { group: 'Học tập' },
    { key: 'study', label: 'Góc học tập', icon: 'book', path: '/student/study' },
    { key: 'documents', label: 'Văn bản', icon: 'file', path: '/student/documents' },
  ],
  staff: [
    { key: 'dashboard', label: 'Tổng quan', icon: 'dashboard', path: '/staff' },
    { key: 'notifications', label: 'Thông báo cá nhân', icon: 'bell', path: '/staff/notifications' },
    { group: 'Hỗ trợ sinh viên' },
    { key: 'forum', label: 'Diễn đàn', icon: 'forum', path: '/staff/forum' },
    { key: 'messages', label: 'Tin nhắn', icon: 'chat', path: '/staff/messages' },
    { group: 'Quản lý nội dung' },
    { key: 'documents', label: 'Quản lý văn bản', icon: 'file', path: '/staff/documents' },
    { key: 'study', label: 'Quản lý góc học tập', icon: 'book', path: '/staff/study' },
    { key: 'statistical', label: 'Thống kê', icon: 'chart', path: '/staff/statistics' },
  ],
  admin: [
    { key: 'dashboard', label: 'Tổng quan', icon: 'dashboard', path: '/admin' },
    { key: 'notifications', label: 'Thông báo cá nhân', icon: 'bell', path: '/admin/notifications' },
    { group: 'Người dùng' },
    { key: 'accounts', label: 'Quản lý tài khoản', icon: 'users', path: '/admin/accounts' },
    { key: 'departments', label: 'Khoa / Viện', icon: 'building', path: '/admin/departments' },
    { group: 'Kiểm duyệt' },
    { key: 'reports', label: 'Quản lý báo cáo vi phạm', icon: 'flag', path: '/admin/reports' },
    { key: 'forums', label: 'Diễn đàn', icon: 'forum', path: '/admin/forum' },
    { group: 'Hệ thống' },
    { key: 'announcements', label: 'Thông báo hệ thống', icon: 'megaphone', path: '/admin/announcements' },
    { key: 'statistics', label: 'Thống kê', icon: 'chart', path: '/admin/statistics' },
  ],
}
