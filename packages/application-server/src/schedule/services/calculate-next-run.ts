/**
 * calculateNextRun - 计算下次执行时间
 *
 * 解析 cron 表达式并计算下次执行时间
 *
 * @module application-server/schedule/services
 */

import { CronExpressionParser } from 'cron-parser';

/**
 * 计算配置选项
 */
export interface CalculateNextRunOptions {
  /** 时区，默认为系统本地时区 */
  timezone?: string;
  /** 起始时间，默认为当前时间 */
  currentDate?: Date;
  /** 结束时间（可选，用于限制搜索范围） */
  endDate?: Date;
}

/**
 * 计算 cron 表达式的下次执行时间
 *
 * @param cronExpression cron 表达式（标准 5 字段或扩展 6 字段格式）
 * @param options 计算选项
 * @returns 下次执行时间，如果无法计算则返回 null
 *
 * @example
 * // 每天 9:00
 * calculateNextRun('0 9 * * *')
 *
 * // 每周一 8:00，上海时区
 * calculateNextRun('0 8 * * 1', { timezone: 'Asia/Shanghai' })
 *
 * // 从指定时间开始计算
 * calculateNextRun('0 9 * * *', { currentDate: new Date('2024-01-01') })
 */
export function calculateNextRun(
  cronExpression: string,
  options?: CalculateNextRunOptions
): Date | null;

/**
 * 计算 cron 表达式的下次执行时间（简化版本）
 *
 * @param cronExpression cron 表达式
 * @param timezone 时区
 * @returns 下次执行时间，如果无法计算则返回 null
 */
export function calculateNextRun(
  cronExpression: string,
  timezone?: string
): Date | null;

/**
 * 实现
 */
export function calculateNextRun(
  cronExpression: string,
  optionsOrTimezone?: CalculateNextRunOptions | string
): Date | null {
  if (!cronExpression) {
    return null;
  }

  // 规范化参数
  const options: CalculateNextRunOptions =
    typeof optionsOrTimezone === 'string'
      ? { timezone: optionsOrTimezone }
      : optionsOrTimezone ?? {};

  try {
    const interval = CronExpressionParser.parse(cronExpression, {
      currentDate: options.currentDate ?? new Date(),
      endDate: options.endDate,
      tz: options.timezone,
    });

    return interval.next().toDate();
  } catch (error) {
    // 日志记录但不抛出异常
    console.warn(
      `[calculateNextRun] Failed to parse cron expression: ${cronExpression}`,
      error
    );
    return null;
  }
}

/**
 * 批量计算多个 cron 表达式的下次执行时间
 *
 * @param expressions cron 表达式数组
 * @param options 计算选项
 * @returns 下次执行时间数组，对应每个表达式
 */
export function calculateNextRunBatch(
  expressions: string[],
  options?: CalculateNextRunOptions
): (Date | null)[] {
  return expressions.map((expr) => calculateNextRun(expr, options));
}

/**
 * 获取 cron 表达式的多个即将执行的时间点
 *
 * @param cronExpression cron 表达式
 * @param count 要获取的时间点数量
 * @param options 计算选项
 * @returns 执行时间数组
 */
export function getNextRunTimes(
  cronExpression: string,
  count: number,
  options?: CalculateNextRunOptions
): Date[] {
  if (!cronExpression || count <= 0) {
    return [];
  }

  try {
    const interval = CronExpressionParser.parse(cronExpression, {
      currentDate: options?.currentDate ?? new Date(),
      endDate: options?.endDate,
      tz: options?.timezone,
    });

    // 使用 take() 方法获取多个时间点
    const dates = interval.take(count);
    return dates.map((d) => d.toDate());
  } catch (error) {
    console.warn(
      `[getNextRunTimes] Failed to parse cron expression: ${cronExpression}`,
      error
    );
    return [];
  }
}

/**
 * 验证 cron 表达式是否有效
 *
 * @param cronExpression cron 表达式
 * @returns 是否有效
 */
export function isValidCronExpression(cronExpression: string): boolean {
  if (!cronExpression) {
    return false;
  }

  try {
    CronExpressionParser.parse(cronExpression);
    return true;
  } catch {
    return false;
  }
}

/**
 * 解析 cron 表达式并返回详细信息
 *
 * @param cronExpression cron 表达式
 * @returns 解析结果，包含各字段信息
 */
export interface CronExpressionFields {
  second?: number[];
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
}

export function parseCronExpression(
  cronExpression: string
): CronExpressionFields | null {
  if (!cronExpression) {
    return null;
  }

  try {
    const interval = CronExpressionParser.parse(cronExpression);
    const fields = interval.fields;

    return {
      second: fields.second ? Array.from(fields.second.values).map(Number) : undefined,
      minute: Array.from(fields.minute.values).map(Number),
      hour: Array.from(fields.hour.values).map(Number),
      dayOfMonth: Array.from(fields.dayOfMonth.values).map(Number),
      month: Array.from(fields.month.values).map(Number),
      dayOfWeek: Array.from(fields.dayOfWeek.values).map(Number),
    };
  } catch {
    return null;
  }
}
