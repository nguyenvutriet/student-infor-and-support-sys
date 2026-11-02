
import { useState } from 'react'
import Topbar from '../commom/Topbar'
import Sidebar from '../commom/Sidebar'
import '../../styles/layout.css'

export default function AdminLayout({
    activeKey,
    children,
    user,
    badges,
    unreadNotifications,
    unreadMessages,
    onNotifications,
    onMessages,
    onProfile,
    onLogout,
}) {
    const [collapsed, setCollapsed] = useState(false)

    const toggleMenu = () => {
        setCollapsed(current => !current)
    }

    const handleNavigate = (item) => {
        if (item.path) {
            window.location.href = item.path
        }
    }

    return (
        <div className={`ute-app ${collapsed ? 'ute-app--collapsed' : ''}`} data-module="admin">
            <Sidebar
                module="admin"
                activeKey={activeKey}
                onNavigate={handleNavigate}
                badges={badges}
                user={user}
                onToggle={toggleMenu}
                collapsed={collapsed}
            />

            <Topbar
                module="admin"
                user={user}
                unreadNotifications={unreadNotifications}
                unreadMessages={unreadMessages}
                onLogoClick={() => {
                    window.location.href = '/admin'
                }}
                onNotifications={onNotifications}
                onMessages={onMessages}
                onProfile={onProfile}
                onLogout={onLogout}
            />

            <main className="ute-main">
                <div className="ute-content">
                    <div className="ute-feed">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
