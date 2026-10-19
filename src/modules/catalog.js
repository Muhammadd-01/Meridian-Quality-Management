/**
 * Module catalogue — every page added to match the DreamsCore reference.
 *
 * Each page: { path, label, icon, file?, blurb?, bare? }
 *  - file: component under src/modules/<file>.jsx (loaded lazily by the router).
 *    Pages without `file` already exist in src/features and are routed in app/router.jsx.
 *  - bare: rendered outside the app shell (auth and error screens).
 *  - blurb: what the page provides; shown on the placeholder until the page is built.
 * Groups ({ label, icon, children }) render as expandable items in the sidebar.
 *
 * Ownership: every module folder belongs to exactly one build group (see `owner`)
 * so groups can be built in parallel without touching each other's files.
 */
import {
  LayoutDashboard, ShoppingCart, Brain, PieChart, TrendingUp, GanttChartSquare, Wallet, BookText, Landmark, Bitcoin,
  Truck, Building, Stethoscope, GraduationCap, BookOpenCheck, Hotel, UtensilsCrossed, Bike, Plane, Search, Users,
  UserCog, BarChart3, MessageSquare, Bot, Phone, Video, CalendarDays, Mail, FolderOpen, KanbanSquare, StickyNote,
  ListTodo, Workflow, PanelLeft, Columns2, PanelTop, Layers, Maximize2, Square, RectangleHorizontal, PanelRight,
  ArrowRightLeft, PanelBottom, Moon, Store, Package, ClipboardList, Tags, Star, Database, Gauge, Lightbulb,
  Warehouse, Car, Ship, Home, Receipt, PiggyBank, CreditCard, Send, HandCoins, Globe, LineChart, Vault, HeartPulse,
  CalendarClock, BedDouble, Pill, Ambulance, School, UserCheck, ClipboardCheck, ConciergeBell, Sparkles, ChefHat,
  LayoutGrid, MonitorPlay, MapPin, Map, CarTaxiFront, Sailboat, Luggage, Route, Link2, ScanSearch, Banknote,
  CalendarOff, Award, SlidersHorizontal, UserRound, FileText, ShieldCheck, KeyRound, Grid3x3, Component, FormInput,
  Table2, Smile, User, Bell, LogIn, UserPlus, Lock, Smartphone, AlertOctagon, ServerCrash, HelpCircle, BookOpen,
  History, FileBarChart, Headphones, Activity, Wand2, Palette, Target, DollarSign, BarChart,
} from 'lucide-react';

const P = (path, label, icon, file, blurb, extra = {}) => ({ path, label, icon, file, blurb, ...extra });

// ── MAIN: Dashboards, Applications, Layouts ────────────────────────────────
export const DASHBOARDS = [
  P('/dashboard', 'Dashboard', LayoutDashboard),
  P('/ecommerce', 'Ecommerce', ShoppingCart, 'commerce/pages/EcommerceDashboard', 'Revenue, orders, conversion, top products, category mix and recent orders.'),
  P('/ai-analytics', 'AI Analytics', Brain, 'people/pages/AiDashboard', 'Model accuracy, predictions, anomalies and AI-generated insights.', { badge: 'NEW' }),
  P('/bi', 'Business Intelligence', PieChart, 'commerce/pages/BiDashboard', 'Cross-source KPIs, cohort and funnel analysis, data freshness.'),
  P('/sales-analytics', 'Sales Analytics', TrendingUp),
  P('/projects', 'Project Management', GanttChartSquare),
  P('/finance', 'Finance', Wallet, 'finance/pages/FinanceDashboard', 'Cash position, income vs expenses, budgets and cash-flow forecast.'),
  P('/accounting', 'Accounting', BookText, 'finance/pages/AccountingDashboard', 'P&L, receivables/payables ageing, journal activity and tax due.'),
  P('/banking', 'Banking', Landmark, 'finance/pages/BankingDashboard', 'Balances, card spend, transfers, loan book and FX wires.'),
  P('/crypto', 'Crypto Analytics', Bitcoin, 'finance/pages/CryptoDashboard', 'Portfolio value, allocation, market movers and price trends.'),
  P('/logistics', 'Logistics', Truck, 'logistics/pages/LogisticsDashboard', 'Shipments in transit, on-time rate, fleet status and stock alerts.'),
  P('/real-estate', 'Real Estate', Building, 'logistics/pages/RealEstateDashboard', 'Listings, occupancy, sales pipeline, agent performance.'),
  P('/hospital', 'Hospital Management', Stethoscope, 'people/pages/HospitalDashboard', 'Bed occupancy, emergency queue, appointments, doctor availability.'),
  P('/school', 'School Management', GraduationCap, 'hospitality/pages/SchoolDashboard', 'Enrolment, attendance, exam results and fee collection.'),
  P('/lms-analytics', 'LMS Analytics', BookOpenCheck),
  P('/hotel', 'Hotel Management', Hotel, 'hospitality/pages/HotelDashboard', 'Occupancy, ADR/RevPAR, arrivals and departures, housekeeping status.'),
  P('/restaurant', 'Restaurant POS', UtensilsCrossed, 'hospitality/pages/RestaurantDashboard', 'Sales today, open orders, table turnover, best sellers.'),
  P('/food-delivery', 'Food Delivery', Bike, 'hospitality/pages/FoodDeliveryDashboard', 'Live orders, delivery times, rider utilisation, partner ratings.'),
  P('/travel', 'Travel & Booking', Plane, 'logistics/pages/TravelDashboard', 'Bookings by type, revenue, upcoming trips and cancellations.'),
  P('/seo', 'SEO Analytics', Search, 'hospitality/pages/SeoDashboard', 'Keyword visibility, backlinks, site health and organic traffic.'),
  P('/crm', 'CRM', Users),
  P('/hrm', 'HRM', UserCog, 'people/pages/HrmDashboard', 'Headcount, attendance, payroll cost, leave and review cycle.'),
  P('/traffic-overview', 'Traffic Overview', BarChart3),
];

export const APPLICATIONS = [
  P('/apps/chat', 'Chat', MessageSquare, 'apps/pages/Chat', 'Conversations, groups, attachments, search and unread counts.'),
  P('/apps/ai-chat', 'AI Chat', Bot, 'apps/pages/AiChat', 'Assistant chat with prompt suggestions and saved threads.'),
  P('/apps/voice-call', 'Voice Call', Phone, 'apps/pages/VoiceCall', 'Dialer, call screen with mute/hold, recent calls.'),
  P('/apps/video-call', 'Video Call', Video, 'apps/pages/VideoCall', 'Camera preview, participant grid, controls and call log.'),
  P('/calendar', 'Calendar', CalendarDays),
  P('/apps/email', 'Email', Mail, 'apps/pages/Email', 'Inbox, folders, labels, compose, read and star messages.'),
  P('/apps/files', 'File Manager', FolderOpen, 'apps/pages/FileManager', 'Folders, upload, grid/list views, storage usage, recent files.'),
  P('/apps/kanban', 'Kanban', KanbanSquare, 'apps/pages/Kanban', 'Boards with drag-and-drop cards, labels, assignees, due dates.'),
  P('/apps/notes', 'Notes', StickyNote, 'apps/pages/Notes', 'Coloured notes, pin, tag, search and archive.'),
  P('/apps/todo', 'To Do', ListTodo, 'apps/pages/Todo', 'Task lists with priorities, due dates, filters and completion.'),
  P('/apps/workflows', 'Workflow & Approvals', Workflow, 'apps/pages/Workflows', 'Approval requests, multi-step workflows, approve/reject with comments.'),
];

const layout = (slug, label, icon, blurb) => P(`/layouts/${slug}`, label, icon, 'platform/pages/LayoutDemo', blurb);
export const LAYOUTS = [
  layout('detached-sidebar', 'Detached Sidebar', PanelLeft, 'Floating sidebar card separated from the screen edge.'),
  layout('two-sidebar', 'Two Sidebar Layout', Columns2, 'Icon rail plus a contextual secondary sidebar.'),
  layout('horizontal-menu', 'Horizontal Menu Layout', PanelTop, 'Top navigation bar instead of a sidebar.'),
  layout('stacked-header', 'Stacked Header Layout', Layers, 'Header with a second navigation row beneath it.'),
  layout('transparent-header', 'Transparent Header Layout', RectangleHorizontal, 'Header blends into the page until you scroll.'),
  layout('fullscreen', 'Fullscreen Layout', Maximize2, 'Content only, navigation hidden behind a toggle.'),
  layout('container', 'Container Layout', Square, 'Boxed content with a maximum width.'),
  layout('wide', 'Wide Layout', ArrowRightLeft, 'Edge-to-edge content for data-dense screens.'),
  layout('right-sidebar', 'Right Sidebar Layout', PanelRight, 'Navigation on the right-hand side.'),
  layout('rtl', 'RTL Layout', ArrowRightLeft, 'Right-to-left direction for Arabic and Urdu.'),
  layout('bottom-navigation', 'Bottom Navigation Layout', PanelBottom, 'Mobile-style tab bar at the bottom.'),
  layout('dark-mode', 'Dark Mode Layout', Moon, 'The whole workspace in dark mode.'),
];

// ── Module sections (owner = build group) ──────────────────────────────────
export const MODULE_SECTIONS = [
  {
    id: 'ecommerce', title: 'Ecommerce', owner: 'commerce', home: '/ecommerce',
    items: [
      P('/ecommerce/storefront', 'Storefront', Store, 'commerce/pages/Storefront', 'Store profile, configuration, maintenance mode and activity.'),
      P('/ecommerce/products', 'Products', Package, 'commerce/pages/Products', 'Product catalogue with SKU, price, stock, category and status.'),
      P('/ecommerce/orders', 'Orders', ClipboardList, 'commerce/pages/Orders', 'Orders with status workflow, payment and fulfilment tracking.'),
      P('/ecommerce/categories', 'Categories', Tags, 'commerce/pages/Categories', 'Category tree with product counts and visibility.'),
      P('/ecommerce/reviews', 'Reviews', Star, 'commerce/pages/Reviews', 'Customer reviews with rating, moderation and replies.'),
    ],
  },
  {
    id: 'bi', title: 'Business Intelligence', owner: 'commerce', home: '/bi',
    items: [
      P('/bi/overview', 'BI Overview', PieChart, 'commerce/pages/BiOverview', 'Executive summary across all modules.'),
      P('/bi/data-sources', 'Data Sources', Database, 'commerce/pages/DataSources', 'Connected collections, record counts, freshness and sync status.'),
      P('/bi/kpi-builder', 'KPI Builder', Gauge, 'commerce/pages/KpiBuilder', 'Build saved KPIs from any collection, field and aggregation.'),
      P('/bi/insights', 'Insights', Lightbulb, 'commerce/pages/Insights', 'Rule-based insights and anomalies from live records.'),
    ],
  },
  {
    id: 'logistics', title: 'Logistics', owner: 'logistics', home: '/logistics',
    items: [
      P('/logistics/inventory', 'Inventory', Warehouse, 'logistics/pages/Inventory', 'Stock by SKU and warehouse, reorder levels and alerts.'),
      P('/logistics/stock-transfers', 'Stock Transfer', ArrowRightLeft, 'logistics/pages/StockTransfers', 'Transfers between warehouses with status workflow.'),
      P('/logistics/purchase-orders', 'Purchase Orders', FileText, 'logistics/pages/PurchaseOrders', 'POs with line totals, approval and receiving.'),
      P('/logistics/suppliers', 'Suppliers', Building, 'logistics/pages/Suppliers', 'Supplier directory with rating, lead time and spend.'),
      P('/logistics/vehicles', 'Vehicles', Car, 'logistics/pages/Vehicles', 'Fleet register, service dates, driver and status.'),
      P('/logistics/shipments', 'Shipments', Ship, 'logistics/pages/Shipments', 'Shipment tracking with milestones and delivery status.'),
    ],
  },
  {
    id: 'real-estate', title: 'Real Estate', owner: 'logistics', home: '/real-estate',
    items: [
      P('/real-estate/properties', 'Properties', Home, 'logistics/pages/Properties', 'Property portfolio with type, size, value and occupancy.'),
      P('/real-estate/listings', 'Property Listings', LayoutGrid, 'logistics/pages/Listings', 'Listings for sale/rent with price, status and views.'),
      P('/real-estate/agents', 'Agents', UserRound, 'logistics/pages/Agents', 'Agents with listings, closed deals and commission.'),
      P('/real-estate/leads', 'Leads', Target, 'logistics/pages/PropertyLeads', 'Buyer/tenant enquiries with budget and stage.'),
    ],
  },
  {
    id: 'finance', title: 'Finance', owner: 'finance', home: '/finance',
    items: [
      P('/finance/accounts', 'Accounts', Wallet, 'finance/pages/FinanceAccounts', 'Cash and bank accounts with balances and currency.'),
      P('/finance/transactions', 'Transactions', ArrowRightLeft, 'finance/pages/Transactions', 'Income and expense transactions with categories.'),
      P('/finance/budgets', 'Budgets', PiggyBank, 'finance/pages/Budgets', 'Budgets by category with actual vs planned.'),
      P('/finance/expenses', 'Expenses', Receipt, 'finance/pages/Expenses', 'Expense claims with receipts and approval.'),
    ],
  },
  {
    id: 'accounting', title: 'Accounting', owner: 'finance', home: '/accounting',
    items: [
      P('/accounting/ledger', 'Ledger', BookText, 'finance/pages/Ledger', 'General ledger journal entries with balanced debits/credits.'),
      P('/accounting/invoices', 'Invoices', FileText, 'finance/pages/AccountingInvoices', 'Invoice workspace with line items, tax and payment status.'),
      P('/accounting/tax-reports', 'Tax Reports', Receipt, 'finance/pages/TaxReports', 'Tax filing centre: periods, liabilities and filing status.'),
      P('/accounting/reconciliation', 'Reconciliation', ClipboardCheck, 'finance/pages/Reconciliation', 'Match bank lines to ledger entries.'),
    ],
  },
  {
    id: 'banking', title: 'Banking', owner: 'finance', home: '/banking',
    items: [
      P('/banking/accounts', 'Accounts', Landmark, 'finance/pages/BankAccounts', 'Bank accounts with statements and balances.'),
      P('/banking/cards', 'Cards', CreditCard, 'finance/pages/Cards', 'Card gallery with limits, spend and freeze controls.'),
      P('/banking/transfers', 'Transfers', Send, 'finance/pages/Transfers', 'Local transfers with beneficiaries and status.'),
      P('/banking/loans', 'Loans', HandCoins, 'finance/pages/Loans', 'Loan book with schedules, rate and outstanding balance.'),
      P('/banking/wires', "Int'l Wires", Globe, 'finance/pages/Wires', 'International wires with FX rate and fees.'),
    ],
  },
  {
    id: 'crypto', title: 'Crypto Analytics', owner: 'finance', home: '/crypto',
    items: [
      P('/crypto/portfolio', 'Portfolio', PieChart, 'finance/pages/Portfolio', 'Holdings, allocation and profit/loss.'),
      P('/crypto/market-watch', 'Market Watch', LineChart, 'finance/pages/MarketWatch', 'Watchlist with price, 24h change and volume.'),
      P('/crypto/trends', 'Trends', TrendingUp, 'finance/pages/CryptoTrends', 'Price history charts and moving-average signals.'),
      P('/crypto/vault', 'Vault', Vault, 'finance/pages/CryptoVault', 'Wallet addresses, deposits and withdrawals log.'),
    ],
  },
  {
    id: 'hospital', title: 'Hospital Management', owner: 'people', home: '/hospital',
    items: [
      P('/hospital/patients', 'Patients', HeartPulse, 'people/pages/Patients', 'Patient records with condition, ward and status.'),
      P('/hospital/doctors', 'Doctors', Stethoscope, 'people/pages/Doctors', 'Doctor directory with specialty, schedule and availability.'),
      P('/hospital/appointments', 'Appointments', CalendarClock, 'people/pages/Appointments', 'Appointment book with status and check-in.'),
      P('/hospital/wards', 'Wards & Beds', BedDouble, 'people/pages/Wards', 'Floor layout of wards and bed occupancy.'),
      P('/hospital/pharmacy', 'Pharmacy', Pill, 'people/pages/Pharmacy', 'Medicine catalogue with stock and expiry.'),
      P('/hospital/ambulance', 'Ambulance', Ambulance, 'people/pages/AmbulanceDispatch', 'Emergency dispatch board and ambulance status.'),
      P('/hospital/billing', 'Billing', Receipt, 'people/pages/HospitalBilling', 'Patient bills, insurance claims and payments.'),
    ],
  },
  {
    id: 'school', title: 'School Management', owner: 'hospitality', home: '/school',
    items: [
      P('/school/students', 'Students', GraduationCap, 'hospitality/pages/Students', 'Student directory with class, guardian and fees.'),
      P('/school/classes', 'Classes', School, 'hospitality/pages/Classes', 'Classes with teacher, timetable and roster.'),
      P('/school/attendance', 'Attendance', UserCheck, 'hospitality/pages/Attendance', 'Daily attendance register by class.'),
      P('/school/exams', 'Exams', ClipboardCheck, 'hospitality/pages/Exams', 'Exam planner with results and grade distribution.'),
    ],
  },
  {
    id: 'hotel', title: 'Hotel Management', owner: 'hospitality', home: '/hotel',
    items: [
      P('/hotel/rooms', 'Rooms', BedDouble, 'hospitality/pages/Rooms', 'Room explorer with type, rate and status.'),
      P('/hotel/reservations', 'Reservations', CalendarClock, 'hospitality/pages/Reservations', 'Reservation timeline with check-in/out.'),
      P('/hotel/guests', 'Guests', Users, 'hospitality/pages/Guests', 'Guest directory with stays and preferences.'),
      P('/hotel/housekeeping', 'Housekeeping', Sparkles, 'hospitality/pages/Housekeeping', 'Housekeeping task board by room.'),
    ],
  },
  {
    id: 'restaurant', title: 'Restaurant POS', owner: 'hospitality', home: '/restaurant',
    items: [
      P('/restaurant/orders', 'Orders', ClipboardList, 'hospitality/pages/RestaurantOrders', 'POS order board from new to served.'),
      P('/restaurant/menu', 'Menu', ChefHat, 'hospitality/pages/MenuBuilder', 'Menu builder with categories, prices and availability.'),
      P('/restaurant/tables', 'Tables', LayoutGrid, 'hospitality/pages/Tables', 'Table floor map with seating status.'),
      P('/restaurant/kitchen', 'Kitchen Display', MonitorPlay, 'hospitality/pages/KitchenDisplay', 'Kitchen display queue with timers.'),
    ],
  },
  {
    id: 'food-delivery', title: 'Food Delivery', owner: 'hospitality', home: '/food-delivery',
    items: [
      P('/food-delivery/live-orders', 'Live Orders', MapPin, 'hospitality/pages/LiveOrders', 'Live order tracking from kitchen to door.'),
      P('/food-delivery/riders', 'Riders', Bike, 'hospitality/pages/Riders', 'Rider profiles, ratings and earnings.'),
      P('/food-delivery/restaurants', 'Restaurants', Store, 'hospitality/pages/PartnerRestaurants', 'Partner restaurants with ratings and commission.'),
      P('/food-delivery/zones', 'Delivery Zones', Map, 'hospitality/pages/DeliveryZones', 'Delivery zones with fees and coverage.'),
    ],
  },
  {
    id: 'travel', title: 'Travel & Booking', owner: 'logistics', home: '/travel',
    items: [
      P('/travel/flights', 'Flights', Plane, 'logistics/pages/Flights', 'Flight bookings with route, fare and status.'),
      P('/travel/cabs', 'Cabs', CarTaxiFront, 'logistics/pages/Cabs', 'Cab bookings with pickup, drop and fare.'),
      P('/travel/cruises', 'Cruises', Sailboat, 'logistics/pages/Cruises', 'Cruise packages and cabin bookings.'),
      P('/travel/trips', 'Trips', Luggage, 'logistics/pages/Trips', 'Trip packages with dates and travellers.'),
      P('/travel/bookings', 'Bookings', ClipboardList, 'logistics/pages/TravelBookings', 'All bookings across travel types.'),
      P('/travel/itineraries', 'Itineraries', Route, 'logistics/pages/Itineraries', 'Day-by-day itineraries.'),
    ],
  },
  {
    id: 'seo', title: 'SEO Analytics', owner: 'hospitality', home: '/seo',
    items: [
      P('/seo/keywords', 'Keyword Rank', Search, 'hospitality/pages/Keywords', 'Tracked keywords with position, change and volume.'),
      P('/seo/backlinks', 'Backlinks', Link2, 'hospitality/pages/Backlinks', 'Referring domains with authority and status.'),
      P('/seo/site-audit', 'Site Audit', ScanSearch, 'hospitality/pages/SiteAudit', 'Audit issues by severity with fix tracking.'),
      P('/traffic-overview', 'Traffic', BarChart3),
    ],
  },
  {
    id: 'hrm', title: 'HRM', owner: 'people', home: '/hrm',
    items: [
      P('/hrm/employees', 'Employees', Users, 'people/pages/Employees', 'Employee directory with department, role and status.'),
      P('/hrm/payroll', 'Payroll', Banknote, 'people/pages/Payroll', 'Payroll runs with gross, deductions and net pay.'),
      P('/hrm/leave', 'Leave Requests', CalendarOff, 'people/pages/LeaveRequests', 'Leave requests with balances and approvals.'),
      P('/hrm/reviews', 'Performance Reviews', Award, 'people/pages/PerformanceReviews', 'Review cycles, ratings and goals.'),
    ],
  },
  {
    id: 'ai', title: 'AI Analytics', owner: 'people', home: '/ai-analytics',
    items: [
      P('/ai/insights', 'AI Insights', Lightbulb, 'people/pages/AiInsights', 'Generated insights with confidence and status.'),
      P('/ai/chatbot', 'Chatbot Assistant', Bot, 'people/pages/ChatbotConversations', 'Chatbot conversations, intents and satisfaction.'),
      P('/ai/predictions', 'Predictions', TrendingUp, 'people/pages/Predictions', 'Prediction runs with accuracy and drift.'),
      P('/ai/model-settings', 'Model Settings', SlidersHorizontal, 'people/pages/ModelSettings', 'Model configuration, thresholds and versions.'),
    ],
  },
  {
    id: 'management', title: 'Management', owner: 'commerce',
    items: [
      P('/management/customers', 'Customers', Users, 'commerce/pages/Customers', 'Customer explorer with lifetime value and segments.'),
      P('/management/invoices', 'Invoices', FileText, 'commerce/pages/CustomerInvoices', 'Customer invoices with due dates and status.'),
      P('/management/payments', 'Payments', CreditCard, 'commerce/pages/Payments', 'Payment centre: received, pending and refunded.'),
      {
        label: 'Users & Access', icon: ShieldCheck, children: [
          P('/access/users', 'Users', User, 'people/pages/AccessUsers', 'User directory with role, status and last login.'),
          P('/access/roles', 'Roles', KeyRound, 'people/pages/Roles', 'Role builder with assigned users.'),
          P('/access/permissions', 'Permissions', Grid3x3, 'people/pages/Permissions', 'Permission matrix by role and module.'),
        ],
      },
    ],
  },
  {
    id: 'reports', title: 'Reports', owner: 'mixed',
    items: [
      {
        label: 'Sales & Ecommerce', icon: DollarSign, owner: 'commerce', children: [
          P('/reports/sales', 'Sales', DollarSign, 'commerce/pages/reports/SalesReport'),
          P('/reports/revenue', 'Revenue', TrendingUp, 'commerce/pages/reports/RevenueReport'),
          P('/reports/product-performance', 'Product Performance', Package, 'commerce/pages/reports/ProductPerformanceReport'),
          P('/reports/order-summary', 'Order Summary', ClipboardList, 'commerce/pages/reports/OrderSummaryReport'),
          P('/reports/discounts', 'Discount & Coupon', Tags, 'commerce/pages/reports/DiscountReport'),
          P('/reports/customer-purchases', 'Customer Purchase', Users, 'commerce/pages/reports/CustomerPurchaseReport'),
          P('/reports/cart-abandonment', 'Cart Abandonment', ShoppingCart, 'commerce/pages/reports/CartAbandonmentReport'),
        ],
      },
      {
        label: 'Inventory & Logistics', icon: Warehouse, owner: 'logistics', children: [
          P('/reports/stock-summary', 'Stock Summary', Warehouse, 'logistics/pages/reports/StockSummaryReport'),
          P('/reports/stock-movement', 'Stock Movement', ArrowRightLeft, 'logistics/pages/reports/StockMovementReport'),
          P('/reports/purchase-orders', 'Purchase Order', FileText, 'logistics/pages/reports/PurchaseOrderReport'),
          P('/reports/supplier-performance', 'Supplier Performance', Building, 'logistics/pages/reports/SupplierPerformanceReport'),
          P('/reports/shipments', 'Shipment / Delivery', Truck, 'logistics/pages/reports/ShipmentReport'),
        ],
      },
      {
        label: 'CRM & Sales Pipeline', icon: Target, owner: 'platform', children: [
          P('/reports/lead-conversion', 'Lead Conversion', Target, 'platform/pages/reports/LeadConversionReport'),
          P('/reports/deals-pipeline', 'Deals Pipeline', BarChart, 'platform/pages/reports/DealsPipelineReport'),
          P('/reports/sales-reps', 'Sales Rep Performance', Award, 'platform/pages/reports/SalesRepReport'),
          P('/reports/crm-activity', 'Activity', Activity, 'platform/pages/reports/CrmActivityReport'),
        ],
      },
      {
        label: 'HRM', icon: UserCog, owner: 'people', children: [
          P('/reports/attendance', 'Attendance', UserCheck, 'people/pages/reports/AttendanceReport'),
          P('/reports/payroll', 'Payroll', Banknote, 'people/pages/reports/PayrollReport'),
          P('/reports/leave', 'Leave', CalendarOff, 'people/pages/reports/LeaveReport'),
          P('/reports/employee-performance', 'Employee Performance', Award, 'people/pages/reports/EmployeePerformanceReport'),
        ],
      },
      {
        label: 'Project Management', icon: GanttChartSquare, owner: 'platform', children: [
          P('/reports/project-progress', 'Project Progress', GanttChartSquare, 'platform/pages/reports/ProjectProgressReport'),
          P('/reports/task-completion', 'Task Completion', ClipboardCheck, 'platform/pages/reports/TaskCompletionReport'),
          P('/reports/time-tracking', 'Time Tracking', CalendarClock, 'platform/pages/reports/TimeTrackingReport'),
          P('/reports/resource-utilization', 'Resource Utilization', Users, 'platform/pages/reports/ResourceUtilizationReport'),
        ],
      },
      {
        label: 'Support / Helpdesk', icon: Headphones, owner: 'people', children: [
          P('/reports/tickets', 'Ticket Summary', ClipboardList, 'people/pages/reports/TicketSummaryReport'),
          P('/reports/agent-performance', 'Agent Performance', Award, 'people/pages/reports/AgentPerformanceReport'),
          P('/reports/sla', 'SLA Compliance', ShieldCheck, 'people/pages/reports/SlaComplianceReport'),
        ],
      },
      {
        label: 'General', icon: FileBarChart, owner: 'platform', children: [
          P('/reports/traffic', 'Traffic', BarChart3, 'platform/pages/reports/TrafficReport'),
          P('/reports/user-activity', 'User Activity', Activity, 'platform/pages/reports/UserActivityReport'),
          P('/reports/audit', 'Audit Log', History, 'platform/pages/reports/AuditReport'),
          P('/reports/system-usage', 'System Usage', Database, 'platform/pages/reports/SystemUsageReport'),
        ],
      },
      P('/reports/builder', 'Custom Report Builder', Wand2, 'platform/pages/ReportBuilder', 'Pick a collection, fields, filters, grouping and chart; save and export.'),
      P('/reports', 'Report Library', FileBarChart),
      P('/activity-log', 'Activity Log', History, 'platform/pages/ActivityLog', 'Timeline of everything that happened in this workspace.'),
    ],
  },
  {
    id: 'ui', title: 'UI Elements', owner: 'uikit',
    items: [
      {
        label: 'Base UI', icon: Component, children: [
          ['alerts', 'Alerts'], ['accordion', 'Accordion'], ['avatar', 'Avatar'], ['badges', 'Badges'], ['buttons', 'Buttons'],
          ['button-group', 'Button Group'], ['breadcrumb', 'Breadcrumb'], ['cards', 'Card'], ['colors', 'Colors'], ['collapse', 'Collapse'],
          ['dropdowns', 'Dropdowns'], ['grid', 'Grid'], ['images', 'Images'], ['modals', 'Modals'], ['offcanvas', 'Offcanvas'],
          ['pagination', 'Pagination'], ['popovers', 'Popovers'], ['progress', 'Progress'], ['tabs', 'Tabs'], ['typography', 'Typography'],
          ['drag-drop', 'Drag & Drop'], ['clipboard', 'Clipboard'], ['range-slider', 'Range Slider'], ['lightbox', 'Lightbox'],
        ].map(([slug, label]) => P(`/ui/${slug}`, label, Palette, `uikit/pages/${slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')}`)),
      },
      {
        label: 'Forms', icon: FormInput, children: [
          P('/ui/form-elements', 'Form Elements', FormInput, 'uikit/pages/FormElements'),
          P('/ui/select', 'Select & Multi-select', FormInput, 'uikit/pages/SelectInputs'),
          P('/ui/pickers', 'Date & Colour Pickers', FormInput, 'uikit/pages/Pickers'),
        ],
      },
      {
        label: 'Tables', icon: Table2, children: [
          P('/ui/basic-tables', 'Basic Tables', Table2, 'uikit/pages/BasicTables'),
          P('/ui/data-tables', 'Data Tables', Table2, 'uikit/pages/DataTables'),
        ],
      },
      {
        label: 'Charts', icon: BarChart3, children: [
          P('/ui/charts-line-bar', 'Line & Bar Charts', LineChart, 'uikit/pages/ChartsLineBar'),
          P('/ui/charts-pie-radar', 'Pie, Radar & More', PieChart, 'uikit/pages/ChartsPieRadar'),
        ],
      },
      P('/ui/icons', 'Icons', Smile, 'uikit/pages/Icons', 'Searchable Lucide icon library with copy-to-clipboard.'),
    ],
  },
  {
    id: 'pages', title: 'Pages', owner: 'platform',
    items: [
      {
        label: 'Account', icon: User, children: [
          P('/account/profile', 'Profile', User, 'platform/pages/Profile', 'Profile overview with activity, skills and contact details.'),
          P('/settings', 'Settings', SlidersHorizontal),
          P('/account/notifications', 'Notifications', Bell, 'platform/pages/NotificationsCenter', 'Full notification centre with filters and preferences.'),
        ],
      },
      {
        label: 'Authentication', icon: LogIn, children: [
          P('/login', 'Login', LogIn),
          P('/register', 'Register', UserPlus),
          P('/auth/forgot-password', 'Forgot Password', KeyRound, 'platform/pages/ForgotPassword', '', { bare: true }),
          P('/auth/reset-password', 'Reset Password', Lock, 'platform/pages/ResetPassword', '', { bare: true }),
          P('/auth/lock-screen', 'Lock Screen', Lock, 'platform/pages/LockScreen', '', { bare: true }),
          P('/auth/two-factor', 'Two-Factor Auth', Smartphone, 'platform/pages/TwoFactor', '', { bare: true }),
        ],
      },
      {
        label: 'Error Pages', icon: AlertOctagon, children: [
          P('/error/404', '404 Not Found', AlertOctagon, 'platform/pages/NotFound', '', { bare: true }),
          P('/error/500', '500 Server Error', ServerCrash, 'platform/pages/ServerError', '', { bare: true }),
        ],
      },
    ],
  },
  {
    id: 'support', title: 'Support', owner: 'platform',
    items: [
      P('/help', 'Documentation', BookOpen, 'platform/pages/Documentation', 'In-app guide to every module and how data is stored.'),
      P('/faq', 'FAQ', HelpCircle, 'platform/pages/Faq', 'Searchable frequently asked questions.'),
      P('/changelog', 'Changelog', History, 'platform/pages/Changelog', 'Release notes for each version of Meridian.'),
    ],
  },
];

/** Flatten nested groups into page entries (with their section). */
export function flattenItems(items, section) {
  return items.flatMap(it => (it.children ? flattenItems(it.children, section) : [{ ...it, section }]));
}

/** Every catalogue page that has its own component file. */
export const CATALOG_PAGES = [
  ...DASHBOARDS.map(p => ({ ...p, section: { id: 'dashboards', title: 'Dashboards' } })),
  ...APPLICATIONS.map(p => ({ ...p, section: { id: 'apps', title: 'Applications' } })),
  ...LAYOUTS.map(p => ({ ...p, section: { id: 'layouts', title: 'Layouts' } })),
  ...MODULE_SECTIONS.flatMap(s => flattenItems(s.items, { id: s.id, title: s.title, home: s.home })),
].filter(p => p.file);
