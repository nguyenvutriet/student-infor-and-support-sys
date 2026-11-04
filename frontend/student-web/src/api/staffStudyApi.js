import api from './api.js'
import { STATUS_LABEL, ALLOWED_EXT, MAX_FILE_MB, fmtDate } from './staffDocumentApi.js'

// dùng lại các hằng/tiện ích chung với module văn bản
export { STATUS_LABEL, ALLOWED_EXT, MAX_FILE_MB, fmtDate }
export { fmtSize } from '../utils/file.js'

export const TYPE_LABEL = { DOCUMENT: 'Tài liệu', EXAM: 'Đề thi' }
export const MAX_FILES = 10
export const MAX_TEXT = 255

const normalize = (r) => ({
    ...r,
    description: r.description ?? '',
    files: (r.files || []).map((f) => ({ ...f, id: f.id ?? f.fileId, name: f.name ?? f.fileName, size: f.size ?? f.fileSize })),
})

const makeFormData = (data, files = []) => {
    const form = new FormData()
    form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    files.forEach((file) => form.append('files', file))
    return form
}

const handleError = (error) => {
    const status = error?.response?.status
    const message = error?.response?.data?.message || error.message
    throw Object.assign(new Error(message || 'Có lỗi xảy ra'), { code: status === 404 ? 'NOT_FOUND' : undefined, status })
}

/** Danh sách tài liệu góc học tập do nhân viên đang đăng nhập đăng tải (mới → cũ). */
export async function listStudyResources() {
    try { const { data } = await api.get('/staff/study-resources'); return (data || []).map(normalize) }
    catch (e) { handleError(e) }
}

export async function getStudyResource(id) {
    try { const { data } = await api.get(`/staff/study-resources/${id}`); return normalize(data) }
    catch (e) { handleError(e) }
}

export async function createStudyResource({ title, description, resourceType, newFiles = [] }) {
    try {
        const { data } = await api.post('/staff/study-resources', makeFormData({ title, description, resourceType }, newFiles))
        return normalize(data)
    } catch (e) { handleError(e) }
}

export async function updateStudyResource(id, { title, description, resourceType, keepFileIds = [], newFiles = [] }) {
    try {
        const { data } = await api.put(`/staff/study-resources/${id}`, makeFormData({ title, description, resourceType, keepFileIds }, newFiles))
        return normalize(data)
    } catch (e) { handleError(e) }
}

export async function setStudyStatus(id, status) {
    try { const { data } = await api.patch(`/staff/study-resources/${id}/visibility`, null, { params: { status } }); return normalize(data) }
    catch (e) { handleError(e) }
}
