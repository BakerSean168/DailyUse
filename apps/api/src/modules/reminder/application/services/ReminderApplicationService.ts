import { ReminderDomainService, ReminderGroup } from '@dailyuse/domain-server';
import type {
  IReminderTemplateRepository,
  IReminderGroupRepository,
  IReminderStatisticsRepository,
} from '@dailyuse/domain-server';
import { ReminderContainer } from '../../infrastructure/di/ReminderContainer';
import type { ReminderContracts } from '@dailyuse/contracts';
import { ImportanceLevel } from '@dailyuse/contracts';

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
    updates: Partial<{
      title: string;
      description: string;
      trigger: ReminderContracts.TriggerConfigServerDTO;
      activeTime: ReminderContracts.ActiveTimeConfigServerDTO;
      notificationConfig: ReminderContracts.NotificationConfigServerDTO;
      recurrence?: ReminderContracts.RecurrenceConfigServerDTO;
      activeHours?: ReminderContracts.ActiveHoursConfigServerDTO;
      importanceLevel?: ImportanceLevel;
      tags?: string[];
      color?: string;
      icon?: string;
    }>,
  ): Promise<ReminderTemplateClientDTO> {
    const template = await this.domainService.getTemplate(uuid);
    if (!template) {
      throw new Error(`ReminderTemplate not found: ${uuid}`);
    }

    // 更新属性（简化版本，实际应该有单独的update方法）
    Object.assign(template, updates);
    await this.reminderTemplateRepository.save(template);
    
    return template.toClientDTO();
  }

  /**
   * 删除提醒模板
   */
  async deleteReminderTemplate(uuid: string): Promise<void> {
    await this.domainService.deleteTemplate(uuid, true); // 软删除
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
