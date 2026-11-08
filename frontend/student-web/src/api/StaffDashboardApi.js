import api from './api.js'

export const getStaffDashboard = () =>
    api.get('/staff/dashboard')
        .then((r) => r.data)
        .catch((e) => {
            throw new Error(e?.response?.data?.message || e.message || 'Không thể tải dữ liệu tổng quan')
        })