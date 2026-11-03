import { VALIDITY_LABEL } from '../../../api/staffDocumentApi.js'

export default function ValidityBadge({ validity = 'IN_EFFECT' }) {
    return <span className={`doc-badge doc-badge--${validity.toLowerCase()}`}>{VALIDITY_LABEL[validity] ?? validity}</span>
}