import { useRef, useState } from 'react'
import Icon from '../Icon'
import { REACTIONS, REACTION_MAP, topReactions } from './forumUtils'

export function ReactionButton({ myReaction, onReact }) {
  const [open, setOpen] = useState(false)
  const timer = useRef(null)
  const cur = myReaction ? REACTION_MAP[myReaction] : null

  const show = (ms) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(true), ms)
  }
  const hide = (ms = 250) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(false), ms)
  }

  return (
    <div
      className="fm-react"
      onMouseEnter={() => show(350)}
      onMouseLeave={() => hide()}
    >
      {open && (
        <div className="fm-react__picker" onMouseEnter={() => show(0)} onMouseLeave={() => hide()}>
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              type="button"
              className="fm-react__opt"
              title={r.label}
              onClick={() => { setOpen(false); onReact(r.type === myReaction ? null : r.type) }}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className={`fm-action ${cur ? 'fm-action--on' : ''}`}
        style={cur ? { color: cur.color } : undefined}
        onClick={() => { setOpen(false); onReact(cur ? null : 'LIKE') }}
        onTouchStart={() => show(450)}
        onTouchEnd={() => clearTimeout(timer.current)}
      >
        {cur ? <span className="fm-react__emoji">{cur.emoji}</span> : <Icon name="thumb" size={19} />}
        <span>{cur ? cur.label : 'Thích'}</span>
      </button>
    </div>
  )
}

export function ReactionSummary({ post, onClickComments }) {
  const tops = topReactions(post.reactionSummary)
  return (
    <div className="fm-stats">
      <span className="fm-stats__react">
        {post.reactionCount > 0 && (
          <>
            <span className="fm-stats__emojis">
              {tops.map((r) => <span key={r.type}>{r.emoji}</span>)}
            </span>
            {post.reactionCount}
          </>
        )}
      </span>
      {post.commentCount > 0 && (
        <button type="button" className="fm-stats__cmt" onClick={onClickComments}>
          {post.commentCount} bình luận
        </button>
      )}
    </div>
  )
}
