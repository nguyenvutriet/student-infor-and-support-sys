import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import ForumModal from './ForumModal'
import ForumAvatar from './ForumAvatar'
import ConfirmDialog from './ConfirmDialog'
import Icon from '../Icon'
import { ACCEPT_DOC, ACCEPT_GIF, ACCEPT_MEDIA, FORUM_FEATURES, FORUM_LIMITS, firstName, pickedKind } from './forumUtils'
import { fmtSize } from '../../../utils/file'
import { MODULE_LABELS } from '../../../config/menus'
import { createForumPost } from '../../../store/action/action'

/**
 * UC7 – Popup "Tạo bài viết" (giống Facebook).
 * Trường bắt buộc: Tiêu đề, Nội dung. Đính kèm (tùy chọn): Ảnh/Video, GIF, Tệp tài liệu.
 * Đã nhập mà bấm đóng/hủy → hộp xác nhận ngay giữa màn hình (không dùng alert của trình duyệt).
 */
export default function PostComposerModal({ user, role, onClose, onPosted }) {
  const dispatch = useDispatch()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [files, setFiles] = useState([]) // [{ file, url? }]
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [progress, setProgress] = useState(0)
  const [confirmClose, setConfirmClose] = useState(false)
  const fileRef = useRef(null)
  const taRef = useRef(null)

  // Giải phóng URL xem trước ảnh khi đóng popup
  const filesRef = useRef(files)
  useEffect(() => { filesRef.current = files }, [files])
  useEffect(() => () => filesRef.current.forEach((f) => f.url && URL.revokeObjectURL(f.url)), [])

  // Textarea tự giãn theo nội dung
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 260)}px`
  }, [content])

  const dirty = title.trim() || content.trim() || files.length > 0
  // Đóng popup: chưa nhập gì → đóng luôn; đã nhập → hỏi xác nhận bằng hộp thoại của giao diện
  const requestClose = () => {
    if (submitting) return
    if (dirty) setConfirmClose(true)
    else onClose()
  }

  // Mở hộp chọn tệp theo loại (Ảnh/Video, GIF, Tài liệu)
  const pick = (accept) => {
    if (!fileRef.current) return
    fileRef.current.accept = accept
    fileRef.current.click()
  }

  const addFiles = (list) => {
    const next = [...files]
    let total = next.reduce((sum, f) => sum + f.file.size, 0)
    for (const f of Array.from(list)) {
      const kind = pickedKind(f)
      if (!kind) {
        toast.error(`"${f.name}" có định dạng không được hỗ trợ`)
        continue
      }
      if (next.length >= FORUM_LIMITS.MAX_FILES) {
        toast.error(`Chỉ đính kèm tối đa ${FORUM_LIMITS.MAX_FILES} tệp`)
        break
      }
      const maxMb = kind === 'video' ? FORUM_LIMITS.MAX_VIDEO_MB : FORUM_LIMITS.MAX_FILE_MB
      if (f.size > maxMb * 1024 * 1024) {
        toast.error(`"${f.name}" vượt quá ${maxMb}MB`)
        continue
      }
      if (total + f.size > FORUM_LIMITS.MAX_TOTAL_MB * 1024 * 1024) {
        toast.error(`Tổng dung lượng đính kèm không được vượt quá ${FORUM_LIMITS.MAX_TOTAL_MB}MB`)
        break
      }
      total += f.size
      next.push({ file: f, kind, url: kind === 'file' ? null : URL.createObjectURL(f) })
    }
    setFiles(next)
    if (fileRef.current) fileRef.current.value = ''
  }

  const removeFile = (i) => {
    setFiles((cur) => {
      if (cur[i].url) URL.revokeObjectURL(cur[i].url)
      return cur.filter((_, idx) => idx !== i)
    })
  }

  const submit = async () => {
    const e = {}
    if (!title.trim()) e.title = 'Vui lòng nhập đầy đủ thông tin'
    if (!content.trim()) e.content = 'Vui lòng nhập đầy đủ thông tin'
    setErrors(e)
    setSubmitError('')
    if (Object.keys(e).length) return

    setSubmitting(true)
    setProgress(0)
    const res = await dispatch(createForumPost(
      { title: title.trim(), content: content.trim(), files: files.map((f) => f.file), onProgress: setProgress },
      toast,
    ))
    setSubmitting(false)
    if (res.ok) { onPosted?.(); onClose() }
    // UC7 – 6.2: báo lỗi và GIỮ NGUYÊN nội dung đã nhập
    else setSubmitError(res.message)
  }

  const ready = title.trim() && content.trim()

  return (
    <ForumModal title="Tạo bài viết" onClose={requestClose} width={560} closeOnBackdrop={false}>
      <div className="fm-composer">
        <div className="fm-composer__me">
          <ForumAvatar name={user?.fullName} src={user?.avatar} size={42} />
          <div>
            <strong>{user?.fullName}</strong>
            <span className="fm-composer__pill">{MODULE_LABELS[role]}</span>
          </div>
        </div>

        <input
          className={`fm-composer__title ${errors.title ? 'fm-invalid' : ''}`}
          placeholder="Tiêu đề bài viết *"
          maxLength={FORUM_LIMITS.TITLE_MAX}
          value={title}
          autoFocus
          onChange={(e) => { setTitle(e.target.value); setErrors((x) => ({ ...x, title: '' })) }}
        />
        {errors.title && <div className="fm-error">{errors.title}</div>}

        <textarea
          ref={taRef}
          className={`fm-composer__content ${errors.content ? 'fm-invalid' : ''}`}
          rows={4}
          placeholder={`${firstName(user?.fullName)} ơi, bạn đang nghĩ gì thế? *`}
          maxLength={FORUM_LIMITS.CONTENT_MAX}
          value={content}
          onChange={(e) => { setContent(e.target.value); setErrors((x) => ({ ...x, content: '' })) }}
        />
        {errors.content && <div className="fm-error">{errors.content}</div>}

        {FORUM_FEATURES.UPLOAD_ATTACHMENTS && files.length > 0 && (
          <div className="fm-previews">
            {files.map((f, i) => (
              <div key={i} className={`fm-preview ${f.kind === 'file' ? 'fm-preview--file' : ''}`}>
                {f.kind === 'image' && <img src={f.url} alt={f.file.name} />}
                {f.kind === 'video' && (
                  <>
                    <video src={f.url} muted preload="metadata" />
                    <span className="fm-preview__play" aria-hidden="true">▶</span>
                  </>
                )}
                {f.kind === 'file' && (
                  <>
                    <Icon name="file" size={26} />
                    <span className="fm-preview__name">{f.file.name}</span>
                    <span className="fm-preview__size">{fmtSize(f.file.size)}</span>
                  </>
                )}
                {submitting ? null : (
                  <button type="button" className="fm-preview__x" onClick={() => removeFile(i)} aria-label="Gỡ tệp">
                    <Icon name="x" size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {FORUM_FEATURES.UPLOAD_ATTACHMENTS && (
          <div className="fm-addbar">
            <span>Thêm vào bài viết của bạn</span>
            <div className="fm-addbar__icons">
              <button type="button" title="Ảnh/video" aria-label="Ảnh/video" className="fm-addbar__btn fm-addbar__btn--img" disabled={submitting} onClick={() => pick(ACCEPT_MEDIA)}>
                <Icon name="image" size={24} />
              </button>
              <button type="button" title="Ảnh GIF" aria-label="Ảnh GIF" className="fm-addbar__btn fm-addbar__btn--gif" disabled={submitting} onClick={() => pick(ACCEPT_GIF)}>
                <span className="fm-gifbadge">GIF</span>
              </button>
              <button type="button" title="Tệp đính kèm" aria-label="Tệp đính kèm" className="fm-addbar__btn fm-addbar__btn--file" disabled={submitting} onClick={() => pick(ACCEPT_DOC)}>
                <Icon name="paperclip" size={24} />
              </button>
            </div>
            <input ref={fileRef} type="file" hidden multiple onChange={(e) => addFiles(e.target.files)} />
          </div>
        )}

        {submitError && <div className="fm-error fm-error--box">{submitError}</div>}

        <button type="button" className={`fm-submit ${ready ? '' : 'fm-submit--idle'}`} disabled={submitting} onClick={submit}>
          {submitting ? (files.length && progress > 0 && progress < 100 ? `Đang tải lên… ${progress}%` : 'Đang đăng…') : 'Đăng'}
        </button>
      </div>

      {confirmClose && (
        <ConfirmDialog
          title="Bỏ bài viết?"
          message="Nếu thoát bây giờ, nội dung bạn đã soạn sẽ không được lưu."
          confirmText="Bỏ bài viết"
          cancelText="Tiếp tục chỉnh sửa"
          danger
          onCancel={() => setConfirmClose(false)}
          onConfirm={() => { setConfirmClose(false); onClose() }}
        />
      )}
    </ForumModal>
  )
}
