import { useState } from 'react'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import ForumModal from './ForumModal'
import { REPORT_REASONS } from './forumUtils'
import { reportForumContent } from '../../../store/action/action'

export default function ReportModal({ target, onClose }) {
  const dispatch = useDispatch()
  const [reasonType, setReasonType] = useState(null)
  const [detail, setDetail] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const isPost = target.type === 'POST'

  const submit = async () => {
    const d = detail.trim()
    if ((!reasonType || reasonType === 'OTHER') && !d) {
      setError(reasonType === 'OTHER'
        ? 'Vui lòng nhập nội dung vi phạm'
        : 'Vui lòng chọn loại vi phạm hoặc nhập nội dung vi phạm')
      return
    }
    const label = REPORT_REASONS.find((r) => r.type === reasonType)?.label
    setSending(true)
    const res = await dispatch(reportForumContent({
      targetType: target.type,
      targetId: target.id,
      reasonType,
      reasonDetail: d,
      reason: [label, d].filter(Boolean).join(': '),
    }, toast))
    setSending(false)
    if (res.ok) onClose()
    else setError(res.message)
  }

  return (
    <ForumModal
      title={isPost ? 'Báo cáo bài viết' : 'Báo cáo bình luận'}
      onClose={onClose}
      width={500}
      level={2}
      footer={
        <div className="fm-foot-actions">
          <button type="button" className="fm-btn fm-btn--light" onClick={onClose}>Hủy</button>
          <button type="button" className="fm-btn" disabled={sending} onClick={submit}>
            {sending ? 'Đang gửi…' : 'Gửi'}
          </button>
        </div>
      }
    >
      <div className="fm-report">
        <p className="fm-report__lead">Nội dung này vi phạm điều gì? Báo cáo sẽ được gửi đến quản trị viên để xem xét.</p>
        {target.preview && <blockquote className="fm-report__preview">{target.preview}</blockquote>}

        <div className="fm-report__list" role="radiogroup">
          {REPORT_REASONS.map((r) => (
            <label key={r.type} className={`fm-radio ${reasonType === r.type ? 'fm-radio--on' : ''}`}>
              <input
                type="radio"
                name="reason"
                checked={reasonType === r.type}
                onChange={() => { setReasonType(r.type); setError('') }}
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>

        <textarea
          className="fm-textarea"
          rows={3}
          maxLength={500}
          value={detail}
          placeholder={reasonType === 'OTHER' ? 'Nhập nội dung vi phạm (bắt buộc)…' : 'Mô tả thêm (không bắt buộc)…'}
          onChange={(e) => { setDetail(e.target.value); setError('') }}
        />
        {error && <div className="fm-error">{error}</div>}
      </div>
    </ForumModal>
  )
}
