import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import LoadingState from '../components/ui/LoadingState';

// Route-level code splitting: each page loads on first visit.

// Core Top-Level Module Pages
const Dashboard = lazy(() => import('../features/dashboard/Dashboard'));
const TrafficOverview = lazy(() => import('../features/traffic/TrafficOverview'));
const Projects = lazy(() => import('../features/projects/Projects'));
const CRM = lazy(() => import('../features/crm/CRM'));
const LMSAnalytics = lazy(() => import('../features/lms-analytics/LMSAnalytics'));
const SalesAnalytics = lazy(() => import('../features/sales-analytics/SalesAnalytics'));

// Authentication Pages
const Login = lazy(() => import('../features/auth/Login'));
const Register = lazy(() => import('../features/auth/Register'));

// Project Management Subpages
const Tasks = lazy(() => import('../features/projects/tasks/Tasks'));
const Team = lazy(() => import('../features/projects/team/Team'));
const Timesheets = lazy(() => import('../features/projects/timesheets/Timesheets'));

// CRM Subpages
const CustomerSegments = lazy(() => import('../features/crm/customer-segments/CustomerSegments'));
const Companies = lazy(() => import('../features/crm/companies/Companies'));
const Contacts = lazy(() => import('../features/crm/contacts/Contacts'));
const Activities = lazy(() => import('../features/crm/activities/Activities'));
const CallsEmails = lazy(() => import('../features/crm/calls-emails/CallsEmails'));

// LMS Analytics Subpages
const CourseCatalog = lazy(() => import('../features/lms-analytics/course-catalog/CourseCatalog'));
const LearnerProfile = lazy(() => import('../features/lms-analytics/learner-profile/LearnerProfile'));
const QuizBuilder = lazy(() => import('../features/lms-analytics/quiz-builder/QuizBuilder'));
const ActivityFeed = lazy(() => import('../features/lms-analytics/activity-feed/ActivityFeed'));

// Sales Analytics Subpages
const Leads = lazy(() => import('../features/sales-analytics/leads/Leads'));
const Deals = lazy(() => import('../features/sales-analytics/deals/Deals'));
const Quotations = lazy(() => import('../features/sales-analytics/quotations/Quotations'));
const Pipeline = lazy(() => import('../features/sales-analytics/pipeline/Pipeline'));

// Workspace (cross-module) Pages
const Calendar = lazy(() => import('../features/calendar/Calendar'));
const Reports = lazy(() => import('../features/reports/Reports'));
const AuditLog = lazy(() => import('../features/audit-log/AuditLog'));
const Settings = lazy(() => import('../features/settings/Settings'));

export default function AppRouter() {
  return (
    <Suspense fallback={<LoadingState text="Loading…" />}>
      <Routes>
        {/* Standalone Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main Application Layout Routes */}
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/traffic-overview" element={<TrafficOverview />} />

          {/* Project Management */}
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/tasks" element={<Tasks />} />
          <Route path="/projects/team" element={<Team />} />
          <Route path="/projects/timesheets" element={<Timesheets />} />

          {/* CRM */}
          <Route path="/crm" element={<CRM />} />
          <Route path="/crm/customer-segments" element={<CustomerSegments />} />
          <Route path="/crm/companies" element={<Companies />} />
          <Route path="/crm/contacts" element={<Contacts />} />
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

          {/* Workspace */}
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback & Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
