import useLocalStorage from '../hooks/useLocalStorage';

export const SETTINGS_KEY = 'meridian-settings';

/**
 * Local user preferences. These are display preferences stored in this browser
 * only — there is no account backend, so they are not shared across devices and
 * are not a security boundary.
 */
export const DEFAULT_SETTINGS = {
  profile: {
    // Filled from the signed-in account (lib/auth.jsx); neutral until then.
    name: 'User',
    title: '',
    email: '',
  },
  preferences: {
    dashboardPeriod: '30',
    tablePageSize: 10,
    reduceMotion: false,
  },
  notifications: {
    recordChanges: true,
    deadlines: true,
    quotationExpiry: true,
  },
};

export function mergeSettings(stored) {
  return {
    profile: { ...DEFAULT_SETTINGS.profile, ...(stored?.profile || {}) },
    preferences: { ...DEFAULT_SETTINGS.preferences, ...(stored?.preferences || {}) },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(stored?.notifications || {}) },
  };
}

export function useSettings() {
  const [stored, setStored] = useLocalStorage(SETTINGS_KEY, DEFAULT_SETTINGS);
  return [mergeSettings(stored), setStored];
}
