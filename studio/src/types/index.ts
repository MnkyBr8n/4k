// Re-export all types from a single entry point

export * from './character';
export * from './image';
export * from './drawing';

// App-wide settings interface
export interface AppSettings {
  theme: 'light' | 'dark';
  autoSave: boolean;
  syncEnabled: boolean;
  lastSync: string | null;
}

// GitHub configuration
export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

// Activity log entry
export interface ActivityLogEntry {
  id: string;
  type: string;
  description: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

// Storage info
export interface StorageInfo {
  characters: number;
  images: number;
  backgrounds: number;
  totalSize: string;
  available: string;
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  autoSave: true,
  syncEnabled: false,
  lastSync: null,
};

// User type (for simple auth)
export interface User {
  username: string;
  role: 'admin' | 'user';
}
