// Hằng số + hàm tiện ích dùng chung cho module Diễn đàn

export const REACTIONS = [
  { type: 'LIKE', emoji: '👍', label: 'Thích', color: '#2078f4' },
  { type: 'LOVE', emoji: '❤️', label: 'Yêu thích', color: '#f33e58' },
  { type: 'HAHA', emoji: '😆', label: 'Haha', color: '#d99a00' },
  { type: 'WOW', emoji: '😮', label: 'Wow', color: '#d99a00' },
  { type: 'SAD', emoji: '😢', label: 'Buồn', color: '#d99a00' },
  { type: 'ANGRY', emoji: '😡', label: 'Phẫn nộ', color: '#e9710f' },
]

export const REACTION_MAP = Object.fromEntries(REACTIONS.map((r) => [r.type, r]))


export const REPORT_REASONS = [
  { type: 'SPAM', label: 'Spam / quảng cáo' },
  { type: 'HATE', label: 'Ngôn từ xúc phạm, thù ghét' },
  { type: 'SENSITIVE', label: 'Nội dung nhạy cảm, không phù hợp' },
  { type: 'FALSE_INFO', label: 'Thông tin sai lệch' },
  { type: 'COPYRIGHT', label: 'Vi phạm bản quyền' },
  { type: 'OTHER', label: 'Khác' },
]

export const FORUM_LIMITS = {
  TITLE_MAX: 200,
  CONTENT_MAX: 5000,
  COMMENT_MAX: 1000,
  MAX_FILES: 5,
  MAX_FILE_MB: 10,
}

export const ALLOWED_ATTACH_ACCEPT =
  'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip'

export function initials(name = '') {
  return (
    name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase() || 'U'
  )
}

export function firstName(name = '') {
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1] || 'bạn'
}

export function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} ngày trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}

export function fullDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export const isImageAttachment = (a) =>
  (a?.fileType || '').toLowerCase().startsWith('image/') ||
  /\.(png|jpe?g|gif|webp)$/i.test(a?.fileName || '')

export function topReactions(summary = {}, n = 3) {
  return Object.entries(summary)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([t]) => REACTION_MAP[t])
    .filter(Boolean)
}
