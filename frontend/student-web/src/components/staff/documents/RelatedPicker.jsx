import { useEffect, useState } from 'react'
import Icon from '../../commom/Icon'
import { listDocuments, RELATION_LABEL, RELATION_EFFECT } from '../../../api/staffDocumentApi.js'

/**
 * Chọn "văn bản liên quan" (không bắt buộc): tìm theo số hiệu hoặc tiêu đề trong văn bản của đơn vị,
 * có thể chọn nhiều văn bản, mỗi văn bản chọn loại quan hệ (thay thế cho / sửa đổi, bổ sung / bổ sung...).
 * Quan hệ là hai chiều; văn bản bị thay thế sẽ tự động hết hiệu lực.
 * value: [{ docId, docNumber, title, type }]
 */
export default function RelatedPicker({ currentId, excludeIds = [], value, onChange }) {
    const [docs, setDocs] = useState([])
    const [q, setQ] = useState('')

    useEffect(() => { listDocuments().then(setDocs).catch(() => setDocs([])) }, [])

    const chosen = new Set([...value.map((v) => v.docId), ...excludeIds])
    const kw = q.trim().toLowerCase()
    const results = kw
        ? docs.filter((d) => d.id !== currentId && !chosen.has(d.id) && (d.title?.toLowerCase().includes(kw) || d.docNumber?.toLowerCase().includes(kw))).slice(0, 5)
        : []

    const add = (d) => { onChange([...value, { docId: d.id, docNumber: d.docNumber, title: d.title, type: 'REPLACES' }]); setQ('') }
    const setType = (docId, type) => onChange(value.map((v) => (v.docId === docId ? { ...v, type } : v)))
    const remove = (docId) => onChange(value.filter((v) => v.docId !== docId))

    return (
        <div>
            <label className="ute-field" style={{ maxWidth: '100%' }}>
                <Icon name="search" size={18} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm văn bản theo số hiệu hoặc tiêu đề để liên kết" />
            </label>

            {kw && (
                <div className="doc-pick__results">
                    {results.length === 0 && <div className="doc-pick__empty">Không tìm thấy văn bản phù hợp</div>}
                    {results.map((d) => (
                        <button type="button" className="doc-pick__item" key={d.id} onClick={() => add(d)}>
                            <span><b>{d.docNumber}</b> – {d.title}</span><span className="doc-link">+ Thêm</span>
                        </button>
                    ))}
                </div>
            )}

            <div style={{ marginTop: 10 }}>
                {value.map((v) => (
                    <div key={v.docId}>
                        <div className="doc-file">
                            <span className="doc-file__name"><b>{v.docNumber}</b> – {v.title}</span>
                            <select className="doc-input doc-select" value={v.type} onChange={(e) => setType(v.docId, e.target.value)}>
                                {Object.entries(RELATION_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                            </select>
                            <button type="button" className="ute-iconbtn doc-x" onClick={() => remove(v.docId)} aria-label="Gỡ liên kết"><Icon name="x" size={16} /></button>
                        </div>
                        {RELATION_EFFECT[v.type] && <div className="doc-relation-effect">⚠ {RELATION_EFFECT[v.type]}</div>}
                    </div>
                ))}
            </div>
        </div>
    )
}
