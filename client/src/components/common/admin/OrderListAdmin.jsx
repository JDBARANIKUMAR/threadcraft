import React from 'react';
import AdminOrders from './AdminOrders';

// Legacy entry kept so any older import path still resolves to the single,
// unified orders system (list + detail). There is only one orders UI now.
const OrderListAdmin = (props) => <AdminOrders {...props} />;

export default OrderListAdmin;
