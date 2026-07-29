import api from './api';

export const getAdminStats = async () => {
    const response = await api.get('/admin/stats');
    return response.data;
};

export const getAdminSellers = async () => {
    const response = await api.get('/admin/sellers');
    return response.data;
};

export const toggleSellerApproval = async (sellerId) => {
    const response = await api.patch(`/admin/sellers/${sellerId}/toggle`);
    return response.data;
};

export const getAdminCategories = async () => {
    const response = await api.get('/admin/categories');
    return response.data;
};

export const createCategory = async (categoryData) => {
    const response = await api.post('/admin/categories', categoryData);
    return response.data;
};

export const deleteCategory = async (categoryId) => {
    const response = await api.delete(`/admin/categories/${categoryId}`);
    return response.data;
};

export const getAdminUsers = async () => {
    const response = await api.get('/admin/users');
    return response.data;
};

export const getAdminOrders = async () => {
    const response = await api.get('/admin/orders');
    return response.data;
};

export const approveAdminOrder = async (orderId) => {
    const response = await api.patch(`/admin/orders/${orderId}/approve`);
    return response.data;
};
