import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProductListAdmin from './ProductListAdmin';
import ProductForm from './ProductForm';

const AdminProducts = () => (
  <Routes>
    <Route index element={<ProductListAdmin />} />
    <Route path="create" element={<ProductForm />} />
    <Route path="edit/:id" element={<ProductForm editMode />} />
    <Route path="*" element={<Navigate to=".." replace />} />
  </Routes>
);

export default AdminProducts;
