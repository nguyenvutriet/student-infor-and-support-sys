import { useNavigate } from 'react-router-dom'
import { TYPE_LABEL, fmtDate, resourcePath, yearOf } from '../../../utils/studyUtils'
import { downloadFromCard } from './studyHelpers'

export default function ResourceCard({ resource, showNew = false, showDepartment = true }) {
  const navigate = useNavigate()
  const r = resource

  return (
    <article className="sty-res">
      {(showNew || r.isNew) && <span className="sty-new">Mới</span>}
      <h3 className="sty-res__title" title={r.title}>{r.title}</h3>
      <div className="sty-tags">
        {showDepartment && r.departmentName && <span className="sty-tag">{r.departmentName}</span>}
        {r.createAt && <span className="sty-tag">{yearOf(r.createAt)}</span>}
        {r.resourceType && (
          <span className={`sty-tag sty-tag--${r.resourceType.toLowerCase()}`}>{TYPE_LABEL[r.resourceType] ?? r.resourceType}</span>
        )}
      </div>
      <p className="sty-res__desc">{r.description || 'Không có mô tả.'}</p>
      <div className="sty-res__foot">
        <span className="sty-res__date">Đăng {fmtDate(r.createAt)}</span>
        <span className="sty-res__actions">
          <button type="button" className="ute-btn ute-btn--outline" onClick={() => navigate(resourcePath(r.resourceId))}>Xem</button>
          <button type="button" className="ute-btn" onClick={() => downloadFromCard(r, navigate)}>Tải về</button>
        </span>
      </div>
    </article>
  )
}
