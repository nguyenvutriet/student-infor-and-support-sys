import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import Logo from './Logo'
import { MODULE_LABELS } from '../../config/menus'

function initials(name = '') {
  return name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase() || 'U'
}

export default function Topbar({
  module,
  user,
  unreadNotifications = 0,
  unreadMessages = 0,
  onLogoClick,
  onNotifications,
  onMessages,
  onProfile,
  onLogout,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const avatar = user?.avatar ? <img src={user.avatar} alt="" /> : initials(user?.name)

  return (
    <header className="ute-topbar">
      <div className="ute-topbar__brand">
        <Logo onClick={onLogoClick} />
      </div>
      <div className="ute-topbar__bar">

      <div className="ute-topbar__right">
        {module !== 'admin' && (
          <button type="button" className="ute-iconbtn" onClick={onMessages} aria-label="Tin nhắn">
            <Icon name="chat" />
            {unreadMessages > 0 && <span className="ute-iconbtn__badge">{unreadMessages}</span>}
          </button>
        )}
        <button type="button" className="ute-iconbtn" onClick={onNotifications} aria-label="Thông báo">
          <Icon name="bell" />
          {unreadNotifications > 0 && <span className="ute-iconbtn__badge">{unreadNotifications}</span>}
        </button>

        <div className="ute-dropdown" ref={ref}>
          <button type="button" className="ute-avatar" onClick={() => setOpen((v) => !v)} aria-label="Tài khoản">
            {avatar}
          </button>
          {open && (
            <div className="ute-dropdown__panel">
              <div className="ute-dropdown__me">
                <span className="ute-avatar">{avatar}</span>
                <div>
                  <strong>{user?.name || 'Người dùng'}</strong>
                  <span>{MODULE_LABELS[module]}</span>
                </div>
              </div>
              <button type="button" className="ute-dropdown__item" onClick={() => { setOpen(false); onProfile?.() }}>
                <span className="ute-dropdown__ico"><Icon name="user" /></span> Trang cá nhân
              </button>
              <button type="button" className="ute-dropdown__item" onClick={() => { setOpen(false); onLogout?.() }}>
                <span className="ute-dropdown__ico"><Icon name="logout" /></span> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  )
}
