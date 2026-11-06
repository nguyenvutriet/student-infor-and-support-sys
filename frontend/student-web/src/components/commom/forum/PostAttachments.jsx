import { useState } from 'react'
import MediaViewer from './MediaViewer'
import { DownloadIcon } from './ForumIcons'
import { downloadAttachment, extOf, isImageAttachment, isVideoAttachment } from './forumUtils'
import { fmtSize } from '../../../utils/file'

export default function PostAttachments({ attachments = [], limit }) {
  const [viewer, setViewer] = useState(null) // vị trí đang mở trong danh sách media
  const media = attachments.filter((a) => isImageAttachment(a) || isVideoAttachment(a))
  const files = attachments.filter((a) => !isImageAttachment(a) && !isVideoAttachment(a))
  const shown = limit ? media.slice(0, limit) : media
  const extra = media.length - shown.length

  return (
    <>
      {shown.length > 0 && (
        <div className={`fm-imgs fm-imgs--${Math.min(shown.length, 4)}`}>
          {shown.map((a, i) => (
            <div className="fm-imgs__item" key={a.fileId ?? a.fileUrl}>
              {isVideoAttachment(a) ? (
                <video src={`${a.fileUrl}#t=0.1`} controls preload="metadata" playsInline />
              ) : (
                <img src={a.fileUrl} alt={a.fileName} loading="lazy" onClick={() => setViewer(i)} />
              )}
              {extra > 0 && i === shown.length - 1 && (
                <span className="fm-imgs__more" onClick={() => setViewer(i)}>+{extra}</span>
              )}
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
              <span className="fm-file__dl"><DownloadIcon size={18} /></span>
            </button>
          ))}
        </div>
      )}

      {viewer !== null && <MediaViewer items={media} start={viewer} onClose={() => setViewer(null)} />}
    </>
  )
}
