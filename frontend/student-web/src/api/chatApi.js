import api from './api.js'

export const STATUS_LABEL = {
    PENDING: 'Chờ tiếp nhận',
    ACCEPTED: 'Đang xử lý',
    REJECTED: 'Từ chối tiếp nhận',
    FORWARDED: 'Đã chuyển tiếp',
    CLOSED: 'Đã xử lý',
}

export const STATUS_OPTIONS = ['PENDING', 'ACCEPTED', 'CLOSED', 'REJECTED']

export const MAX_FILE_MB = 10
export const MAX_FILES = 5
export const CHAT_ALLOWED_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt']

/** Chuẩn hóa lỗi: Error(message tiếng Việt từ backend) + status HTTP. */
const unwrap = (promise) =>
    promise.then((r) => r.data).catch((e) => {
        throw Object.assign(new Error(e?.response?.data?.message || e.message || 'Có lỗi xảy ra'), {
            status: e?.response?.status,
        })
    })

export const listDepartments = () => unwrap(api.get('/chat/departments'))
export const listRequests = (params) => unwrap(api.get('/chat/requests', { params }))
export const getRequest = (id) => unwrap(api.get(`/chat/requests/${id}`))
export const getMessages = (id) => unwrap(api.get(`/chat/requests/${id}/messages`))

export const createRequest = (body) => unwrap(api.post('/chat/requests', body))
export const deleteRequest = (id) => unwrap(api.delete(`/chat/requests/${id}`))

export const sendMessage = (id, content, files = []) => {
    const form = new FormData()
    if (content) form.append('content', content)
    files.forEach((f) => form.append('files', f))
    return unwrap(api.post(`/chat/requests/${id}/messages`, form))
}
export const recallMessage = (id, messId) => unwrap(api.delete(`/chat/requests/${id}/messages/${messId}`))

export const acceptRequest = (id) => unwrap(api.post(`/chat/requests/${id}/accept`))
export const rejectRequest = (id, reason) => unwrap(api.post(`/chat/requests/${id}/reject`, { reason }))
export const forwardRequest = (id, departmentId, note) => unwrap(api.post(`/chat/requests/${id}/forward`, { departmentId, note }))
export const inviteDepartments = (id, departmentIds, message) => unwrap(api.post(`/chat/requests/${id}/invite`, { departmentIds, message }))
export const closeRequest = (id, note) => unwrap(api.post(`/chat/requests/${id}/close`, { note }))
