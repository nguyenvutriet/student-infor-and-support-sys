import { FiMapPin } from 'react-icons/fi'
import DepartmentLogo from './DepartmentLogo'

export default function DepartmentCard({ department, onOpen }) {
  const d = department
  return (
    <button type="button" className="sty-dept" onClick={() => onOpen(d)} aria-label={`Xem ${d.name}`}>
      <DepartmentLogo department={d} />
      <span className="sty-dept__body">
        <strong className="sty-dept__name">{d.name}</strong>
        <span className="sty-dept__loc"><FiMapPin size={14} />{d.location || 'Chưa cập nhật vị trí'}</span>
        <span className="sty-dept__stats">
          <span className="doc-badge study-type--exam">{d.examCount} đề thi</span>
          <span className="doc-badge study-type--document">{d.documentCount} tài liệu</span>
        </span>
      </span>
    </button>
  )
}
