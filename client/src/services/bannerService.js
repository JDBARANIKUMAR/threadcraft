import api from './api';

export const bannerService = {
  getActiveBanners: async () => {
    const res = await api.get('/banners');
    return res.data;
  },
  // Accepts { all: true } so admin pages share one call signature
  getBanners: async (params = {}) => {
    const res = await api.get('/banners/admin');
    return res.data;
  },
  getAllBanners: async () => {
    const res = await api.get('/banners/admin');
    return res.data;
  },
  createBanner: async (bannerData) => {
    const res = await api.post('/banners', bannerData);
    return res.data;
  },
  updateBanner: async (id, bannerData) => {
    const res = await api.put(`/banners/${id}`, bannerData);
    return res.data;
  },
  deleteBanner: async (id) => {
    const res = await api.delete(`/banners/${id}`);
    return res.data;
  }
};
