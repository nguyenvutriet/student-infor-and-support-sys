import api from './api.js'

export const STAT_GROUPS = [
    { key: 'messages', label: 'Tin nhắn' },
    { key: 'documents', label: 'Văn bản' },
    { key: 'study', label: 'Tài liệu' },
    { key: 'forum', label: 'Diễn đàn' },
]

/** group: messages | documents | study | forum; from/to: yyyy-MM-dd */
export const getStaffStatistics = (group, from, to) =>
    api.get(`/staff/statistics/${group}`, { params: { from, to } })
        .then((r) => r.data)
        .catch((e) => {
            throw new Error(e?.response?.data?.message || 'Không thể tải dữ liệu thống kê')
        })

