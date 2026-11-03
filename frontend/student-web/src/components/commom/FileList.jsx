import { useState } from 'react'
import FilePreview from './FilePreview'
import { canPreview, downloadFile, fmtSize, normalizeFile } from '../../utils/file'
import '../../styles/file-preview.css'

/**
 * Danh sách tập tin có nút "Xem trước" (mở khung ngay bên dưới dòng tập tin) và "Tải xuống".
 * Dùng cho mọi module: chỉ cần truyền mảng tập tin.
 *
 * @param {Array}  files          [{ id, name, size, url }] – cũng nhận { fileId, fileName, fileSize, fileUrl }
 * @param {boolean} accordion     true (mặc định): chỉ mở một khung xem trước cùng lúc
 * @param {boolean} downloadable  hiện nút "Tải xuống" (mặc định true)
 * @param {string}  previewHeight chiều cao khung xem trước (mặc định '72vh')
 * @param {string}  emptyText     chữ khi không có tập tin ('' để không hiện gì)
 * @param {(file)=>ReactNode} renderActions  nút thêm cạnh mỗi tập tin (vd: Gỡ, Xóa)
 * @param {(file, open:boolean)=>void} onPreviewToggle  gọi khi mở/đóng xem trước
 *
 * Ví dụ:
 *   <FileList files={doc.attachments} />
 *   <FileList files={post.files} downloadable={false} renderActions={(f) => <button onClick={() => remove(f)}>Xóa</button>} />
 */
export default function FileList({
  files = [],
  accordion = true,
  downloadable = true,
  previewHeight,
  emptyText = 'Không có tập tin đính kèm.',
  renderActions,
  onPreviewToggle,
  className = '',
}) {
  const [openIds, setOpenIds] = useState([])

  const list = files.map(normalizeFile)
  if (list.length === 0) return emptyText ? <p className="ute-files__empty">{emptyText}</p> : null

  const toggle = (file) => {
    const isOpen = openIds.includes(file.id)
    setOpenIds((cur) => {
      if (isOpen) return cur.filter((id) => id !== file.id)
      return accordion ? [file.id] : [...cur, file.id]
    })
    onPreviewToggle?.(file, !isOpen)
  }

  return (
    <div className={`ute-files ${className}`}>
      {list.map((file) => {
        const previewable = canPreview(file)
        const open = previewable && openIds.includes(file.id)
        return (
          <div key={file.id}>
            <div className="ute-file">
              <span className="ute-file__name" title={file.name}>{file.name}</span>
              {file.size != null && <span className="ute-file__size">{fmtSize(file.size)}</span>}
              <span className="ute-file__actions">
                {previewable && (
                  <button type="button" className="ute-btn ute-btn--light" aria-expanded={open} onClick={() => toggle(file)}>
                    {open ? 'Đóng xem trước' : 'Xem trước'}
                  </button>
                )}
                {downloadable && (
                  <button type="button" className="ute-btn ute-btn--outline" onClick={() => downloadFile(file)}>Tải xuống</button>
                )}
                {renderActions?.(file)}
              </span>
            </div>

            {open && <FilePreview key={file.id} file={file} height={previewHeight} onClose={() => toggle(file)} />}
          </div>
        )
      })}
    </div>
  )
}
