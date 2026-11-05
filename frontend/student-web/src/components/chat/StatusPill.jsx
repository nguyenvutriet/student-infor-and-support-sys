import { STATUS_LABEL } from '../../api/chatApi'

export default function StatusPill({ status, small }) {
  return (
    <span className={`cx-pill cx-pill--${String(status).toLowerCase()} ${small ? 'cx-pill--sm' : ''}`}>
      <i /> {STATUS_LABEL[status] || status}
    </span>
  )
}
