import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '../../commom/Card'
import FileList from '../../commom/FileList'
import Icon from '../../commom/Icon'
import ValidityBadge from '../../staff/documents/ValidityBadge'
import { fmtDate, getVisibleDocument, RELATION_DISPLAY_LABEL } from '../../../api/studentDocumentApi'

/** Sinh viên xem chi tiết văn bản: thông tin, nội dung, tập tin đính kèm (xem trước / tải xuống), văn bản liên quan. */
export default function StudentDocumentDetail() {
  const { docId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ id: null, status: 'loading', doc: null, message: '' })

  useEffect(() => {
    let alive = true
    getVisibleDocument(docId)
      .then((doc) => alive && setState({ id: docId, status: 'ok', doc, message: '' }))
      .catch((e) => alive && setState({
        id: docId, status: e.status === 404 ? 'missing' : 'error', doc: null, message: e.message,
      }))
    return () => { alive = false }
  }, [docId])

  const back = () => navigate('/student/documents')
  const loading = state.id !== docId

  const BackButton = (
    <div className="doc-top-nav">
      <button type="button" className="doc-back-btn" onClick={back}>
        <Icon name="arrowLeft" size={16} />
        <span>Quay lại danh sách</span>
      </button>
    </div>
  )

  if (loading) return <Card>{BackButton}<div className="doc-state">Đang tải...</div></Card>
  if (state.status !== 'ok') {
    return (
      <Card>
        {BackButton}
        <div className="doc-state">
          <strong>{state.status === 'missing' ? 'Văn bản không tồn tại hoặc đã bị ẩn' : 'Không thể tải văn bản'}</strong>
          {state.status === 'error' && <p>{state.message}</p>}
        </div>
      </Card>
    )
  }

  const doc = state.doc
  const replacedBy = doc.relations.find((r) => r.type === 'REPLACED_BY')

  return (
    <Card>
      {BackButton}
      <h2 style={{ fontSize: 20, color: 'var(--primary-dark)' }}>{doc.title}</h2>

      <dl className="doc-meta">
        <div><dt>Số hiệu</dt><dd>{doc.docNumber}</dd></div>
        <div><dt>Ngày đăng</dt><dd>{fmtDate(doc.createAt)}</dd></div>
        <div><dt>Cập nhật lần cuối</dt><dd>{fmtDate(doc.updateAt)}</dd></div>
        <div><dt>Đơn vị ban hành</dt><dd>{doc.department}</dd></div>
        <div><dt>Tình trạng hiệu lực</dt><dd><ValidityBadge validity={doc.validity} /></dd></div>
      </dl>

      {replacedBy && doc.validity === 'EXPIRED' && (
        <div className="doc-note doc-note--danger">
          Văn bản đã hết hiệu lực vì bị thay thế bởi{' '}
          <button type="button" className="doc-link" onClick={() => navigate(`/student/documents/${replacedBy.docId}`)}>
            {replacedBy.docNumber} – {replacedBy.title}
          </button>.
        </div>
      )}

      {doc.content && <p className="doc-content">{doc.content}</p>}

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
              <button type="button" className="doc-link doc-file__name" onClick={() => navigate(`/student/documents/${r.docId}`)}>
                {r.docNumber} – {r.title}
              </button>
            </div>
          ))}
        </section>
      )}
    </Card>
  )
}
