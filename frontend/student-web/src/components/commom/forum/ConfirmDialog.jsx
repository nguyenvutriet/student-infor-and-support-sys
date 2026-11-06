import ForumModal from './ForumModal'

export default function ConfirmDialog({
  title,
  message,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy',
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <ForumModal
      title={title}
      level={2}
      width={440}
      onClose={onCancel}
      closeOnBackdrop={false}
      footer={
        <div className="fm-foot-actions">
          <button type="button" className="fm-btn fm-btn--light" onClick={onCancel} autoFocus>
            {cancelText}
          </button>
          <button type="button" className={`fm-btn ${danger ? 'fm-btn--danger' : ''}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      }
    >
      <p className="fm-confirm__text">{message}</p>
    </ForumModal>
  )
}
