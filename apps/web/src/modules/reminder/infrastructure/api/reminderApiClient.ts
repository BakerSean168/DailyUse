/**
 * Reminder API Client
 * 
 * 职责：
 * - 封装 Reminder 模块的所有 HTTP 请求
 * - 统一错误处理
 * - 类型安全的请求/响应
 */

import { apiClient } from '@/shared/api';
import type { ReminderContracts } from '@dailyuse/contracts';

// 类型别名
type ReminderTemplateClientDTO = ReminderContracts.ReminderTemplateClientDTO;
type CreateReminderTemplateRequestDTO = ReminderContracts.CreateReminderTemplateRequestDTO;
type UpdateReminderTemplateRequestDTO = ReminderContracts.UpdateReminderTemplateRequestDTO;
type ReminderStatisticsClientDTO = ReminderContracts.ReminderStatisticsClientDTO;

/**
 * Reminder API Client
 * 
 * 注意：apiClient 方法直接返回数据 (T)，不是包装的 ApiResponse<T>
 */
export const reminderApiClient = {
  /**
   * 创建提醒模板
   */
  async createTemplate(
    data: CreateReminderTemplateRequestDTO,
  ): Promise<ReminderTemplateClientDTO> {
    return apiClient.post<ReminderTemplateClientDTO>('/reminders/templates', data);
  },

  // 别名方法（兼容应用服务）
  createReminderTemplate(
    data: CreateReminderTemplateRequestDTO,
  ): Promise<ReminderTemplateClientDTO> {
    return this.createTemplate(data);
  },

  /**
   * 获取提醒模板详情
   */
  async getTemplate(uuid: string): Promise<ReminderTemplateClientDTO> {
    return apiClient.get<ReminderTemplateClientDTO>(`/reminders/templates/${uuid}`);
  },

  // 别名方法（兼容应用服务）
  getReminderTemplate(uuid: string): Promise<ReminderTemplateClientDTO> {
    return this.getTemplate(uuid);
  },

  /**
   * 获取用户的所有提醒模板
   */
  async getUserTemplates(accountUuid: string): Promise<ReminderTemplateClientDTO[]> {
    return apiClient.get<ReminderTemplateClientDTO[]>(
      `/reminders/templates/user/${accountUuid}`,
    );
  },

  // 别名方法（兼容应用服务）
  async getReminderTemplates(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReminderTemplateClientDTO[]> {
    // 目前不需要传递 accountUuid，后端通过 session 获取
    return apiClient.get<ReminderTemplateClientDTO[]>('/reminders/templates', { params });
  },

  // 别名方法（兼容应用服务）
  async getActiveTemplates(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReminderTemplateClientDTO[]> {
    return apiClient.get<ReminderTemplateClientDTO[]>('/reminders/templates/active', { params });
  },

  /**
   * 更新提醒模板
   */
  async updateTemplate(
    uuid: string,
    data: UpdateReminderTemplateRequestDTO,
  ): Promise<ReminderTemplateClientDTO> {
    return apiClient.patch<ReminderTemplateClientDTO>(`/reminders/templates/${uuid}`, data);
  },

  // 别名方法（兼容应用服务）
  updateReminderTemplate(
    uuid: string,
    data: UpdateReminderTemplateRequestDTO,
  ): Promise<ReminderTemplateClientDTO> {
    return this.updateTemplate(uuid, data);
  },

  /**
   * 删除提醒模板
   */
  async deleteTemplate(uuid: string): Promise<void> {
    await apiClient.delete<void>(`/reminders/templates/${uuid}`);
  },

  // 别名方法（兼容应用服务）
  deleteReminderTemplate(uuid: string): Promise<void> {
    return this.deleteTemplate(uuid);
  },

  /**
   * 切换提醒模板启用状态
   */
  async toggleTemplateStatus(uuid: string): Promise<ReminderTemplateClientDTO> {
    return apiClient.post<ReminderTemplateClientDTO>(`/reminders/templates/${uuid}/toggle`, {});
  },

  // 别名方法（兼容应用服务）
  toggleTemplateEnabled(uuid: string, enabled: boolean): Promise<ReminderTemplateClientDTO> {
    // 目前使用 toggle 端点，忽略 enabled 参数
    return this.toggleTemplateStatus(uuid);
  },

  /**
   * 搜索提醒模板
   */
  async searchTemplates(
    accountUuid: string,
    query: string,
  ): Promise<ReminderTemplateClientDTO[]> {
    return apiClient.get<ReminderTemplateClientDTO[]>('/reminders/templates/search', {
      params: { accountUuid, query },
    });
  },

  // 别名方法（兼容应用服务）
  searchReminderTemplates(
    accountUuid: string,
    query: string,
  ): Promise<ReminderTemplateClientDTO[]> {
    return this.searchTemplates(accountUuid, query);
  },

  /**
   * 获取提醒统计
   */
  async getStatistics(accountUuid: string): Promise<ReminderStatisticsClientDTO> {
    return apiClient.get<ReminderStatisticsClientDTO>(`/reminders/statistics/${accountUuid}`);
  },

  // 别名方法（兼容应用服务）
  getReminderStatistics(accountUuid: string): Promise<ReminderStatisticsClientDTO> {
    return this.getStatistics(accountUuid);
  },
};
