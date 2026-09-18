// client/src/components/common/admin/LoadingSpinner.jsx
import React from 'react';
import './admin.css';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-4">
    <div className="spinner border-4 border-t-4 border-gray-200 border-t-primary rounded-full w-8 h-8 animate-spin" />
  </div>
);

export default LoadingSpinner;
