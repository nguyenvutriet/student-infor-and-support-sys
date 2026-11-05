import FileList from '../FileList'
import { isImageAttachment } from './forumUtils'


export default function PostAttachments({ attachments = [], limit, onOpen }) {
  const images = attachments.filter(isImageAttachment)
  const files = attachments.filter((a) => !isImageAttachment(a))
  const shown = limit ? images.slice(0, limit) : images
  const extra = images.length - shown.length

  return (
    <>
      {shown.length > 0 && (
        <div className={`fm-imgs fm-imgs--${Math.min(shown.length, 4)}`} onClick={onOpen}>
          {shown.map((a, i) => (
            <div className="fm-imgs__item" key={a.fileId}>
              <img src={a.fileUrl} alt={a.fileName} loading="lazy" />
              {extra > 0 && i === shown.length - 1 && <span className="fm-imgs__more">+{extra}</span>}
            </div>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="fm-files">
          <FileList files={files} emptyText="" />
        </div>
      )}
    </>
  )
}
