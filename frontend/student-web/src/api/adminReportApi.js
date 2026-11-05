
import api from './api'

export const adminReportApi = {
    listAll: async () => {
        const res = await api.get('/admin/reports')
        return res.data
    },

    resolveAll: async (id, data) => {
        const res = await api.patch(
            `/admin/reports/${id}/resolve`,
            data
        )
        return res.data
    },
}
