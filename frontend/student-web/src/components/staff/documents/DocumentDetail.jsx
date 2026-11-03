import { useEffect, useState } from 'react'
import Card from '../../commom/Card'
import FileList from '../../commom/FileList'
import ValidityBadge from './ValidityBadge'
import { getDocument, setStatus, STATUS_LABEL, RELATION_DISPLAY_LABEL, fmtDate } from '../../../api/staffDocumentApi.js'
import Icon from "../../commom/Icon.jsx";

/** Xem chi tiết văn bản (nhân viên): xem, tải xuống, Cập nhật, Ẩn/Hiện */
export default function DocumentDetail({ id, department, onBack, onEdit, onOpen, notify }) {
    const [doc, setDoc] = useState(null)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        let alive = true
        getDocument(id)
            .then((d) => alive && setDoc(d))
            .catch(() => {
                if (!alive) return
                notify('Văn bản không tồn tại', 'error') // văn bản không còn tồn tại → quay lại danh sách
                onBack()
            })
        return () => { alive = false }
    }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

    if (!doc) return <Card><div className="doc-state">Đang tải...</div></Card>

    // Nhân viên chỉ xem và thao tác văn bản thuộc đơn vị phụ trách của mình (backend đã kiểm tra)
    const canManage = true
    const hidden = doc.status === 'HIDDEN'
    // văn bản đã bị thay thế bởi văn bản khác → hết hiệu lực
    const replacedBy = doc.relations.find((r) => r.type === 'REPLACED_BY')

    const toggle = async () => {
        setBusy(true)
        try {
            const next = hidden ? 'VISIBLE' : 'HIDDEN'
            setDoc(await setStatus(doc.id, next))
            notify(next === 'HIDDEN' ? 'Đã ẩn văn bản' : 'Đã hiện văn bản')
        } catch {
            notify('Không thể cập nhật trạng thái hiển thị, vui lòng thử lại', 'error')
        } finally {
            setBusy(false)
        }
    }

    return (
        <Card>
            <div className="doc-top-nav">
                <button type="button" className="doc-back-btn" onClick={onBack}>
                    <Icon name="arrowLeft" size={16} />
                    <span>Quay lại</span>
                </button>
            </div>

            <h2 style={{ fontSize: 20, color: 'var(--primary-dark)' }}>{doc.title}</h2>

            <dl className="doc-meta">
                <div><dt>Số hiệu</dt><dd>{doc.docNumber}</dd></div>
                <div><dt>Ngày đăng</dt><dd>{fmtDate(doc.createAt)}</dd></div>
                <div><dt>Cập nhật lần cuối</dt><dd>{fmtDate(doc.updateAt)}</dd></div>
                <div><dt>Đơn vị phụ trách</dt><dd>{doc.department}</dd></div>
                <div><dt>Tình trạng hiệu lực</dt><dd><ValidityBadge validity={doc.validity} /></dd></div>
                <div><dt>Trạng thái hiển thị</dt><dd><span className={`doc-badge doc-badge--${doc.status.toLowerCase()}`}>{STATUS_LABEL[doc.status]}</span></dd></div>
            </dl>

            {replacedBy && doc.validity === 'EXPIRED' && (
                <div className="doc-note doc-note--danger">
                    Văn bản đã hết hiệu lực vì bị thay thế bởi{' '}
                    <button type="button" className="doc-link" onClick={() => onOpen(replacedBy.docId)}>{replacedBy.docNumber} – {replacedBy.title}</button>.
                </div>
            )}

            {hidden && <div className="doc-note">Văn bản đang ẩn – sinh viên không nhìn thấy văn bản này.</div>}

            <p className="doc-content">{doc.content}</p>

            <section className="doc-section">
                <h3>Tập tin đính kèm</h3>
                <FileList files={doc.attachments} />
            </section>

            {doc.relations.length > 0 && (
                <section className="doc-section">
                    <h3>Văn bản liên quan</h3>
                    {doc.relations.map((r) => (
                        <div className="doc-file" key={`${r.docId}-${r.type}`}>
                            <span className="doc-badge doc-badge--hidden">{RELATION_DISPLAY_LABEL[r.type] ?? r.type}</span>
                            <button type="button" className="doc-link doc-file__name" onClick={() => onOpen(r.docId)}>{r.docNumber} – {r.title}</button>
                        </div>
                    ))}
                </section>
            )}

            <div className="doc-actions">
                {canManage && (
                    <>
                        <button type="button" className="ute-btn" onClick={() => onEdit(doc.id)}>Cập nhật</button>
                        <button
                            type="button"
                            className={`ute-btn ute-btn--outline doc-visibility-btn ${
                                hidden ? 'doc-visibility-btn--show' : 'doc-visibility-btn--hide'
                            }`}
                            disabled={busy}
                            onClick={toggle}
                        >
                            <Icon name={hidden ? "eye" : "eye-off"} size={16} />
                            {hidden ? ' Hiện văn bản' : ' Ẩn văn bản'}
                        </button>
                    </>
                )}
            </div>
        </Card>
    )
}
