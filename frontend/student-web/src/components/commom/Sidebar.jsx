import Icon from './Icon'
import { MENUS, MODULE_LABELS } from '../../config/menus'

function initials(name = '') {
  return name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase() || 'U'
}

export default function Sidebar({ module, activeKey, onNavigate, badges = {}, user, onToggle, collapsed }) {
  const items = MENUS[module] || []

  return (
    <>
    <aside className="ute-sidebar" aria-label="Menu chính">

      <div className="ute-me">
        <span className="ute-avatar">{user?.avatar ? <img src={user.avatar} alt="" /> : initials(user?.name)}</span>
        <div className="ute-me__info">
          <strong>{user?.name || 'Người dùng'}</strong>
          {user?.code && <div className="ute-me__code">{user.code}</div>}
          <span className="ute-me__role">{MODULE_LABELS[module]}</span>
        </div>
      </div>

      <nav className="ute-nav-wrap">
        {items.map((it, i) =>
          it.group ? (
            <div className="ute-sidebar__group" key={`g${i}`}>{it.group}</div>
          ) : (
            <button
              key={it.key}
              type="button"
              title={it.label}
              className={`ute-nav ${activeKey === it.key ? 'ute-nav--active' : ''}`}
              onClick={() => onNavigate?.(it)}
              aria-current={activeKey === it.key ? 'page' : undefined}
            >
              <span className="ute-nav__icon"><Icon name={it.icon} size={19} /></span>
              <span className="ute-nav__label">{it.label}</span>
              {badges[it.key] > 0 && <span className="ute-nav__badge">{badges[it.key]}</span>}
            </button>
          ),
        )}
      </nav>

      <div className="ute-sidebar__footer">© HCMC University of Technology and Education</div>
    </aside>

    {/* Viền phải menu: bấm để thu gọn / mở rộng */}
    <button
      type="button"
      className="ute-sidebar__edge"
      onClick={onToggle}
      aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
      title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
    >
      <span className="ute-sidebar__edge-knob"><Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={14} /></span>
    </button>
    </>
  )
}
