/**
 * Auto Update Store
 *
 * Story 13.51: 自动更新集成
 *
 * Zustand store for managing auto-update state
 */

import { create } from 'zustand';
import {
  autoUpdateClient,
  UpdateStatus,
  type UpdateInfo,
  type UpdateProgress,
  type UpdateConfig,
} from '../../infrastructure';

interface AutoUpdateState {
  // State
  status: UpdateStatus;
  updateInfo: UpdateInfo | null;
  progress: UpdateProgress | null;
  error: string | null;
  isInitialized: boolean;

  // Actions
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  quitAndInstall: () => void;
  updateConfig: (config: Partial<UpdateConfig>) => Promise<void>;
  refreshStatus: () => Promise<void>;

  // Internal
  setStatus: (status: UpdateStatus) => void;
  setUpdateInfo: (info: UpdateInfo | null) => void;
  setProgress: (progress: UpdateProgress | null) => void;
  setError: (error: string | null) => void;
}

export const useAutoUpdateStore = create<AutoUpdateState>((set, get) => ({
  // Initial state
  status: UpdateStatus.Idle,
  updateInfo: null,
  progress: null,
  error: null,
  isInitialized: false,

  // Actions
  checkForUpdates: async () => {
    try {
      set({ status: UpdateStatus.Checking, error: null });
      const info = await autoUpdateClient.checkForUpdates();
      set({
        updateInfo: info,
        status: info ? UpdateStatus.Available : UpdateStatus.NotAvailable,
      });
    } catch (error) {
      set({
        status: UpdateStatus.Error,
        error: (error as Error).message,
      });
    }
  },

  downloadUpdate: async () => {
    try {
      set({ status: UpdateStatus.Downloading, error: null });
      const success = await autoUpdateClient.downloadUpdate();
      if (success) {
        set({ status: UpdateStatus.Downloaded });
      } else {
        set({ status: UpdateStatus.Error, error: 'Download failed' });
      }
    } catch (error) {
      set({
        status: UpdateStatus.Error,
        error: (error as Error).message,
      });
    }
  },

  quitAndInstall: () => {
    autoUpdateClient.quitAndInstall().catch(console.error);
  },

  updateConfig: async (config) => {
    try {
      await autoUpdateClient.updateConfig(config);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  refreshStatus: async () => {
    try {
      const result = await autoUpdateClient.getStatus();
      set({
        status: result.status,
        updateInfo: result.updateInfo,
        progress: result.progress,
        isInitialized: true,
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isInitialized: true,
      });
    }
  },

  // Internal setters
  setStatus: (status) => set({ status }),
  setUpdateInfo: (info) => set({ updateInfo: info }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
}));

/**
 * Initialize auto-update listeners
 *
 * Call this on app startup to listen for update events from main process
 */
export function initAutoUpdateListeners(): void {
  const store = useAutoUpdateStore.getState();

  // Listen for update events from main process
  if (typeof window !== 'undefined' && (window as any).electron) {
    const electron = (window as any).electron;

    electron.on?.('update:checking', () => {
      store.setStatus(UpdateStatus.Checking);
    });

    electron.on?.('update:available', (info: UpdateInfo) => {
      store.setStatus(UpdateStatus.Available);
      store.setUpdateInfo(info);
    });

    electron.on?.('update:not-available', () => {
      store.setStatus(UpdateStatus.NotAvailable);
    });

    electron.on?.('update:progress', (progress: UpdateProgress) => {
      store.setStatus(UpdateStatus.Downloading);
      store.setProgress(progress);
    });

    electron.on?.('update:downloaded', (info: UpdateInfo) => {
      store.setStatus(UpdateStatus.Downloaded);
      store.setUpdateInfo(info);
      store.setProgress(null);
    });

    electron.on?.('update:error', ({ message }: { message: string }) => {
      store.setStatus(UpdateStatus.Error);
      store.setError(message);
    });
  }
}
