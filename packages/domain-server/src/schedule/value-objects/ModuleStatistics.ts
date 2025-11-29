/**
 * ModuleStatistics 值对象
 * 模块统计 - 不可变值对象
 */

import { ValueObject } from '@dailyuse/utils';

interface IModuleStatisticsDTO {
  moduleName: string;
  totalTasks: number;
  activeTasks: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgDuration: number;
}

/**
 * ModuleStatistics 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class ModuleStatistics extends ValueObject implements IModuleStatisticsDTO {
  public readonly moduleName: string;
  public readonly totalTasks: number;
  public readonly activeTasks: number;
  public readonly totalExecutions: number;
  public readonly successfulExecutions: number;
  public readonly failedExecutions: number;
  public readonly avgDuration: number;

  constructor(params: {
    moduleName: string;
    totalTasks?: number;
    activeTasks?: number;
    totalExecutions?: number;
    successfulExecutions?: number;
    failedExecutions?: number;
    avgDuration?: number;
  }) {
    super();

    this.moduleName = params.moduleName;
    this.totalTasks = params.totalTasks ?? 0;
    this.activeTasks = params.activeTasks ?? 0;
    this.totalExecutions = params.totalExecutions ?? 0;
    this.successfulExecutions = params.successfulExecutions ?? 0;
    this.failedExecutions = params.failedExecutions ?? 0;
    this.avgDuration = params.avgDuration ?? 0;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 更新统计
   */
  public update(params: {
    tasksDelta: number;
    activeTasksDelta: number;
    executionsDelta: number;
    successDelta: number;
    failureDelta: number;
    durationMs: number;
  }): ModuleStatistics {
    const newTotalExecutions = this.totalExecutions + params.executionsDelta;
    const newSuccessful = this.successfulExecutions + params.successDelta;
    const newFailed = this.failedExecutions + params.failureDelta;

    // 计算新的平均时长
    const totalDuration = this.avgDuration * this.totalExecutions + params.durationMs;
    const newAvgDuration = newTotalExecutions > 0 ? totalDuration / newTotalExecutions : 0;

    return new ModuleStatistics({
      moduleName: this.moduleName,
      totalTasks: this.totalTasks + params.tasksDelta,
      activeTasks: this.activeTasks + params.activeTasksDelta,
      totalExecutions: newTotalExecutions,
      successfulExecutions: newSuccessful,
      failedExecutions: newFailed,
      avgDuration: newAvgDuration,
    });
  }

  /**
   * 计算成功率
   */
  public calculateSuccessRate(): number {
    if (this.totalExecutions === 0) {
      return 0;
    }
    return (this.successfulExecutions / this.totalExecutions) * 100;
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      moduleName: string;
      totalTasks: number;
      activeTasks: number;
      totalExecutions: number;
      successfulExecutions: number;
      failedExecutions: number;
      avgDuration: number;
    }>,
  ): ModuleStatistics {
    return new ModuleStatistics({
      moduleName: changes.moduleName ?? this.moduleName,
      totalTasks: changes.totalTasks ?? this.totalTasks,
      activeTasks: changes.activeTasks ?? this.activeTasks,
      totalExecutions: changes.totalExecutions ?? this.totalExecutions,
      successfulExecutions: changes.successfulExecutions ?? this.successfulExecutions,
      failedExecutions: changes.failedExecutions ?? this.failedExecutions,
      avgDuration: changes.avgDuration ?? this.avgDuration,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof ModuleStatistics)) {
      return false;
    }

    return (
      this.moduleName === other.moduleName &&
      this.totalTasks === other.totalTasks &&
      this.activeTasks === other.activeTasks &&
      this.totalExecutions === other.totalExecutions &&
      this.successfulExecutions === other.successfulExecutions &&
      this.failedExecutions === other.failedExecutions &&
      this.avgDuration === other.avgDuration
    );
  }

  /**
   * 转换为 DTO
   */
  public toDTO(): IModuleStatisticsDTO {
    return {
      moduleName: this.moduleName,
      totalTasks: this.totalTasks,
      activeTasks: this.activeTasks,
      totalExecutions: this.totalExecutions,
      successfulExecutions: this.successfulExecutions,
      failedExecutions: this.failedExecutions,
      avgDuration: this.avgDuration,
    };
  }

  /**
   * 从 DTO 创建值对象
   */
  public static fromDTO(dto: IModuleStatisticsDTO): ModuleStatistics {
    return new ModuleStatistics(dto);
  }

  /**
   * 创建默认统计
   */
  public static createDefault(moduleName: string): ModuleStatistics {
    return new ModuleStatistics({
      moduleName,
      totalTasks: 0,
      activeTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgDuration: 0,
    });
  }
}
