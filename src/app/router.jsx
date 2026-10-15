import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';

// Core Top-Level Module Pages
import Dashboard from '../features/dashboard/Dashboard';
import Projects from '../features/projects/Projects';
import CRM from '../features/crm/CRM';
import LMSAnalytics from '../features/lms-analytics/LMSAnalytics';
import SalesAnalytics from '../features/sales-analytics/SalesAnalytics';

// Authentication Pages
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';

// Project Management Subpages
import Tasks from '../features/projects/tasks/Tasks';
import Team from '../features/projects/team/Team';
import Timesheets from '../features/projects/timesheets/Timesheets';

// CRM Subpages
import CustomerSegments from '../features/crm/customer-segments/CustomerSegments';
import Companies from '../features/crm/companies/Companies';
import Activities from '../features/crm/activities/Activities';
import CallsEmails from '../features/crm/calls-emails/CallsEmails';

// LMS Analytics Subpages
import CourseCatalog from '../features/lms-analytics/course-catalog/CourseCatalog';
import LearnerProfile from '../features/lms-analytics/learner-profile/LearnerProfile';
import QuizBuilder from '../features/lms-analytics/quiz-builder/QuizBuilder';
import ActivityFeed from '../features/lms-analytics/activity-feed/ActivityFeed';

// Sales Analytics Subpages
import Leads from '../features/sales-analytics/leads/Leads';
import Deals from '../features/sales-analytics/deals/Deals';
import Quotations from '../features/sales-analytics/quotations/Quotations';
import Pipeline from '../features/sales-analytics/pipeline/Pipeline';

export default function AppRouter() {
  return (
    <Routes>
      {/* Standalone Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Main Application Layout Routes */}
      <Route element={<AppLayout />}>
        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Project Management */}
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/tasks" element={<Tasks />} />
        <Route path="/projects/team" element={<Team />} />
        <Route path="/projects/timesheets" element={<Timesheets />} />

        {/* CRM */}
        <Route path="/crm" element={<CRM />} />
        <Route path="/crm/customer-segments" element={<CustomerSegments />} />
        <Route path="/crm/companies" element={<Companies />} />
        <Route path="/crm/activities" element={<Activities />} />
        <Route path="/crm/calls-emails" element={<CallsEmails />} />

        {/* LMS Analytics */}
        <Route path="/lms-analytics" element={<LMSAnalytics />} />
        <Route path="/lms-analytics/course-catalog" element={<CourseCatalog />} />
        <Route path="/lms-analytics/learner-profile" element={<LearnerProfile />} />
        <Route path="/lms-analytics/quiz-builder" element={<QuizBuilder />} />
        <Route path="/lms-analytics/activity-feed" element={<ActivityFeed />} />

        {/* Sales Analytics */}
        <Route path="/sales-analytics" element={<SalesAnalytics />} />
        <Route path="/sales-analytics/leads" element={<Leads />} />
        <Route path="/sales-analytics/deals" element={<Deals />} />
        <Route path="/sales-analytics/quotations" element={<Quotations />} />
        <Route path="/sales-analytics/pipeline" element={<Pipeline />} />
      </Route>

      {/* Fallback & Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
