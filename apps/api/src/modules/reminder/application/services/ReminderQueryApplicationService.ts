/**
 * ReminderQueryApplicationService - 提醒查询应用服务
 * 
 * 职责：
 * - 查询提醒相关数据
 * - 计算即将到来的提醒
 * - 数据聚合和转换
 * 
 * @architecture
 * - 应用服务层（Application Service）
 * - 只读操作，不涉及事务
 * - 调用领域服务进行业务计算
 * - 返回给前端的 DTO
 */

import { ReminderContainer } from '../../infrastructure/di/ReminderContainer';
import type { UpcomingReminderDTO } from '@dailyuse/domain-server/reminder';
import { UpcomingReminderCalculationService } from '@dailyuse/domain-server/reminder';
import type { ReminderTemplateServerDTO, ReminderGroupServerDTO } from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderQueryApplicationService');

/**
 * 即将到来的提醒查询参数
 */
export interface UpcomingRemindersQueryParams {
  // 用户账户 UUID
  accountUuid: string;
  
  // 查询选项
  days?: number; // 向后查看天数，默认 1（今天内）
  limit?: number; // 返回的最大条数，默认 50
  afterTime?: number; // 从某个时间之后开始，默认当前时间
  
  // 过滤选项
  groupUuid?: string | null; // 仅查看特定分组，null 表示未分组的提醒
  importanceLevel?: ImportanceLevel; // 仅查看特定重要性级别
}

/**
 * 提醒查询应用服务
 */
export class ReminderQueryApplicationService {
  private static instance: ReminderQueryApplicationService;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ReminderQueryApplicationService {
    if (!ReminderQueryApplicationService.instance) {
      ReminderQueryApplicationService.instance = new ReminderQueryApplicationService();
    }
    return ReminderQueryApplicationService.instance;
  }

  /**
   * 获取即将到来的提醒列表
   * 
   * 流程：
   * 1. 获取所有启用的 ReminderTemplate
   * 2. 调用领域服务计算接下来的触发时间
   * 3. 应用过滤器（如果有）
   * 4. 按触发时间排序，返回
   * 
   * @param params 查询参数
   * @returns 即将到来的提醒 DTO 数组
   */
  async getUpcomingReminders(params: UpcomingRemindersQueryParams): Promise<UpcomingReminderDTO[]> {
    const {
      accountUuid,
      days = 1, // 默认今天内
      limit = 50,
      afterTime = Date.now(),
      groupUuid,
      importanceLevel,
    } = params;

    try {
      logger.info('获取即将到来的提醒', {
        accountUuid,
        days,
        limit,
        groupUuid,
        importanceLevel,
      });

      // 1. 从仓储获取所有启用的提醒
      const container = ReminderContainer.getInstance();
      const reminderRepo = container.getReminderTemplateRepository();
      
      const allReminders = await reminderRepo.findByAccountUuid(accountUuid);
      
      console.log('📊 [ReminderQueryApplicationService] 查询到的所有提醒数量:', allReminders.length);
      console.log('📊 [ReminderQueryApplicationService] 提醒详情:', allReminders.map(r => ({
        uuid: r.uuid,
        title: r.title,
        selfEnabled: r.selfEnabled,
        status: r.status,
        type: r.type,
        trigger: r.trigger,
        nextTriggerAt: r.nextTriggerAt,
      })));
      
      logger.info('📊 查询到的所有提醒', {
        accountUuid,
        total: allReminders.length,
        reminders: allReminders.map((r) => ({
          uuid: r.uuid,
          title: r.title,
          selfEnabled: r.selfEnabled,
          status: r.status,
          type: r.type,
          triggerType: r.trigger.type,
          nextTriggerAt: r.nextTriggerAt,
        })),
      });
      
      // 过滤启用的提醒
      const enabledReminders = allReminders.filter(
        (r) => r.selfEnabled && r.status === 'ACTIVE',
      );

      logger.info('📊 过滤后启用的提醒', {
        accountUuid,
        enabled: enabledReminders.length,
        reminders: enabledReminders.map((r) => ({
          uuid: r.uuid,
          title: r.title,
          type: r.type,
          triggerType: r.trigger.type,
          nextTriggerAt: r.nextTriggerAt,
        })),
      });

      if (enabledReminders.length === 0) {
        logger.info('用户没有启用的提醒', { accountUuid });
        return [];
      }

      // 转换为 ServerDTO（供领域服务使用）
      const reminderServerDTOs = enabledReminders.map((r) => r.toServerDTO());

      logger.info('📊 转换为 ServerDTO', {
        accountUuid,
        count: reminderServerDTOs.length,
        dtos: reminderServerDTOs.map((dto) => ({
          uuid: dto.uuid,
          title: dto.title,
          type: dto.type,
          trigger: dto.trigger,
          recurrence: dto.recurrence,
          activeTime: dto.activeTime,
          nextTriggerAt: dto.nextTriggerAt,
        })),
      });

      // 2. 调用领域服务计算今日作息表（所有触发时间点）
      logger.info('🔍 调用领域服务计算今日作息表', {
        accountUuid,
        days,
        limit,
        maxItemsPerReminder: 20,
        includeExpired: false,
      });

      // 使用新的 calculateTodaySchedule 方法生成完整的今日时间表
      const upcomingReminders = UpcomingReminderCalculationService.calculateTodaySchedule(
        reminderServerDTOs,
        {
          maxItemsPerReminder: 20, // 每个提醒最多显示 20 个时间点
          includeExpired: false, // 不包含已过期的时间点
        },
      );

      logger.info('🔍 领域服务计算今日作息表完成', {
        accountUuid,
        totalTriggerPoints: upcomingReminders.length,
        reminders: upcomingReminders.map((r) => ({
          uuid: r.templateUuid,
          title: r.title,
          nextTriggerAt: new Date(r.nextTriggerAt).toISOString(),
          nextTriggerDisplay: r.nextTriggerDisplay,
        })),
      });

      // 3. 应用额外的过滤器
      let filtered = upcomingReminders;

      if (groupUuid !== undefined) {
        // 过滤特定分组的提醒
        filtered = filtered.filter((r) => r.groupUuid === groupUuid);
      }

      if (importanceLevel) {
        // 过滤特定重要性级别的提醒
        filtered = filtered.filter((r) => r.importanceLevel === importanceLevel);
      }

      logger.info('获取即将到来的提醒成功', {
        accountUuid,
        total: upcomingReminders.length,
        filtered: filtered.length,
      });

      return filtered;
    } catch (error) {
      logger.error('获取即将到来的提醒失败', {
        accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 获取特定提醒的下一次触发时间
   * 
   * @param accountUuid 用户账户 UUID
   * @param templateUuid 提醒模板 UUID
   * @returns 下一次触发的时间戳（epoch ms），如果不需要触发则返回 null
   */
  async getNextTriggerTime(
    accountUuid: string,
    templateUuid: string,
  ): Promise<number | null> {
    try {
      const container = ReminderContainer.getInstance();
      const reminderRepo = container.getReminderTemplateRepository();

      const reminder = await reminderRepo.findById(templateUuid);
      if (!reminder) {
        logger.warn('提醒模板不存在', { accountUuid, templateUuid });
        return null;
      }

      // 检查权限（确保提醒属于该账户）
      if (reminder.accountUuid !== accountUuid) {
        logger.warn('无权限访问提醒', { accountUuid, templateUuid });
        return null;
      }

      const serverDTO = reminder.toServerDTO();
      return UpcomingReminderCalculationService.calculateNextTriggerTime(serverDTO);
    } catch (error) {
      logger.error('获取下一次触发时间失败', {
        accountUuid,
        templateUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 批量获取多个提醒的下一次触发时间
   * 
   * @param accountUuid 用户账户 UUID
   * @param templateUuids 提醒模板 UUID 列表
   * @returns 提醒 UUID → 下一次触发时间的映射
   */
  async getNextTriggerTimes(
    accountUuid: string,
    templateUuids: string[],
  ): Promise<Record<string, number | null>> {
    try {
      const result: Record<string, number | null> = {};

      for (const uuid of templateUuids) {
        const nextTriggerTime = await this.getNextTriggerTime(accountUuid, uuid);
        result[uuid] = nextTriggerTime;
      }

      return result;
    } catch (error) {
      logger.error('批量获取下一次触发时间失败', {
        accountUuid,
        count: templateUuids.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 获取用户所有提醒的统计信息
   * 
   * @param accountUuid 用户账户 UUID
   * @returns 统计信息
   */
  async getReminderStatistics(accountUuid: string) {
    try {
      const container = ReminderContainer.getInstance();
      const reminderRepo = container.getReminderTemplateRepository();

      const allReminders = await reminderRepo.findByAccountUuid(accountUuid);

      return {
        totalCount: allReminders.length,
        enabledCount: allReminders.filter((r) => r.selfEnabled).length,
        disabledCount: allReminders.filter((r) => !r.selfEnabled).length,
        activeCount: allReminders.filter((r) => r.status === 'ACTIVE').length,
        recurringCount: allReminders.filter((r) => r.type === 'RECURRING').length,
        oneTimeCount: allReminders.filter((r) => r.type === 'ONE_TIME').length,
        importanceLevels: {
          vital: allReminders.filter((r) => r.importanceLevel === 'vital').length,
          important: allReminders.filter((r) => r.importanceLevel === 'important').length,
          moderate: allReminders.filter((r) => r.importanceLevel === 'moderate').length,
          minor: allReminders.filter((r) => r.importanceLevel === 'minor').length,
          trivial: allReminders.filter((r) => r.importanceLevel === 'trivial').length,
        },
      };
    } catch (error) {
      logger.error('获取提醒统计信息失败', {
        accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// 导出单例实例
export const reminderQueryApplicationService = ReminderQueryApplicationService.getInstance();

