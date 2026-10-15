import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Dashboard from '../features/dashboard/Dashboard';
import Projects from '../features/projects/Projects';
import CRM from '../features/crm/CRM';
import LMSAnalytics from '../features/lms-analytics/LMSAnalytics';
import SalesAnalytics from '../features/sales-analytics/SalesAnalytics';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/lms-analytics" element={<LMSAnalytics />} />
        <Route path="/sales-analytics" element={<SalesAnalytics />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
