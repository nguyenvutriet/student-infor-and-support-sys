import { useEffect } from 'react'

export default function ScheduleModal({ title, onClose, children, width = 560 }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sty-modal" role="presentation">
      <div className="sty-modal__box" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
        <h2 className="sty-modal__title">{title}</h2>
        {children}
      </div>
    </div>
  )
}
