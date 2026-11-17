import api from './api.js'

export { VALIDITY_LABEL, RELATION_DISPLAY_LABEL } from './staffDocumentApi.js'

const fail = (e) => {
    throw Object.assign(new Error(e?.response?.data?.message || e.message || 'Có lỗi xảy ra'), {
        status: e?.response?.status,
    })
}

/** dd/MM/yyyy HH:mm */
export const fmtDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const p = (n) => String(n).padStart(2, '0')
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const normalize = (d) => ({
    ...d,
    id: d.id ?? d.docId,
    department: d.department ?? '',
    validity: d.validity || 'IN_EFFECT',
    attachments: d.attachments || [],
    relations: d.relations || [],
})

export const listDocumentDepartments = () =>
    api.get('/student/documents/departments').then((r) => r.data || []).catch(fail)

/** departmentId bỏ trống = tất cả đơn vị. */
export const listVisibleDocuments = (departmentId) =>
    api.get('/student/documents', { params: departmentId ? { departmentId } : {} })
        .then((r) => (r.data || []).map(normalize)).catch(fail)

export const getVisibleDocument = (id) =>
    api.get(`/student/documents/${id}`).then((r) => normalize(r.data)).catch(fail)
