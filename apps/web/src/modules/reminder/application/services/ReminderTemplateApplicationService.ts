/**
 * Reminder Template Application Service
 * 提醒模板应用服务 - Web 端
 *
 * 职责：
 * - 提醒模板的 CRUD 操作
 * - 模板状态管理（启用/禁用）
 * - 模板搜索和查询
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

// 类型别名
type ReminderTemplate = ReminderContracts.ReminderTemplateClientDTO;

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
   * 延迟获取 Snackbar（避免在 Pinia 初始化前访问）
   */
  private get snackbar() {
    return useSnackbar();
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
    request: ReminderContracts.CreateReminderTemplateRequestDTO,
  ): Promise<ReminderContracts.ReminderTemplateClientDTO> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const templateData = await reminderApiClient.createReminderTemplate(request);

      // 直接使用 DTO 数据同步到 store
      this.reminderStore.addOrUpdateReminderTemplate(templateData);

      this.snackbar.showSuccess('提醒模板创建成功');
      return templateData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建提醒模板失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
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

      const templatesResponse = await reminderApiClient.getReminderTemplates(params);

      // 直接使用 DTO 数据同步到 store
      const templates = Array.isArray(templatesResponse) ? templatesResponse : [];
      this.reminderStore.setReminderTemplates(templates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取提醒模板失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 获取活跃的提醒模板
   */
  async getActiveTemplates(params?: {
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

      const templatesResponse = await reminderApiClient.getActiveTemplates(params);

      // 直接使用 DTO 数据同步到 store
      const templates = Array.isArray(templatesResponse) ? templatesResponse : [];
      this.reminderStore.setReminderTemplates(templates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取活跃模板失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
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

      // 直接使用 DTO 数据同步到 store
      this.reminderStore.addOrUpdateReminderTemplate(templateData);

      return templateData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取提醒模板详情失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
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
    request: Partial<ReminderContracts.CreateReminderTemplateRequestDTO>,
  ): Promise<ReminderTemplate> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const templateData = await reminderApiClient.updateReminderTemplate(uuid, request);

      // 直接使用 DTO 数据同步到 store
      this.reminderStore.addOrUpdateReminderTemplate(templateData);

      this.snackbar.showSuccess('提醒模板更新成功');
      return templateData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新提醒模板失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
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

      // 从 store 中移除
      this.reminderStore.removeReminderTemplate(uuid);

      this.snackbar.showSuccess('提醒模板删除成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除提醒模板失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
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
  ): Promise<ReminderContracts.ReminderTemplateClientDTO> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const templateData = await reminderApiClient.toggleTemplateEnabled(uuid, enabled);

      // 直接使用 DTO 数据同步到 store
      this.reminderStore.addOrUpdateReminderTemplate(templateData);

      return templateData;
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
      return templates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索模板失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }
}

// 导出单例实例
export const reminderTemplateApplicationService = ReminderTemplateApplicationService.getInstance();
