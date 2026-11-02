import api from './api'

export const adminCommentReportApi = {
    list: async () => {
        const res = await api.get('/admin/comment-reports')
        return res.data
    },

    detail: async (id) => {
        const res = await api.get(`/admin/comment-reports/${id}`)
        return res.data
    },

    statistics: async () => {
        const res = await api.get('/admin/comment-reports/statistics')
        return res.data
    },

    resolve: async (id, data) => {
        const res = await api.patch(
            `/admin/comment-reports/${id}/resolve`,
            data
        )
        return res.data
    },
}