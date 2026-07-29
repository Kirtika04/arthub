import api from './api';

export const getAllProducts = async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
};

export const getCategories = async () => {
    const response = await api.get('/products/categories');
    return response.data;
};

export const getProductById = async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};
