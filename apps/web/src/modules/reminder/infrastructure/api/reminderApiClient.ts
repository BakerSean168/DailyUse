/**
 * Reminder API Client
 * 
 * 职责：
 * - 封装 Reminder 模块的所有 HTTP 请求
 * - 统一错误处理
 * - 类型安全的请求/响应
 */

import { apiClient } from '@/shared/api';
import type { ReminderTemplateClientDTO, ReminderGroupClientDTO, CreateReminderTemplateRequest, UpdateReminderTemplateRequest, ReminderHistoryClientDTO, ReminderStatisticsClientDTO, UpcomingRemindersResponseDTO, GetUpcomingRemindersRequest, CreateReminderGroupRequest, UpdateReminderGroupRequest, TemplateScheduleStatusDTO } from '@dailyuse/contracts/reminder';

// 类型别名

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
    data: CreateReminderTemplateRequest,
  ): Promise<ReminderTemplateClientDTO> {
    return apiClient.post<ReminderTemplateClientDTO>('/reminders/templates', data);
  },

  // 别名方法（兼容应用服务）
  createReminderTemplate(
    data: CreateReminderTemplateRequest,
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

  /**
   * 获取当前用户的所有提醒模板（从认证 token 获取用户）
   */
  async getReminderTemplates(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ templates: ReminderTemplateClientDTO[]; total: number; page: number; pageSize: number; hasMore: boolean }> {
    return apiClient.get<{ templates: ReminderTemplateClientDTO[]; total: number; page: number; pageSize: number; hasMore: boolean }>('/reminders/templates', { params });
  },

  /**
   * 更新提醒模板
   */
  async updateTemplate(
    uuid: string,
    data: UpdateReminderTemplateRequest,
  ): Promise<ReminderTemplateClientDTO> {
    return apiClient.patch<ReminderTemplateClientDTO>(`/reminders/templates/${uuid}`, data);
  },

  // 别名方法（兼容应用服务）
  updateReminderTemplate(
    uuid: string,
    data: UpdateReminderTemplateRequest,
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
   * 移动模板到指定分组（专用方法）
   */
  async moveTemplateToGroup(
    uuid: string,
    targetGroupUuid: string | null,
  ): Promise<ReminderTemplateClientDTO> {
    return apiClient.post<ReminderTemplateClientDTO>(
      `/reminders/templates/${uuid}/move`,
      { targetGroupUuid }
    );
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

  /**
   * 获取模板的调度状态
   */
  async getScheduleStatus(
    templateUuid: string,
  ): Promise<TemplateScheduleStatusDTO> {
    return apiClient.get<TemplateScheduleStatusDTO>(
      `/reminders/templates/${templateUuid}/schedule-status`,
    );
  },

  /**
   * 获取即将到来的提醒（基于调度计算）
   */
  async getUpcomingReminders(params?: {
    days?: number;
    limit?: number;
    importanceLevel?: string;
    type?: string;
  }): Promise<UpcomingRemindersResponseDTO> {
    return apiClient.get<UpcomingRemindersResponseDTO>(
      '/reminders/upcoming',
      { params },
    );
  },

  // ===== Reminder Group 管理 =====

  /**
   * 创建提醒分组
   */
  async createReminderGroup(
    data: CreateReminderGroupRequest,
  ): Promise<ReminderGroupClientDTO> {
    return apiClient.post<ReminderGroupClientDTO>('/reminder-groups', data);
  },

  /**
   * 获取分组详情
   */
  async getReminderGroup(uuid: string): Promise<ReminderGroupClientDTO> {
    return apiClient.get<ReminderGroupClientDTO>(`/reminder-groups/${uuid}`);
  },

  /**
   * 获取当前用户的所有分组（从认证 token 获取用户）
   */
  async getReminderGroups(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    groups: ReminderGroupClientDTO[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    return apiClient.get<{
      groups: ReminderGroupClientDTO[];
      total: number;
      page: number;
      pageSize: number;
      hasMore: boolean;
    }>('/reminder-groups', { params });
  },

  /**
   * 获取指定用户的所有分组
   */
  async getUserReminderGroups(
    accountUuid: string,
  ): Promise<ReminderGroupClientDTO[]> {
    return apiClient.get<ReminderGroupClientDTO[]>(
      `/reminder-groups/user/${accountUuid}`,
    );
  },

  /**
   * 更新分组
   */
  async updateReminderGroup(
    uuid: string,
    data: UpdateReminderGroupRequest,
  ): Promise<ReminderGroupClientDTO> {
    return apiClient.patch<ReminderGroupClientDTO>(
      `/reminder-groups/${uuid}`,
      data,
    );
  },

  /**
   * 删除分组
   */
  async deleteReminderGroup(uuid: string): Promise<void> {
    await apiClient.delete<void>(`/reminder-groups/${uuid}`);
  },

  /**
   * 切换分组启用状态
   */
  async toggleReminderGroupStatus(
    uuid: string,
  ): Promise<ReminderGroupClientDTO> {
    return apiClient.post<ReminderGroupClientDTO>(
      `/reminder-groups/${uuid}/toggle-status`,
      {},
    );
  },

  /**
   * 切换分组控制模式
   */
  async toggleReminderGroupControlMode(
    uuid: string,
  ): Promise<ReminderGroupClientDTO> {
    return apiClient.post<ReminderGroupClientDTO>(
      `/reminder-groups/${uuid}/toggle-control-mode`,
      {},
    );
  },
};

