/**
 * Reminder Template Application Service
 * 提醒模板应用服务 - Web 端
 *
 * 职责：
 * - 提醒模板的 CRUD 操作
 * - 模板状态管理（启用/禁用）
 * - 模板搜索和查询
 *
 * Pattern A: ApplicationService 只负责 API 调用和 DTO 转换
 * UI 反馈（success/error 消息）由 Composable 层处理
 *
 * 特性：
 * - 单例模式
 * - 依赖注入支持
 * - 统一错误处理
 */

import type { CreateReminderTemplateRequest, UpdateReminderTemplateRequest, ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { ReminderTemplate } from '@dailyuse/domain-client/reminder';
import { reminderApiClient } from '../../infrastructure/api/reminderApiClient';
import { useReminderStore } from '../../presentation/stores/reminderStore';

export class ReminderTemplateApplicationService {
  private static instance: ReminderTemplateApplicationService;

  private constructor() {}

  /**
   * 延迟获取 Store（避免在 Pinia 初始化前访问）
   */
  private get reminderStore() {
    return useReminderStore();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ReminderTemplateApplicationService {
    if (!ReminderTemplateApplicationService.instance) {
      ReminderTemplateApplicationService.instance = new ReminderTemplateApplicationService();
    }
    return ReminderTemplateApplicationService.instance;
  }

  // ===== 模板 CRUD =====

  /**
   * 创建提醒模板
   */
  async createReminderTemplate(
    request: CreateReminderTemplateRequest,
  ): Promise<ReminderTemplate> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

  const templateData = await reminderApiClient.createReminderTemplate(request);

  const template = ReminderTemplate.fromClientDTO(templateData);
  this.reminderStore.addOrUpdateReminderTemplate(template);

  return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建提醒模板失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 获取提醒模板列表
   */
  async getReminderTemplates(params?: {
    page?: number;
    limit?: number;
    forceRefresh?: boolean;
  }): Promise<void> {
    try {
      // 缓存优先策略：如果已有数据且不强制刷新，直接返回
      if (!params?.forceRefresh && this.reminderStore.reminderTemplates.length > 0) {
        return;
      }

      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const response = await reminderApiClient.getReminderTemplates(params);

      // 处理新的响应格式：{ templates, total, page, pageSize, hasMore }
      const templates = response.templates.map((template) =>
        ReminderTemplate.fromClientDTO(template),
      );
      this.reminderStore.setReminderTemplates(templates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取提醒模板失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 获取提醒模板详情
   */
  async getReminderTemplate(uuid: string): Promise<ReminderTemplate | null> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

  const templateData = await reminderApiClient.getReminderTemplate(uuid);

  const template = ReminderTemplate.fromClientDTO(templateData);
  this.reminderStore.addOrUpdateReminderTemplate(template);

  return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取提醒模板详情失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 更新提醒模板
   */
  async updateReminderTemplate(
    uuid: string,
    request: Partial<CreateReminderTemplateRequest>,
  ): Promise<ReminderTemplate> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

  const templateData = await reminderApiClient.updateReminderTemplate(uuid, request);

  const template = ReminderTemplate.fromClientDTO(templateData);
  this.reminderStore.addOrUpdateReminderTemplate(template);

  return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新提醒模板失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 删除提醒模板
   */
  async deleteReminderTemplate(uuid: string): Promise<void> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

  await reminderApiClient.deleteReminderTemplate(uuid);

  this.reminderStore.removeReminderTemplate(uuid);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除提醒模板失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 切换模板启用状态
   */
  async toggleTemplateEnabled(
    uuid: string,
    enabled: boolean,
  ): Promise<ReminderTemplate> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

  const templateData = await reminderApiClient.toggleTemplateEnabled(uuid, enabled);

  const template = ReminderTemplate.fromClientDTO(templateData);
  this.reminderStore.addOrUpdateReminderTemplate(template);

  return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换模板状态失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 搜索提醒模板
   */
  async searchTemplates(
    accountUuid: string,
    query: string,
  ): Promise<ReminderTemplate[]> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

  const templates = await reminderApiClient.searchReminderTemplates(accountUuid, query);
  return templates.map((template) => ReminderTemplate.fromClientDTO(template));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索模板失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 移动模板到指定分组
   */
  async moveTemplateToGroup(
    templateUuid: string,
    targetGroupUuid: string | null,
  ): Promise<ReminderTemplate> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const templateData = await reminderApiClient.moveTemplateToGroup(
        templateUuid,
        targetGroupUuid
      );

      const template = ReminderTemplate.fromClientDTO(templateData);
      this.reminderStore.addOrUpdateReminderTemplate(template);

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '移动模板失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 获取即将到来的提醒
   */
  async getUpcomingReminders(options?: {
    limit?: number;
    days?: number;
    importanceLevel?: string;
    type?: string;
  }) {
    return await reminderApiClient.getUpcomingReminders(options);
  }
}

// 导出单例实例
export const reminderTemplateApplicationService = ReminderTemplateApplicationService.getInstance();

