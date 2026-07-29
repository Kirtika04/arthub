import api from './api';
export const fetchCart = async () => (await api.get('/cart')).data;
export const persistCartItem = async (item) => (await api.post('/cart', { inventory_id: item.inventory_id, product_id: item.id, quantity: 1 })).data;
export const deleteCartItem = async (inventoryId) => (await api.delete(`/cart/${inventoryId}`)).data;
