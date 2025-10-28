/**
 * Reminder Statistics Application Service
 * 提醒统计应用服务 - Web 端
 *
 * 职责：
 * - 提醒统计数据查询
 * - 统计数据缓存管理
 *
 * 特性：
 * - 单例模式
 * - 依赖注入支持
 * - 统一错误处理
 */

import { ReminderContracts } from '@dailyuse/contracts';
import { reminderApiClient } from '../../infrastructure/api/reminderApiClient';
import { useReminderStore } from '../../presentation/stores/reminderStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';

export class ReminderStatisticsApplicationService {
  private static instance: ReminderStatisticsApplicationService;

  private constructor() {}

  /**
   * 延迟获取 Store（避免在 Pinia 初始化前访问）
   */
  private get reminderStore() {
    return useReminderStore();
  }

  /**
   * 延迟获取 Snackbar（避免在 Pinia 初始化前访问）
   */
  private get snackbar() {
    return useSnackbar();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ReminderStatisticsApplicationService {
    if (!ReminderStatisticsApplicationService.instance) {
      ReminderStatisticsApplicationService.instance =
        new ReminderStatisticsApplicationService();
    }
    return ReminderStatisticsApplicationService.instance;
  }

  /**
   * 获取提醒统计数据
   */
  async getReminderStatistics(
    accountUuid: string,
    options?: { forceRefresh?: boolean },
  ): Promise<ReminderContracts.ReminderStatsClientDTO> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const statistics = await reminderApiClient.getReminderStatistics(accountUuid);

      // 更新 store 中的统计数据
      this.reminderStore.setStatistics(statistics);

      return statistics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取提醒统计失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }
}

// 导出单例实例
export const reminderStatisticsApplicationService =
  ReminderStatisticsApplicationService.getInstance();
