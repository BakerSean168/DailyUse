import type { ReminderTemplateClientDTO, ReminderGroupClientDTO, ReminderHistoryClientDTO, CreateReminderGroupRequest, UpdateReminderGroupRequest } from '@dailyuse/contracts/reminder';
import { ReminderGroup } from '@dailyuse/domain-client/reminder';
import { reminderApiClient } from '../../infrastructure/api/reminderApiClient';
import { getReminderStore } from '../../presentation/stores/reminderStore';

/**
 * Reminder Group Application Service
 * 提醒分组应用服务 - 负责分组管理
 *
 * Pattern A: ApplicationService 只负责 API 调用和 DTO 转换
 * UI 反馈（success/error 消息）由 Composable 层处理
 */
export class ReminderGroupApplicationService {
  private static instance: ReminderGroupApplicationService;

  private constructor() {}

  static getInstance(): ReminderGroupApplicationService {
    if (!ReminderGroupApplicationService.instance) {
      ReminderGroupApplicationService.instance = new ReminderGroupApplicationService();
    }
    return ReminderGroupApplicationService.instance;
  }

  private get reminderStore() {
    return getReminderStore();
  }

  /**
   * 创建提醒分组
   */
  async createReminderGroup(
    request: CreateReminderGroupRequest,
  ): Promise<ReminderGroupClientDTO> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const groupData = await reminderApiClient.createReminderGroup(request);

      // 创建客户端实体并同步到 store
      const group = ReminderGroup.fromClientDTO(groupData);
      this.reminderStore.addOrUpdateReminderGroup(group);

      return groupData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建分组失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 获取分组列表
   */
  async getReminderGroups(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    items: ReminderGroupClientDTO[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const response = await reminderApiClient.getReminderGroups(params);

      // API 返回格式: { groups: [...], total, page, pageSize, hasMore }
      // axios 拦截器已经解包了外层的 { data: ... }
      const groupsData = response?.groups || [];
      
      // 批量创建客户端实体并同步到 store
      const groups = Array.isArray(groupsData) 
        ? groupsData.map((groupData: any) => ReminderGroup.fromClientDTO(groupData))
        : [];
      this.reminderStore.setReminderGroups(groups);

      return {
        items: groups,
        total: response?.total || 0,
        page: response?.page || 1,
        pageSize: response?.pageSize || 10,
        hasMore: response?.hasMore || false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取分组列表失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 获取分组详情
   */
  async getReminderGroup(uuid: string): Promise<ReminderGroupClientDTO> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const groupData = await reminderApiClient.getReminderGroup(uuid);

      // 创建客户端实体并同步到 store
      const group = ReminderGroup.fromClientDTO(groupData);
      this.reminderStore.addOrUpdateReminderGroup(group);

      return groupData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取分组详情失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 更新分组
   */
  async updateReminderGroup(
    uuid: string,
    request: UpdateReminderGroupRequest,
  ): Promise<ReminderGroupClientDTO> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const data = await reminderApiClient.updateReminderGroup(uuid, request);

      // 更新客户端实体并同步到 store
      const group = ReminderGroup.fromClientDTO(data);
      this.reminderStore.addOrUpdateReminderGroup(group);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新分组失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 删除分组
   */
  async deleteReminderGroup(uuid: string): Promise<void> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      await reminderApiClient.deleteReminderGroup(uuid);

      // 从 store 中移除
      this.reminderStore.removeReminderGroup(uuid);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除分组失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 切换分组启用状态
   */
  async toggleReminderGroupStatus(
    uuid: string,
  ): Promise<ReminderGroupClientDTO> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const data = await reminderApiClient.toggleReminderGroupStatus(uuid);

      // 更新客户端实体并同步到 store
      const group = ReminderGroup.fromClientDTO(data);
      this.reminderStore.addOrUpdateReminderGroup(group);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换分组状态失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }

  /**
   * 切换分组控制模式
   */
  async toggleReminderGroupControlMode(
    uuid: string,
  ): Promise<ReminderGroupClientDTO> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const data = await reminderApiClient.toggleReminderGroupControlMode(uuid);

      // 更新客户端实体并同步到 store
      const group = ReminderGroup.fromClientDTO(data);
      this.reminderStore.addOrUpdateReminderGroup(group);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换控制模式失败';
      this.reminderStore.setError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }
}

export const reminderGroupApplicationService = ReminderGroupApplicationService.getInstance();

