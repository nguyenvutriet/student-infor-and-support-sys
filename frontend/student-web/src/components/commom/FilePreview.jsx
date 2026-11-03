import { useEffect, useState } from 'react'
import { fetchBlobUrl, getPreviewKind, getPreviewSrc } from '../../utils/file'
import '../../styles/file-preview.css'

/**
 * Khung xem trước MỘT tập tin ngay trong giao diện (PDF, Word/Excel/PowerPoint, ảnh).
 * Component thuần hiển thị – không gọi API của module nào.
 *
 * - PDF / ảnh : tải nội dung về rồi nhúng bằng blob URL với đúng MIME, nên vẫn xem được
 *               khi máy chủ trả về octet-stream (file cũ không có đuôi trên Cloudinary).
 *               Nếu không tải được (vd: bị chặn CORS) thì thử nhúng trực tiếp đường dẫn.
 * - Office    : nhúng qua Office Online viewer (cần URL công khai, có đuôi .docx/.xlsx...).
 *
 * @param {{name?:string, url:string}} file   tập tin (đã chuẩn hóa)
 * @param {string}   height     chiều cao khung, mặc định '72vh'
 * @param {()=>void} onClose    có thì hiện nút "Đóng"
 * @param {ReactNode} extra     nội dung thêm trên thanh tiêu đề (vd: nút tải xuống)
 * @param {string}   className
 *
 * Nhớ truyền `key={file.id}` khi đổi tập tin để đặt lại trạng thái.
 */
export default function FilePreview({ file, height = '72vh', onClose, extra, className = '' }) {
    const kind = getPreviewKind(file)
    const [src, setSrc] = useState(null)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        if (!kind) return undefined
        if (kind === 'office') { setSrc(getPreviewSrc(file)); return undefined }

        let cancelled = false
        let blobUrl = null
        fetchBlobUrl(file)
            .then((u) => {
                blobUrl = u
                if (cancelled) return URL.revokeObjectURL(u)
                setSrc(kind === 'pdf' ? `${u}#view=FitH` : u)
            })
            .catch(() => { if (!cancelled) setSrc(getPreviewSrc(file)) })

        return () => {
            cancelled = true
            if (blobUrl) URL.revokeObjectURL(blobUrl)
        }
    }, [kind, file.url, file.name]) // eslint-disable-line react-hooks/exhaustive-deps

    if (!kind) return <p className="ute-preview__empty">Không hỗ trợ xem trước loại tập tin này.</p>

    return (
        <div className={`ute-preview ${className}`}>
            <div className="ute-preview__bar">
                <strong title={file.name}>{file.name}</strong>
                <span className="ute-preview__tools">
          {extra}
                    <a className="ute-preview__link" href={file.url} target="_blank" rel="noopener noreferrer">Mở ở tab mới</a>
                    {onClose && <button type="button" className="ute-preview__close" onClick={onClose}>Đóng</button>}
        </span>
            </div>

            <div className="ute-preview__body" style={{ '--preview-h': height }}>
                {(!src || !loaded) && <div className="ute-preview__loading">Đang tải bản xem trước...</div>}
                {src && (kind === 'image' ? (
                    <img className="ute-preview__img" src={src} alt={file.name || ''} onLoad={() => setLoaded(true)} />
                ) : (
                    <iframe className="ute-preview__frame" title={`Xem trước ${file.name || ''}`} src={src} onLoad={() => setLoaded(true)} />
                ))}
            </div>

            <p className="ute-preview__hint">Không hiển thị được? Hãy dùng “Mở ở tab mới” hoặc tải xuống.</p>
        </div>
    )
}