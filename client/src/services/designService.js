import api from './api';

export const designService = {
  getDesigns: async (params = {}) => {
    // Admin callers (includeInactive) get the full list; customers get active only
    if (params.includeInactive) {
      const res = await api.get('/designs/admin');
      return res.data;
    }
    const res = await api.get('/designs', { params });
    return res.data;
  },
  getAdminDesigns: async () => {
    const res = await api.get('/designs/admin');
    return res.data;
  },
  uploadImage: async (formData) => {
    const res = await api.post('/designs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  createDesign: async (designData) => {
    const res = await api.post('/designs', designData);
    return res.data;
  },
  updateDesign: async (id, designData) => {
    const res = await api.put(`/designs/${id}`, designData);
    return res.data;
  },
  deleteDesign: async (id) => {
    const res = await api.delete(`/designs/${id}`);
    return res.data;
  }
};
