import api from './api';

export const getUserOrders = async () => {
    const response = await api.get('/orders');
    return response.data;
};

export const createOrder = async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
};

export const getOrderDetails = async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
};

export const requestItemReturn = async (orderId, itemId, reason) => {
    const response = await api.post(`/orders/${orderId}/items/${itemId}/return`, { reason });
    return response.data;
};
