/**
 * Focus DTOs - Client side transfer objects for Focus functionality
 * 专注功能 - 客户端传输对象
 *
 * 这些 DTO 用于 Renderer/Web 端与 Main/API 端的通信
 */

import type { FocusSessionClientDTO } from '../aggregates/FocusSessionClient';

// ============ Focus Status DTO ============

/**
 * 当前专注状态
 * 用于获取实时专注状态
 */
export interface FocusStatusDTO {
  /** 是否有活跃的专注会话 */
  isActive: boolean;
  /** 当前会话信息（如果有） */
  session: FocusSessionClientDTO | null;
  /** 关联的目标标题 */
  goalTitle?: string;
  /** 剩余时间（秒） */
  remainingSeconds?: number;
  /** 已用时间（秒） */
  elapsedSeconds?: number;
}

// ============ Focus History DTO ============

/**
 * 专注历史统计
 * 用于查询某时间段的专注记录
 */
export interface FocusHistoryDTO {
  /** 会话列表 */
  sessions: FocusSessionClientDTO[];
  /** 总会话数 */
  totalSessions: number;
  /** 总时长（分钟） */
  totalDurationMinutes: number;
  /** 平均时长（分钟） */
  averageDurationMinutes: number;
  /** 完成率（0-1） */
  completionRate: number;
}

// ============ Focus Statistics DTO ============

/**
 * 专注统计数据
 * 用于展示统计面板
 */
export interface FocusStatisticsDTO {
  /** 今日专注时长（分钟） */
  todayDurationMinutes: number;
  /** 本周专注时长（分钟） */
  weekDurationMinutes: number;
  /** 本月专注时长（分钟） */
  monthDurationMinutes: number;
  /** 总会话数 */
  totalSessions: number;
  /** 已完成会话数 */
  completedSessions: number;
  /** 平均会话时长（分钟） */
  averageSessionDurationMinutes: number;
  /** 最长连续天数 */
  longestStreak: number;
  /** 当前连续天数 */
  currentStreak: number;
}

// ============ Pomodoro Config DTO ============

/**
 * 番茄钟配置
 * 用于用户自定义专注参数
 */
export interface PomodoroConfigDTO {
  /** 专注时长（分钟），默认 25 */
  focusDurationMinutes: number;
  /** 短休息时长（分钟），默认 5 */
  shortBreakMinutes: number;
  /** 长休息时长（分钟），默认 15 */
  longBreakMinutes: number;
  /** 长休息前的专注次数，默认 4 */
  sessionsBeforeLongBreak: number;
  /** 是否自动开始休息 */
  autoStartBreaks: boolean;
  /** 是否自动开始下一个专注 */
  autoStartFocus: boolean;
  /** 是否启用声音提醒 */
  soundEnabled: boolean;
  /** 是否启用桌面通知 */
  notificationEnabled: boolean;
}

// ============ Focus Request DTOs ============

/**
 * 开始专注请求
 */
export interface StartFocusRequest {
  /** 关联的目标 UUID（可选） */
  goalUuid?: string;
  /** 专注时长（分钟） */
  durationMinutes: number;
  /** 描述/备注 */
  description?: string;
}

/**
 * 停止专注请求
 */
export interface StopFocusRequest {
  /** 结束备注 */
  notes?: string;
}

/**
 * 查询专注历史请求
 */
export interface GetFocusHistoryRequest {
  /** 关联的目标 UUID（可选，不传则查询所有） */
  goalUuid?: string;
  /** 开始日期（timestamp ms） */
  startDate?: number;
  /** 结束日期（timestamp ms） */
  endDate?: number;
  /** 分页：每页数量 */
  limit?: number;
  /** 分页：偏移量 */
  offset?: number;
}
