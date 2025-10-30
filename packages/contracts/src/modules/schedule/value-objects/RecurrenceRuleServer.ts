/**
 * RecurrenceRule Value Object - Server Interface
 * Schedule 循环规则值对象 - 服务端接口
 * 
 * Story 4-2: Recurring Event Management
 */

import type { RecurrenceRuleClientDTO } from './RecurrenceRuleClient';

// ============ 枚举定义 ============

/**
 * 循环频率
 */
export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/**
 * 星期几
 */
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

// ============ 接口定义 ============

/**
 * 循环规则 - Server 接口
 */
export interface RecurrenceRuleServer {
  /** 循环频率 */
  frequency: RecurrenceFrequency;
  /** 间隔（每 N 天/周/月/年） */
  interval: number;
  /** 星期几重复（仅 WEEKLY）*/
  daysOfWeek: DayOfWeek[];
  /** 结束日期（Unix 毫秒时间戳，null 表示永不结束）*/
  endDate: number | null;
  /** 重复次数（null 表示无限）*/
  occurrences: number | null;

  // 值对象方法
  equals(other: RecurrenceRuleServer): boolean;

  // DTO 转换
  toClientDTO(): RecurrenceRuleClientDTO;
  toJSON(): RecurrenceRulePersistenceDTO;
}

// ============ DTO 定义 ============

/**
 * RecurrenceRule Server DTO
 */
export interface RecurrenceRuleServerDTO {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: DayOfWeek[];
  endDate?: number | null;
  occurrences?: number | null;
}

/**
 * RecurrenceRule Persistence DTO
 * 数据库持久化格式（JSON 字符串化）
 */
export interface RecurrenceRulePersistenceDTO {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: DayOfWeek[];
  endDate: number | null;
  occurrences: number | null;
}
