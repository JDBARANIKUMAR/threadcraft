import api from './api';

export const couponService = {
  validateCoupon: async (code, orderAmount) => {
    const res = await api.post('/coupons/validate', { code, orderAmount });
    return res.data;
  },
  getAllCoupons: async () => {
    const res = await api.get('/coupons');
    return res.data;
  },
  createCoupon: async (couponData) => {
    const res = await api.post('/coupons', couponData);
    return res.data;
  },
  updateCoupon: async (id, couponData) => {
    const res = await api.put(`/coupons/${id}`, couponData);
    return res.data;
  },
  deleteCoupon: async (id) => {
    const res = await api.delete(`/coupons/${id}`);
    return res.data;
  }
};
