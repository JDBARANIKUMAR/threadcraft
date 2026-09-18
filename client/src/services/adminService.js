import api from './api';

export const adminService = {
  getDashboardStats: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },
  // Alias used by dashboard pages
  getStats: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },
  getCustomers: async (params = {}) => {
    const res = await api.get('/admin/customers', { params });
    return res.data;
  },
  getCustomerById: async (id) => {
    const res = await api.get(`/admin/customers/${id}`);
    return res.data;
  },
  getCustomerOrders: async (id) => {
    const res = await api.get(`/admin/customers/${id}/orders`);
    return res.data;
  },
  deleteCustomer: async (id) => {
    const res = await api.delete(`/admin/customers/${id}`);
    return res.data;
  },
  updateStock: async (productId, stock, colourName) => {
    const res = await api.patch(`/admin/inventory/${productId}`, { stock, colourName });
    return res.data;
  },
  // Orders (they live under /api/orders/admin/*)
  getAllOrders: async (params = {}) => {
    const res = await api.get('/orders/admin/all', { params });
    return res.data;
  },
  getOrderById: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },
  updateOrderStatus: async (id, payload) => {
    const res = await api.put(`/orders/${id}/status`, payload);
    return res.data;
  }
};
