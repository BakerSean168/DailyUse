/**
 * Dashboard IPC Client - Dashboard 模块 IPC 客户端
 * 
 * @module renderer/modules/dashboard/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { DashboardChannels } from '@/shared/types/ipc-channels';

// ============ Types ============

export interface DashboardDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string;
  layout: DashboardLayoutDTO;
  widgets: WidgetDTO[];
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DashboardLayoutDTO {
  type: 'grid' | 'masonry' | 'flow';
  columns: number;
  gap: number;
  padding: number;
}

export interface WidgetDTO {
  uuid: string;
  type: WidgetType;
  title: string;
  position: WidgetPositionDTO;
  config: Record<string, unknown>;
  data?: Record<string, unknown>;
  refreshInterval?: number;
  lastRefreshedAt?: number;
}

export type WidgetType =
  | 'task_summary'
  | 'goal_progress'
  | 'schedule_today'
  | 'reminder_upcoming'
  | 'focus_stats'
  | 'habit_streak'
  | 'quick_add'
  | 'recent_activity'
  | 'calendar_mini'
  | 'pomodoro_timer'
  | 'quote'
  | 'weather'
  | 'clock'
  | 'custom';

export interface WidgetPositionDTO {
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface DashboardSummaryDTO {
  tasks: TaskSummaryDTO;
  goals: GoalSummaryDTO;
  schedule: ScheduleSummaryDTO;
  focus: FocusSummaryDTO;
  habits: HabitSummaryDTO;
}

export interface TaskSummaryDTO {
  total: number;
  completed: number;
  overdue: number;
  dueToday: number;
  completionRate: number;
}

export interface GoalSummaryDTO {
  total: number;
  active: number;
  achieved: number;
  averageProgress: number;
}

export interface ScheduleSummaryDTO {
  todayEvents: number;
  upcomingEvents: number;
  nextEvent?: {
    title: string;
    startTime: number;
  };
}

export interface FocusSummaryDTO {
  totalMinutesToday: number;
  sessionsToday: number;
  currentStreak: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

export interface HabitSummaryDTO {
  totalHabits: number;
  completedToday: number;
  currentStreaks: number;
  longestStreak: number;
}

export interface ActivityDTO {
  uuid: string;
  type: ActivityType;
  title: string;
  description?: string;
  entityType: string;
  entityUuid: string;
  timestamp: number;
}

export type ActivityType = 'create' | 'update' | 'complete' | 'delete' | 'archive';

export interface CreateWidgetRequest {
  dashboardUuid: string;
  type: WidgetType;
  title: string;
  position: WidgetPositionDTO;
  config?: Record<string, unknown>;
}

export interface UpdateWidgetRequest {
  uuid: string;
  title?: string;
  position?: WidgetPositionDTO;
  config?: Record<string, unknown>;
}

// ============ Dashboard IPC Client ============

/**
 * Dashboard IPC Client
 */
export class DashboardIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ Overview ============

  /**
   * 获取概览数据
   */
  async getOverview(): Promise<DashboardSummaryDTO> {
    return this.client.invoke<DashboardSummaryDTO>(
      DashboardChannels.GET_OVERVIEW,
      {}
    );
  }

  /**
   * 获取今日数据
   */
  async getToday(): Promise<{
    tasks: TaskSummaryDTO;
    schedule: ScheduleSummaryDTO;
  }> {
    return this.client.invoke(
      DashboardChannels.GET_TODAY,
      {}
    );
  }

  /**
   * 获取本周数据
   */
  async getWeek(): Promise<{
    tasks: TaskSummaryDTO;
    goals: GoalSummaryDTO;
  }> {
    return this.client.invoke(
      DashboardChannels.GET_WEEK,
      {}
    );
  }

  /**
   * 获取汇总数据
   */
  async getSummary(): Promise<DashboardSummaryDTO> {
    return this.client.invoke<DashboardSummaryDTO>(
      DashboardChannels.GET_SUMMARY,
      {}
    );
  }

  // ============ Widgets ============

  /**
   * 获取小部件列表
   */
  async listWidgets(): Promise<WidgetDTO[]> {
    return this.client.invoke<WidgetDTO[]>(
      DashboardChannels.WIDGET_LIST,
      {}
    );
  }

  /**
   * 获取小部件
   */
  async getWidget(uuid: string): Promise<WidgetDTO> {
    return this.client.invoke<WidgetDTO>(
      DashboardChannels.WIDGET_GET,
      { uuid }
    );
  }

  /**
   * 创建小部件
   */
  async createWidget(params: CreateWidgetRequest): Promise<WidgetDTO> {
    return this.client.invoke<WidgetDTO>(
      DashboardChannels.WIDGET_CREATE,
      params
    );
  }

  /**
   * 更新小部件
   */
  async updateWidget(params: UpdateWidgetRequest): Promise<WidgetDTO> {
    return this.client.invoke<WidgetDTO>(
      DashboardChannels.WIDGET_UPDATE,
      params
    );
  }

  /**
   * 删除小部件
   */
  async deleteWidget(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      DashboardChannels.WIDGET_DELETE,
      { uuid }
    );
  }

  /**
   * 重排小部件
   */
  async reorderWidgets(widgetUuids: string[]): Promise<void> {
    return this.client.invoke<void>(
      DashboardChannels.WIDGET_REORDER,
      { widgetUuids }
    );
  }

  // ============ Quick Actions ============

  /**
   * 快速添加任务
   */
  async quickAddTask(title: string, options?: {
    dueDate?: string;
    priority?: number;
  }): Promise<{ uuid: string }> {
    return this.client.invoke(
      DashboardChannels.QUICK_ADD_TASK,
      { title, ...options }
    );
  }

  /**
   * 快速添加提醒
   */
  async quickAddReminder(title: string, time: string): Promise<{ uuid: string }> {
    return this.client.invoke(
      DashboardChannels.QUICK_ADD_REMINDER,
      { title, time }
    );
  }

  /**
   * 快速添加日程
   */
  async quickAddSchedule(title: string, startTime: string, endTime?: string): Promise<{ uuid: string }> {
    return this.client.invoke(
      DashboardChannels.QUICK_ADD_SCHEDULE,
      { title, startTime, endTime }
    );
  }

  // ============ Activities ============

  /**
   * 获取活动列表
   */
  async listActivities(limit?: number): Promise<ActivityDTO[]> {
    return this.client.invoke<ActivityDTO[]>(
      DashboardChannels.ACTIVITY_LIST,
      { limit }
    );
  }

  /**
   * 获取最近活动
   */
  async getRecentActivities(limit = 10): Promise<ActivityDTO[]> {
    return this.client.invoke<ActivityDTO[]>(
      DashboardChannels.ACTIVITY_RECENT,
      { limit }
    );
  }
}

// ============ Singleton Export ============

export const dashboardIPCClient = new DashboardIPCClient();
