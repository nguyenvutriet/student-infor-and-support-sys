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

// Loại vi phạm gợi ý (đặc tả chưa liệt kê cụ thể – xem file Word ghi chú)
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

// Bật/tắt tính năng theo mức hoàn thiện của BE.
//  UPLOAD_ATTACHMENTS = false → BE API #3 hiện nhận JSON (@RequestBody PostDTO), chưa nhận tệp → ẩn nút đính kèm.
//  Khi BE đã làm multipart (xem file Word mục 4.2) đổi thành true.
export const FORUM_FEATURES = {
  UPLOAD_ATTACHMENTS: false,
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

// Ảnh hay tệp? (dựa vào fileType, nếu thiếu thì dựa đuôi tên tệp)
export const isImageAttachment = (a) =>
  (a?.fileType || '').toLowerCase().startsWith('image/') ||
  /\.(png|jpe?g|gif|webp)$/i.test(a?.fileName || '')

// Các loại cảm xúc nhiều nhất (để hiện emoji cạnh số đếm)
export function topReactions(summary = {}, n = 3) {
  return Object.entries(summary)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([t]) => REACTION_MAP[t])
    .filter(Boolean)
}

/* =====================================================================
 *  CHUYỂN ĐỔI DỮ LIỆU BE → FE  (FE theo BE: PostDTO / CommentDTO / VoteDTO / PostResponse)
 *  Mọi chỗ BE đặt tên/kiểu khác với giao diện đều xử lý ở đây, component không phải sửa.
 * ===================================================================== */

// LocalDateTime có thể về dạng chuỗi ISO hoặc mảng [y, m, d, h, mi, s] (khi Jackson bật WRITE_DATES_AS_TIMESTAMPS)
export function toIso(v) {
  if (!v) return null
  if (Array.isArray(v)) {
    const [y, mo, d, h = 0, mi = 0, s = 0] = v
    return new Date(y, mo - 1, d, h, mi, s).toISOString()
  }
  return v
}

const normRole = (r) => (r ? String(r).toLowerCase().replace(/^role_/, '') : undefined)

// BE hiện chỉ trả authorId; nếu BE bổ sung authorName / authorAvatar / authorRole (hoặc object author) thì tự dùng
export function normalizeAuthor(dto = {}) {
  const a = dto.author && typeof dto.author === 'object' ? dto.author : {}
  const userId = a.userId ?? dto.authorId ?? null
  return {
    userId,
    fullName: a.fullName || dto.authorName || userId || 'Người dùng',
    avatar: a.avatar || dto.authorAvatar || null,
    role: normRole(a.role || dto.authorRole),
  }
}

// reactionSummary: BE trả List<VoteDTO> → đếm theo reactionType thành { LIKE: 3, LOVE: 1 }
export function summarizeVotes(list) {
  if (!list) return {}
  if (!Array.isArray(list)) return list // đã là dạng map
  return list.reduce((acc, v) => {
    const t = v.reactionType || v.voteType || v.type
    if (t) acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})
}

export function normalizePost(dto = {}, myUserId) {
  const votes = Array.isArray(dto.reactionSummary) ? dto.reactionSummary : []
  const reactionSummary = summarizeVotes(dto.reactionSummary)
  const total = Object.values(reactionSummary).reduce((a, b) => a + b, 0)
  const mine = votes.find((v) => v.userId && v.userId === myUserId)
  return {
    postId: dto.postId,
    title: dto.title ?? '',
    content: dto.content ?? '',
    status: dto.status,
    author: normalizeAuthor(dto),
    attachments: Array.isArray(dto.attachments) ? dto.attachments : [],
    reactionSummary,
    reactionCount: Math.max(Number(dto.reactionCount) || 0, total),
    myReaction: dto.myReaction ?? mine?.reactionType ?? null,
    commentCount: Number(dto.commentCount) || 0,
    saved: !!dto.saved,
    savedAt: toIso(dto.savedAt),
    createAt: toIso(dto.createAt ?? dto.createdAt),
  }
}

// CommentDTO của BE: { commentId, content, authorId, createdAt, replies } (chưa có parentId → suy ra từ cấp lồng nhau)
export function normalizeComment(dto = {}, parentId = null) {
  return {
    commentId: dto.commentId,
    content: dto.content ?? '',
    parentId: dto.parentId ?? parentId ?? null,
    author: normalizeAuthor(dto),
    createAt: toIso(dto.createAt ?? dto.createdAt),
    replies: (dto.replies || []).map((r) => normalizeComment(r, dto.commentId)),
  }
}

// PostResponse của BE: { content, pageNumber, pageSize, totalElements, totalPages, lastPage } → { content, page, size, hasMore }
export function normalizePostPage(data = {}, myUserId) {
  return {
    content: (data.content || []).map((p) => normalizePost(p, myUserId)),
    page: data.pageNumber ?? data.page ?? 0,
    size: data.pageSize ?? data.size,
    totalElements: data.totalElements,
    hasMore: data.hasMore ?? (data.lastPage === undefined ? false : !data.lastPage),
  }
}
