/**
 * Schedule Store - Zustand 状态管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { 
  ScheduleClientDTO,
  CreateScheduleRequest,
  UpdateScheduleRequest,
} from '@dailyuse/contracts/schedule';
import { scheduleContainer } from '../../infrastructure/di';

// ============ Types ============
export interface ScheduleState {
  schedules: ScheduleClientDTO[];
  schedulesById: Record<string, ScheduleClientDTO>;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  selectedScheduleId: string | null;
  viewDate: Date;
  viewMode: 'day' | 'week' | 'month';
}

export interface ScheduleActions {
  setSchedules: (schedules: ScheduleClientDTO[]) => void;
  addSchedule: (schedule: ScheduleClientDTO) => void;
  updateSchedule: (id: string, updates: Partial<ScheduleClientDTO>) => void;
  removeSchedule: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  setSelectedScheduleId: (id: string | null) => void;
  setViewDate: (date: Date) => void;
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
  initialize: () => Promise<void>;
  reset: () => void;
  fetchSchedules: (start: Date, end: Date) => Promise<void>;
  createSchedule: (dto: CreateScheduleRequest) => Promise<ScheduleClientDTO>;
  updateScheduleById: (id: string, dto: UpdateScheduleRequest) => Promise<ScheduleClientDTO>;
  deleteSchedule: (id: string) => Promise<void>;
}

export interface ScheduleSelectors {
  getScheduleById: (id: string) => ScheduleClientDTO | undefined;
  getSchedulesForDate: (date: Date) => ScheduleClientDTO[];
  getSchedulesForWeek: (weekStart: Date) => ScheduleClientDTO[];
}

type ScheduleStore = ScheduleState & ScheduleActions & ScheduleSelectors;

// ============ Initial State ============
const initialState: ScheduleState = {
  schedules: [],
  schedulesById: {},
  isLoading: false,
  isInitialized: false,
  error: null,
  selectedScheduleId: null,
  viewDate: new Date(),
  viewMode: 'week',
};

// ============ Store ============
export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setSchedules: (schedules) => {
        const byId = Object.fromEntries(schedules.map(s => [s.uuid, s]));
        set({ schedules, schedulesById: byId });
      },
      
      addSchedule: (schedule) => set((state) => ({
        schedules: [...state.schedules, schedule],
        schedulesById: { ...state.schedulesById, [schedule.uuid]: schedule },
      })),
      
      updateSchedule: (id, updates) => set((state) => {
        const index = state.schedules.findIndex(s => s.uuid === id);
        if (index === -1) return state;
        
        const updated = { ...state.schedules[index], ...updates };
        const newSchedules = [...state.schedules];
        newSchedules[index] = updated;
        
        return {
          schedules: newSchedules,
          schedulesById: { ...state.schedulesById, [id]: updated },
        };
      }),
      
      removeSchedule: (id) => set((state) => {
        const { [id]: _, ...rest } = state.schedulesById;
        return {
          schedules: state.schedules.filter(s => s.uuid !== id),
          schedulesById: rest,
        };
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      setSelectedScheduleId: (selectedScheduleId) => set({ selectedScheduleId }),
      setViewDate: (viewDate) => set({ viewDate }),
      setViewMode: (viewMode) => set({ viewMode }),
      
      initialize: async () => {
        const state = get();
        if (state.isInitialized) return;
        
        try {
          const start = new Date(state.viewDate);
          start.setDate(start.getDate() - 30);
          const end = new Date(state.viewDate);
          end.setDate(end.getDate() + 30);
          
          await state.fetchSchedules(start, end);
          set({ isInitialized: true });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to initialize' });
        }
      },
      
      reset: () => set(initialState),
      
      fetchSchedules: async (start, end) => {
        set({ isLoading: true, error: null });
        
        try {
          // 使用 IPC Client 获取日程
          const scheduleClient = scheduleContainer.scheduleClient;
          const schedules = await scheduleClient.listByDateRange(
            '', // TODO: 从 AuthStore 获取当前账户
            start.getTime(),
            end.getTime()
          );
          
          // 转换为 ClientDTO 格式
          const clientSchedules: ScheduleClientDTO[] = schedules.map(s => ({
            uuid: s.uuid,
            accountUuid: s.accountUuid,
            title: s.title,
            description: s.description,
            startTime: s.startTime,
            endTime: s.endTime,
            allDay: s.allDay,
            location: s.location,
            color: s.color,
            status: s.status,
            isRecurring: s.isRecurring,
            recurrenceId: s.recurrenceId,
            completedAt: s.completedAt,
            cancelledAt: s.cancelledAt,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          }));
          
          get().setSchedules(clientSchedules);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      createSchedule: async (dto) => {
        set({ isLoading: true, error: null });
        
        try {
          // 使用 IPC Client 创建日程
          const scheduleClient = scheduleContainer.scheduleClient;
          const result = await scheduleClient.create(dto as any);
          
          const schedule: ScheduleClientDTO = {
            uuid: result.uuid,
            accountUuid: result.accountUuid,
            title: result.title,
            description: result.description,
            startTime: result.startTime,
            endTime: result.endTime,
            allDay: result.allDay,
            location: result.location,
            color: result.color,
            status: result.status,
            isRecurring: result.isRecurring,
            recurrenceId: result.recurrenceId,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          };
          
          get().addSchedule(schedule);
          return schedule;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      updateScheduleById: async (id, dto) => {
        set({ isLoading: true, error: null });
        
        try {
          // 使用 IPC Client 更新日程
          const scheduleClient = scheduleContainer.scheduleClient;
          const result = await scheduleClient.update({ uuid: id, ...dto } as any);
          
          const schedule: ScheduleClientDTO = {
            uuid: result.uuid,
            accountUuid: result.accountUuid,
            title: result.title,
            description: result.description,
            startTime: result.startTime,
            endTime: result.endTime,
            allDay: result.allDay,
            location: result.location,
            color: result.color,
            status: result.status,
            isRecurring: result.isRecurring,
            recurrenceId: result.recurrenceId,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          };
          
          get().updateSchedule(id, schedule);
          return schedule;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      deleteSchedule: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          // 使用 IPC Client 删除日程
          const scheduleClient = scheduleContainer.scheduleClient;
          await scheduleClient.delete(id);
          
          get().removeSchedule(id);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Selectors
      getScheduleById: (id) => get().schedulesById[id],
      
      getSchedulesForDate: (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return get().schedules.filter(s => {
          const startStr = new Date(s.startTime).toISOString().split('T')[0];
          return startStr === dateStr;
        });
      },
      
      getSchedulesForWeek: (weekStart) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        return get().schedules.filter(s => {
          const start = new Date(s.startTime);
          return start >= weekStart && start < weekEnd;
        });
      },
    }),
    {
      name: 'schedule-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        viewMode: state.viewMode,
      }),
    }
  )
);

export const useSchedules = () => useScheduleStore((state) => state.schedules);
export const useScheduleLoading = () => useScheduleStore((state) => state.isLoading);
