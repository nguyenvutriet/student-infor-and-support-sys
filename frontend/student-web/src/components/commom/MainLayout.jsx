import { useState } from 'react'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import '../../styles/layout.css'

/**
 * Layout dùng chung cho cả 3 module.
 *
 * @param {'student'|'staff'|'admin'} module  quyết định menu trái
 * @param {string}   activeKey    key menu đang chọn
 * @param {(item)=>void} onNavigate  gọi khi bấm menu (item.path dùng với react-router)
 * @param {{name:string, code?:string, avatar?:string}} user  hiện ở thẻ người dùng trên menu trái
 * @param {ReactNode} rightPanel  (tùy chọn) cột phải, chỉ hiện khi màn hình ≥ 1400px
 * @param {object} badges         vd { requests: 3 } – số đỏ cạnh menu
 */
export default function MainLayout({
  module = 'student',
  activeKey,
  onNavigate,
  user,
  badges,
  unreadNotifications,
  unreadMessages,
  onNotifications,
  onMessages,
  onProfile,
  onLogout,
  rightPanel,
  children,
}) {
  // Menu trái: mở rộng / thu gọn (chỉ còn icon). Nhớ lựa chọn; điện thoại mặc định thu gọn.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('ute-menu-collapsed')
      if (saved !== null) return saved === '1'
    } catch { /* bỏ qua */ }
    return window.matchMedia('(max-width: 960px)').matches
  })

  const toggleMenu = () =>
    setCollapsed((v) => {
      try { localStorage.setItem('ute-menu-collapsed', v ? '0' : '1') } catch { /* bỏ qua */ }
      return !v
    })

  const handleNavigate = (item) => {
    // Điện thoại: chọn mục xong tự thu gọn để không che nội dung
    if (window.matchMedia('(max-width: 960px)').matches) setCollapsed(true)
    onNavigate?.(item)
  }

  return (
    <div className={`ute-app ${collapsed ? 'ute-app--collapsed' : ''}`} data-module={module}>
      <Sidebar
        module={module}
        activeKey={activeKey}
        onNavigate={handleNavigate}
        badges={badges}
        user={user}
        onToggle={toggleMenu}
        collapsed={collapsed}
      />

      <Topbar
        module={module}
        user={user}
        unreadNotifications={unreadNotifications}
        unreadMessages={unreadMessages}
        onLogoClick={() => handleNavigate({ key: 'home' })}
        onNotifications={onNotifications}
        onMessages={onMessages}
        onProfile={onProfile}
        onLogout={onLogout}
      />

      <main className="ute-main">
        <div className="ute-content">
          <div className="ute-feed">{children}</div>
          {rightPanel && <aside className="ute-right">{rightPanel}</aside>}
        </div>
      </main>
    </div>
  )
}
