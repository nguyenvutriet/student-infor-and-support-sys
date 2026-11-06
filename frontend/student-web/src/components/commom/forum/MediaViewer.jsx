import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronIcon, CloseIcon, DownloadIcon } from './ForumIcons'
import { downloadAttachment, isVideoAttachment } from './forumUtils'

export default function MediaViewer({ items, start = 0, onClose }) {
  const [index, setIndex] = useState(start)
  const many = items.length > 1
  const go = useCallback((d) => setIndex((c) => (c + d + items.length) % items.length), [items.length])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      else if (many && e.key === 'ArrowRight') { e.stopPropagation(); go(1) }
      else if (many && e.key === 'ArrowLeft') { e.stopPropagation(); go(-1) }
    }
    document.addEventListener('keydown', onKey, true) 
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prev
    }
  }, [go, many, onClose])

  const a = items[index]
  if (!a) return null
  const closeOnBlank = (e) => { if (e.target === e.currentTarget) onClose() }

  return createPortal(
    <div className="fm-viewer" role="dialog" aria-modal="true" aria-label="Xem ảnh và video" onMouseDown={closeOnBlank}>
      <button type="button" className="fm-viewer__btn fm-viewer__close" onClick={onClose} aria-label="Đóng">
        <CloseIcon />
      </button>

      <div className="fm-viewer__top">
        {many && <span>{index + 1} / {items.length}</span>}
        <button type="button" className="fm-viewer__btn" onClick={() => downloadAttachment(a)} aria-label="Tải xuống" title="Tải xuống">
          <DownloadIcon />
        </button>
      </div>

      {many && (
        <button type="button" className="fm-viewer__btn fm-viewer__nav fm-viewer__nav--prev" onClick={() => go(-1)} aria-label="Trước">
          <ChevronIcon dir="left" />
        </button>
      )}

      <div className="fm-viewer__stage" onMouseDown={closeOnBlank}>
        {isVideoAttachment(a) ? (
          <video key={a.fileUrl} src={a.fileUrl} controls autoPlay playsInline />
        ) : (
          <img key={a.fileUrl} src={a.fileUrl} alt={a.fileName} />
        )}
      </div>

      {many && (
        <button type="button" className="fm-viewer__btn fm-viewer__nav fm-viewer__nav--next" onClick={() => go(1)} aria-label="Sau">
          <ChevronIcon dir="right" />
        </button>
      )}
    </div>,
    document.body,
  )
}
