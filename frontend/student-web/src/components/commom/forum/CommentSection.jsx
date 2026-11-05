import { useState } from 'react'
import ForumAvatar from './ForumAvatar'
import Icon from '../Icon'
import { FORUM_LIMITS, fullDate, timeAgo } from './forumUtils'
import { MODULE_LABELS } from '../../../config/menus'

function CommentItem({ c, isReply, myUserId, canReport, onReply, onReport }) {
  const own = c.author?.userId === myUserId
  return (
    <div className={`fm-cmt ${isReply ? 'fm-cmt--reply' : ''}`}>
      <ForumAvatar name={c.author?.fullName} src={c.author?.avatar} size={isReply ? 28 : 34} />
      <div className="fm-cmt__main">
        <div className="fm-cmt__bubble">
          <strong>
            {c.author?.fullName}
            {c.author?.role && c.author.role !== 'student' && (
              <span className={`fm-role fm-role--${c.author.role}`}>{MODULE_LABELS[c.author.role]}</span>
            )}
          </strong>
          <p>{c.content}</p>
        </div>
        <div className="fm-cmt__meta">
          <time title={fullDate(c.createAt)}>{timeAgo(c.createAt)}</time>
          <button type="button" onClick={() => onReply(c)}>Phản hồi</button>
          {canReport && !own && (
            <button type="button" className="fm-cmt__report" onClick={() => onReport(c)} title="Báo cáo vi phạm">
              <Icon name="flag" size={13} /> Báo cáo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function CommentList({ comments, loading, error, onRetry, ...rest }) {
  if (loading) return <div className="fm-cmt__state">Đang tải bình luận…</div>
  if (error)
    return (
      <div className="fm-cmt__state">
        {error} <button type="button" className="fm-link" onClick={onRetry}>Thử lại</button>
      </div>
    )
  if (!comments.length) return <div className="fm-cmt__state">Chưa có bình luận nào. Hãy là người đầu tiên!</div>

  return (
    <div className="fm-cmts">
      {comments.map((c) => (
        <div key={c.commentId}>
          <CommentItem c={c} {...rest} />
          {(c.replies || []).map((r) => (
            <CommentItem key={r.commentId} c={r} isReply {...rest} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Ô nhập bình luận (dính đáy popup) – Enter để gửi, Shift+Enter xuống dòng */
export function CommentInput({ user, replyTo, onCancelReply, onSubmit, inputRef }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const trimmed = text.trim()

  const submit = async () => {
    if (!trimmed || sending) return
    setSending(true)
    const ok = await onSubmit(trimmed)
    setSending(false)
    if (ok) setText('')
  }

  return (
    <div className="fm-cinput">
      {replyTo && (
        <div className="fm-cinput__reply">
          Đang trả lời <strong>{replyTo.author?.fullName}</strong>
          <button type="button" onClick={onCancelReply} aria-label="Hủy trả lời"><Icon name="x" size={14} /></button>
        </div>
      )}
      <div className="fm-cinput__row">
        <ForumAvatar name={user?.fullName} src={user?.avatar} size={34} />
        <div className="fm-cinput__box">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            maxLength={FORUM_LIMITS.COMMENT_MAX}
            placeholder="Viết bình luận…"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
            }}
          />
          <button type="button" className="fm-cinput__send" disabled={!trimmed || sending} onClick={submit} aria-label="Gửi bình luận">
            <Icon name="send" size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
