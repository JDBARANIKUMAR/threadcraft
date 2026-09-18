import React from 'react';
import ProductList from './ProductList';
import { useLocation } from 'react-router-dom';

const ShopPage = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const query = params.get('search') || '';
  const shirtType = params.get('shirtType') || '';
  const category = params.get('category') || '';

  return (
    <div className="bg-canvas min-h-screen">
      <ProductList searchQuery={query} shirtTypeParam={shirtType} categoryParam={category} />
    </div>
  );
};

export default ShopPage;
