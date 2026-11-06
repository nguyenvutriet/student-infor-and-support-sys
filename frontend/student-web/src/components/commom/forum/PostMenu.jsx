import { useEffect, useRef, useState } from 'react'
import { BookmarkIcon, MoreIcon, ReportIcon } from './ForumIcons'

export default function PostMenu({ saved, onToggleSave, onReport }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation() 
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  if (!onToggleSave && !onReport) return null

  const run = (fn) => () => { setOpen(false); fn() }

  return (
    <div className="fm-menu" ref={ref}>
      <button
        type="button"
        className={`fm-menu__btn ${open ? 'fm-menu__btn--on' : ''}`}
        aria-label="Tùy chọn bài viết"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
      >
        <MoreIcon />
      </button>

      {open && (
        <div className="fm-menu__list" role="menu">
          {onToggleSave && (
            <button type="button" role="menuitem" className="fm-menu__item" onClick={run(onToggleSave)}>
              <span className="fm-menu__ico"><BookmarkIcon size={22} filled={saved} /></span>
              <span className="fm-menu__text">
                <strong>{saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}</strong>
                <small>{saved ? 'Xóa khỏi danh sách bài viết đã lưu' : 'Thêm vào danh sách bài viết đã lưu'}</small>
              </span>
            </button>
          )}
          {onToggleSave && onReport && <div className="fm-menu__sep" />}
          {onReport && (
            <button type="button" role="menuitem" className="fm-menu__item" onClick={run(onReport)}>
              <span className="fm-menu__ico"><ReportIcon size={22} /></span>
              <span className="fm-menu__text">
                <strong>Báo cáo bài viết</strong>
                <small>Bài viết này vi phạm quy định của diễn đàn</small>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
