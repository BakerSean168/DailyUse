/**
 * Dashboard Store - Zustand 状态管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============ Types ============
export interface DashboardWidget {
  id: string;
  type: 'goals' | 'tasks' | 'schedule' | 'reminders' | 'statistics' | 'focus';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config?: Record<string, unknown>;
}

export interface DashboardState {
  widgets: DashboardWidget[];
  isLoading: boolean;
  error: string | null;
  layoutMode: 'grid' | 'free';
}

export interface DashboardActions {
  setWidgets: (widgets: DashboardWidget[]) => void;
  addWidget: (widget: DashboardWidget) => void;
  updateWidget: (id: string, updates: Partial<DashboardWidget>) => void;
  removeWidget: (id: string) => void;
  moveWidget: (id: string, position: { x: number; y: number }) => void;
  resizeWidget: (id: string, size: { width: number; height: number }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLayoutMode: (mode: 'grid' | 'free') => void;
  resetToDefault: () => void;
}

type DashboardStore = DashboardState & DashboardActions;

// Default widgets
const defaultWidgets: DashboardWidget[] = [
  { id: 'goals', type: 'goals', title: '目标进度', position: { x: 0, y: 0 }, size: { width: 2, height: 2 } },
  { id: 'tasks', type: 'tasks', title: '今日任务', position: { x: 2, y: 0 }, size: { width: 2, height: 2 } },
  { id: 'schedule', type: 'schedule', title: '日程安排', position: { x: 0, y: 2 }, size: { width: 2, height: 1 } },
  { id: 'reminders', type: 'reminders', title: '提醒', position: { x: 2, y: 2 }, size: { width: 2, height: 1 } },
];

const initialState: DashboardState = {
  widgets: defaultWidgets,
  isLoading: false,
  error: null,
  layoutMode: 'grid',
};

// ============ Store ============
export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setWidgets: (widgets) => set({ widgets }),
      
      addWidget: (widget) => set((state) => ({
        widgets: [...state.widgets, widget],
      })),
      
      updateWidget: (id, updates) => set((state) => ({
        widgets: state.widgets.map(w => w.id === id ? { ...w, ...updates } : w),
      })),
      
      removeWidget: (id) => set((state) => ({
        widgets: state.widgets.filter(w => w.id !== id),
      })),
      
      moveWidget: (id, position) => set((state) => ({
        widgets: state.widgets.map(w => w.id === id ? { ...w, position } : w),
      })),
      
      resizeWidget: (id, size) => set((state) => ({
        widgets: state.widgets.map(w => w.id === id ? { ...w, size } : w),
      })),
      
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setLayoutMode: (layoutMode) => set({ layoutMode }),
      resetToDefault: () => set({ widgets: defaultWidgets }),
    }),
    {
      name: 'dashboard-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useWidgets = () => useDashboardStore((state) => state.widgets);
