import { useEffect, useRef, useState } from 'react'
import Card from '../../commom/Card'
import Icon from '../../commom/Icon'
import {
    getStudyResource, createStudyResource, updateStudyResource,
    TYPE_LABEL, ALLOWED_EXT, MAX_FILE_MB, MAX_FILES, MAX_TEXT, fmtSize,
} from '../../../api/staffStudyApi.js'

const FILE_ERROR = `Tập tin không đúng định dạng hoặc vượt quá dung lượng cho phép (${ALLOWED_EXT.join(', ').toUpperCase()} – tối đa ${MAX_FILE_MB} MB).`

export default function StudyForm({ mode, id, onDone, onCancel, onMissing }) {
    const isEdit = mode === 'edit'
    const fileRef = useRef(null)

    const [loading, setLoading] = useState(isEdit)
    const [title, setTitle] = useState('')
    const [resourceType, setResourceType] = useState('DOCUMENT')
    const [description, setDescription] = useState('')
    const [kept, setKept] = useState([])      // tập tin cũ còn giữ (khi cập nhật)
    const [files, setFiles] = useState([])    // tập tin mới chọn
    const [errors, setErrors] = useState({})
    const [fileError, setFileError] = useState('')
    const [formError, setFormError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isEdit) return
        let alive = true
        getStudyResource(id)
            .then((r) => {
                if (!alive) return
                setTitle(r.title); setResourceType(r.resourceType || 'DOCUMENT'); setDescription(r.description); setKept(r.files)
                setLoading(false)
            })
            .catch(() => alive && onMissing())
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
        if (!title.trim()) errs.title = 'Vui lòng nhập tiêu đề'
        const total = kept.length + files.length
        if (total === 0) errs.files = 'Vui lòng chọn ít nhất một tập tin'
        else if (total > MAX_FILES) errs.files = `Mỗi tài liệu tối đa ${MAX_FILES} tập tin`
        setErrors(errs)
        if (Object.keys(errs).length) {
            setFormError('Vui lòng kiểm tra lại các thông tin được đánh dấu')
            return
        }
        setFormError('')
        setSaving(true)
        try {
            const payload = { title, description, resourceType }
            const saved = isEdit
                ? await updateStudyResource(id, { ...payload, keepFileIds: kept.map((f) => f.id), newFiles: files })
                : await createStudyResource({ ...payload, newFiles: files })
            onDone(saved.id)
        } catch (err) {
            if (err?.code === 'NOT_FOUND') onMissing()
            else setFormError(err?.status === 400 && err.message
                ? err.message
                : isEdit ? 'Cập nhật tài liệu không thành công, vui lòng thử lại' : 'Đăng tải tài liệu không thành công, vui lòng thử lại')
            setSaving(false)
        }
    }

    if (loading) return <Card><div className="doc-state">Đang tải...</div></Card>

    return (
        <Card>
            {formError && <div className="doc-alert" role="alert">{formError}</div>}

            <div className="doc-field">
                <label htmlFor="study-title">Tiêu đề <span className="doc-req">*</span></label>
                <input id="study-title" className={`doc-input ${errors.title ? 'doc-input--error' : ''}`} value={title} maxLength={MAX_TEXT} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Đề thi cuối kỳ Giải tích 1 – HK1 2025" />
                {errors.title && <div className="doc-error">{errors.title}</div>}
            </div>

            <div className="doc-field">
                <label htmlFor="study-type">Loại <span className="doc-req">*</span></label>
                <select id="study-type" className="doc-input" style={{ maxWidth: 320 }} value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                    {Object.entries(TYPE_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </select>
            </div>

            <div className="doc-field">
                <label htmlFor="study-desc">Mô tả <span className="doc-help" style={{ fontWeight: 400 }}>(không bắt buộc)</span></label>
                <textarea id="study-desc" className="doc-input" rows={5} value={description} maxLength={MAX_TEXT} onChange={(e) => setDescription(e.target.value)} placeholder="Môn học, học kỳ, nội dung chính của tài liệu..." />
                <div className="study-count">{description.length}/{MAX_TEXT}</div>
            </div>

            <div className="doc-field">
                <label>Tập tin <span className="doc-req">*</span></label>
                {kept.map((f) => (
                    <div className="doc-file" key={f.id}>
                        <span className="doc-file__name">{f.name}</span>
                        <span className="doc-file__size">{fmtSize(f.size)}</span>
                        <button type="button" className="ute-iconbtn doc-x" aria-label="Gỡ tập tin" onClick={() => setKept(kept.filter((x) => x.id !== f.id))}><Icon name="x" size={16} /></button>
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
                <button type="button" className="ute-btn ute-btn--outline doc-pick-btn" onClick={() => fileRef.current?.click()}>
                    <Icon name="upload" size={16} />
                    Chọn tập tin
                </button>
                {errors.files && <div className="doc-error">{errors.files}</div>}
                {fileError ? <div className="doc-error">{fileError}</div> : <div className="doc-help">Định dạng: {ALLOWED_EXT.join(', ').toUpperCase()} – tối đa {MAX_FILE_MB} MB mỗi tập tin, tối đa {MAX_FILES} tập tin.</div>}
            </div>

            <div className="doc-actions">
                <button type="button" className="ute-btn" disabled={saving} onClick={submit}>{saving ? 'Đang lưu...' : isEdit ? 'Lưu' : 'Đăng tải'}</button>
                <button type="button" className="ute-btn ute-btn--light" disabled={saving} onClick={onCancel}>Hủy</button>
            </div>
        </Card>
    )
}