import api from './api';

export const orderService = {
  createOrder: async (orderData) => {
    const res = await api.post('/orders', orderData);
    return res.data;
  },
  getMyOrders: async () => {
    const res = await api.get('/orders/my-orders');
    return res.data;
  },
  getOrderById: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },
  getAllOrders: async (params = {}) => {
    const res = await api.get('/orders/admin/all', { params });
    return res.data;
  },
  updateOrderStatus: async (id, statusData) => {
    const res = await api.put(`/orders/${id}/status`, statusData);
    return res.data;
  }
};
