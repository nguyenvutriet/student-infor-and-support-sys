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
  MAX_VIDEO_MB: 50,   
  MAX_TOTAL_MB: 100,  
}

export const FORUM_FEATURES = {
  UPLOAD_ATTACHMENTS: true,
}

export const ACCEPT_MEDIA = 'image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,video/quicktime,.png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.mov'
export const ACCEPT_GIF = 'image/gif,.gif'
export const ACCEPT_DOC = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip'
export const ALLOWED_ATTACH_ACCEPT = `${ACCEPT_MEDIA},${ACCEPT_DOC}`

export const extOf = (name = '') => (name.includes('.') ? name.split('.').pop().toLowerCase() : '')
const IMG_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp']
const VID_EXT = ['mp4', 'webm', 'mov']

export function pickedKind(file) {
  const ext = extOf(file?.name)
  if (file?.type?.startsWith('image/') || IMG_EXT.includes(ext)) return IMG_EXT.includes(ext) ? 'image' : null
  if (file?.type?.startsWith('video/') || VID_EXT.includes(ext)) return VID_EXT.includes(ext) ? 'video' : null
  return ACCEPT_DOC.split(',').map((x) => x.slice(1)).includes(ext) ? 'file' : null
}

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

export const isVideoAttachment = (a) =>
  (a?.fileType || '').toLowerCase().startsWith('video/') ||
  /\.(mp4|webm|mov)$/i.test(a?.fileName || '')

export async function downloadAttachment(a) {
  try {
    const res = await fetch(a.fileUrl)
    if (!res.ok) throw new Error(String(res.status))
    const url = URL.createObjectURL(await res.blob())
    const link = document.createElement('a')
    link.href = url
    link.download = a.fileName || 'tep-dinh-kem'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1500)
  } catch {
    window.open(a.fileUrl, '_blank', 'noopener')
  }
}

export function topReactions(summary = {}, n = 3) {
  return Object.entries(summary)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([t]) => REACTION_MAP[t])
    .filter(Boolean)
}


export function toIso(v) {
  if (!v) return null
  if (Array.isArray(v)) {
    const [y, mo, d, h = 0, mi = 0, s = 0] = v
    return new Date(y, mo - 1, d, h, mi, s).toISOString()
  }
  return v
}

const normRole = (r) => (r ? String(r).toLowerCase().replace(/^role_/, '') : undefined)

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

export function summarizeVotes(list) {
  if (!list) return {}
  if (!Array.isArray(list)) return list 
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

export function normalizePostPage(data = {}, myUserId) {
  return {
    content: (data.content || []).map((p) => normalizePost(p, myUserId)),
    page: data.pageNumber ?? data.page ?? 0,
    size: data.pageSize ?? data.size,
    totalElements: data.totalElements,
    hasMore: data.hasMore ?? (data.lastPage === undefined ? false : !data.lastPage),
  }
}
