/**
 * ReminderStatistics Aggregate Root - Client Implementation
 * 提醒统计聚合根 - 客户端实现
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  GroupStatsInfo,
  ReminderStatisticsClient,
  ReminderStatisticsClientDTO,
  ReminderStatisticsServerDTO,
  TemplateStatsInfo,
  TriggerStatsInfo,
} from '@dailyuse/contracts/reminder';

/**
 * 提醒统计聚合根客户端实现
 */
export class ReminderStatistics
  extends AggregateRoot
  implements ReminderStatisticsClient
{
  private _accountUuid: string;
  private _templateStats: TemplateStatsInfo;
  private _groupStats: GroupStatsInfo;
  private _triggerStats: TriggerStatsInfo;
  private _calculatedAt: number;

  private constructor(
    uuid: string,
    accountUuid: string,
    templateStats: TemplateStatsInfo,
    groupStats: GroupStatsInfo,
    triggerStats: TriggerStatsInfo,
    calculatedAt: number,
  ) {
    super(uuid);
    this._accountUuid = accountUuid;
    this._templateStats = templateStats;
    this._groupStats = groupStats;
    this._triggerStats = triggerStats;
    this._calculatedAt = calculatedAt;
  }

  // ========== Getters ==========

  get accountUuid(): string {
    return this._accountUuid;
  }

  get templateStats(): TemplateStatsInfo {
    return { ...this._templateStats };
  }

  get groupStats(): GroupStatsInfo {
    return { ...this._groupStats };
  }

  get triggerStats(): TriggerStatsInfo {
    return { ...this._triggerStats };
  }

  get calculatedAt(): number {
    return this._calculatedAt;
  }

  // ========== UI 扩展属性 ==========

  get todayTriggersText(): string {
    return `今日 ${this._triggerStats.todayTriggers} 次`;
  }

  get weekTriggersText(): string {
    return `本周 ${this._triggerStats.weekTriggers} 次`;
  }

  get successRateText(): string {
    const rate = this.getSuccessRate();
    return `成功率 ${rate.toFixed(1)}%`;
  }

  // ========== UI 业务方法 ==========

  /**
   * 获取成功率 (0-100)
   */
  getSuccessRate(): number {
    const { totalTriggers, successfulTriggers } = this._triggerStats;
    if (totalTriggers === 0) return 0;
    return (successfulTriggers / totalTriggers) * 100;
  }

  /**
   * 获取触发趋势
   */
  getTriggerTrend(): 'UP' | 'DOWN' | 'STABLE' {
    const { weekTriggers, monthTriggers } = this._triggerStats;
    const weekAverage = weekTriggers / 7;
    const monthAverage = monthTriggers / 30;

    const diff = weekAverage - monthAverage;
    const threshold = monthAverage * 0.1; // 10% 变化阈值

    if (diff > threshold) return 'UP';
    if (diff < -threshold) return 'DOWN';
    return 'STABLE';
  }

  /**
   * 获取模板活跃率文本
   */
  getTemplateActiveRateText(): string {
    const { totalTemplates, activeTemplates } = this._templateStats;
    if (totalTemplates === 0) return '0%';
    const rate = (activeTemplates / totalTemplates) * 100;
    return `${rate.toFixed(1)}%`;
  }

  /**
   * 获取分组活跃率文本
   */
  getGroupActiveRateText(): string {
    const { totalGroups, activeGroups } = this._groupStats;
    if (totalGroups === 0) return '0%';
    const rate = (activeGroups / totalGroups) * 100;
    return `${rate.toFixed(1)}%`;
  }

  // ========== DTO 转换 ==========

  toServerDTO(): ReminderStatisticsServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      templateStats: this._templateStats,
      groupStats: this._groupStats,
      triggerStats: this._triggerStats,
      calculatedAt: this._calculatedAt,
    };
  }

  toClientDTO(): ReminderStatisticsClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      templateStats: this._templateStats,
      groupStats: this._groupStats,
      triggerStats: this._triggerStats,
      calculatedAt: this._calculatedAt,
      todayTriggersText: this.todayTriggersText,
      weekTriggersText: this.weekTriggersText,
      successRateText: this.successRateText,
    };
  }

  // ========== 静态工厂方法 ==========

  static createDefault(uuid: string, accountUuid: string): ReminderStatistics {
    const now = Date.now();

    const templateStats: TemplateStatsInfo = {
      totalTemplates: 0,
      activeTemplates: 0,
      pausedTemplates: 0,
      oneTimeTemplates: 0,
      recurringTemplates: 0,
    };

    const groupStats: GroupStatsInfo = {
      totalGroups: 0,
      activeGroups: 0,
      pausedGroups: 0,
      groupControlledGroups: 0,
      individualControlledGroups: 0,
    };

    const triggerStats: TriggerStatsInfo = {
      todayTriggers: 0,
      weekTriggers: 0,
      monthTriggers: 0,
      totalTriggers: 0,
      successfulTriggers: 0,
      failedTriggers: 0,
    };

    return new ReminderStatistics(
      uuid,
      accountUuid,
      templateStats,
      groupStats,
      triggerStats,
      now,
    );
  }

  static fromServerDTO(dto: ReminderStatisticsServerDTO): ReminderStatistics {
    return new ReminderStatistics(
      dto.uuid,
      dto.accountUuid,
      dto.templateStats,
      dto.groupStats,
      dto.triggerStats,
      dto.calculatedAt,
    );
  }

  static fromClientDTO(dto: ReminderStatisticsClientDTO): ReminderStatistics {
    return new ReminderStatistics(
      dto.uuid,
      dto.accountUuid,
      dto.templateStats,
      dto.groupStats,
      dto.triggerStats,
      dto.calculatedAt,
    );
  }
}
