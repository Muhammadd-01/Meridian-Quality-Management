/**
 * CRM roles and what each may do — mirrors supabase/roles.sql (Row Level
 * Security) and backend AppRoles.cs. The server enforces these rules; the web
 * app uses them only to hide actions a role cannot perform.
 */
export const ROLES = ['Admin', 'CEO', 'Manager', 'Employee'];

export const PERMISSIONS = {
  'records.view': ['Admin', 'CEO', 'Manager', 'Employee'],
  'records.edit': ['Admin', 'CEO', 'Manager', 'Employee'], // create and edit
  'records.delete': ['Admin', 'CEO', 'Manager'],
  'users.view': ['Admin', 'CEO', 'Manager'],
  'users.manage': ['Admin', 'CEO'], // create users, change roles, activate / deactivate
};

export const PERMISSION_LABELS = {
  'records.view': 'View accounts, contacts, leads and deals',
  'records.edit': 'Create and edit records',
  'records.delete': 'Delete records',
  'users.view': 'See users and their roles',
  'users.manage': 'Create users, change roles, activate / deactivate',
};

export const ROLE_DESCRIPTIONS = {
  Admin: 'Full access, including creating users and changing roles.',
  CEO: 'Full access, including creating users and changing roles.',
  Manager: 'Full access to records; can see users but not create them or change roles.',
  Employee: 'Can view, create and edit records; cannot delete or manage users.',
};

/** Pages that need a permission beyond being signed in. */
export const PAGE_PERMISSIONS = {
  '/users': 'users.view',
};

export function can(role, permission) {
  return !!role && (PERMISSIONS[permission] || []).includes(role);
}

export function canOpenPath(role, path) {
  const permission = PAGE_PERMISSIONS[String(path || '').split(/[?#]/)[0]];
  return !permission || can(role, permission);
}

export const ROLE_BADGE = {
  Admin: 'bg-teal-800 text-primrose',
  CEO: 'bg-accent text-primary-ink',
  Manager: 'bg-info-50 text-info-700',
  Employee: 'bg-gray-100 text-gray-700',
};
