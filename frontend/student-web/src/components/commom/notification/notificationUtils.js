import { toIso } from '../forum/forumUtils'

export const NOTI_KINDS = {
  request: { label: 'Yêu cầu hỗ trợ', bg: '#e3f0fb', fg: '#0b5cab' },
  message: { label: 'Tin nhắn', bg: '#e6f6ec', fg: '#1a7f37' },
  document: { label: 'Văn bản', bg: '#fff1d6', fg: '#9a5b00' },
  study: { label: 'Góc học tập', bg: '#efe8fb', fg: '#6b3fb5' },
  forum: { label: 'Diễn đàn', bg: '#e0f4f6', fg: '#0e7c86' },
  report: { label: 'Báo cáo & bài viết', bg: '#fde8e7', fg: '#c62828' },
  account: { label: 'Tài khoản', bg: '#fce7f3', fg: '#a21c63' },
  system: { label: 'Hệ thống', bg: '#e9ecef', fg: '#3d4650' },
}

export const NOTI_TYPES = {
  NEW_REQUEST_RECEIVED: { title: 'Có yêu cầu hỗ trợ mới', kind: 'request' },
  REQUEST_ACCEPTED: { title: 'Yêu cầu đã được tiếp nhận', kind: 'request' },
  REQUEST_REJECTED: { title: 'Yêu cầu bị từ chối tiếp nhận', kind: 'request' },
  REQUEST_FORWARDED: { title: 'Yêu cầu được chuyển tiếp', kind: 'request' },
  REQUEST_CLOSED: { title: 'Trao đổi đã được đóng', kind: 'request' },
  SUPPORT_UNIT_INVITED: { title: 'Được mời tham gia hỗ trợ', kind: 'request' },
  NEW_MESSAGE: { title: 'Tin nhắn mới', kind: 'message' },
  NEW_DOCUMENT: { title: 'Văn bản mới', kind: 'document' },
  NEW_STUDY_RESOURCE: { title: 'Tài liệu học tập mới', kind: 'study' },
  NEW_COMMENT: { title: 'Có bình luận mới', kind: 'forum' },
  NEW_COMMENT_REPLY: { title: 'Có phản hồi bình luận', kind: 'forum' },
  REPORT_SUBMITTED_CONFIRMATION: { title: 'Đã gửi báo cáo vi phạm', kind: 'report' },
  REPORT_RESOLVED_VIOLATION: { title: 'Kết quả báo cáo: có vi phạm', kind: 'report' },
  REPORT_RESOLVED_NO_VIOLATION: { title: 'Kết quả báo cáo: không vi phạm', kind: 'report' },
  POST_HIDDEN: { title: 'Bài viết đã bị ẩn', kind: 'report' },
  ACCOUNT_LOCKED: { title: 'Tài khoản đã bị khóa', kind: 'account' },
  ACCOUNT_UNLOCKED: { title: 'Tài khoản đã được mở khóa', kind: 'account' },
  SYSTEM_ANNOUNCEMENT: { title: 'Thông báo hệ thống', kind: 'system' },
}

export function typeMeta(type) {
  const t = NOTI_TYPES[type]
  const kind = t?.kind || 'system'
  return { title: t?.title || 'Thông báo', kind, kindLabel: NOTI_KINDS[kind].label, bg: NOTI_KINDS[kind].bg, fg: NOTI_KINDS[kind].fg }
}

const p2 = (n) => String(n).padStart(2, '0')

export function splitDateTime(iso) {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return { date: '', time: '' }
  return {
    date: `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`,
    time: `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`,
  }
}

export function normalizeNotification(dto = {}) {
  return {
    notiId: dto.notiId ?? dto.id,
    content: dto.content ?? '',
    type: dto.type ?? dto.notificationType ?? null,
    read: !!(dto.read ?? dto.isRead ?? dto.is_read),
    createAt: toIso(dto.createAt ?? dto.createdAt),
    title: dto.title || null,
    sender: dto.senderName || null,
  }
}

export function normalizeNotificationPage(data = {}) {
  return {
    items: (data.content || []).map(normalizeNotification),
    page: data.pageNumber ?? 0,
    size: data.pageSize,
    totalElements: data.totalElements ?? 0,
    totalPages: data.totalPages ?? 0,
  }
}
