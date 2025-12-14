/**
 * Notification Store - Zustand 状态管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============ Types ============
export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationState {
  notifications: AppNotification[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
}

export interface NotificationActions {
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface NotificationSelectors {
  getUnreadNotifications: () => AppNotification[];
  getNotificationById: (id: string) => AppNotification | undefined;
}

type NotificationStore = NotificationState & NotificationActions & NotificationSelectors;

const initialState: NotificationState = {
  notifications: [],
  isLoading: false,
  error: null,
  unreadCount: 0,
};

// ============ Store ============
export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      addNotification: (notification) => set((state) => {
        const newNotification: AppNotification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          read: false,
        };
        return {
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        };
      }),
      
      removeNotification: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        return {
          notifications: state.notifications.filter(n => n.id !== id),
          unreadCount: notification && !notification.read 
            ? state.unreadCount - 1 
            : state.unreadCount,
        };
      }),
      
      markAsRead: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        if (!notification || notification.read) return state;
        
        return {
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      }),
      
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      })),
      
      clearAll: () => set({ notifications: [], unreadCount: 0 }),
      
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      // Selectors
      getUnreadNotifications: () => {
        return get().notifications.filter(n => !n.read);
      },
      
      getNotificationById: (id) => {
        return get().notifications.find(n => n.id === id);
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 100), // Keep last 100
        unreadCount: state.unreadCount,
      }),
    }
  )
);

export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const useUnreadCount = () => useNotificationStore((state) => state.unreadCount);
