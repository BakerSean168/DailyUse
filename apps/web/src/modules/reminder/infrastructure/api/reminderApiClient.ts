import type { ReminderContracts, ImportanceLevel } from '@dailyuse/contracts';
import { apiClient } from '@/shared/api/instances';

/**
 * Reminder API 客户端
 * 基于聚合根控制模式的 API 接口
 */
class ReminderApiClient {
  private readonly baseUrl = '/reminders/templates';

  // ===== 模板聚合根操作 =====

  /**
   * 创建提醒模板聚合根
   */
  async createReminderTemplate(
    request: ReminderContracts.CreateReminderTemplateRequestDTO,
  ): Promise<ReminderContracts.ReminderTemplateClientDTO> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 更新提醒模板聚合根
   */
  async updateReminderTemplate(
    templateUuid: string,
    request: ReminderContracts.UpdateReminderTemplateRequestDTO,
  ): Promise<ReminderContracts.ReminderTemplateClientDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${templateUuid}`, request);
    return data;
  }

  /**
   * 获取提醒模板聚合根详情
   */
  async getReminderTemplate(
    templateUuid: string,
  ): Promise<ReminderContracts.ReminderTemplateClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${templateUuid}`);
    return data;
  }

  /**
   * 删除提醒模板聚合根
   */
  async deleteReminderTemplate(templateUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${templateUuid}`);
  }

  /**
   * 切换模板启用状态（更新 selfEnabled）
   */
  async toggleTemplateEnabled(
    templateUuid: string,
    enabled: boolean,
  ): Promise<ReminderContracts.ReminderTemplateClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${templateUuid}/toggle`, { enabled });
    return data;
  }

  /**
   * 移动提醒模板到指定分组
   */
  async moveTemplateToGroup(templateUuid: string, targetGroupUuid: string): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/${templateUuid}/move`, {
      targetGroupUuid,
    });
  }

  /**
   * 获取提醒模板列表
   */
  async getReminderTemplates(params?: {
    page?: number;
    limit?: number;
    groupUuid?: string;
    status?: ReminderContracts.ReminderStatus;
    importanceLevel?: ImportanceLevel;
  }): Promise<ReminderContracts.ReminderTemplateClientDTO[]> {
    const response = await apiClient.get(this.baseUrl, { params });
    console.log('📋 getReminderTemplates 响应:', response);

    // 处理新的响应格式：{ templates: [...], total }
    if (response && typeof response === 'object' && 'templates' in response) {
      return Array.isArray(response.templates) ? response.templates : [];
    }
    // 兼容旧格式直接返回数组的情况
    return Array.isArray(response) ? response : [];
  }

  /**
   * 获取活跃的提醒模板
   */
  async getActiveTemplates(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReminderContracts.ReminderTemplateClientDTO[]> {
    const response = await apiClient.get(`${this.baseUrl}/active`, { params });
    console.log('📋 getActiveTemplates 响应:', response);

    // 处理新的响应格式：{ templates: [...], total }
    if (response && typeof response === 'object' && 'templates' in response) {
      return Array.isArray(response.templates) ? response.templates : [];
    }
    // 兼容旧格式直接返回数组的情况
    return Array.isArray(response) ? response : [];
  }

  // ===== 调度状态管理 =====

  /**
   * 获取模板的调度状态
   */
  async getScheduleStatus(templateUuid: string): Promise<{
    hasSchedule: boolean;
    enabled: boolean;
    nextRunAt: Date | null;
    lastRunAt: Date | null;
    executionCount: number;
    recentExecutions: any[];
    cronExpression: string | null;
    cronDescription: string | null;
  }> {
    const data = await apiClient.get(`${this.baseUrl}/${templateUuid}/schedule-status`);
    return data;
  }

  // ===== 聚合根统计信息 =====

  /**
   * 聚合根统计信息
   */
  async getAggregateStats(templateUuid: string): Promise<ReminderContracts.ReminderStatisticsClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${templateUuid}/stats`);
    return data;
  }

  /**
   * 聚合根健康检查
   */
  async checkAggregateHealth(
    templateUuid: string,
  ): Promise<{ isHealthy: boolean; issues: string[] }> {
    const data = await apiClient.get(`${this.baseUrl}/${templateUuid}/health`);
    return data;
  }

  // ===== 全局操作 =====

  /**
   * 获取即将到来的提醒任务
   * ⚠️ 架构变更：使用 Reminder 模块内部计算，不再依赖 Schedule 模块
   */
  async getActiveReminders(params?: {
    limit?: number;
    timeWindow?: number; // 时间窗口（小时）
    importanceLevel?: ImportanceLevel;
  }): Promise<{ reminders: any[]; total: number; page: number; limit: number; hasMore: boolean }> {
    // ✅ 使用 Reminder 模块的新 API
    const data = await apiClient.get(`${this.baseUrl}/upcoming`, {
      params: {
        limit: params?.limit || 10,
        timeWindow: params?.timeWindow || 24, // 默认 24 小时
      },
    });
    console.log('📋 getActiveReminders (Reminder API) 响应:', data);

    // 后端返回的格式已经是 UpcomingReminderItem[]
    if (!data || !Array.isArray(data)) {
      return { reminders: [], total: 0, page: 1, limit: params?.limit || 10, hasMore: false };
    }

    // 转换为统一格式
    const reminders = data.map((item: any) => ({
      uuid: item.templateUuid,
      templateUuid: item.templateUuid,
      title: item.templateName,
      message: item.message,
      scheduledTime: item.nextTriggerTime,
      importanceLevel: item.importanceLevel,
      enabled: true,
      metadata: {
        category: item.category,
        tags: item.tags,
        sourceType: 'template' as const,
        sourceId: item.templateUuid,
      },
      snoozeHistory: [],
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isOverdue: new Date(item.nextTriggerTime) < new Date(),
      timeUntil: Math.max(0, new Date(item.nextTriggerTime).getTime() - Date.now()),
      formattedTime: new Date(item.nextTriggerTime).toLocaleString(),
      currentSnoozeCount: 0,
    }));

    return {
      reminders,
      total: reminders.length,
      page: 1,
      limit: params?.limit || 10,
      hasMore: false,
    };
  }

  /**
   * 获取全局提醒统计
   */
  async getGlobalStats(): Promise<ReminderContracts.ReminderStatisticsClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/stats`);
    return data;
  }

  /**
   * 搜索提醒模板
   */
  async searchReminderTemplates(
    accountUuid: string,
    query: string,
  ): Promise<ReminderContracts.ReminderTemplateClientDTO[]> {
    const response = await apiClient.get(`${this.baseUrl}/search`, {
      params: { accountUuid, query },
    });
    return Array.isArray(response) ? response : [];
  }

  /**
   * 获取用户提醒统计
   */
  async getReminderStatistics(
    accountUuid: string,
  ): Promise<ReminderContracts.ReminderStatsClientDTO> {
    const data = await apiClient.get(`/reminders/statistics/${accountUuid}`);
    return data;
  }

  // ===== 分组操作 =====

  /**
   * 创建提醒模板分组
   */
  async createReminderTemplateGroup(
    request: ReminderContracts.CreateReminderGroupRequestDTO,
  ): Promise<ReminderContracts.ReminderGroupClientDTO> {
    const data = await apiClient.post('/reminders/groups', request);
    return data;
  }

  /**
   * 更新提醒模板分组
   */
  async updateReminderTemplateGroup(
    groupUuid: string,
    request: ReminderContracts.UpdateReminderGroupRequestDTO,
  ): Promise<ReminderContracts.ReminderGroupClientDTO> {
    const data = await apiClient.put(`/reminders/groups/${groupUuid}`, request);
    return data;
  }

  /**
   * 获取提醒模板分组详情
   */
  async getReminderTemplateGroup(
    groupUuid: string,
  ): Promise<ReminderContracts.ReminderGroupClientDTO> {
    const data = await apiClient.get(`/reminders/groups/${groupUuid}`);
    return data;
  }

  /**
   * 删除提醒模板分组
   */
  async deleteReminderTemplateGroup(groupUuid: string): Promise<void> {
    await apiClient.delete(`/reminders/groups/${groupUuid}`);
  }

  /**
   * 获取提醒模板分组列表
   */
  async getReminderTemplateGroups(): Promise<ReminderContracts.ReminderGroupListDTO> {
    const data = await apiClient.get('/reminders/groups');
    console.log('📋 getReminderTemplateGroups 响应:', data);

    // 确保返回的数据结构完整
    if (!data || typeof data !== 'object') {
      return { groups: [], total: 0 };
    }

    // 如果 groups 字段不存在或不是数组，返回空数据
    if (!Array.isArray(data.groups)) {
      return {
        groups: [],
        total: data.total || 0,
      };
    }

    return data;
  }

  /**
   * 切换分组启用状态
   */
  async toggleReminderTemplateGroupEnabled(groupUuid: string, enabled: boolean): Promise<void> {
    await apiClient.patch(`/reminders/groups/${groupUuid}/toggle`, { enabled });
  }

  // ===== 启用状态控制操作 =====

  /**
   * 切换分组启用模式
   */
  async toggleGroupEnableMode(
    groupUuid: string,
    request: { mode: ReminderContracts.ControlMode },
  ): Promise<ReminderContracts.ReminderOperationResponseDTO> {
    const data = await apiClient.put(`/reminders/groups/${groupUuid}/enable-mode`, request);
    return data;
  }

  /**
   * 切换分组启用状态
   */
  async toggleGroupEnabled(
    groupUuid: string,
    request: { enabled: boolean },
  ): Promise<ReminderContracts.ReminderOperationResponseDTO> {
    const data = await apiClient.put(`/reminders/groups/${groupUuid}/enabled`, request);
    return data;
  }

  /**
   * 切换模板自我启用状态
   */
  async toggleTemplateSelfEnabled(
    templateUuid: string,
    request: { enabled: boolean },
  ): Promise<ReminderContracts.ReminderOperationResponseDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${templateUuid}/self-enabled`, request);
    return data;
  }

  /**
   * 批量更新模板启用状态
   */
  async batchUpdateTemplatesEnabled(
    request: { templateUuids: string[]; enabled: boolean },
  ): Promise<ReminderContracts.BatchOperationResponseDTO> {
    const data = await apiClient.put(`${this.baseUrl}/batch-enabled`, request);
    return data;
  }

  /**
   * 获取即将到来的提醒实例
   */
  async getUpcomingReminders(
    request: { limit?: number; timeWindow?: number },
  ): Promise<any> {
    const data = await apiClient.get('/reminders/upcoming', { params: request });
    return data;
  }
}

// 导出单例实例
export const reminderApiClient = new ReminderApiClient();
