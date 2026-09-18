import api from './api';

export const productService = {
  getProducts: async (params = {}) => {
    const res = await api.get('/products', { params });
    return res.data;
  },
  getFeaturedProducts: async () => {
    const res = await api.get('/products/featured');
    return res.data;
  },
  getProductById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },
  createProduct: async (productData) => {
    const res = await api.post('/products', productData);
    return res.data;
  },
  updateProduct: async (id, productData) => {
    const res = await api.put(`/products/${id}`, productData);
    return res.data;
  },
  deleteProduct: async (id) => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  }
};
