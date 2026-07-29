import api from './api';

export const getMyProducts = async () => {
    const response = await api.get('/seller/products');
    return response.data;
};

export const createProduct = async (formData) => {
    const response = await api.post('/seller/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteSellerProduct = async (productId) => {
    const response = await api.delete(`/seller/products/${productId}`);
    return response.data;
};
