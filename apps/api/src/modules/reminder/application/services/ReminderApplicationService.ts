import { ReminderDomainService } from '@dailyuse/domain-server';
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
}
