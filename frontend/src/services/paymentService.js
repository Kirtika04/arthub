import api from './api';

export const createPaymentOrder = async (orderId) => {
    const response = await api.post(`/payments/orders/${orderId}`);
    return response.data;
};

export const verifyPayment = async (paymentData) => {
    const response = await api.post('/payments/verify', paymentData);
    return response.data;
};

export const selectCashOnDelivery = async (orderId) => {
    const response = await api.post(`/payments/orders/${orderId}/cod`);
    return response.data;
};
