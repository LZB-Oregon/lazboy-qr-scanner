export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';


// Store Locations (9 locations for La-Z-Boy Oregon)
export const STORE_LOCATIONS = [
  { code: '00', name: 'Warehouse' },
  { code: '01', name: 'Delta Park' },
  { code: '02', name: 'Tualatin' },
  { code: '03', name: 'Happy Valley' },
  { code: '04', name: 'Tanasbourne' },
  { code: '05', name: 'Salem' },
  { code: '07', name: 'Eugene' },
  { code: '08', name: 'Delta Park' },
  { code: '09', name: 'Phoenix' },
] as const;

export type StoreCode = typeof STORE_LOCATIONS[number]['code'];

// 7-Checkpoint Location Tracking Workflow
export const LOCATION_CHECKPOINTS = [
  { id: 1, label: 'Dropped at Store', color: 'bg-blue-600' },
  { id: 2, label: 'On Transfer Truck', color: 'bg-purple-600' },
  { id: 3, label: 'Received at Warehouse', color: 'bg-indigo-600' },
  { id: 4, label: 'In Repair', color: 'bg-orange-600' },
  { id: 5, label: 'Repair Complete', color: 'bg-green-600' },
  { id: 6, label: 'Staged for Delivery', color: 'bg-cyan-600' },
  { id: 7, label: 'Back at Store or Customer', color: 'bg-emerald-600' },
] as const;

export type LocationCheckpoint = typeof LOCATION_CHECKPOINTS[number]['id'];
