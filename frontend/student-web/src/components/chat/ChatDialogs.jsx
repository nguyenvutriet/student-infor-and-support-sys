import { useEffect, useState } from 'react'
import { FiX } from 'react-icons/fi'

/** Khung hộp thoại dùng chung: Esc / bấm nền để hủy. */
function Modal({ title, onClose, children, footer, busy, width = 460 }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  return (
    <div className="cx-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="cx-modal" style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title}>
        <div className="cx-modal__head">
          <h3>{title}</h3>
          <button type="button" className="cx-icobtn" onClick={onClose} disabled={busy} aria-label="Đóng"><FiX /></button>
        </div>
        <div className="cx-modal__body">{children}</div>
        <div className="cx-modal__foot">{footer}</div>
      </div>
    </div>
  )
}

/** Gọi onSubmit(); lỗi hiện trong hộp thoại, thành công thì tự đóng (onDone). */
function useSubmit(onSubmit) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (...args) => {
    setBusy(true)
    setError('')
    try { await onSubmit(...args) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return { busy, error, setError, submit }
}

const Footer = ({ onClose, busy, okText, okDisabled, danger, onOk }) => (
  <>
    <button type="button" className="cx-btn cx-btn--light" onClick={onClose} disabled={busy}>Hủy</button>
    <button type="button" className={`cx-btn ${danger ? 'cx-btn--danger' : ''}`} onClick={onOk} disabled={busy || okDisabled}>
      {busy ? 'Đang xử lý…' : okText}
    </button>
  </>
)

export function ConfirmDialog({ title, message, okText = 'Xác nhận', danger, onConfirm, onClose }) {
  const { busy, error, submit } = useSubmit(onConfirm)
  return (
    <Modal title={title} onClose={onClose} busy={busy}
      footer={<Footer onClose={onClose} busy={busy} okText={okText} danger={danger} onOk={() => submit()} />}>
      <p className="cx-text">{message}</p>
      {error && <p className="cx-error">{error}</p>}
    </Modal>
  )
}

export function RejectDialog({ onSubmit, onClose }) {
  const [reason, setReason] = useState('')
  const { busy, error, setError, submit } = useSubmit(onSubmit)
  const ok = () => {
    if (!reason.trim()) return setError('Vui lòng nhập lý do từ chối')
    submit(reason.trim())
  }
  return (
    <Modal title="Từ chối tiếp nhận yêu cầu" onClose={onClose} busy={busy}
      footer={<Footer onClose={onClose} busy={busy} okText="Xác nhận" danger onOk={ok} />}>
      <label className="cx-label">Lý do từ chối <b>*</b> <small>(hiển thị trong lịch sử xử lý)</small></label>
      <textarea className="cx-input" rows={4} maxLength={200} value={reason} autoFocus
        onChange={(e) => { setReason(e.target.value); setError('') }} placeholder="Nhập lý do (tối đa 200 ký tự)…" />
      {error && <p className="cx-error">{error}</p>}
    </Modal>
  )
}

export function ForwardDialog({ departments, currentId, onSubmit, onClose }) {
  const [deptId, setDeptId] = useState('')
  const [note, setNote] = useState('')
  const { busy, error, setError, submit } = useSubmit(onSubmit)
  const ok = () => (deptId ? submit(deptId, note.trim()) : setError('Vui lòng chọn đơn vị nhận'))
  return (
    <Modal title="Chuyển tiếp yêu cầu" onClose={onClose} busy={busy}
      footer={<Footer onClose={onClose} busy={busy} okText="Xác nhận" onOk={ok} />}>
      <label className="cx-label">Đơn vị nhận <b>*</b></label>
      <select className="cx-input" value={deptId} onChange={(e) => { setDeptId(e.target.value); setError('') }}>
        <option value="">-- Chọn đơn vị --</option>
        {departments.filter((d) => d.id !== currentId).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <label className="cx-label">Ghi chú chuyển tiếp <small>(tối đa 200 ký tự, hiển thị trong lịch sử xử lý)</small></label>
      <textarea className="cx-input" rows={3} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
      <p className="cx-hint">Sau khi chuyển tiếp, yêu cầu sẽ chờ đơn vị mới tiếp nhận và bạn không còn phụ trách yêu cầu này.</p>
      {error && <p className="cx-error">{error}</p>}
    </Modal>
  )
}

export function InviteDialog({ departments, currentId, invitedIds, onSubmit, onClose }) {
  const [picked, setPicked] = useState([])
  const [message, setMessage] = useState('')
  const { busy, error, setError, submit } = useSubmit(onSubmit)
  const toggle = (id) => { setError(''); setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])) }
  const ok = () => (picked.length ? submit(picked, message.trim()) : setError('Vui lòng chọn đơn vị cần mời'))
  const options = departments.filter((d) => d.id !== currentId && !invitedIds.includes(d.id))
  return (
    <Modal title="Mời đơn vị hỗ trợ" onClose={onClose} busy={busy}
      footer={<Footer onClose={onClose} busy={busy} okText="Mời" onOk={ok} />}>
      <label className="cx-label">Chọn đơn vị <b>*</b></label>
      <div className="cx-checklist">
        {options.length === 0 && <p className="cx-hint">Không còn đơn vị nào để mời.</p>}
        {options.map((d) => (
          <label key={d.id} className="cx-check">
            <input type="checkbox" checked={picked.includes(d.id)} onChange={() => toggle(d.id)} /> {d.name}
          </label>
        ))}
      </div>
      <label className="cx-label">Lời nhắn <small>(tối đa 200 ký tự)</small></label>
      <textarea className="cx-input" rows={3} maxLength={200} value={message} onChange={(e) => setMessage(e.target.value)} />
      <p className="cx-hint">Đơn vị được mời phải bấm "Tiếp nhận" thì mới nhắn tin được; chỉ xem và nhắn tin, không có quyền chuyển tiếp, mời thêm hay đóng trao đổi.</p>
      {error && <p className="cx-error">{error}</p>}
    </Modal>
  )
}

export function CloseDialog({ onSubmit, onClose }) {
  const [note, setNote] = useState('')
  const { busy, error, submit } = useSubmit(onSubmit)
  return (
    <Modal title="Đóng trao đổi" onClose={onClose} busy={busy}
      footer={<Footer onClose={onClose} busy={busy} okText="Xác nhận" onOk={() => submit(note.trim())} />}>
      <p className="cx-text">Sau khi đóng, <b>không thể nhắn tin, gửi tệp hoặc thu hồi tin nhắn</b> nữa, nhưng vẫn xem lại được nội dung.</p>
      <label className="cx-label">Ghi chú kết quả xử lý <small>(tối đa 200 ký tự, hiển thị trong lịch sử xử lý)</small></label>
      <textarea className="cx-input" rows={3} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <p className="cx-error">{error}</p>}
    </Modal>
  )
}

export function CreateRequestDialog({ departments, onSubmit, onClose }) {
  const [form, setForm] = useState({ departmentId: '', subject: '', description: '' })
  const { busy, error, setError, submit } = useSubmit(onSubmit)
  const set = (k) => (e) => { setError(''); setForm((f) => ({ ...f, [k]: e.target.value })) }
  const ok = () => {
    if (!form.departmentId || !form.subject.trim() || !form.description.trim())
      return setError('Vui lòng nhập đầy đủ thông tin bắt buộc')
    submit({ ...form, subject: form.subject.trim(), description: form.description.trim() })
  }
  return (
    <Modal title="Tạo yêu cầu hỗ trợ" onClose={onClose} busy={busy} width={540}
      footer={<Footer onClose={onClose} busy={busy} okText="Gửi yêu cầu" onOk={ok} />}>
      <label className="cx-label">Đơn vị tiếp nhận <b>*</b></label>
      <select className="cx-input" value={form.departmentId} onChange={set('departmentId')}>
        <option value="">-- Chọn khoa / viện / phòng ban --</option>
        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <label className="cx-label">Tiêu đề <b>*</b></label>
      <input className="cx-input" maxLength={255} value={form.subject} onChange={set('subject')} placeholder="VD: Hỗ trợ đăng ký học phần" />
      <label className="cx-label">Nội dung yêu cầu <b>*</b></label>
      <textarea className="cx-input" rows={5} maxLength={255} value={form.description} onChange={set('description')} placeholder="Mô tả vấn đề của bạn…" />
      {error && <p className="cx-error">{error}</p>}
    </Modal>
  )
}
