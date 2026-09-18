// client/src/components/common/admin/AdminCategories.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './admin.css';
import CategoryListAdmin from './CategoryListAdmin';
import CategoryForm from './CategoryForm';

const AdminCategories = () => {
  return (
    <Routes>
      <Route index element={<CategoryListAdmin />} />
      <Route path="create" element={<CategoryForm />} />
      <Route path="edit/:id" element={<CategoryForm editMode={true} />} />
      <Route path="*" element={<Navigate to=".." replace />} />
    </Routes>
  );
};

export default AdminCategories;
