import React from 'react';
import { AdminFinancialView } from './AdminFinancialView';

export const FinancialManagementView: React.FC<{ adminUser: any }> = ({ adminUser }) => {
  return <AdminFinancialView adminUser={adminUser} />;
};

export default FinancialManagementView;
