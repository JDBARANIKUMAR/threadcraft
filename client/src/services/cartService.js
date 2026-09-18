import api from './api';

export const cartService = {
  getCart: async () => {
    const res = await api.get('/cart');
    return res.data;
  },
  addToCart: async (itemData) => {
    const res = await api.post('/cart', itemData);
    return res.data;
  },
  updateQuantity: async (itemId, quantity) => {
    const res = await api.put(`/cart/item/${itemId}`, { quantity });
    return res.data;
  },
  removeItem: async (itemId) => {
    const res = await api.delete(`/cart/item/${itemId}`);
    return res.data;
  },
  clearCart: async () => {
    const res = await api.delete('/cart');
    return res.data;
  }
};
