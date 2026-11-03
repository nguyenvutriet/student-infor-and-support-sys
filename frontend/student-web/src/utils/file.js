/**
 * Tiện ích tập tin dùng chung (văn bản, góc học tập, diễn đàn, tin nhắn, yêu cầu hỗ trợ...).
 * Không phụ thuộc module nào – chỉ làm việc với object tập tin dạng { id, name, size, url }.
 */

export const PDF_EXT = ['pdf']
export const OFFICE_EXT = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
export const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp']

/** Địa chỉ trình xem Office Online (tập tin phải truy cập được công khai). */
export const OFFICE_VIEWER_URL = 'https://view.officeapps.live.com/op/embed.aspx?src='

/** Đuôi tập tin (chữ thường, không dấu chấm); '' nếu không có. */
export const fileExt = (name = '') => {
  const clean = String(name).split(/[?#]/)[0]
  return clean.includes('.') ? clean.split('.').pop().toLowerCase() : ''
}

export const fmtSize = (bytes) =>
    bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

/**
 * Chuẩn hóa tập tin từ nhiều dạng API khác nhau về { id, name, size, url, ... }.
 * Nhận cả { fileId, fileName, fileSize, fileUrl } lẫn { id, name, size, url }.
 */
export const normalizeFile = (f = {}) => ({
  ...f,
  id: f.id ?? f.fileId,
  name: f.name ?? f.fileName,
  size: f.size ?? f.fileSize,
  url: f.url ?? f.fileUrl,
})

/** Loại xem trước: 'pdf' | 'office' | 'image' | null (không xem trước được, vd: zip). */
export function getPreviewKind(file) {
  if (!file?.url) return null
  const ext = fileExt(file.name) || fileExt(file.url)
  if (PDF_EXT.includes(ext)) return 'pdf'
  if (OFFICE_EXT.includes(ext)) return 'office'
  if (IMAGE_EXT.includes(ext)) return 'image'
  return null
}

/** Địa chỉ nhúng vào khung xem trước; null nếu không xem trước được. */
export function getPreviewSrc(file) {
  switch (getPreviewKind(file)) {
    case 'pdf': return `${file.url}#view=FitH`
    case 'office': return `${OFFICE_VIEWER_URL}${encodeURIComponent(file.url)}`
    case 'image': return file.url
    default: return null
  }
}

export const canPreview = (file) => getPreviewKind(file) !== null

const MIME_BY_EXT = {
  pdf: 'application/pdf',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
}

/** MIME theo đuôi tên tập tin (hoặc đuôi URL); application/octet-stream nếu không rõ. */
export const getMime = (file) =>
    MIME_BY_EXT[fileExt(file?.name) || fileExt(file?.url)] || 'application/octet-stream'

/**
 * Tải nội dung tập tin rồi tạo blob URL với ĐÚNG MIME để nhúng vào <iframe>/<img>.
 * Dùng khi máy chủ lưu trữ (vd: Cloudinary) trả về octet-stream khiến trình duyệt tải file về
 * thay vì hiển thị. Nhớ gọi URL.revokeObjectURL(url) khi không dùng nữa.
 */
export async function fetchBlobUrl(file) {
  const res = await fetch(file.url)
  if (!res.ok) throw new Error(`Không tải được tập tin (${res.status})`)
  const blob = await res.blob()
  return URL.createObjectURL(new Blob([blob], { type: getMime(file) }))
}

/** Tải xuống tập tin (mở bằng thẻ <a download>). */
export function downloadFile(file) {
  if (!file?.url) throw new Error('Không tìm thấy đường dẫn tập tin')
  const a = window.document.createElement('a')
  a.href = file.url
  a.download = file.name || 'download'
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.click()
}