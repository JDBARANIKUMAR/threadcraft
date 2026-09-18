import api from './api';

export const settingsService = {
  getSettings: async () => {
    const res = await api.get('/settings');
    return res.data;
  },
  updateSettings: async (data) => {
    const res = await api.put('/settings', data);
    return res.data;
  }
};
