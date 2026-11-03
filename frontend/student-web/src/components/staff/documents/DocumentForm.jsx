import { useEffect, useRef, useState } from 'react'
import Card from '../../commom/Card'
import Icon from '../../commom/Icon'
import RelatedPicker from './RelatedPicker'
import { getDocument, createDocument, updateDocument, VALIDITY_LABEL, RELATION_DISPLAY_LABEL, ALLOWED_EXT, MAX_FILE_MB, fmtSize } from '../../../api/staffDocumentApi.js'

const FILE_ERROR = `Tập tin không đúng định dạng hoặc vượt quá dung lượng cho phép (${ALLOWED_EXT.join(', ').toUpperCase()} – tối đa ${MAX_FILE_MB} MB).`

/** Đăng tải văn bản (mode="create") và Cập nhật văn bản (mode="edit") dùng chung một form */
export default function DocumentForm({ mode, id, onDone, onCancel, onBack, onMissing }) {
  const isEdit = mode === 'edit'
  const fileRef = useRef(null)
  const handleBack = onBack || onCancel

  const [loading, setLoading] = useState(isEdit)
  const [docNumber, setDocNumber] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [validity, setValidity] = useState('IN_EFFECT')
  const [kept, setKept] = useState([])          // tập tin cũ còn giữ (khi cập nhật)
  const [files, setFiles] = useState([])        // tập tin mới chọn
  const [relations, setRelations] = useState([])   // quan hệ văn bản này tự khai báo (sửa được)
  const [derived, setDerived] = useState([])         // quan hệ do văn bản khác khai báo (chỉ đọc)
  const [errors, setErrors] = useState({})
  const [fileError, setFileError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // đã bị văn bản khác thay thế (chiều ngược do văn bản kia khai báo) → khóa ở "Hết hiệu lực"
  const replaced = derived.some((r) => r.type === 'REPLACED_BY')

  useEffect(() => {
    if (!isEdit) return
    let alive = true
    getDocument(id)
        .then((d) => {
          if (!alive) return
          setDocNumber(d.docNumber); setTitle(d.title); setContent(d.content); setKept(d.attachments)
          setValidity(d.selectedValidity || d.validity || 'IN_EFFECT')
          setDerived(d.relations.filter((r) => r.incoming))
          setRelations(d.relations.filter((r) => !r.incoming).map((r) => ({ docId: r.docId, docNumber: r.docNumber, title: r.title, type: r.type })))
          setLoading(false)
        })
        .catch(() => alive && onMissing()) // Văn bản không còn tồn tại
    return () => { alive = false }
  }, [id, isEdit]) // eslint-disable-line react-hooks/exhaustive-deps

  const pickFiles = (e) => {
    const ok = []
    let bad = false
    Array.from(e.target.files || []).forEach((f) => {
      const ext = f.name.split('.').pop().toLowerCase()
      if (ALLOWED_EXT.includes(ext) && f.size <= MAX_FILE_MB * 1024 * 1024) ok.push(f)
      else bad = true
    })
    setFiles((prev) => [...prev, ...ok])
    setFileError(bad ? FILE_ERROR : '')
    e.target.value = ''
  }

  const submit = async () => {
    const errs = {}
    if (!docNumber.trim()) errs.docNumber = 'Vui lòng nhập số hiệu'
    if (!title.trim()) errs.title = 'Vui lòng nhập tiêu đề'
    if (!content.trim()) errs.content = 'Vui lòng nhập nội dung'
    setErrors(errs)
    if (Object.keys(errs).length) {
      setFormError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }
    setFormError('')
    setSaving(true)
    try {
      const rel = relations.map(({ docId, type }) => ({ docId, type }))
      const finalValidity = replaced ? 'EXPIRED' : validity
      const saved = isEdit
          ? await updateDocument(id, { docNumber, title, content, validity: finalValidity, keepAttachmentIds: kept.map((a) => a.id), newFiles: files, relations: rel })
          : await createDocument({ docNumber, title, content, validity: finalValidity, newFiles: files, relations: rel })
      onDone(saved.id)
    } catch (err) {
      if (err?.code === 'NOT_FOUND') onMissing()
      else if (err?.code === 'DUPLICATE') {
        setErrors({ docNumber: 'Số hiệu văn bản đã tồn tại' })
        setFormError('Số hiệu văn bản đã tồn tại')
      }
      else setFormError(err?.message || (isEdit ? 'Cập nhật văn bản không thành công, vui lòng thử lại' : 'Đăng tải văn bản không thành công, vui lòng thử lại'))
      setSaving(false)
    }
  }

  if (loading) return <Card><div className="doc-state">Đang tải...</div></Card>

  return (
      <Card>
        <div className="doc-top-nav">
          <button type="button" className="doc-back-btn" onClick={handleBack}>
            <Icon name="arrowLeft" size={16} />
            <span>Quay lại</span>
          </button>
        </div>

        {formError && <div className="doc-alert" role="alert">{formError}</div>}

        <div className="doc-field">
          <label htmlFor="doc-number">Số hiệu <span className="doc-req">*</span></label>
          <input id="doc-number" className={`doc-input ${errors.docNumber ? 'doc-input--error' : ''}`} style={{ maxWidth: 320 }} value={docNumber} maxLength={50} onChange={(e) => setDocNumber(e.target.value)} placeholder="VD: 125/QĐ-ĐHSPKT" />
          {errors.docNumber && <div className="doc-error">{errors.docNumber}</div>}
        </div>

        <div className="doc-field">
          <label htmlFor="doc-title">Tiêu đề <span className="doc-req">*</span></label>
          <input id="doc-title" className={`doc-input ${errors.title ? 'doc-input--error' : ''}`} value={title} maxLength={255} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề văn bản" />
          {errors.title && <div className="doc-error">{errors.title}</div>}
        </div>

        <div className="doc-field">
          <label htmlFor="doc-content">Nội dung <span className="doc-req">*</span></label>
          <textarea id="doc-content" className={`doc-input ${errors.content ? 'doc-input--error' : ''}`} rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nhập nội dung / mô tả văn bản" />
          {errors.content && <div className="doc-error">{errors.content}</div>}
        </div>

        <div className="doc-field">
          <label htmlFor="doc-validity">Tình trạng hiệu lực</label>
          <select id="doc-validity" className="doc-input" style={{ maxWidth: 320 }} value={replaced ? 'EXPIRED' : validity} disabled={replaced} onChange={(e) => setValidity(e.target.value)}>
            {Object.entries(VALIDITY_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          {replaced && <div className="doc-help">Văn bản đã bị thay thế bởi văn bản khác nên tự động hết hiệu lực.</div>}
        </div>

        <div className="doc-field">
          <label>Tập tin đính kèm</label>
          {kept.map((a) => (
              <div className="doc-file" key={a.id}>
                <span className="doc-file__name">{a.name}</span>
                <span className="doc-file__size">{fmtSize(a.size)}</span>
                <button type="button" className="ute-iconbtn doc-x" aria-label="Gỡ tập tin" onClick={() => setKept(kept.filter((x) => x.id !== a.id))}><Icon name="x" size={16} /></button>
              </div>
          ))}
          {files.map((f, i) => (
              <div className="doc-file" key={`${f.name}-${i}`}>
                <span className="doc-file__name">{f.name}</span>
                <span className="doc-file__size">{fmtSize(f.size)}</span>
                <button type="button" className="ute-iconbtn doc-x" aria-label="Bỏ tập tin" onClick={() => setFiles(files.filter((_, j) => j !== i))}><Icon name="x" size={16} /></button>
              </div>
          ))}
          <input ref={fileRef} type="file" multiple hidden accept={ALLOWED_EXT.map((e) => `.${e}`).join(',')} onChange={pickFiles} />
          <button
              type="button"
              className="ute-btn ute-btn--outline doc-pick-btn"
              onClick={() => fileRef.current?.click()}
          >
            <Icon name="upload" size={16} />
            Chọn tập tin
          </button>
          {fileError ? <div className="doc-error">{fileError}</div> : <div className="doc-help">Định dạng: {ALLOWED_EXT.join(', ').toUpperCase()} – tối đa {MAX_FILE_MB} MB mỗi tập tin.</div>}
        </div>

        <div className="doc-field">
          <label>Văn bản liên quan <span className="doc-help" style={{ fontWeight: 400 }}>(không bắt buộc)</span></label>
          <div className="doc-help" style={{ marginBottom: 6 }}>Chọn văn bản đã đăng và loại quan hệ. Liên kết là hai chiều (văn bản kia cũng tự hiển thị liên kết ngược lại); văn bản bị thay thế sẽ tự động hết hiệu lực.</div>
          <RelatedPicker currentId={isEdit ? id : null} excludeIds={derived.map((r) => r.docId)} value={relations} onChange={setRelations} />
          {derived.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div className="doc-help" style={{ marginBottom: 6 }}>Liên kết do văn bản khác khai báo (chỉnh ở văn bản đó):</div>
                {derived.map((r) => (
                    <div className="doc-file" key={`${r.docId}-${r.type}`}>
                      <span className="doc-badge doc-badge--hidden">{RELATION_DISPLAY_LABEL[r.type] ?? r.type}</span>
                      <span className="doc-file__name"><b>{r.docNumber}</b> – {r.title}</span>
                    </div>
                ))}
              </div>
          )}
        </div>

        <div className="doc-actions">
          <button type="button" className="ute-btn" disabled={saving} onClick={submit}>
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu' : 'Đăng tải'}
          </button>
        </div>
      </Card>
  )
}
