import { FiInfo, FiFileText, FiFlag, FiHome, FiCalendar, FiArrowRight, FiUsers, FiCheckCircle, FiTrash2, FiUser, FiXCircle, FiCheck } from 'react-icons/fi'
import Avatar from './Avatar'
import StatusPill from './StatusPill'
import { fullDate } from './chatUtils'

const Row = ({ icon, label, children }) => (
  <div className="cx-row">
    <span className="cx-row__ico">{icon}</span>
    <span className="cx-row__label">{label}</span>
    <span className="cx-row__val">{children}</span>
  </div>
)

export default function InfoPanel({ detail, isStaff, open, onClose, actions }) {
  if (!detail) {
    return (
      <aside className={`cx-info ${open ? 'is-open' : ''}`}>
        <h2 className="cx-info__title"><FiInfo /> Thông tin yêu cầu</h2>
        <p className="cx-empty">Chọn một yêu cầu để xem chi tiết</p>
      </aside>
    )
  }
  const p = detail.permissions
  const who = isStaff ? detail.studentName : (detail.handlerName || detail.departmentName || 'Đơn vị')
  const whoSub = isStaff ? `MSSV: ${detail.studentId}` : detail.departmentName

  return (
    <aside className={`cx-info ${open ? 'is-open' : ''}`}>
      <h2 className="cx-info__title"><FiInfo /> Thông tin yêu cầu
        <button type="button" className="cx-icobtn cx-info__close" onClick={onClose} aria-label="Đóng">×</button>
      </h2>

      <div className="cx-info__who">
        <Avatar name={who} size={72} />
        <div><strong>{who}</strong><span>{whoSub}</span></div>
      </div>

      <div className="cx-info__rows">
        <Row icon={<FiFileText />} label="Tiêu đề">{detail.subject}</Row>
        <Row icon={<FiFlag />} label="Trạng thái"><StatusPill status={detail.status} small /></Row>
        <Row icon={<FiHome />} label="Đơn vị tiếp nhận">{detail.departmentName}</Row>
        {detail.handlerName && <Row icon={<FiUser />} label="Người phụ trách">{detail.handlerName}</Row>}
        {detail.invitedDepartments.length > 0 && (
          <Row icon={<FiUsers />} label="Đơn vị hỗ trợ">{detail.invitedDepartments.map((d) => d.name).join(', ')}</Row>
        )}
        <Row icon={<FiCalendar />} label="Ngày tạo">{fullDate(detail.createdAt)}</Row>
      </div>

      <div className="cx-info__actions">
        {p.canAccept && <button type="button" className="cx-btn cx-btn--block" onClick={actions.accept}><FiCheck /> Tiếp nhận</button>}
        {p.canReject && <button type="button" className="cx-btn cx-btn--outline cx-btn--block" onClick={actions.reject}><FiXCircle /> Từ chối tiếp nhận</button>}
        {p.canForward && <button type="button" className="cx-btn cx-btn--block" onClick={actions.forward}><FiArrowRight /> Chuyển tiếp</button>}
        {p.canInvite && <button type="button" className="cx-btn cx-btn--soft cx-btn--block" onClick={actions.invite}><FiUsers /> Mời đơn vị hỗ trợ</button>}
        {p.canClose && <button type="button" className="cx-btn cx-btn--outline cx-btn--block" onClick={actions.close}><FiCheckCircle /> Đóng trao đổi</button>}
        {p.canDelete && <button type="button" className="cx-btn cx-btn--danger-outline cx-btn--block" onClick={actions.remove}><FiTrash2 /> Xóa yêu cầu</button>}
      </div>

      <h3 className="cx-info__sub">Lịch sử xử lý</h3>
      <ol className="cx-timeline">
        {detail.histories.map((h, i) => (
          <li key={`${h.time}-${i}`}>
            <strong>{h.action}</strong>
            <time>{fullDate(h.time)}</time>
            <span>({h.actorName}{h.departmentName ? ` · ${h.departmentName}` : ''})</span>
            {h.note && <p className="cx-timeline__note">{h.note}</p>}
          </li>
        ))}
      </ol>
    </aside>
  )
}
