// Same-tab change notification. The native `storage` event only fires in
// *other* tabs, so hooks listen for this event to stay in sync within a tab.
export const STORAGE_CHANGE_EVENT = 'meridian-storage-change';

export function getStorageItem(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem(key, value, source) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyStorageChange(key, source);
    return true;
  } catch {
    return false;
  }
}

export function removeStorageItem(key) {
  try {
    localStorage.removeItem(key);
    notifyStorageChange(key);
  } catch {
    // silent
  }
}

export function notifyStorageChange(key, source) {
  try {
    window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { key, source } }));
  } catch {
    // non-browser environment
  }
}
