import api from './api';
export const getAddresses = async () => (await api.get('/users/me/addresses')).data;
export const saveAddress = async address => (await api.post('/users/me/addresses', address)).data;
export const updateAddress = async (id, address) => (await api.patch(`/users/me/addresses/${id}`, address)).data;
export const getProfile = async () => (await api.get('/users/me')).data;
export const updateProfile = async profile => (await api.patch('/users/me', profile)).data;
