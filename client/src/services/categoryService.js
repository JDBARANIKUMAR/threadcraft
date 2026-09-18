import api from './api';

export const categoryService = {
  getCategories: async () => {
    const res = await api.get('/categories');
    return res.data;
  },
  getAdminCategories: async () => {
    const res = await api.get('/categories/admin');
    return res.data;
  },
  // Admin edit forms resolve the category from the admin list (the public
  // endpoint hides inactive categories)
  getCategory: async (id) => {
    const res = await api.get('/categories/admin');
    const match = (res.data?.data ?? res.data ?? []).find((c) => c._id === id);
    if (!match) throw new Error('Category not found');
    return { data: match };
  },
  createCategory: async (categoryData) => {
    const res = await api.post('/categories', categoryData);
    return res.data;
  },
  updateCategory: async (id, categoryData) => {
    const res = await api.put(`/categories/${id}`, categoryData);
    return res.data;
  },
  deleteCategory: async (id) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  }
};
