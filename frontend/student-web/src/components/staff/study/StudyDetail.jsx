import { useEffect, useState } from 'react'
import Card from '../../commom/Card'
import Icon from '../../commom/Icon'
import FileList from '../../commom/FileList'
import { getStudyResource, setStudyStatus, STATUS_LABEL, TYPE_LABEL, fmtDate } from '../../../api/staffStudyApi.js'

export default function StudyDetail({ id, onBack, onEdit, notify }) {
    const [item, setItem] = useState(null)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        let alive = true
        getStudyResource(id)
            .then((r) => alive && setItem(r))
            .catch(() => {
                if (!alive) return
                notify('Tài liệu không tồn tại', 'error')
                onBack()
            })
        return () => { alive = false }
    }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

    if (!item) return <Card><div className="doc-state">Đang tải...</div></Card>

    const hidden = item.status === 'HIDDEN'

    const toggle = async () => {
        setBusy(true)
        try {
            const next = hidden ? 'VISIBLE' : 'HIDDEN'
            setItem(await setStudyStatus(item.id, next))
            notify(next === 'HIDDEN' ? 'Đã ẩn tài liệu' : 'Đã hiện tài liệu')
        } catch {
            notify('Không thể cập nhật trạng thái hiển thị, vui lòng thử lại', 'error')
        } finally {
            setBusy(false)
        }
    }

    return (
        <Card>
            <h2 style={{ fontSize: 20, color: 'var(--primary-dark)' }}>{item.title}</h2>

            <dl className="doc-meta">
                <div><dt>Loại</dt><dd><span className={`doc-badge study-type--${(item.resourceType || '').toLowerCase()}`}>{TYPE_LABEL[item.resourceType] ?? item.resourceType}</span></dd></div>
                <div><dt>Người đăng</dt><dd>{item.staffName || '—'}</dd></div>
                <div><dt>Ngày đăng</dt><dd>{fmtDate(item.createAt)}</dd></div>
                <div><dt>Trạng thái hiển thị</dt><dd><span className={`doc-badge doc-badge--${item.status.toLowerCase()}`}>{STATUS_LABEL[item.status]}</span></dd></div>
            </dl>

            {hidden && <div className="doc-note">Tài liệu đang ẩn – sinh viên không nhìn thấy tài liệu này.</div>}

            {item.description && <p className="study-desc">{item.description}</p>}

            <section className="doc-section">
                <h3>Tập tin ({item.files.length})</h3>
                <FileList files={item.files} />
            </section>

            <div className="doc-actions">
                <button type="button" className="ute-btn ute-btn--light" onClick={onBack}>← Quay lại</button>
                <button type="button" className="ute-btn" onClick={() => onEdit(item.id)}>Cập nhật</button>
                <button
                    type="button"
                    className={`ute-btn ute-btn--outline doc-visibility-btn ${hidden ? 'doc-visibility-btn--show' : 'doc-visibility-btn--hide'}`}
                    disabled={busy}
                    onClick={toggle}
                >
                    <Icon name={hidden ? 'eye' : 'eye-off'} size={16} />
                    {hidden ? ' Hiện tài liệu' : ' Ẩn tài liệu'}
                </button>
            </div>
        </Card>
    )
}