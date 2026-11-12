import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { FullScreenLoader } from '../components/ui/MeridianLoader';
import { RequireAuth, useAuth } from '../lib/auth';
import { HOME_PATH, PUBLIC_SIGNUP, isPathVisible, visibleTarget } from './features';
import { canOpenPath } from '../lib/permissions';

// A hidden feature's route stays registered but sends visitors to its visible
// replacement (keeping ?q= search links working) or to the home page.
function HiddenRoute() {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={visibleTarget(`${pathname}${search}${hash}`) || HOME_PATH} replace />;
}

// Pages that need a permission (e.g. Users & Roles) send other roles home.
function PermissionRoute({ path, children }) {
  const { role } = useAuth();
  return canOpenPath(role, path) ? children : <Navigate to={HOME_PATH} replace />;
}

const gate = (path, element) => (isPathVisible(path)
  ? <PermissionRoute path={path}>{element}</PermissionRoute>
  : <HiddenRoute />);

// Sign-out links point here: themed sign-out screen, then /login.
const Logout = lazy(() => import('../features/auth/SignOut'));

// Route-level code splitting: each page loads on first visit.

// Core Top-Level Module Pages
const Dashboard = lazy(() => import('../features/dashboard/Dashboard'));
const TrafficOverview = lazy(() => import('../features/traffic/TrafficOverview'));
const Projects = lazy(() => import('../features/projects/Projects'));
const CRM = lazy(() => import('../features/crm/CRM'));
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
const Accounts = lazy(() => import('../features/crm/accounts/Accounts'));
const Companies = lazy(() => import('../features/crm/companies/Companies'));
const Contacts = lazy(() => import('../features/crm/contacts/Contacts'));
const Activities = lazy(() => import('../features/crm/activities/Activities'));
const CallsEmails = lazy(() => import('../features/crm/calls-emails/CallsEmails'));
const BulkEmail = lazy(() => import('../features/crm/bulk-email/BulkEmail'));
const CallCenter = lazy(() => import('../features/crm/call-center/CallCenter'));

// Website Analytics Subpages
const Leads = lazy(() => import('../features/sales-analytics/leads/Leads'));
const Deals = lazy(() => import('../features/sales-analytics/deals/Deals'));
const Quotations = lazy(() => import('../features/sales-analytics/quotations/Quotations'));
const Pipeline = lazy(() => import('../features/sales-analytics/pipeline/Pipeline'));
const LeadCapture = lazy(() => import('../features/sales-analytics/lead-capture/LeadCapture'));
const PurchaseOrders = lazy(() => import('../features/sales-analytics/purchase-orders/PurchaseOrders'));

// Team Pages
const Attendance = lazy(() => import('../features/team/Attendance'));
const DailyTasks = lazy(() => import('../features/team/DailyTasks'));
const FollowUps = lazy(() => import('../features/team/FollowUps'));
const Leaves = lazy(() => import('../features/team/Leaves'));
const Reminders = lazy(() => import('../features/team/Reminders'));
const DailyReports = lazy(() => import('../features/team/DailyReports'));

// Workspace (cross-module) Pages
const Calendar = lazy(() => import('../features/calendar/Calendar'));
const Chat = lazy(() => import('../features/chat/Chat'));
const Reports = lazy(() => import('../features/reports/Reports'));
const AuditLog = lazy(() => import('../features/audit-log/AuditLog'));
const Settings = lazy(() => import('../features/settings/Settings'));
const Users = lazy(() => import('../features/users/Users'));

export default function AppRouter() {
  return (
    <Suspense fallback={<FullScreenLoader text="Loading Meridian" />}>
      <Routes>
        {/* Standalone Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={PUBLIC_SIGNUP ? <Register /> : <Navigate to="/login" replace />} />
        <Route path="/logout" element={<Logout />} />

        {/* Main Application Layout Routes (signed-in users only) */}
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          {/* Dashboard */}
          <Route path="/dashboard" element={gate('/dashboard', <Dashboard />)} />
          <Route path="/traffic-overview" element={gate('/traffic-overview', <TrafficOverview />)} />

          {/* Project Management */}
          <Route path="/projects" element={gate('/projects', <Projects />)} />
          <Route path="/projects/tasks" element={gate('/projects/tasks', <Tasks />)} />
          <Route path="/projects/team" element={gate('/projects/team', <Team />)} />
          <Route path="/projects/timesheets" element={gate('/projects/timesheets', <Timesheets />)} />

          {/* CRM */}
          <Route path="/crm" element={gate('/crm', <CRM />)} />
          <Route path="/crm/customer-segments" element={gate('/crm/customer-segments', <CustomerSegments />)} />
          <Route path="/crm/accounts" element={gate('/crm/accounts', <Accounts />)} />
          <Route path="/crm/companies" element={gate('/crm/companies', <Companies />)} />
          <Route path="/crm/contacts" element={gate('/crm/contacts', <Contacts />)} />
          <Route path="/crm/activities" element={gate('/crm/activities', <Activities />)} />
          <Route path="/crm/calls-emails" element={gate('/crm/calls-emails', <CallsEmails />)} />
          <Route path="/crm/bulk-email" element={gate('/crm/bulk-email', <BulkEmail />)} />
          <Route path="/crm/call-center" element={gate('/crm/call-center', <CallCenter />)} />

          {/* Website Analytics */}
          <Route path="/sales-analytics" element={gate('/sales-analytics', <SalesAnalytics />)} />
          <Route path="/sales-analytics/leads" element={gate('/sales-analytics/leads', <Leads />)} />
          <Route path="/sales-analytics/deals" element={gate('/sales-analytics/deals', <Deals />)} />
          <Route path="/sales-analytics/quotations" element={gate('/sales-analytics/quotations', <Quotations />)} />
          <Route path="/sales-analytics/pipeline" element={gate('/sales-analytics/pipeline', <Pipeline />)} />
          <Route path="/sales-analytics/lead-capture" element={gate('/sales-analytics/lead-capture', <LeadCapture />)} />
          <Route path="/sales-analytics/purchase-orders" element={gate('/sales-analytics/purchase-orders', <PurchaseOrders />)} />

          {/* Team */}
          <Route path="/team" element={gate('/team/attendance', <Navigate to="/team/attendance" replace />)} />
          <Route path="/team/attendance" element={gate('/team/attendance', <Attendance />)} />
          <Route path="/team/daily-tasks" element={gate('/team/daily-tasks', <DailyTasks />)} />
          <Route path="/team/follow-ups" element={gate('/team/follow-ups', <FollowUps />)} />
          <Route path="/team/leaves" element={gate('/team/leaves', <Leaves />)} />
          <Route path="/team/reminders" element={gate('/team/reminders', <Reminders />)} />
          <Route path="/team/daily-reports" element={gate('/team/daily-reports', <DailyReports />)} />

          {/* Workspace */}
          <Route path="/calendar" element={gate('/calendar', <Calendar />)} />
          <Route path="/chat" element={gate('/chat', <Chat />)} />
          <Route path="/reports" element={gate('/reports', <Reports />)} />
          <Route path="/audit-log" element={gate('/audit-log', <AuditLog />)} />
          <Route path="/users" element={gate('/users', <Users />)} />
          <Route path="/settings" element={gate('/settings', <Settings />)} />
        </Route>

        {/* Fallback & Redirects */}
        <Route path="/" element={<Navigate to={HOME_PATH} replace />} />
        <Route path="*" element={<Navigate to={HOME_PATH} replace />} />
      </Routes>
    </Suspense>
  );
}
