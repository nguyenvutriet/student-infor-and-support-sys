import { VALIDITY_LABEL } from '../../../api/staffDocumentApi.js'

/** Huy hiệu tình trạng hiệu lực: Chưa có hiệu lực / Còn hiệu lực / Hết hiệu lực */
export default function ValidityBadge({ validity = 'IN_EFFECT' }) {
    return <span className={`doc-badge doc-badge--${validity.toLowerCase()}`}>{VALIDITY_LABEL[validity] ?? validity}</span>
}