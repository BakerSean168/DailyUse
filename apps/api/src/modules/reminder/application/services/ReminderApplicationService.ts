import { ReminderDomainService, ReminderGroup } from '@dailyuse/domain-server';
import type {
  IReminderTemplateRepository,
  IReminderGroupRepository,
  IReminderStatisticsRepository,
} from '@dailyuse/domain-server';
import { ReminderContainer } from '../../infrastructure/di/ReminderContainer';
import type { ReminderContracts } from '@dailyuse/contracts';
import { ImportanceLevel } from '@dailyuse/contracts';
import { 
  createLogger,
  eventBus,
  ReminderTemplateNotFoundError,
  ReminderTemplateUpdateError,
  ReminderTemplateMethodMissingError,
  ReminderTemplateSaveError,
} from '@dailyuse/utils';

const logger = createLogger('ReminderApplicationService');

// 类型别名导出（统一在顶部）
type ReminderTemplateClientDTO = ReminderContracts.ReminderTemplateClientDTO;
type ReminderStatisticsClientDTO = ReminderContracts.ReminderStatisticsClientDTO;
type ReminderType = ReminderContracts.ReminderType;
type TriggerType = ReminderContracts.TriggerType;

/**
 * Reminder 应用服务
 * 负责协调领域服务和仓储，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain → ClientDTO）
 *
 * 注意：返回给客户端的数据必须使用 ClientDTO（通过 toClientDTO() 方法）
 */
export class ReminderApplicationService {
  private static instance: ReminderApplicationService;
  private domainService: ReminderDomainService;
  private reminderTemplateRepository: IReminderTemplateRepository;
  private reminderGroupRepository: IReminderGroupRepository;
  private reminderStatisticsRepository: IReminderStatisticsRepository;

  private constructor(
    reminderTemplateRepository: IReminderTemplateRepository,
    reminderGroupRepository: IReminderGroupRepository,
    reminderStatisticsRepository: IReminderStatisticsRepository,
  ) {
    this.reminderTemplateRepository = reminderTemplateRepository;
    this.reminderGroupRepository = reminderGroupRepository;
    this.reminderStatisticsRepository = reminderStatisticsRepository;
    this.domainService = new ReminderDomainService(
      reminderTemplateRepository,
      reminderGroupRepository,
      reminderStatisticsRepository,
    );
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    reminderTemplateRepository?: IReminderTemplateRepository,
    reminderGroupRepository?: IReminderGroupRepository,
    reminderStatisticsRepository?: IReminderStatisticsRepository,
  ): Promise<ReminderApplicationService> {
    const container = ReminderContainer.getInstance();
    const templateRepo = reminderTemplateRepository || container.getReminderTemplateRepository();
    const groupRepo = reminderGroupRepository || container.getReminderGroupRepository();
    const statsRepo = reminderStatisticsRepository || container.getReminderStatisticsRepository();

    ReminderApplicationService.instance = new ReminderApplicationService(
      templateRepo,
      groupRepo,
      statsRepo,
    );
    return ReminderApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<ReminderApplicationService> {
    if (!ReminderApplicationService.instance) {
      ReminderApplicationService.instance = await ReminderApplicationService.createInstance();
    }
    return ReminderApplicationService.instance;
  }

  // ===== Reminder Template 管理 =====

  /**
   * 创建提醒模板
   */
  async createReminderTemplate(params: {
    accountUuid: string;
    title: string;
    type: ReminderType;
    trigger: ReminderContracts.TriggerConfigServerDTO;
    activeTime: ReminderContracts.ActiveTimeConfigServerDTO;
    notificationConfig: ReminderContracts.NotificationConfigServerDTO;
    description?: string;
    recurrence?: ReminderContracts.RecurrenceConfigServerDTO;
    activeHours?: ReminderContracts.ActiveHoursConfigServerDTO;
    importanceLevel?: ImportanceLevel;
    tags?: string[];
    color?: string;
    icon?: string;
    groupUuid?: string;
  }): Promise<ReminderTemplateClientDTO> {
    const template = await this.domainService.createReminderTemplate(params);
    
    // 发布领域事件到事件总线（触发调度任务创建）
    const events = template.getDomainEvents();
    console.log('🔥 [ReminderApplicationService] Publishing domain events:', {
      templateUuid: template.uuid,
      eventsCount: events.length,
      eventTypes: events.map(e => e.eventType),
    });
    
    for (const event of events) {
      // 增强事件 payload，包含完整的 reminder 数据用于调度系统
      const enhancedEvent = {
        ...event,
        payload: {
          ...(typeof event.payload === 'object' && event.payload !== null ? event.payload : {}),
          reminder: template.toServerDTO(), // 添加完整的 ServerDTO
        },
      };
      console.log('📤 [ReminderApplicationService] Publishing event:', {
        eventType: enhancedEvent.eventType,
        accountUuid: enhancedEvent.accountUuid,
        aggregateId: enhancedEvent.aggregateId,
        hasReminder: !!enhancedEvent.payload.reminder,
      });
      await eventBus.publish(enhancedEvent);
    }
    template.clearDomainEvents();
    
    logger.info('Reminder template created and events published', { 
      uuid: template.uuid,
      eventsCount: events.length 
    });
    
    return template.toClientDTO();
  }

  /**
   * 获取提醒模板详情
   */
  async getReminderTemplate(uuid: string): Promise<ReminderTemplateClientDTO | null> {
    const template = await this.domainService.getTemplate(uuid, { includeHistory: false });
    return template ? template.toClientDTO() : null;
  }

  /**
   * 获取用户的所有提醒模板
   */
  async getUserReminderTemplates(accountUuid: string): Promise<ReminderTemplateClientDTO[]> {
    const templates = await this.reminderTemplateRepository.findByAccountUuid(accountUuid, {
      includeHistory: false,
      includeDeleted: false,
    });
    return templates.map((t) => t.toClientDTO());
  }

  /**
   * 更新提醒模板
   */
  async updateReminderTemplate(
    uuid: string,
    updates: ReminderContracts.UpdateReminderTemplateRequestDTO,
  ): Promise<ReminderTemplateClientDTO> {
    const operationId = `update-template-${uuid}-${Date.now()}`;
    
    try {
      logger.info('Starting template update', { operationId, uuid, updates: Object.keys(updates) });

      // Step 1: 获取模板
      const template = await this.domainService.getTemplate(uuid);
      if (!template) {
        throw new ReminderTemplateNotFoundError(uuid, operationId);
      }

      logger.debug('Template loaded', {
        operationId,
        uuid,
        templateType: template.constructor.name,
      });

      // Step 2: 验证模板实例有效性
      const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(template))
        .filter(m => typeof (template as any)[m] === 'function');

      if (typeof template.update !== 'function') {
        logger.error('Template instance invalid: missing update method', {
          operationId,
          uuid,
          templateType: template.constructor.name,
          availableMethods,
        });
        
        throw new ReminderTemplateMethodMissingError('update', {
          uuid,
          templateType: template.constructor.name,
          availableMethods,
          operationId,
          step: 'validate_instance',
        });
      }

      logger.debug('Template validation passed', { operationId, uuid });

      // Step 3: 执行更新
      template.update(updates);
      logger.debug('Template updated in memory', { operationId, uuid });

      // Step 4: 持久化
      await this.reminderTemplateRepository.save(template);
      logger.info('Template saved to database', { operationId, uuid });

      // Step 5: 发布领域事件到事件总线（触发调度任务更新）
      const events = template.getDomainEvents();
      for (const event of events) {
        await eventBus.publish(event);
      }
      template.clearDomainEvents();
      
      logger.info('Reminder template updated and events published', { 
        uuid,
        operationId,
        eventsCount: events.length 
      });

      // Step 6: 返回结果
      const result = template.toClientDTO();
      logger.info('Template update completed', {
        operationId,
        uuid,
        title: result.title,
      });

      return result;
      
    } catch (error) {
      // 如果是已知的领域错误，直接抛出
      if (error instanceof ReminderTemplateNotFoundError ||
          error instanceof ReminderTemplateMethodMissingError) {
        throw error;
      }

      // 未知错误，包装后抛出
      logger.error('Template update failed with unexpected error', {
        operationId,
        uuid,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new ReminderTemplateUpdateError(
        uuid,
        error instanceof Error ? error.message : 'Unknown error',
        { operationId, step: 'unknown' },
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 删除提醒模板
   */
  async deleteReminderTemplate(uuid: string): Promise<void> {
    const template = await this.domainService.getTemplate(uuid);
    if (!template) {
      throw new Error(`ReminderTemplate not found: ${uuid}`);
    }

    // 执行软删除
    await this.domainService.deleteTemplate(uuid, true);

    // 发布删除事件到事件总线（触发调度任务删除）
    const events = template.getDomainEvents();
    for (const event of events) {
      const enhancedEvent = {
        ...event,
        payload: {
          ...(typeof event.payload === 'object' && event.payload !== null ? event.payload : {}),
          reminder: template.toServerDTO(),
        },
      };
      await eventBus.publish(enhancedEvent);
    }
    template.clearDomainEvents();

    logger.info('Reminder template deleted and events published', {
      uuid,
      eventsCount: events.length,
    });
  }

  /**
   * 切换提醒模板启用状态
   */
  async toggleReminderTemplateStatus(uuid: string): Promise<ReminderTemplateClientDTO> {
    const template = await this.domainService.getTemplate(uuid);
    if (!template) {
      throw new Error(`ReminderTemplate not found: ${uuid}`);
    }

    // Toggle enabled status
    if (template.selfEnabled) {
      template.pause();
    } else {
      template.enable();
    }

    await this.reminderTemplateRepository.save(template);

    // 发布启用/禁用事件到事件总线（触发调度任务启用/禁用）
    const events = template.getDomainEvents();
    for (const event of events) {
      const enhancedEvent = {
        ...event,
        payload: {
          ...(typeof event.payload === 'object' && event.payload !== null ? event.payload : {}),
          reminder: template.toServerDTO(),
        },
      };
      await eventBus.publish(enhancedEvent);
    }
    template.clearDomainEvents();

    logger.info('Reminder template status toggled and events published', {
      uuid,
      enabled: template.selfEnabled,
      eventsCount: events.length,
    });

    return template.toClientDTO();
  }

  /**
   * 搜索提醒模板（简化版：按标题模糊搜索）
   */
  async searchReminderTemplates(
    accountUuid: string,
    query: string,
  ): Promise<ReminderTemplateClientDTO[]> {
    const allTemplates = await this.reminderTemplateRepository.findByAccountUuid(accountUuid, {
      includeHistory: false,
      includeDeleted: false,
    });
    
    // 简单的客户端过滤（实际应在仓储层实现）
    const filtered = allTemplates.filter((t) =>
      t.title.toLowerCase().includes(query.toLowerCase()),
    );
    
    return filtered.map((t) => t.toClientDTO());
  }

  /**
   * 获取提醒统计
   */
  async getReminderStatistics(accountUuid: string): Promise<ReminderStatisticsClientDTO> {
    const stats = await this.reminderStatisticsRepository.findOrCreate(accountUuid);
    return stats.toClientDTO();
  }

  /**
   * 获取即将到来的提醒（基于模板和调度计算）
   * TODO: 实现真实的调度计算逻辑
   */
  async getUpcomingReminders(params: {
    days?: number;
    limit?: number;
    importanceLevel?: ImportanceLevel;
    type?: ReminderType;
  }): Promise<ReminderContracts.UpcomingRemindersResponseDTO> {
    const days = params.days || 7;
    const limit = params.limit || 50;

    const now = Date.now();
    const fromDate = now;
    const toDate = now + days * 24 * 60 * 60 * 1000;

    // TODO: 实现真实的调度计算逻辑
    // 1. 查询所有活跃模板
    // 2. 根据每个模板的 trigger + recurrence 配置计算未来触发时间
    // 3. 筛选在时间范围内的触发点
    // 4. 按时间排序并限制数量
    console.warn(
      `getUpcomingReminders: 此功能需要调度计算引擎支持，当前返回空数据`,
    );

    return {
      reminders: [],
      total: 0,
      fromDate,
      toDate,
    };
  }

  /**
   * 获取模板的调度状态
   * TODO: 目前返回基于模板数据的简单状态，待实现调度系统后返回真实调度信息
   */
  async getTemplateScheduleStatus(
    templateUuid: string,
  ): Promise<ReminderContracts.TemplateScheduleStatusDTO> {
    const template = await this.reminderTemplateRepository.findById(templateUuid);

    if (!template) {
      throw new Error(`Reminder template not found: ${templateUuid}`);
    }

    // TODO: 实现真实的调度状态查询
    // 当前基于模板状态返回基本信息
    const now = Date.now();
    const effectiveEnabled = await template.getEffectiveEnabled();

    return {
      templateUuid: template.uuid,
      hasSchedule: true, // 所有模板都有调度配置
      enabled: template.selfEnabled && effectiveEnabled,
      status: template.status,
      nextTriggerAt: template.nextTriggerAt,
      lastTriggeredAt: null, // TODO: 从调度历史中获取
      triggerCount: 0, // TODO: 从调度历史中统计
      lastTriggerResult: null, // TODO: 从调度历史中获取
      errorMessage: null,
      updatedAt: now,
    };
  }

  // ===== Reminder Group 管理 =====

  /**
   * 创建提醒分组
   */
  async createReminderGroup(params: {
    accountUuid: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }): Promise<ReminderContracts.ReminderGroupClientDTO> {
    const group = await this.domainService.createReminderGroup(params);
    return group.toClientDTO();
  }

  /**
   * 获取分组详情
   */
  async getReminderGroup(uuid: string): Promise<ReminderContracts.ReminderGroupClientDTO | null> {
    const group = await this.reminderGroupRepository.findById(uuid);
    return group ? group.toClientDTO() : null;
  }

  /**
   * 获取用户的所有分组
   */
  async getUserReminderGroups(
    accountUuid: string,
  ): Promise<ReminderContracts.ReminderGroupClientDTO[]> {
    const groups = await this.reminderGroupRepository.findByAccountUuid(accountUuid);
    return groups.map((g) => g.toClientDTO());
  }

  /**
   * 更新分组
   */
  async updateReminderGroup(
    uuid: string,
    updates: {
      name?: string;
      description?: string;
      enabled?: boolean;
    },
  ): Promise<ReminderContracts.ReminderGroupClientDTO> {
    const group = await this.reminderGroupRepository.findById(uuid);
    if (!group) {
      throw new Error(`ReminderGroup not found: ${uuid}`);
    }

    // 用 ServerDTO 重建对象以更新字段
    const serverDTO = group.toServerDTO();
    const updatedGroup = ReminderGroup.fromServerDTO({
      ...serverDTO,
      name: updates.name ?? serverDTO.name,
      description: updates.description ?? serverDTO.description,
    });

    // 单独处理 enabled 状态
    if (updates.enabled !== undefined) {
      if (updates.enabled && !updatedGroup.enabled) {
        updatedGroup.enable();
      } else if (!updates.enabled && updatedGroup.enabled) {
        updatedGroup.pause();
      }
    }

    await this.reminderGroupRepository.save(updatedGroup);
    return updatedGroup.toClientDTO();
  }

  /**
   * 删除分组
   */
  async deleteReminderGroup(uuid: string): Promise<void> {
    await this.domainService.deleteGroup(uuid);
  }

  /**
   * 切换分组启用状态
   */
  async toggleReminderGroupStatus(
    uuid: string,
  ): Promise<ReminderContracts.ReminderGroupClientDTO> {
    const group = await this.reminderGroupRepository.findById(uuid);
    if (!group) {
      throw new Error(`ReminderGroup not found: ${uuid}`);
    }

    group.toggle();
    await this.reminderGroupRepository.save(group);
    return group.toClientDTO();
  }

  /**
   * 切换分组控制模式
   */
  async toggleReminderGroupControlMode(
    uuid: string,
  ): Promise<ReminderContracts.ReminderGroupClientDTO> {
    const group = await this.reminderGroupRepository.findById(uuid);
    if (!group) {
      throw new Error(`ReminderGroup not found: ${uuid}`);
    }

    group.toggleControlMode();
    await this.reminderGroupRepository.save(group);
    return group.toClientDTO();
  }
}
