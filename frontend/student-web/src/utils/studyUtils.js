/**
 * Hàm thuần dùng cho Góc học tập (sinh viên): nhãn, chuẩn hóa dữ liệu BE → FE, định dạng.
 * Chuẩn hóa chịu được các khác biệt thường gặp của DTO (Lombok `boolean isNew` → JSON "new",
 * người đăng là authorName hoặc staffName, ngày giờ dạng chuỗi hoặc mảng).
 */
import { normalizeFile } from './file'
import { toIsoLocal } from './scheduleUtils'

export const TYPE_LABEL = { EXAM: 'Đề thi', DOCUMENT: 'Tài liệu' }
export const NEW_DAYS = 7
export const DOWNLOAD_ERROR = 'Tải xuống không thành công, vui lòng thử lại'

const isRecent = (createAt) => {
  if (!createAt) return false
  const t = new Date(toIsoLocal(createAt)).getTime()
  return Number.isFinite(t) && Date.now() - t <= NEW_DAYS * 86400000
}

export const normalizeResource = (r = {}) => ({
  ...r,
  resourceId: r.resourceId ?? r.id,
  description: r.description ?? '',
  createAt: r.createAt ? toIsoLocal(r.createAt) : null,
  files: (r.files || []).map(normalizeFile),
  staffName: r.staffName ?? r.authorName ?? '',
  isNew: r.isNew ?? r.new ?? isRecent(r.createAt),
})

export const normalizeDepartment = (d = {}) => ({
  ...d,
  description: d.description ?? '',
  examCount: d.examCount ?? 0,
  documentCount: d.documentCount ?? 0,
  recentResources: (d.recentResources || []).map(normalizeResource),
})

export const normalizeSchedule = (s = {}) => ({
  ...s,
  subject: s.subject ?? '',
  note: s.note ?? '',
  startTime: toIsoLocal(s.startTime),
  endTime: toIsoLocal(s.endTime),
})

/** Gộp thông tin khoa từ danh sách (đầy đủ) với chi tiết BE trả về, bỏ qua trường null/undefined của chi tiết. */
export const mergeDepartment = (base = {}, detail = {}) => {
  const defined = Object.fromEntries(Object.entries(detail).filter(([, v]) => v !== null && v !== undefined && v !== ''))
  return { ...base, ...defined }
}

/** Gắn status + code NOT_FOUND để UI phân biệt "không tồn tại / đã bị ẩn". */
export const apiError = (error, fallback) => {
  const status = error?.response?.status
  return Object.assign(new Error(error?.response?.data?.message || fallback), {
    status,
    code: status === 404 ? 'NOT_FOUND' : undefined,
  })
}

export const fmtDate = (v) => {
  if (!v) return '—'
  const [y, m, d] = toIsoLocal(v).slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}
export const yearOf = (v) => (v ? toIsoLocal(v).slice(0, 4) : '')

export const deptPath = (id) => `/student/study/departments/${encodeURIComponent(id)}`
export const resourcePath = (id) => `/student/study/resources/${id}`
