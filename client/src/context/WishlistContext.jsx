import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { readAccountData, writeAccountData } from '../utils/accountStorage';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [accountLoaded, setAccountLoaded] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    setWishlist(readAccountData(user).favorites);
    setAccountLoaded(true);
  }, [user, authLoading]);

  useEffect(() => {
    if (accountLoaded && user) {
      const data = readAccountData(user);
      writeAccountData(user, { ...data, favorites: wishlist });
    }
  }, [wishlist, accountLoaded, user]);

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item._id === product._id);
      if (exists) {
        showToast(`Removed from wishlist`, 'info');
        return prev.filter((item) => item._id !== product._id);
      } else {
        showToast(`Added to wishlist!`, 'success');
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item._id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
