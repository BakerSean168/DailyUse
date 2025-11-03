/**
 * TaskStatistics 聚合根实现 (Client)
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';

type ITaskStatistics = TaskContracts.TaskStatistics;
type TaskStatisticsDTO = TaskContracts.TaskStatisticsDTO;
type TaskStatisticsServerDTO = TaskContracts.TaskStatisticsServerDTO;
type TemplateStatsInfo = TaskContracts.TemplateStatsInfo;
type InstanceStatsInfo = TaskContracts.InstanceStatsInfo;
type CompletionStatsInfo = TaskContracts.CompletionStatsInfo;
type TimeStatsInfo = TaskContracts.TimeStatsInfo;
type DistributionStatsInfo = TaskContracts.DistributionStatsInfo;
type ChartData = TaskContracts.ChartData;
type TrendData = TaskContracts.TrendData;

/**
 * TaskStatistics 聚合根 (Client)
 */
export class TaskStatistics extends AggregateRoot implements ITaskStatistics {
  private _accountUuid: string;
  private _templateStats: TemplateStatsInfo;
  private _instanceStats: InstanceStatsInfo;
  private _completionStats: CompletionStatsInfo;
  private _timeStats: TimeStatsInfo;
  private _distributionStats: DistributionStatsInfo;
  private _calculatedAt: number;

  private constructor(params: {
    uuid: string;
    accountUuid: string;
    templateStats: TemplateStatsInfo;
    instanceStats: InstanceStatsInfo;
    completionStats: CompletionStatsInfo;
    timeStats: TimeStatsInfo;
    distributionStats: DistributionStatsInfo;
    calculatedAt: number;
  }) {
    super(params.uuid);
    this._accountUuid = params.accountUuid;
    this._templateStats = params.templateStats;
    this._instanceStats = params.instanceStats;
    this._completionStats = params.completionStats;
    this._timeStats = params.timeStats;
    this._distributionStats = params.distributionStats;
    this._calculatedAt = params.calculatedAt;
  }

  // ========== Getters ==========

  get accountUuid(): string {
    return this._accountUuid;
  }

  get templateStats(): TemplateStatsInfo {
    return { ...this._templateStats };
  }

  get instanceStats(): InstanceStatsInfo {
    return { ...this._instanceStats };
  }

  get completionStats(): CompletionStatsInfo {
    return { ...this._completionStats };
  }

  get timeStats(): TimeStatsInfo {
    return { ...this._timeStats };
  }

  get distributionStats(): DistributionStatsInfo {
    return {
      tasksByImportance: { ...this._distributionStats.tasksByImportance },
      tasksByUrgency: { ...this._distributionStats.tasksByUrgency },
      tasksByFolder: { ...this._distributionStats.tasksByFolder },
      tasksByTag: { ...this._distributionStats.tasksByTag },
    };
  }

  get calculatedAt(): number {
    return this._calculatedAt;
  }

  // ========== UI 计算属性 ==========

  get todayCompletionText(): string {
    const completed = this._completionStats.todayCompleted;
    const total = this._instanceStats.todayInstances;
    return `今日完成 ${completed}/${total}`;
  }

  get weekCompletionText(): string {
    const completed = this._completionStats.weekCompleted;
    const total = this._instanceStats.weekInstances;
    return `本周完成 ${completed}/${total}`;
  }

  get completionRateText(): string {
    const rate = this._completionStats.completionRate;
    return `完成率 ${rate.toFixed(1)}%`;
  }

  get overdueText(): string {
    const overdue = this._timeStats.overdueInstances;
    if (overdue === 0) {
      return '无逾期';
    }
    return `${overdue} 个逾期`;
  }

  get efficiencyTrendText(): string {
    const trend = this.getEfficiencyTrend();
    const trendTexts: Record<'UP' | 'DOWN' | 'STABLE', string> = {
      UP: '效率提升',
      DOWN: '效率下降',
      STABLE: '保持稳定',
    };
    return trendTexts[trend];
  }

  // ========== UI 业务方法 ==========

  /**
   * 获取今日完成率 (0-100)
   */
  getTodayCompletionRate(): number {
    const today = this._instanceStats.todayInstances;
    const completed = this._completionStats.todayCompleted;
    if (today === 0) return 0;
    return Math.round((completed / today) * 100);
  }

  /**
   * 获取本周完成率 (0-100)
   */
  getWeekCompletionRate(): number {
    const week = this._instanceStats.weekInstances;
    const completed = this._completionStats.weekCompleted;
    if (week === 0) return 0;
    return Math.round((completed / week) * 100);
  }

  /**
   * 获取效率趋势
   */
  getEfficiencyTrend(): 'UP' | 'DOWN' | 'STABLE' {
    const todayRate = this.getTodayCompletionRate();
    const weekRate = this.getWeekCompletionRate();

    if (todayRate > weekRate + 10) {
      return 'UP';
    } else if (todayRate < weekRate - 10) {
      return 'DOWN';
    }
    return 'STABLE';
  }

  /**
   * 获取完成率徽章
   */
  getCompletionBadge(): { text: string; color: string; icon: string } {
    const rate = this._completionStats.completionRate;
    if (rate >= 80) {
      return { text: '优秀', color: '#10B981', icon: '🌟' };
    } else if (rate >= 60) {
      return { text: '良好', color: '#3B82F6', icon: '👍' };
    } else if (rate >= 40) {
      return { text: '一般', color: '#F59E0B', icon: '📊' };
    }
    return { text: '待提升', color: '#EF4444', icon: '📈' };
  }

  /**
   * 获取趋势徽章
   */
  getTrendBadge(): { text: string; color: string; icon: string } {
    const trend = this.getEfficiencyTrend();
    const badges: Record<'UP' | 'DOWN' | 'STABLE', { text: string; color: string; icon: string }> =
      {
        UP: { text: '提升中', color: '#10B981', icon: '📈' },
        DOWN: { text: '下降中', color: '#EF4444', icon: '📉' },
        STABLE: { text: '稳定', color: '#3B82F6', icon: '➡️' },
      };
    return badges[trend];
  }

  /**
   * 获取最活跃的标签
   */
  getTopTag(): string | null {
    const tags = Object.entries(this._distributionStats.tasksByTag);
    if (tags.length === 0) return null;

    const [tag] = tags.reduce((max, entry) => (entry[1] > max[1] ? entry : max));
    return tag;
  }

  /**
   * 获取最常用的文件夹
   */
  getTopFolder(): string | null {
    const folders = Object.entries(this._distributionStats.tasksByFolder);
    if (folders.length === 0) return null;

    const [folder] = folders.reduce((max, entry) => (entry[1] > max[1] ? entry : max));
    return folder;
  }

  // ========== 图表数据方法 ==========

  /**
   * 获取重要性分布图表数据
   */
  getImportanceChartData(): ChartData {
    const labels = Object.keys(this._distributionStats.tasksByImportance);
    const values = Object.values(this._distributionStats.tasksByImportance);
    const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#6B7280'];

    return {
      labels,
      datasets: [
        {
          label: 'Tasks by Importance',
          data: values,
          backgroundColor: colors,
        },
      ],
    };
  }

  /**
   * 获取紧急度分布图表数据
   */
  getUrgencyChartData(): ChartData {
    const labels = Object.keys(this._distributionStats.tasksByUrgency);
    const values = Object.values(this._distributionStats.tasksByUrgency);
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#6B7280'];

    return {
      labels,
      datasets: [
        {
          label: 'Tasks by Urgency',
          data: values,
          backgroundColor: colors,
        },
      ],
    };
  }

  /**
   * 获取状态分布图表数据
   */
  getStatusChartData(): ChartData {
    const statusLabels = ['待处理', '进行中', '已完成', '已跳过', '已过期'];
    const values = [
      this._instanceStats.pendingInstances,
      this._instanceStats.inProgressInstances,
      this._instanceStats.completedInstances,
      this._instanceStats.skippedInstances,
      this._instanceStats.expiredInstances,
    ];
    const colors = ['#94A3B8', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

    return {
      labels: statusLabels,
      datasets: [
        {
          label: 'Tasks by Status',
          data: values,
          backgroundColor: colors,
        },
      ],
    };
  }

  /**
   * 获取完成趋势图表数据
   */
  getCompletionTrendData(): TrendData {
    // 生成最近7天的日期
    const dates: string[] = [];
    const completed: number[] = [];
    const total: number[] = [];

    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);

      // 这里需要根据实际的每日数据来填充
      // 目前使用简单的平均值作为示例
      const avgCompleted = Math.round(this._completionStats.weekCompleted / 7);
      const avgTotal = Math.round(this._instanceStats.weekInstances / 7);
      completed.push(avgCompleted);
      total.push(avgTotal);
    }

    return { dates, completed, total };
  }

  // ========== DTO 转换 ==========

  toServerDTO(): TaskStatisticsServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      templateStats: this._templateStats,
      instanceStats: this._instanceStats,
      completionStats: this._completionStats,
      timeStats: this._timeStats,
      distributionStats: this._distributionStats,
      calculatedAt: this._calculatedAt,
    };
  }

  toClientDTO(): TaskStatisticsDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      templateStats: this._templateStats,
      instanceStats: this._instanceStats,
      completionStats: this._completionStats,
      timeStats: this._timeStats,
      distributionStats: this._distributionStats,
      calculatedAt: this._calculatedAt,
      todayCompletionText: this.todayCompletionText,
      weekCompletionText: this.weekCompletionText,
      completionRateText: this.completionRateText,
      overdueText: this.overdueText,
      efficiencyTrendText: this.efficiencyTrendText,
    };
  }

  // ========== 静态工厂方法 ==========

  /**
   * 创建默认统计实例
   */
  static createDefault(accountUuid: string): TaskStatistics {
    return new TaskStatistics({
      uuid: AggregateRoot.generateUUID(),
      accountUuid,
      templateStats: {
        totalTemplates: 0,
        activeTemplates: 0,
        pausedTemplates: 0,
        archivedTemplates: 0,
        oneTimeTemplates: 0,
        recurringTemplates: 0,
      },
      instanceStats: {
        totalInstances: 0,
        todayInstances: 0,
        weekInstances: 0,
        monthInstances: 0,
        pendingInstances: 0,
        inProgressInstances: 0,
        completedInstances: 0,
        skippedInstances: 0,
        expiredInstances: 0,
      },
      completionStats: {
        todayCompleted: 0,
        weekCompleted: 0,
        monthCompleted: 0,
        totalCompleted: 0,
        averageCompletionTime: null,
        completionRate: 0,
      },
      timeStats: {
        allDayTasks: 0,
        timePointTasks: 0,
        timeRangeTasks: 0,
        overdueInstances: 0,
        upcomingInstances: 0,
      },
      distributionStats: {
        tasksByImportance: {},
        tasksByUrgency: {},
        tasksByFolder: {},
        tasksByTag: {},
      },
      calculatedAt: Date.now(),
    });
  }

  /**
   * 从 Server DTO 创建客户端实体
   */
  static fromServerDTO(dto: TaskStatisticsServerDTO): TaskStatistics {
    return new TaskStatistics({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      templateStats: dto.templateStats,
      instanceStats: dto.instanceStats,
      completionStats: dto.completionStats,
      timeStats: dto.timeStats,
      distributionStats: dto.distributionStats,
      calculatedAt: dto.calculatedAt,
    });
  }

  /**
   * 从 Client DTO 创建客户端实体
   */
  static fromClientDTO(dto: TaskStatisticsDTO): TaskStatistics {
    return new TaskStatistics({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      templateStats: dto.templateStats,
      instanceStats: dto.instanceStats,
      completionStats: dto.completionStats,
      timeStats: dto.timeStats,
      distributionStats: dto.distributionStats,
      calculatedAt: dto.calculatedAt,
    });
  }
}
