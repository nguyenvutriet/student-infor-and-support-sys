import api from './api.js'

// Tiện ích tập tin dùng chung – giữ lại tên cũ để các import hiện có không bị vỡ
export { fmtSize, downloadFile as downloadAttachment } from '../utils/file.js'

export const STATUS_LABEL = {
  VISIBLE: 'Hiển thị',
  HIDDEN: 'Ẩn'
}

export const VALIDITY_LABEL = {
  PENDING: 'Chưa có hiệu lực',
  IN_EFFECT: 'Còn hiệu lực',
  EXPIRED: 'Hết hiệu lực'
}

export const RELATION_LABEL = {
  REPLACES: 'Thay thế',
  AMENDS: 'Sửa đổi, bổ sung',
  SUPPLEMENTS: 'Bổ sung'
}

export const RELATION_DISPLAY_LABEL = {
  REPLACES: 'Thay thế cho',
  REPLACED_BY: 'Được thay thế bởi',
  AMENDS: 'Sửa đổi, bổ sung cho',
  AMENDED_BY: 'Được sửa đổi, bổ sung bởi',
  SUPPLEMENTS: 'Bổ sung cho',
  SUPPLEMENTED_BY: 'Được bổ sung bởi',
  // Tương thích ngược nếu còn giá trị cũ
  REPLACE: 'Thay thế cho',
  AMEND: 'Sửa đổi, bổ sung cho',
  SUPPLEMENT: 'Bổ sung cho'
}

export const RELATION_EFFECT = {
  REPLACES: 'Văn bản được chọn sẽ tự động chuyển sang tình trạng Hết hiệu lực (EXPIRED).'
}

export const MAX_FILE_MB = 10
export const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip']
export const DEFAULT_DEPT = 'Phòng Đào tạo'

const normalizeRelationType = (t) => {
  if (t === 'REPLACE') return 'REPLACES'
  if (t === 'AMEND') return 'AMENDS'
  if (t === 'SUPPLEMENT') return 'SUPPLEMENTS'
  return t
}

const normalize = (d) => ({
  ...d,
  id: d.id ?? d.docId,
  department: d.department ?? '',
  attachments: (d.attachments || []).map(a => ({
    ...a,
    id: a.id ?? a.fileId,
    name: a.name ?? a.fileName,
    size: a.size ?? a.fileSize
  })),
  relations: (d.relations || []).map(r => ({
    ...r,
    type: normalizeRelationType(r.type)
  })),
})

const makeFormData = (data, files = []) => {
  const form = new FormData()
  form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  files.forEach(file => form.append('files', file))
  return form
}

const handleError = (error) => {
  const message = error?.response?.data?.message || error?.response?.data?.error || error.message
  const code = error?.response?.status === 404 ? 'NOT_FOUND' : message?.includes('Số hiệu văn bản đã tồn tại') ? 'DUPLICATE' : undefined
  throw Object.assign(new Error(message || 'Có lỗi xảy ra'), { code, status: error?.response?.status })
}

/** Danh sách văn bản của đơn vị STAFF đang đăng nhập. */
export async function listDocuments(title) {
  try {
    const { data } = await api.get('/staff/documents', {
      params: title ? { title } : {}
    });
    return (data || []).map(normalize);
  } catch (e) {
    handleError(e);
  }
}

export async function getDocument(id) {
  try { const { data } = await api.get(`/staff/documents/${id}`); return normalize(data) }
  catch (e) { handleError(e) }
}

export async function createDocument({ docNumber, title, content, validity, newFiles = [], relations = [] }) {
  const payload = {
    docNumber,
    title,
    content,
    validity: validity || 'IN_EFFECT',
    relations: relations.map(r => ({ docId: r.docId, type: normalizeRelationType(r.type) }))
  }
  try { const { data } = await api.post('/staff/documents', makeFormData(payload, newFiles)); return normalize(data) }
  catch (e) { handleError(e) }
}

export async function updateDocument(id, { docNumber, title, content, validity, keepAttachmentIds = [], newFiles = [], relations = [] }) {
  const payload = {
    docNumber,
    title,
    content,
    validity: validity || 'IN_EFFECT',
    keepAttachmentIds,
    relations: relations.map(r => ({ docId: r.docId, type: normalizeRelationType(r.type) }))
  }
  try { const { data } = await api.put(`/staff/documents/${id}`, makeFormData(payload, newFiles)); return normalize(data) }
  catch (e) { handleError(e) }
}

export async function setStatus(id, status) {
  try { const { data } = await api.patch(`/staff/documents/${id}/visibility`, null, { params: { status } }); return normalize(data) }
  catch (e) { handleError(e) }
}

export async function listDepartments() {
  try { const { data } = await api.get('/documents/departments'); return data || [] }
  catch (e) { handleError(e) }
}

export async function listStudentDocuments(departmentId, title) {
  try { const { data } = await api.get(`/documents/department/${departmentId}`, { params: title ? { title } : {} }); return (data || []).map(normalize) }
  catch (e) { handleError(e) }
}

export async function getStudentDocument(id) {
  try { const { data } = await api.get(`/documents/${id}`); return normalize(data) }
  catch (e) { handleError(e) }
}

export const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso); const p = n => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
