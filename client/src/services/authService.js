import api from './api';

export const authService = {
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await api.put('/auth/profile', data);
    return res.data;
  },
  getAddresses: async () => {
    const res = await api.get('/users/addresses');
    return res.data;
  },
  addAddress: async (addressData) => {
    const res = await api.post('/users/addresses', addressData);
    return res.data;
  },
  updateAddress: async (addressId, addressData) => {
    const res = await api.put(`/users/addresses/${addressId}`, addressData);
    return res.data;
  },
  deleteAddress: async (addressId) => {
    const res = await api.delete(`/users/addresses/${addressId}`);
    return res.data;
  },
  setDefaultAddress: async (addressId) => {
    const res = await api.patch(`/users/addresses/${addressId}/default`);
    return res.data;
  }
};
