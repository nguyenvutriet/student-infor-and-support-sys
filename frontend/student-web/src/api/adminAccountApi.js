import api from "./api";

export const adminAccountApi = {
    list: async (params = {}) => {
        const response = await api.get("/admin/accounts", { params });
        return response.data;
    },

    detail: async (id) => {
        const response = await api.get(`/admin/accounts/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post("/admin/accounts", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/admin/accounts/${id}`, data);
        return response.data;
    },

    changeStatus: async (id, status) => {
        const response = await api.patch(
            `/admin/accounts/${id}/status`,
            { status }
        );
        return response.data;
    }
};