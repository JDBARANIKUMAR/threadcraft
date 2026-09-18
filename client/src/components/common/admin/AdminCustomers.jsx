import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerListAdmin from './CustomerListAdmin';
import CustomerDetailAdmin from './CustomerDetailAdmin';

const AdminCustomers = () => (
  <Routes>
    <Route index element={<CustomerListAdmin />} />
    <Route path=":id" element={<CustomerDetailAdmin />} />
    <Route path="*" element={<Navigate to=".." replace />} />
  </Routes>
);

export default AdminCustomers;
