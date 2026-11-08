import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { RefreshIcon } from '../forum/ForumIcons'
import { timeAgo } from '../forum/forumUtils'
import { BellIcon, TypeIcon } from './NotificationIcons'
import { typeMeta } from './notificationUtils'
import '../../../styles/forum.css'
import '../../../styles/notification.css'
import { fetchRecentNotifications, openNotification } from '../../../store/action/action'

export default function NotificationDropdown({ onClose, onSeeMore }) {
  const dispatch = useDispatch()
  const recent = useSelector((s) => s.notification?.recent) || { items: [], loading: false, error: '', loaded: false }
  const ref = useRef(null)

  useEffect(() => {
    dispatch(fetchRecentNotifications())
  }, [dispatch])

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const open = (n) => {
    onClose()
    dispatch(openNotification(n, toast))
  }

  return (
    <div className="nt-pop" ref={ref} role="dialog" aria-label="Thông báo">
      <h3 className="nt-pop__title">Thông báo</h3>

      <div className="nt-pop__body">
        {recent.error ? (
          <div className="nt-pop__state nt-pop__state--err">
            <p>{recent.error}</p>
            <button type="button" className="fm-btn" onClick={() => dispatch(fetchRecentNotifications())}>
              <RefreshIcon size={16} spinning={recent.loading} /> Thử lại
            </button>
          </div>
        ) : !recent.loaded && recent.loading ? (
          <div className="nt-pop__state"><p>Đang tải thông báo…</p></div>
        ) : recent.items.length === 0 ? (
          <div className="nt-pop__state">
            <BellIcon size={32} />
            <p>Chưa có thông báo</p>
          </div>
        ) : (
          <ul className="nt-pop__list">
            {recent.items.map((n) => {
              const m = typeMeta(n.type)
              return (
                <li key={n.notiId}>
                  <button
                    type="button"
                    className={`nt-pop__item ${n.read ? '' : 'nt-pop__item--unread'}`}
                    onClick={() => open(n)}
                  >
                    <span className="nt-ico nt-ico--md" style={{ '--k-bg': m.bg, '--k-fg': m.fg }}>
                      <TypeIcon kind={m.kind} size={22} />
                    </span>
                    <span className="nt-pop__text">
                      <strong>{n.title || m.title}</strong>
                      <span className="nt-pop__content">{n.content}</span>
                      <time>{timeAgo(n.createAt)}</time>
                    </span>
                    {!n.read && <span className="nt-dot" title="Chưa đọc" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="nt-pop__foot">
        <button type="button" className="nt-pop__more" onClick={onSeeMore}>Xem thêm</button>
      </div>
    </div>
  )
}
