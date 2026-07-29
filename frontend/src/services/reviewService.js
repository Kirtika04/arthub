import api from './api';

export const getProductReviews = async (productId) => {
    const response = await api.get(`/products/${productId}/reviews`);
    return response.data;
};

export const addProductReview = async (productId, reviewData) => {
    const response = await api.post(`/products/${productId}/reviews`, reviewData);
    return response.data;
};
