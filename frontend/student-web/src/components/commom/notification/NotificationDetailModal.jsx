import ForumModal from '../forum/ForumModal'
import { TypeIcon } from './NotificationIcons'
import { splitDateTime, typeMeta } from './notificationUtils'

export default function NotificationDetailModal({ notification, onClose }) {
  const m = typeMeta(notification.type)
  const { date, time } = splitDateTime(notification.createAt)
  const style = { '--k-bg': m.bg, '--k-fg': m.fg }

  return (
    <ForumModal
      title="Chi tiết thông báo"
      onClose={onClose}
      width={580}
      footer={
        <div className="fm-foot-actions">
          <button type="button" className="fm-btn" onClick={onClose}>Đóng</button>
        </div>
      }
    >
      <div className="nt-detail">
        <div className="nt-detail__head">
          <span className="nt-ico nt-ico--lg" style={style}><TypeIcon kind={m.kind} size={26} /></span>
          <div className="nt-detail__info">
            <h3 className="nt-detail__title">{notification.title || m.title}</h3>
            <div className="nt-detail__meta">
              <span className="nt-badge" style={style}>{m.kindLabel}</span>
              {date && <time>{date} lúc {time}</time>}
            </div>
          </div>
        </div>

        {notification.sender && (
          <p className="nt-detail__row"><span>Người gửi</span><strong>{notification.sender}</strong></p>
        )}

        <div className="nt-detail__content">{notification.content || 'Thông báo không có nội dung.'}</div>
      </div>
    </ForumModal>
  )
}
