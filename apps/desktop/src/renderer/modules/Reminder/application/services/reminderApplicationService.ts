import type { ApiResponse } from '@dailyuse/contracts';
import { reminderIpcClient } from '../../infrastructure/ipc/reminderIpcClient';
import { useReminderStore } from '../../presentation/stores/reminderStore';
import { ReminderTemplate } from '../../domain/entities/reminderTemplate';
import { ReminderTemplateGroup } from '../../domain/aggregates/reminderTemplateGroup';

/**
 * 提醒模板领域应用服务
 *
 * 作为应用层的核心服务，负责：
 * 1. 协调渲染进程与主进程之间的 IPC 通信
 * 2. 管理本地状态存储（Pinia Store）
 * 3. 提供统一的业务接口给表现层使用
 * 4. 处理业务逻辑的错误和异常
 * 5. 实现数据的双向同步（本地状态 <-> 主进程数据）
 *
 * 设计模式：
 * - 应用服务模式：封装用例逻辑，协调领域对象
 * - 单例模式：通过工厂方法确保全局唯一实例
 * - 门面模式：为复杂的 IPC 通信提供简单的接口
 *
 * @example
 * ```typescript
 * const service = getReminderDomainApplicationService();
 * const result = await service.createReminderTemplate(template);
 * if (result.success) {
 *   console.log('创建成功', result.data);
 * }
 * ```
 */
export class ReminderDomainApplicationService {
  /**
   * Pinia 状态管理存储实例
   * 用于管理提醒模板和组的本地状态
   */
  private get store() {
    return useReminderStore();
  }

  // ========== 提醒模板相关操作 ==========

  /**
   * 创建提醒模板
   *
   * 业务流程：
   * 1. 通过 IPC 向主进程发送创建请求
   * 2. 主进程执行数据持久化
   * 3. 成功后更新本地状态存储
   * 4. 返回统一的响应格式
   *
   * @param template - 要创建的提醒模板实例
   * @returns Promise<ApiResponse<{ template: ReminderTemplate }>> 创建结果，包含新创建的模板数据
   *
   * @example
   * ```typescript
   * const template = new ReminderTemplate(...);
   * const result = await service.createReminderTemplate(template);
   * if (result.success) {
   *   console.log('创建成功', result.data.template);
   * } else {
   *   console.error('创建失败', result.message);
   * }
   * ```
   */
  async createReminderTemplate(
    template: ReminderTemplate,
  ): Promise<ApiResponse<{ template: ReminderTemplate }>> {
    try {
      // 发送 IPC 请求到主进程
      const response = await reminderIpcClient.createReminderTemplate(template);

      if (response.success && response.data) {
        // 成功后同步到本地状态
        this.syncAllReminderGroups();
        return {
          success: true,
          message: response.message,
          data: { template: response.data },
        };
      }

      // 主进程返回失败响应
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      // 处理网络错误、序列化错误等异常
      return {
        success: false,
        message: `创建提醒模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取所有提醒模板
   *
   * 业务流程：
   * 1. 从主进程获取所有模板数据
   * 2. 更新本地状态存储
   * 3. 返回模板列表
   *
   * @returns Promise<ReminderTemplate[]> 所有提醒模板列表，失败时返回空数组
   *
   * @example
   * ```typescript
   * const templates = await service.getAllReminderTemplates();
   * console.log('模板数量:', templates.length);
   * ```
   */
  async getAllReminderTemplates(): Promise<ReminderTemplate[]> {
    try {
      const response = await reminderIpcClient.getAllReminderTemplates();

      if (response.success && response.data) {
        // 批量更新本地状态
        this.syncAllReminderGroups();
        return response.data;
      }

      // 获取失败时返回空数组，避免破坏 UI 渲染
      return [];
    } catch (error) {
      // 错误处理：记录日志但不抛出异常
      console.error('获取提醒模板失败:', error);
      return [];
    }
  }

  /**
   * 根据ID获取特定的提醒模板
   *
   * 业务流程：
   * 1. 根据ID从主进程获取模板数据
   * 2. 更新本地状态中的对应模板
   * 3. 返回模板实例或null
   *
   * @param id - 模板的唯一标识符
   * @returns Promise<ReminderTemplate | null> 找到的模板实例，未找到时返回null
   *
   * @example
   * ```typescript
   * const template = await service.getReminderTemplateById('template-123');
   * if (template) {
   *   console.log('模板名称:', template.name);
   * } else {
   *   console.log('模板不存在');
   * }
   * ```
   */
  async getReminderTemplateById(uuid: string): Promise<ReminderTemplate | null> {
    try {
      const response = await reminderIpcClient.getReminderTemplateById(uuid);

      if (response.success && response.data) {
        // 更新本地状态中的特定模板
        this.syncAllReminderGroups();
        return response.data;
      }

      return null;
    } catch (error) {
      console.error(`获取模板失败 (ID: ${uuid}):`, error);
      return null;
    }
  }

  /**
   * 更新提醒模板
   *
   * 业务流程：
   * 1. 发送更新请求到主进程
   * 2. 主进程执行数据更新和持久化
   * 3. 成功后同步更新本地状态
   * 4. 返回更新结果
   *
   * @param template - 包含更新数据的模板实例
   * @returns Promise<ApiResponse<{ template: ReminderTemplate }>> 更新结果，包含更新后的模板数据
   *
   * @example
   * ```typescript
   * template.updateName('新名称');
   * const result = await service.updateReminderTemplate(template);
   * if (result.success) {
   *   console.log('更新成功');
   * }
   * ```
   */
  async updateReminderTemplate(
    template: ReminderTemplate,
  ): Promise<ApiResponse<{ template: ReminderTemplate }>> {
    try {
      const response = await reminderIpcClient.updateReminderTemplate(template);

      if (response.success && response.data) {
        // 同步更新本地状态
        this.syncAllReminderGroups();
        return {
          success: true,
          message: response.message,
          data: { template: response.data },
        };
      }

      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: `更新提醒模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除提醒模板
   *
   * 业务流程：
   * 1. 发送删除请求到主进程
   * 2. 主进程执行数据删除
   * 3. 成功后从本地状态中移除
   * 4. 返回删除结果
   *
   * @param id - 要删除的模板ID
   * @returns Promise<ApiResponse<void>> 删除结果，成功时不返回数据
   *
   * @example
   * ```typescript
   * const result = await service.deleteReminderTemplate('template-123');
   * if (result.success) {
   *   console.log('删除成功');
   * }
   * ```
   */
  async deleteReminderTemplate(uuid: string): Promise<ApiResponse<void>> {
    try {
      const response = await reminderIpcClient.deleteReminderTemplate(uuid);

      if (response.success) {
        // 从本地状态中移除
        this.syncAllReminderGroups();
        return {
          success: true,
          message: response.message,
        };
      }

      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: `删除提醒模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 提醒组相关操作 ==========

  /**
   * 创建提醒组
   *
   * 业务流程：
   * 1. 通过 IPC 向主进程发送创建请求
   * 2. 主进程执行数据持久化
   * 3. 成功后更新本地状态存储
   * 4. 返回统一的响应格式
   *
   * @param group - 要创建的提醒组实例
   * @returns Promise<ApiResponse<{ group: ReminderTemplateGroup }>> 创建结果，包含新创建的组数据
   *
   * @example
   * ```typescript
   * const group = new ReminderTemplateGroup(...);
   * const result = await service.createReminderGroup(group);
   * if (result.success) {
   *   console.log('创建组成功', result.data.group);
   * }
   * ```
   */
  async createReminderGroup(
    group: ReminderTemplateGroup,
  ): Promise<ApiResponse<{ group: ReminderTemplateGroup }>> {
    try {
      const response = await reminderIpcClient.createReminderGroup(group);

      if (response.success && response.data) {
        console.log('创建组成功:', response.data);
        this.syncAllReminderGroups();
        return {
          success: true,
          message: response.message,
          data: { group: response.data },
        };
      }

      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: `创建提醒组失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取所有提醒组
   *
   * 业务流程：
   * 1. 从主进程获取所有组数据
   * 2. 更新本地状态存储
   * 3. 返回组列表
   *
   * @returns Promise<ReminderTemplateGroup[]> 所有提醒组列表，失败时返回空数组
   *
   * @example
   * ```typescript
   * const groups = await service.getAllReminderGroups();
   * console.log('组数量:', groups.length);
   * ```
   */
  async getAllReminderGroups(): Promise<ReminderTemplateGroup[]> {
    try {
      const response = await reminderIpcClient.getAllReminderGroups();

      if (response.success && response.data) {
        console.log('获取所有提醒组成功:', response.data);
        this.store.setReminderGroups(response.data); // 更新 Pinia store
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('获取提醒组失败:', error);
      return [];
    }
  }

  /**
   * 根据ID获取特定的提醒组
   *
   * 业务流程：
   * 1. 根据ID从主进程获取组数据
   * 2. 更新本地状态中的对应组
   * 3. 返回组实例或null
   *
   * @param id - 组的唯一标识符
   * @returns Promise<ReminderTemplateGroup | null> 找到的组实例，未找到时返回null
   *
   * @example
   * ```typescript
   * const group = await service.getReminderGroupById('group-123');
   * if (group) {
   *   console.log('组名称:', group.name);
   * }
   * ```
   */
  async getReminderGroupById(uuid: string): Promise<ReminderTemplateGroup | null> {
    try {
      const response = await reminderIpcClient.getReminderGroupById(uuid);

      if (response.success && response.data) {
        this.syncAllReminderGroups();
        return response.data;
      }

      return null;
    } catch (error) {
      console.error(`获取组失败 (ID: ${uuid}):`, error);
      return null;
    }
  }

  /**
   * 更新提醒组
   *
   * 业务流程：
   * 1. 发送更新请求到主进程
   * 2. 主进程执行数据更新和持久化
   * 3. 成功后同步更新本地状态
   * 4. 返回更新结果
   *
   * @param group - 包含更新数据的组实例
   * @returns Promise<ApiResponse<{ group: ReminderTemplateGroup }>> 更新结果，包含更新后的组数据
   *
   * @example
   * ```typescript
   * group.updateName('新组名');
   * const result = await service.updateReminderGroup(group);
   * if (result.success) {
   *   console.log('更新成功');
   * }
   * ```
   */
  async updateReminderGroup(
    group: ReminderTemplateGroup,
  ): Promise<ApiResponse<{ group: ReminderTemplateGroup }>> {
    try {
      const response = await reminderIpcClient.updateReminderGroup(group);

      if (response.success && response.data) {
        this.syncAllReminderGroups();
        return {
          success: true,
          message: response.message,
          data: { group: response.data },
        };
      }

      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: `更新提醒组失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除提醒组
   *
   * 业务流程：
   * 1. 发送删除请求到主进程
   * 2. 主进程执行数据删除（包括级联删除相关模板）
   * 3. 成功后从本地状态中移除
   * 4. 返回删除结果
   *
   * @param id - 要删除的组ID
   * @returns Promise<ApiResponse<void>> 删除结果，成功时不返回数据
   *
   * @example
   * ```typescript
   * const result = await service.deleteReminderGroup('group-123');
   * if (result.success) {
   *   console.log('删除成功');
   * }
   * ```
   */
  async deleteReminderGroup(uuid: string): Promise<ApiResponse<void>> {
    try {
      const response = await reminderIpcClient.deleteReminderGroup(uuid);

      if (response.success) {
        this.syncAllReminderGroups();
        return {
          success: true,
          message: response.message,
        };
      }

      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: `删除提醒组失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 设置提醒组启用模式（group/individual）
   * @param groupId string 分组ID
   * @param mode "group" | "individual"
   * @returns Promise<ApiResponse<void>>
   * @example
   * await service.setGroupEnableMode('group-123', 'group');
   */
  async setGroupEnableMode(
    groupId: string,
    mode: 'group' | 'individual',
  ): Promise<ApiResponse<void>> {
    try {
      const response = await reminderIpcClient.setGroupEnableMode(groupId, mode);
      if (response.success) {
        await this.syncAllReminderGroups();
      }
      return response;
    } catch (error) {
      return {
        success: false,
        message: `设置分组启用模式失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 设置提醒组启用/禁用
   * @param groupId string 分组ID
   * @param enabled boolean 是否启用
   * @returns Promise<ApiResponse<void>>
   * @example
   * await service.setGroupEnabled('group-123', true);
   */
  async setGroupEnabled(groupId: string, enabled: boolean): Promise<ApiResponse<void>> {
    try {
      const response = await reminderIpcClient.setGroupEnabled(groupId, enabled);
      if (response.success) {
        await this.syncAllReminderGroups();
      }
      return response;
    } catch (error) {
      return {
        success: false,
        message: `设置分组启用状态失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 设置提醒模板启用/禁用
   * @param templateId string 模板ID
   * @param enabled boolean 是否启用
   * @returns Promise<ApiResponse<void>>
   * @example
   * await service.setTemplateEnabled('template-123', true);
   */
  async setTemplateEnabled(templateId: string, enabled: boolean): Promise<ApiResponse<void>> {
    try {
      const response = await reminderIpcClient.setTemplateEnabled(templateId, enabled);
      if (response.success) {
        await this.syncAllReminderGroups();
      }
      return response;
    } catch (error) {
      return {
        success: false,
        message: `设置模板启用状态失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 提醒模板移动操作 ==========
  /**
   * 将提醒模板移动到指定组
   *
   * 业务流程：
   * 1. 通过 IPC 向主进程发送移动请求
   * 2. 主进程执行数据更新和持久化
   * 3. 成功后更新本地状态存储
   * 4. 返回统一的响应格式
   *
   * @param templateId - 要移动的模板ID
   * @param toGroupId - 目标组ID
   * @returns Promise<ApiResponse<void>> 移动结果，成功时不返回数据
   *
   * @example
   * ```typescript
   * const result = await service.moveTemplateToGroup('template-123', 'group-456');
   * if (result.success) {
   *   console.log('移动成功');
   * }
   * ```
   */
  async moveTemplateToGroup(templateId: string, toGroupId: string): Promise<ApiResponse<void>> {
    try {
      const response = await reminderIpcClient.moveTemplateToGroup(templateId, toGroupId);
      console.log('移动模板到组响应:', response);
      if (response.success) {
        // 等待数据刷新完成，确保前端状态同步
        await this.syncAllReminderGroups();
        console.log('✅ 移动模板成功，数据已同步');
      }

      return response;
    } catch (error) {
      console.error(
        `移动模板到组失败 (Template ID: ${templateId}, Group ID: ${toGroupId}):`,
        error,
      );
      return {
        success: false,
        message: `移动提醒模板到组失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 数据同步相关操作 ==========

  /**
   * 同步所有提醒组到本地状态仓库
   *
   * 用于初始化应用或刷新数据时，确保本地状态与主进程数据一致
   *
   * @returns Promise<void> 无返回值，同步过程中的错误会被内部处理
   *
   * @example
   * ```typescript
   * // 应用启动时同步数据
   * await service.syncAllReminderGroups();
   * ```
   */
  async syncAllReminderGroups(): Promise<void> {
    await this.getAllReminderGroups();
  }

  /**
   * 同步所有提醒模板到本地状态仓库
   *
   * 用于初始化应用或刷新数据时，确保本地状态与主进程数据一致
   *
   * @returns Promise<void> 无返回值，同步过程中的错误会被内部处理
   *
   * @example
   * ```typescript
   * // 应用启动时同步数据
   * await service.syncAllReminderTemplates();
   * ```
   */
  async syncAllReminderTemplates(): Promise<void> {
    await this.getAllReminderTemplates();
  }
}

// ========== 工厂方法和单例管理 ==========

/**
 * 服务实例缓存
 * 用于实现单例模式，确保全局唯一的服务实例
 */
let _reminderDomainApplicationServiceInstance: ReminderDomainApplicationService | null = null;

/**
 * 获取提醒领域应用服务实例
 *
 * 使用单例模式确保全局唯一的服务实例，避免重复创建和状态不一致
 *
 * @returns ReminderDomainApplicationService 服务实例
 *
 * @example
 * ```typescript
 * // 在任何地方获取服务实例
 * const service = getReminderDomainApplicationService();
 *
 * // 在 Vue 组件中使用
 * const { getReminderDomainApplicationService } = useReminderService();
 * const service = getReminderDomainApplicationService();
 * ```
 */
export function getReminderDomainApplicationService(): ReminderDomainApplicationService {
  if (!_reminderDomainApplicationServiceInstance) {
    _reminderDomainApplicationServiceInstance = new ReminderDomainApplicationService();
  }
  return _reminderDomainApplicationServiceInstance;
}
