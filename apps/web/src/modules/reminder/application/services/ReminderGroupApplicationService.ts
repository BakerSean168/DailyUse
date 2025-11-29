import type { ReminderTemplateClientDTO, ReminderGroupClientDTO, ReminderHistoryClientDTO } from '@dailyuse/contracts/reminder';
import { ReminderGroup } from '@dailyuse/domain-client/reminder';
import { reminderApiClient } from '../../infrastructure/api/reminderApiClient';
import { getReminderStore } from '../../presentation/stores/reminderStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';

/**
 * Reminder Group Application Service
 * 提醒分组应用服务 - 负责分组管理
 */
export class ReminderGroupApplicationService {
  private static instance: ReminderGroupApplicationService;

  private constructor() {}

  /**
   * 延迟获取 Snackbar（避免在 Pinia 初始化前访问）
   */
  private get snackbar() {
    return useSnackbar();
  }

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
    request: CreateReminderGroupRequestDTO,
  ): Promise<ReminderGroupClientDTO> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const groupData = await reminderApiClient.createReminderGroup(request);

      // 创建客户端实体并同步到 store
      const group = ReminderGroup.fromClientDTO(groupData);
      this.reminderStore.addOrUpdateReminderGroup(group);

      this.snackbar.showSuccess('分组创建成功');
      return groupData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建分组失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
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
      this.snackbar.showError(errorMessage);
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
      this.snackbar.showError(errorMessage);
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
    request: UpdateReminderGroupRequestDTO,
  ): Promise<ReminderGroupClientDTO> {
    try {
      this.reminderStore.setLoading(true);
      this.reminderStore.setError(null);

      const data = await reminderApiClient.updateReminderGroup(uuid, request);

      // 更新客户端实体并同步到 store
      const group = ReminderGroup.fromClientDTO(data);
      this.reminderStore.addOrUpdateReminderGroup(group);

      this.snackbar.showSuccess('分组更新成功');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新分组失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
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

      this.snackbar.showSuccess('分组删除成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除分组失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
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

      this.snackbar.showSuccess(`分组已${data.enabled ? '启用' : '禁用'}`);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换分组状态失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
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

      this.snackbar.showSuccess(
        `已切换到${data.controlMode === 'GROUP' ? '组控制' : '个体控制'}模式`,
      );
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换控制模式失败';
      this.reminderStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.reminderStore.setLoading(false);
    }
  }
}

export const reminderGroupApplicationService = ReminderGroupApplicationService.getInstance();

