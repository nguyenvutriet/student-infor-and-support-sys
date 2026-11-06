import { downloadAttachment, extOf, isImageAttachment, isVideoAttachment } from './forumUtils'
import { fmtSize } from '../../../utils/file'

function DownloadIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  )
}

export default function PostAttachments({ attachments = [], limit, onOpen }) {
  const media = attachments.filter((a) => isImageAttachment(a) || isVideoAttachment(a))
  const files = attachments.filter((a) => !isImageAttachment(a) && !isVideoAttachment(a))
  const shown = limit ? media.slice(0, limit) : media
  const extra = media.length - shown.length

  return (
    <>
      {shown.length > 0 && (
        <div className={`fm-imgs fm-imgs--${Math.min(shown.length, 4)}`} onClick={onOpen}>
          {shown.map((a, i) => (
            <div className="fm-imgs__item" key={a.fileId ?? a.fileUrl}>
              {isVideoAttachment(a) ? (
                <video src={a.fileUrl} controls preload="metadata" onClick={(e) => e.stopPropagation()} />
              ) : (
                <img src={a.fileUrl} alt={a.fileName} loading="lazy" />
              )}
              {extra > 0 && i === shown.length - 1 && <span className="fm-imgs__more">+{extra}</span>}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="fm-files">
          {files.map((a) => (
            <button
              type="button"
              className="fm-file"
              key={a.fileId ?? a.fileUrl}
              onClick={() => downloadAttachment(a)}
              title="Bấm để tải xuống"
            >
              <span className="fm-file__ext">{extOf(a.fileName).slice(0, 4).toUpperCase() || 'FILE'}</span>
              <span className="fm-file__info">
                <span className="fm-file__name">{a.fileName}</span>
                {a.fileSize > 0 && <span className="fm-file__size">{fmtSize(a.fileSize)}</span>}
              </span>
              <span className="fm-file__dl"><DownloadIcon /></span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
