import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import NotificationDropdown from './notification/NotificationDropdown'
import NotificationDetailModal from './notification/NotificationDetailModal'
import { MENUS } from '../../config/menus'
import { closeNotificationDetail, fetchUnreadNotificationCount } from '../../store/action/action'
import '../../styles/layout.css'

/**
 *
 * @param {'student'|'staff'|'admin'} module  
 * @param {string}   activeKey    
 * @param {(item)=>void} onNavigate 
 * @param {{name:string, code?:string, avatar?:string}} user  
 * @param {ReactNode} rightPanel  
 * @param {object} badges      
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
  const dispatch = useDispatch()
  const unreadFromStore = useSelector((s) => s.notification?.unreadCount)
  const notiDetail = useSelector((s) => s.notification?.detail)
  const unread = unreadNotifications ?? unreadFromStore
  const [notiOpen, setNotiOpen] = useState(false)
  const lastClosedAt = useRef(0)

  useEffect(() => {
    dispatch(fetchUnreadNotificationCount())
    const timer = setInterval(() => dispatch(fetchUnreadNotificationCount()), 60000)
    return () => clearInterval(timer)
  }, [dispatch])

  const closeNoti = useCallback(() => {
    lastClosedAt.current = Date.now()
    setNotiOpen(false)
  }, [])

  const toggleNoti = () => {
    if (notiOpen) return closeNoti()
    if (Date.now() - lastClosedAt.current < 300) return undefined
    setNotiOpen(true)
    onNotifications?.()
    return undefined
  }

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
    // Điện thoại
    if (window.matchMedia('(max-width: 960px)').matches) setCollapsed(true)
    onNavigate?.(item)
  }

  const goNotifications = () => {
    closeNoti()
    const item = (MENUS[module] || []).find((it) => it.key === 'notifications')
    if (item) handleNavigate(item)
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
        unreadNotifications={typeof unread === 'number' && unread > 0 ? unread : undefined}
        unreadMessages={unreadMessages}
        onLogoClick={() => handleNavigate({ key: 'home' })}
        onNotifications={toggleNoti}
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

      {notiOpen && <NotificationDropdown onClose={closeNoti} onSeeMore={goNotifications} />}
      {notiDetail && <NotificationDetailModal notification={notiDetail} onClose={() => dispatch(closeNotificationDetail())} />}
    </div>
  )
}
