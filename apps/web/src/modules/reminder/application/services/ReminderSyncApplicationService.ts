import type { ReminderTemplateClientDTO, ReminderGroupClientDTO, ReminderHistoryClientDTO, ReminderStatisticsClientDTO, ReminderGroupServerDTO, ReminderTemplateServerDTO } from '@dailyuse/contracts/reminder';
import { ReminderTemplate, ReminderGroup } from '@dailyuse/domain-client/reminder';
import { reminderApiClient } from '../../infrastructure/api/reminderApiClient';
import { getReminderStore } from '../../presentation/stores/reminderStore';
import { eventBus } from '@dailyuse/utils';

/**
 * Reminder Events
 */
export const ReminderEvents = {
  TEMPLATE_REFRESH: 'reminder:template:refresh',
  GROUP_REFRESH: 'reminder:group:refresh',
  TEMPLATES_REFRESH_ALL: 'reminder:templates:refresh:all',
  GROUPS_REFRESH_ALL: 'reminder:groups:refresh:all',
} as const;

/**
 * Reminder Template 刷新事件
 */
export interface ReminderTemplateRefreshEvent {
  templateUuid: string;
  reason: string;
  timestamp: number;
  action?: string;
  payload?: Record<string, unknown>;
  template?:
    | ReminderTemplateClientDTO
    | ReminderTemplateServerDTO;
}

/**
 * Reminder Group 刷新事件
 */
export interface ReminderGroupRefreshEvent {
  groupUuid: string;
  reason: string;
  timestamp: number;
  action?: string;
  payload?: Record<string, unknown>;
  group?:
    | ReminderGroupClientDTO
    | ReminderGroupServerDTO;
}

/**
 * Reminder Sync Application Service
 * 提醒数据同步应用服务 - 负责 ReminderTemplate 和 ReminderGroup 的数据同步
 * 
 * 核心职责：
 * 1. 初始化时同步所有数据
 * 2. 监听事件总线上的 Reminder 刷新事件
 * 3. 当事件触发时，从服务器刷新对应的数据
 * 4. 更新 Pinia store
 * 
 * 事件驱动架构：
 * - ReminderInstance 更新 → 发布 ReminderTemplateRefreshEvent
 * - ReminderSyncApplicationService 监听此事件
 * - 自动从服务器刷新 ReminderTemplate 数据
 * - Store 更新 → UI 自动响应
 */
export class ReminderSyncApplicationService {
  private static instance: ReminderSyncApplicationService;
  private unsubscribeFunctions: Map<string, () => void> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): ReminderSyncApplicationService {
    if (!ReminderSyncApplicationService.instance) {
      ReminderSyncApplicationService.instance = new ReminderSyncApplicationService();
    }
    return ReminderSyncApplicationService.instance;
  }

  /**
   * 懒加载获取 Reminder Store
   */
  private get reminderStore() {
    return getReminderStore();
  }

  /**
   * 初始化事件监听
   * 应在应用启动时调用一次
   */
  initializeEventListeners(): void {
    if (this.isInitialized) {
      console.warn('⚠️ [ReminderSyncApplicationService] 事件监听已初始化');
      return;
    }

    console.log('🎧 [ReminderSyncApplicationService] 初始化事件监听...');

    // 监听 ReminderTemplate 刷新事件
    const templateHandler = (event: ReminderTemplateRefreshEvent) =>
      this.handleTemplateRefreshEvent(event);
    eventBus.on(ReminderEvents.TEMPLATE_REFRESH, templateHandler);
    this.unsubscribeFunctions.set(ReminderEvents.TEMPLATE_REFRESH, () =>
      eventBus.off(ReminderEvents.TEMPLATE_REFRESH, templateHandler)
    );

    // 监听 ReminderGroup 刷新事件
    const groupHandler = (event: ReminderGroupRefreshEvent) =>
      this.handleGroupRefreshEvent(event);
    eventBus.on(ReminderEvents.GROUP_REFRESH, groupHandler);
    this.unsubscribeFunctions.set(ReminderEvents.GROUP_REFRESH, () =>
      eventBus.off(ReminderEvents.GROUP_REFRESH, groupHandler)
    );

    // 监听全量刷新事件
    const templatesAllHandler = () => this.refreshAllTemplates();
    eventBus.on(ReminderEvents.TEMPLATES_REFRESH_ALL, templatesAllHandler);
    this.unsubscribeFunctions.set(ReminderEvents.TEMPLATES_REFRESH_ALL, () =>
      eventBus.off(ReminderEvents.TEMPLATES_REFRESH_ALL, templatesAllHandler)
    );

    const groupsAllHandler = () => this.refreshAllGroups();
    eventBus.on(ReminderEvents.GROUPS_REFRESH_ALL, groupsAllHandler);
    this.unsubscribeFunctions.set(ReminderEvents.GROUPS_REFRESH_ALL, () =>
      eventBus.off(ReminderEvents.GROUPS_REFRESH_ALL, groupsAllHandler)
    );

    this.isInitialized = true;
    console.log('✅ [ReminderSyncApplicationService] 事件监听初始化完成');
  }

  /**
   * 处理 ReminderTemplate 刷新事件
   */
  private async handleTemplateRefreshEvent(event: ReminderTemplateRefreshEvent): Promise<void> {
    try {
      const action = event.action || event.reason;
      console.log('[ReminderSyncApplicationService] 收到 Template 刷新事件:', {
        templateUuid: event.templateUuid,
        reason: event.reason,
        action,
        timestamp: new Date(event.timestamp).toISOString(),
      });

      if (action === 'template-deleted') {
        this.reminderStore.removeReminderTemplate(event.templateUuid);
        console.log('[ReminderSyncApplicationService] 已根据 SSE 事件删除模板:', event.templateUuid);
        return;
      }

      let template = this.normalizeTemplateSnapshot(event.template);

      if (!template) {
        // 从服务器刷新该 Template 的完整数据
        const templateDto = await reminderApiClient.getReminderTemplate(event.templateUuid);

        if (!templateDto) {
          console.warn(
            `❌ [ReminderSyncApplicationService] Template 不存在: ${event.templateUuid}`,
          );
          return;
        }

        template = ReminderTemplate.fromClientDTO(templateDto);
      }

      // 更新 store
      this.reminderStore.addOrUpdateReminderTemplate(template);

      console.log(`✅ [ReminderSyncApplicationService] Template 已更新到 store:`, {
        uuid: template.uuid,
        title: template.title,
        reason: event.reason,
        action,
      });
    } catch (error) {
      console.error(
        `❌ [ReminderSyncApplicationService] 刷新 Template 失败: ${event.templateUuid}`,
        error
      );
    }
  }

  /**
   * 处理 ReminderGroup 刷新事件
   */
  private async handleGroupRefreshEvent(event: ReminderGroupRefreshEvent): Promise<void> {
    try {
      const action = event.action || event.reason;
      console.log('[ReminderSyncApplicationService] 收到 Group 刷新事件:', {
        groupUuid: event.groupUuid,
        reason: event.reason,
        action,
        timestamp: new Date(event.timestamp).toISOString(),
      });

      if (action === 'group-deleted') {
        this.reminderStore.removeReminderGroup(event.groupUuid);
        console.log('[ReminderSyncApplicationService] 已根据 SSE 事件删除分组:', event.groupUuid);
        return;
      }

      let group = this.normalizeGroupSnapshot(event.group);

      if (!group) {
        // 从服务器刷新该 Group 的完整数据
        const groupDto = await reminderApiClient.getReminderGroup(event.groupUuid);

        if (!groupDto) {
          console.warn(`❌ [ReminderSyncApplicationService] Group 不存在: ${event.groupUuid}`);
          return;
        }

        group = ReminderGroup.fromClientDTO(groupDto);
      }

      // 更新 store
      this.reminderStore.addOrUpdateReminderGroup(group);

      console.log(`✅ [ReminderSyncApplicationService] Group 已更新到 store:`, {
        uuid: group.uuid,
        name: group.name,
        reason: event.reason,
        action,
      });
    } catch (error) {
      console.error(
        `❌ [ReminderSyncApplicationService] 刷新 Group 失败: ${event.groupUuid}`,
        error
      );
    }
  }

  /**
   * 刷新所有 Templates
   */
  private async refreshAllTemplates(): Promise<void> {
    try {
      console.log('🔄 [ReminderSyncApplicationService] 刷新所有 Templates...');
      const response = await reminderApiClient.getReminderTemplates({ limit: 1000 });
      
      // API 返回格式: { templates: [...], total, page, pageSize, hasMore }
      const templatesData = response?.templates || [];
      const templates = templatesData.map((dto: any) =>
        ReminderTemplate.fromClientDTO(dto)
      );
      this.reminderStore.setReminderTemplates(templates);
      console.log(`✅ [ReminderSyncApplicationService] 已刷新 ${templates.length} 个 Templates`);
    } catch (error) {
      console.error('❌ [ReminderSyncApplicationService] 刷新所有 Templates 失败:', error);
    }
  }

  /**
   * 刷新所有 Groups
   */
  private async refreshAllGroups(): Promise<void> {
    try {
      console.log('🔄 [ReminderSyncApplicationService] 刷新所有 Groups...');
      const response = await reminderApiClient.getReminderGroups({ limit: 1000 });
      
      // API 返回格式: { groups: [...], total, page, pageSize, hasMore }
      // axios 拦截器已经解包了外层的 { data: ... }
      const groupsData = response?.groups || [];
      
      const groups = groupsData.map((dto: any) => ReminderGroup.fromClientDTO(dto));
      this.reminderStore.setReminderGroups(groups);
      console.log(`✅ [ReminderSyncApplicationService] 已刷新 ${groups.length} 个 Groups`);
    } catch (error) {
      console.error('❌ [ReminderSyncApplicationService] 刷新所有 Groups 失败:', error);
    }
  }

  /**
   * 清理事件监听
   * 应在应用卸载时调用
   */
  cleanup(): void {
    console.log('🧹 [ReminderSyncApplicationService] 清理事件监听...');

    this.unsubscribeFunctions.forEach((unsubscribe, eventName) => {
      unsubscribe();
      console.log(`  - 取消监听: ${eventName}`);
    });

    this.unsubscribeFunctions.clear();
    this.isInitialized = false;

    console.log('✅ [ReminderSyncApplicationService] 事件监听清理完成');
  }

  /**
   * 同步所有提醒模板和分组数据到 store
   * 用于应用初始化时加载所有数据
   */
  async syncAllTemplatesAndGroups(): Promise<{
    templatesCount: number;
    groupsCount: number;
  }> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      console.log('📡 开始发起 API 请求（同步所有提醒数据）...');

      // 并行获取所有模板和分组数据
      const [templatesResponse, groupsResponse] = await Promise.all([
        reminderApiClient.getReminderTemplates({ limit: 1000 }),
        reminderApiClient.getReminderGroups({ limit: 1000 }),
      ]);

      console.log('🔍 API 响应数据:', {
        templatesStructure: templatesResponse ? Object.keys(templatesResponse) : 'null/undefined',
        groupsStructure: groupsResponse ? Object.keys(groupsResponse) : 'null/undefined',
        templatesResponse,
        groupsResponse,
      });

      // 转换为客户端实体 - Templates
      // API 返回格式: { templates: [...], total, page, pageSize, hasMore }
      const templatesData = templatesResponse?.templates || [];
      const templates = templatesData.map((dto: any) => ReminderTemplate.fromClientDTO(dto));

      // 转换为客户端实体 - Groups
      // API 实际返回格式: { groups: [...], total, page, pageSize, hasMore }
      // 注意：apiClient 已经解包了外层的 data
      const groupsData = (groupsResponse as any)?.groups || (groupsResponse as any)?.items || [];
      const groups = groupsData.map((dto: any) => ReminderGroup.fromClientDTO(dto));

      console.log('同步前 ========= templates', templates);
      console.log('同步前 ========= groups', groups);

      // 批量同步到 store
      this.reminderStore.setReminderTemplates(templates);
      this.reminderStore.setReminderGroups(groups);

      console.log(`✅ 成功同步数据: ${templates.length} 个提醒模板, ${groups.length} 个分组`);

      return {
        templatesCount: templates.length,
        groupsCount: groups.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步提醒数据失败';
      this.reminderStore.setError(errorMessage);
      console.error('❌ 同步提醒数据失败:', error);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 刷新所有数据
   */
  async refreshAll(): Promise<void> {
    try {
      console.log('🔄 开始刷新所有提醒数据...');
      await this.syncAllTemplatesAndGroups();
      console.log('✅ 所有提醒数据刷新完成');
    } catch (error) {
      console.error('❌ 刷新提醒数据失败:', error);
      throw error;
    }
  }

  private normalizeTemplateSnapshot(
    snapshot?:
      | ReminderTemplateClientDTO
      | ReminderTemplateServerDTO,
  ): ReminderTemplate | null {
    if (!snapshot) {
      return null;
    }

    if ('displayName' in snapshot && typeof snapshot.displayName === 'string') {
      return ReminderTemplate.fromClientDTO(snapshot as ReminderTemplateClientDTO);
    }

    return ReminderTemplate.fromServerDTO(snapshot as ReminderTemplateServerDTO);
  }

  private normalizeGroupSnapshot(
    snapshot?:
      | ReminderGroupClientDTO
      | ReminderGroupServerDTO,
  ): ReminderGroup | null {
    if (!snapshot) {
      return null;
    }

    if ('displayName' in snapshot || 'controlModeText' in snapshot) {
      return ReminderGroup.fromClientDTO(snapshot as ReminderGroupClientDTO);
    }

    return ReminderGroup.fromServerDTO(snapshot as ReminderGroupServerDTO);
  }
}

export const reminderSyncApplicationService = ReminderSyncApplicationService.getInstance();

