/**
 * Task Instance 智能同步服务
 * 
 * 加载策略：
 * - P0（立即）: 今天的实例
 * - P1（预加载）: 本周其他天
 * - P2（按需）: 未来几周
 */

import { eventBus } from '@dailyuse/utils';
import { useTaskStore } from '../presentation/stores/taskStore';
import { TaskInstance } from '@dailyuse/domain-client';
import type { TaskTemplateClientDTO, TaskInstanceClientDTO, TaskDependencyServerDTO } from '@dailyuse/contracts/task';
import { taskTemplateApiClient } from '../infrastructure/api/taskApiClient';

interface TaskInstanceGeneratedEvent {
  templateUuid: string;
  templateTitle: string;
  instanceCount: number;
  dateRange: {
    from: number;
    to: number;
  };
  strategy: 'full' | 'summary'; // 混合策略标识
  instances?: TaskInstanceClientDTO[]; // strategy=full 时包含
  timestamp: string;
}

export class TaskInstanceSyncService {
  private static instance: TaskInstanceSyncService;
  private isInitialized = false;
  private preloadQueue: Array<{ templateUuid: string; dateRange: { from: number; to: number } }> = [];
  private isPreloading = false;

  private constructor() {}

  static getInstance(): TaskInstanceSyncService {
    if (!TaskInstanceSyncService.instance) {
      TaskInstanceSyncService.instance = new TaskInstanceSyncService();
    }
    return TaskInstanceSyncService.instance;
  }

  /**
   * 初始化同步服务（注册事件监听器）
   */
  initialize(): void {
    if (this.isInitialized) {
      console.log('⚠️ [TaskInstanceSyncService] Already initialized');
      return;
    }

    console.log('🎧 [TaskInstanceSyncService] Initializing...');

    // 监听 SSE 事件
    eventBus.on('task:instances-generated', this.handleInstancesGenerated.bind(this));

    this.isInitialized = true;
    console.log('✅ [TaskInstanceSyncService] Initialized');
  }

  /**
   * 处理任务实例生成事件（混合策略）
   */
  private async handleInstancesGenerated(data: TaskInstanceGeneratedEvent): Promise<void> {
    console.log('📦 [TaskInstanceSyncService] 收到实例生成事件:', data);

    const { strategy, instances, templateUuid, dateRange, instanceCount } = data;

    if (strategy === 'full' && instances) {
      // 策略1: 完整数据（小数据量，直接使用）
      console.log(`✅ [TaskInstanceSyncService] 收到完整数据（${instances.length}个实例），直接更新`);
      await this.updateStoreWithInstances(instances);
    } else if (strategy === 'summary') {
      // 策略2: 摘要数据（大数据量，智能加载）
      console.log(`📊 [TaskInstanceSyncService] 收到摘要（${instanceCount}个实例），开始智能加载`);
      await this.smartLoadInstances(templateUuid, dateRange);
    } else {
      console.warn('⚠️ [TaskInstanceSyncService] 未知策略:', strategy);
    }
  }

  /**
   * 智能加载策略：优先今天 → 预加载本周 → 按需加载其他
   */
  private async smartLoadInstances(
    templateUuid: string,
    dateRange: { from: number; to: number }
  ): Promise<void> {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayEnd = new Date().setHours(23, 59, 59, 999);

    // P0: 立即加载今天的实例
    console.log('🚀 [P0] 立即加载今天的实例...');
    await this.loadInstancesByDateRange(templateUuid, todayStart, todayEnd);

    // P1: 预加载本周其他天（异步，不阻塞）
    const weekStart = this.getWeekStart(now);
    const weekEnd = this.getWeekEnd(now);
    
    this.preloadQueue.push({
      templateUuid,
      dateRange: { from: weekStart, to: weekEnd },
    });

    // 启动预加载（延迟执行，避免阻塞）
    setTimeout(() => this.processPreloadQueue(), 1000);

    // P2: 其他日期按需加载（由用户切换日期时触发）
    console.log('📅 [P2] 其他日期将在用户切换时按需加载');
  }

  /**
   * 加载指定日期范围的实例
   */
  private async loadInstancesByDateRange(
    templateUuid: string,
    from: number,
    to: number
  ): Promise<void> {
    try {
      console.log(`📥 [TaskInstanceSyncService] 加载实例: ${templateUuid}`, {
        from: new Date(from).toLocaleDateString(),
        to: new Date(to).toLocaleDateString(),
      });

      // 使用 API 客户端调用（自动处理 token）
      const instances = await taskTemplateApiClient.getInstancesByDateRange(
        templateUuid,
        from,
        to
      );

      console.log(`✅ [TaskInstanceSyncService] 成功加载 ${instances.length} 个实例`);

      // 更新 Store
      await this.updateStoreWithInstances(instances);
    } catch (error) {
      console.error('❌ [TaskInstanceSyncService] 加载失败:', error);
    }
  }

  /**
   * 处理预加载队列
   */
  private async processPreloadQueue(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return;
    }

    this.isPreloading = true;
    console.log(`🔄 [TaskInstanceSyncService] 开始处理预加载队列（${this.preloadQueue.length}项）`);

    while (this.preloadQueue.length > 0) {
      const task = this.preloadQueue.shift();
      if (task) {
        await this.loadInstancesByDateRange(
          task.templateUuid,
          task.dateRange.from,
          task.dateRange.to
        );
        // 添加小延迟，避免阻塞主线程
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.isPreloading = false;
    console.log('✅ [TaskInstanceSyncService] 预加载队列处理完成');
  }

  /**
   * 更新 Store（批量，减少响应式触发）
   */
  private async updateStoreWithInstances(
    instances: TaskInstanceClientDTO[]
  ): Promise<void> {
    const taskStore = useTaskStore();
    
    // 转换 DTO 为领域对象
    const domainInstances = instances.map(dto => TaskInstance.fromClientDTO(dto));
    
    // 使用 Set 快速去重
    const existingUuids = new Set(taskStore.taskInstances.map((i: any) => i.uuid));
    const newInstances = domainInstances.filter(i => !existingUuids.has(i.uuid));

    if (newInstances.length > 0) {
      // 批量添加（一次性触发响应式更新）
      taskStore.taskInstances = [...taskStore.taskInstances, ...newInstances]
        .sort((a, b) => a.instanceDate - b.instanceDate);
      
      console.log(`✅ [TaskInstanceSyncService] 批量添加 ${newInstances.length} 个实例到 Store`);
    } else {
      console.log('ℹ️ [TaskInstanceSyncService] 所有实例已存在，无需更新');
    }
  }

  /**
   * 获取本周开始时间（周一 00:00:00）
   */
  private getWeekStart(timestamp: number): number {
    const date = new Date(timestamp);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 调整为周一
    return new Date(date.setDate(diff)).setHours(0, 0, 0, 0);
  }

  /**
   * 获取本周结束时间（周日 23:59:59）
   */
  private getWeekEnd(timestamp: number): number {
    const weekStart = this.getWeekStart(timestamp);
    return new Date(weekStart).setDate(new Date(weekStart).getDate() + 6).valueOf() + 86400000 - 1;
  }

  /**
   * 手动触发加载（用于用户切换日期时）
   * @param dateOrTemplateUuid 日期对象或模板UUID
   * @param fromTimestamp 可选：起始时间戳（当第一个参数是templateUuid时使用）
   * @param toTimestamp 可选：结束时间戳（当第一个参数是templateUuid时使用）
   */
  async loadInstancesForDate(
    dateOrTemplateUuid: Date | string,
    fromTimestamp?: number,
    toTimestamp?: number
  ): Promise<void> {
    const taskStore = useTaskStore();

    // 场景1：传入 templateUuid + 时间范围
    if (typeof dateOrTemplateUuid === 'string' && fromTimestamp !== undefined && toTimestamp !== undefined) {
      const templateUuid = dateOrTemplateUuid;
      console.log(`📅 [TaskInstanceSyncService] 加载模板 ${templateUuid} 的实例: ${new Date(fromTimestamp).toLocaleDateString()} - ${new Date(toTimestamp).toLocaleDateString()}`);
      
      await this.loadInstancesByDateRange(templateUuid, fromTimestamp, toTimestamp);
      return;
    }

    // 场景2：传入 Date 对象（旧逻辑，兼容性保留）
    if (dateOrTemplateUuid instanceof Date) {
      const date = dateOrTemplateUuid;
      const templates = taskStore.taskTemplates;

      const dayStart = new Date(date).setHours(0, 0, 0, 0);
      const dayEnd = new Date(date).setHours(23, 59, 59, 999);

      console.log(`📅 [TaskInstanceSyncService] 手动加载指定日期: ${date.toLocaleDateString()}`);

      // 为所有模板加载指定日期的实例
      for (const template of templates) {
        await this.loadInstancesByDateRange(template.uuid, dayStart, dayEnd);
      }
    }
  }

  /**
   * 清理（用于测试或卸载）
   */
  dispose(): void {
    if (!this.isInitialized) {
      return;
    }

    eventBus.off('task:instances-generated', this.handleInstancesGenerated.bind(this));
    this.preloadQueue = [];
    this.isPreloading = false;
    this.isInitialized = false;
    
    console.log('🔄 [TaskInstanceSyncService] Disposed');
  }
}

// 导出单例
export const taskInstanceSyncService = TaskInstanceSyncService.getInstance();

