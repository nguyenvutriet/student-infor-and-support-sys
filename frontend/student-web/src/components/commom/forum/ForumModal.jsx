import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../Icon'


export default function ForumModal({
  title,
  onClose,
  children,
  footer,
  width = 560,
  level = 1,
  closeOnBackdrop = true,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      
      const tops = document.querySelectorAll('[data-fm-level]')
      const maxLevel = Math.max(...Array.from(tops).map((n) => Number(n.dataset.fmLevel)))
      if (level >= maxLevel) onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, level])

  return createPortal(
    <div
      className="fm-overlay"
      data-fm-level={level}
      style={{ zIndex: 100 + level * 10 }}
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="fm-modal" style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title}>
        <header className="fm-modal__head">
          <h2>{title}</h2>
          <button type="button" className="fm-modal__close" onClick={onClose} aria-label="Đóng">
            <Icon name="x" size={20} />
          </button>
        </header>
        <div className="fm-modal__body">{children}</div>
        {footer && <footer className="fm-modal__foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}
