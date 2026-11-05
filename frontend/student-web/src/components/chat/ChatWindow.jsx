import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiInfo, FiPaperclip, FiSend, FiX, FiFileText, FiMoreHorizontal, FiCheck } from 'react-icons/fi'
import { CHAT_ALLOWED_EXT, MAX_FILE_MB, MAX_FILES } from '../../api/chatApi'
import { fileExt, fmtSize } from '../../utils/file'
import Avatar from './Avatar'
import StatusPill from './StatusPill'
import { clock, isImageFile, needSeparator, separatorLabel } from './chatUtils'

function Attachment({ file, onImage }) {
  if (isImageFile(file)) {
    return (
      <button type="button" className="cx-img" onClick={() => onImage(file)} title={file.fileName}>
        <img src={file.fileUrl} alt={file.fileName} loading="lazy" />
      </button>
    )
  }
  return (
    <a className="cx-file" href={file.fileUrl} target="_blank" rel="noopener noreferrer" download={file.fileName}>
      <FiFileText />
      <span><b>{file.fileName}</b><small>{fmtSize(file.fileSize)}</small></span>
    </a>
  )
}

function Bubble({ m, mine, onMenu, onImage }) {
  if (m.type === 'SYSTEM') return <div className="cx-system"><span>{m.content}</span></div>

  const menu = (e) => { if (mine && !m.recalled) { e.preventDefault(); onMenu(e.clientX, e.clientY, m) } }
  return (
    <div className={`cx-msg ${mine ? 'cx-msg--mine' : ''}`}>
      {!mine && <Avatar name={m.senderName} size={34} />}
      <div className="cx-msg__col">
        <div className="cx-msg__line">
          {mine && !m.recalled && (
            <button type="button" className="cx-msg__more" aria-label="Tùy chọn tin nhắn"
              onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onMenu(r.left, r.bottom + 4, m) }}>
              <FiMoreHorizontal />
            </button>
          )}
          <div className={`cx-bubble ${m.recalled ? 'is-recalled' : ''}`} onContextMenu={menu}>
            {m.recalled ? 'Tin nhắn đã được thu hồi' : (
              <>
                {m.content && <p>{m.content}</p>}
                {m.attachments?.map((f) => <Attachment key={f.fileId} file={f} onImage={onImage} />)}
              </>
            )}
          </div>
        </div>
        <time className="cx-msg__time">{clock(m.sendAt)}{mine && !m.recalled && <FiCheck />}</time>
      </div>
    </div>
  )
}

function Composer({ detail, onSend }) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [sending, setSending] = useState(false)
  const inputRef = useRef(null)
  const areaRef = useRef(null)

  const pick = (e) => {
    const next = [...files]
    for (const f of e.target.files) {
      if (!CHAT_ALLOWED_EXT.includes(fileExt(f.name))) { toast.error('Định dạng tệp không được hỗ trợ'); continue }
      if (f.size > MAX_FILE_MB * 1024 * 1024) { toast.error('Tệp vượt quá dung lượng cho phép'); continue }
      if (next.length >= MAX_FILES) { toast.error(`Tối đa ${MAX_FILES} tệp mỗi tin nhắn`); break }
      next.push(f)
    }
    setFiles(next)
    e.target.value = ''
  }

  const canSubmit = (text.trim() || files.length) && !sending
  const submit = async () => {
    if (!canSubmit) return
    setSending(true)
    try {
      await onSend(text.trim(), files)
      setText('')
      setFiles([])
      areaRef.current?.focus()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSending(false)
    }
  }

  const status = detail.status
  if (!detail.permissions.canSend) {
    const note = detail.access === 'INVITED_PENDING' && status === 'ACCEPTED'
      ? 'Đơn vị bạn được mời hỗ trợ – hãy bấm "Tiếp nhận" ở cột thông tin để tham gia nhắn tin.'
      : {
      PENDING: 'Yêu cầu đang chờ tiếp nhận – chưa thể nhắn tin.',
      REJECTED: 'Yêu cầu đã bị từ chối tiếp nhận.',
      CLOSED: 'Trao đổi đã được đóng. Bạn chỉ có thể xem lại nội dung.',
    }[status] || 'Yêu cầu không còn trong trạng thái trao đổi.'
    return <div className="cx-locked">{note}</div>
  }

  return (
    <div className="cx-composer">
      {files.length > 0 && (
        <div className="cx-chips">
          {files.map((f, i) => (
            <span key={`${f.name}-${i}`} className="cx-chip">
              <FiFileText /> {f.name} <small>{fmtSize(f.size)}</small>
              <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Gỡ tệp"><FiX /></button>
            </span>
          ))}
        </div>
      )}
      <div className="cx-composer__bar">
        <input ref={inputRef} type="file" multiple hidden onChange={pick}
          accept={CHAT_ALLOWED_EXT.map((e) => `.${e}`).join(',')} />
        <button type="button" className="cx-icobtn cx-icobtn--lg" onClick={() => inputRef.current?.click()} title="Đính kèm tệp" aria-label="Đính kèm tệp"><FiPaperclip /></button>
        <textarea ref={areaRef} rows={1} value={text} maxLength={255} placeholder="Nhập tin nhắn..."
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } }} />
        <button type="button" className="cx-send" onClick={submit} disabled={!canSubmit} aria-label="Gửi"><FiSend /></button>
      </div>
    </div>
  )
}

export default function ChatWindow({ detail, messages, myId, isStaff, loading, error, onSend, onRecall, onBack, onToggleInfo }) {
  const scroller = useRef(null)
  const stick = useRef(true)
  const [menu, setMenu] = useState(null)
  const [lightbox, setLightbox] = useState(null)

  // Tự cuộn xuống cuối khi có tin mới (nếu đang ở gần cuối hoặc là tin của mình)
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const last = messages[messages.length - 1]
    if (stick.current || last?.senderId === myId) el.scrollTop = el.scrollHeight
  }, [messages, myId])
  useEffect(() => { stick.current = true }, [detail?.requestId])

  useEffect(() => {
    if (!menu) return undefined
    const close = () => setMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('keydown', close)
    window.addEventListener('resize', close)
    return () => { window.removeEventListener('click', close); window.removeEventListener('keydown', close); window.removeEventListener('resize', close) }
  }, [menu])

  if (!detail) {
    return (
      <section className="cx-chat cx-chat--empty">
        <p>{loading ? 'Đang tải…' : error || 'Chưa chọn đoạn chat nào'}</p>
      </section>
    )
  }

  const name = isStaff ? detail.studentName : (detail.departmentName || 'Đơn vị')
  const sub = isStaff ? `Sinh viên – ${detail.studentId}`
    : (detail.handlerName ? `Phụ trách: ${detail.handlerName}` : 'Đơn vị tiếp nhận')

  return (
    <section className="cx-chat">
      <header className="cx-chat__head">
        <button type="button" className="cx-icobtn cx-back" onClick={onBack} aria-label="Quay lại"><FiArrowLeft /></button>
        <Avatar name={name} size={46} />
        <div className="cx-chat__who">
          <strong>{name}</strong>
          <span>{sub}</span>
        </div>
        <StatusPill status={detail.status} />
        <button type="button" className="cx-icobtn cx-infobtn" onClick={onToggleInfo} aria-label="Thông tin yêu cầu"><FiInfo /></button>
      </header>

      <div className="cx-chat__body" ref={scroller}
        onScroll={(e) => { const t = e.currentTarget; stick.current = t.scrollHeight - t.scrollTop - t.clientHeight < 80 }}>
        {error && <div className="cx-banner cx-banner--err">{error}</div>}
        {messages.map((m, i) => (
          <div key={m.messId}>
            {needSeparator(messages[i - 1], m) && <div className="cx-sep"><span>{separatorLabel(m.sendAt)}</span></div>}
            <Bubble m={m} mine={m.senderId === myId} onMenu={(x, y, msg) => setMenu({ x, y, msg })} onImage={setLightbox} />
          </div>
        ))}
      </div>

      <Composer key={detail.requestId} detail={detail} onSend={onSend} />

      {menu && (
        <div className="cx-ctx" style={{ left: Math.min(menu.x, window.innerWidth - 190), top: Math.min(menu.y, window.innerHeight - 60) }}>
          <button type="button" onClick={() => { onRecall(menu.msg); setMenu(null) }}>Thu hồi tin nhắn</button>
        </div>
      )}
      {lightbox && (
        <div className="cx-overlay cx-overlay--dark" onClick={() => setLightbox(null)}>
          <img className="cx-lightbox" src={lightbox.fileUrl} alt={lightbox.fileName} />
        </div>
      )}
    </section>
  )
}
