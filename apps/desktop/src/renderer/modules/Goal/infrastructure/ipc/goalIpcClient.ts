import type { ApiResponse } from '@dailyuse/contracts';
import type { IGoal, IGoalRecord, IGoalFolder, IGoalReview } from '@common/modules/goal/types/goal';
import { deepSerializeForIpc } from '@renderer/shared/utils/ipcSerialization';
import { ipcInvokeWithAuth } from '@renderer/shared/utils/ipcInvokeWithAuth';
import { GoalReview } from '../../domain/entities/goalReview';
import { GoalRecord } from '../../domain/entities/record';
import { GoalFolder } from '../../domain/aggregates/GoalFolder';
import { Goal } from '../../domain/aggregates/goal';
/**
 * 目标模块 IPC 客户端
 * 处理渲染进程与主进程之间的目标相关通信
 */
export class GoalIpcClient {
  // ========== 目标管理 ==========
  name = 'GoalIpcClient';
  /**
   * 创建目标
   */
  async createGoal(goal: Goal): Promise<ApiResponse<IGoal>> {
    try {
      const goalDTO = goal.toDTO();
      const goalData = JSON.parse(JSON.stringify(goalDTO));
      console.log('🔄 [渲染进程-IPC] 创建目标,处理后的传输数据:', goalData);

      const response = await ipcInvokeWithAuth('goal:create', goalData);

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标创建成功:', response.data?.id);
      } else {
        console.error('❌ [渲染进程-IPC] 目标创建失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 创建目标通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取所有目标
   */
  async getAllGoals(): Promise<ApiResponse<IGoal[]>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取所有目标');

      const response = await ipcInvokeWithAuth('goal:get-all');

      if (response.success) {
        console.log(`✅ [渲染进程-IPC] 获取目标成功，数量: ${response.data?.length || 0}`);
      } else {
        console.error('❌ [渲染进程-IPC] 获取目标失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取目标通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 根据ID获取目标
   */
  async getGoalById(goalUuid: string): Promise<ApiResponse<IGoal>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取目标:', goalUuid);

      const response = await ipcInvokeWithAuth('goal:get-by-id', goalUuid);

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 获取目标成功:', goalUuid);
      } else {
        console.error('❌ [渲染进程-IPC] 获取目标失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取目标通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 更新目标
   */
  async updateGoal(goalData: IGoal): Promise<ApiResponse<IGoal>> {
    try {
      console.log('🔄 [渲染进程-IPC] 更新目标:', goalData.uuid);

      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc(goalData);

      const response = await ipcInvokeWithAuth('goal:update', serializedData);

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标更新成功:', goalData.uuid);
      } else {
        console.error('❌ [渲染进程-IPC] 目标更新失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 更新目标通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除目标
   */
  async deleteGoal(goalUuid: string): Promise<ApiResponse<void>> {
    try {
      console.log('🔄 [渲染进程-IPC] 删除目标:', goalUuid);

      const response = await ipcInvokeWithAuth('goal:delete', goalUuid);

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标删除成功:', goalUuid);
      } else {
        console.error('❌ [渲染进程-IPC] 目标删除失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 删除目标通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除所有目标
   */
  async deleteAllGoals(): Promise<ApiResponse<void>> {
    try {
      console.log('🔄 [渲染进程-IPC] 删除所有目标');

      const response = await ipcInvokeWithAuth('goal:delete-all');

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 所有目标删除成功');
      } else {
        console.error('❌ [渲染进程-IPC] 删除所有目标失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 删除所有目标通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 记录管理 ==========

  /**
   * 为目标的关键结果添加记录（聚合根驱动）
   */
  async addGoalRecordToGoal(
    record: GoalRecord,
  ): Promise<ApiResponse<{ goalDTO: IGoal; recordDTO: IGoalRecord }>> {
    try {
      console.log('🔄 [渲染进程-IPC] 为目标添加记录:', record);
      const recordDTO = record.toDTO();
      const data = JSON.parse(JSON.stringify(recordDTO));
      const response = await ipcInvokeWithAuth('goal:addGoalRecordToGoal', data);

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 记录添加成功:', response.data?.record?.id);
      } else {
        console.error('❌ [渲染进程-IPC] 记录添加失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 添加记录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 从目标中删除记录（聚合根驱动）
   */
  async removeGoalRecordFromGoal(record: GoalRecord): Promise<ApiResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [渲染进程-IPC] 从目标删除记录:', { record });
      const recordDTO = record.toDTO();
      const data = JSON.parse(JSON.stringify(recordDTO));
      const response = await ipcInvokeWithAuth('goal:removeGoalRecord', data);

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 记录删除成功:', record.uuid);
      } else {
        console.error('❌ [渲染进程-IPC] 记录删除失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 删除记录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 目标复盘管理 ==========

  /**
   * 为目标添加复盘
   */
  async addReviewToGoal(goalReview: GoalReview): Promise<ApiResponse<IGoal>> {
    try {
      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc(goalReview);
      console.log('🔄 [渲染进程-IPC] 为目标添加复盘:', serializedData);
      const response = await ipcInvokeWithAuth('goal:addReview', serializedData);

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 复盘添加成功:', response.data?.review?.id);
      } else {
        console.error('❌ [渲染进程-IPC] 复盘添加失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 添加复盘通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 更新目标的复盘
   */
  async updateReviewInGoal(goalReview: GoalReview): Promise<ApiResponse<IGoal>> {
    try {
      console.log('🔄 [渲染进程-IPC] 更新目标复盘:', goalReview);

      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc(goalReview);

      const response = await ipcInvokeWithAuth('goal:updateReview', serializedData);

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 复盘更新成功:', response.data?.review?.id);
      } else {
        console.error('❌ [渲染进程-IPC] 复盘更新失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 更新复盘通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 从目标中移除复盘
   */
  async removeReviewFromGoal(goalReview: GoalReview): Promise<ApiResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [渲染进程-IPC] 从目标移除复盘:', { goalReview });

      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc(goalReview);

      const response = await ipcInvokeWithAuth('goal:removeReview', serializedData);

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 复盘移除成功');
      } else {
        console.error('❌ [渲染进程-IPC] 复盘移除失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 移除复盘通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取目标的所有复盘
   */
  async getGoalReviews(goalUuid: string): Promise<ApiResponse<IGoalReview[]>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取目标复盘:', goalUuid);

      const response = await ipcInvokeWithAuth('goal:getReviews', goalUuid);

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 获取目标复盘成功:', response.data?.length);
      } else {
        console.error('❌ [渲染进程-IPC] 获取目标复盘失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取目标复盘通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 目标目录管理 ==========

  /**
   * 创建目标目录
   */
  async createGoalFolder(GoalFolderData: IGoalFolder): Promise<ApiResponse<IGoalFolder>> {
    try {
      console.log('🔄 [渲染进程-IPC] 创建目标目录:', GoalFolderData.name);

      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc(GoalFolderData);
      console.log('🔄 [渲染进程-IPC] 序列化目标目录数据:', serializedData);
      const response = await ipcInvokeWithAuth('goal:dir:create', serializedData);

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标目录创建成功:', response.data);
      } else {
        console.error('❌ [渲染进程-IPC] 目标目录创建失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 创建目标目录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取所有目标目录
   */
  async getAllGoalFolders(): Promise<ApiResponse<IGoalFolder[]>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取所有目标目录');

      const response = await ipcInvokeWithAuth('goal:dir:get-all');

      if (response.success) {
        console.log(`✅ [渲染进程-IPC] 获取目标目录成功，数量: ${response.data?.length || 0}`);
      } else {
        console.error('❌ [渲染进程-IPC] 获取目标目录失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取目标目录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除目标目录
   */
  async deleteGoalFolder(GoalFolderId: string): Promise<ApiResponse<void>> {
    try {
      console.log('🔄 [渲染进程-IPC] 删除目标目录:', GoalFolderId);

      const response = await ipcInvokeWithAuth('goal:dir:delete', GoalFolderId);

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标目录删除成功:', GoalFolderId);
      } else {
        console.error('❌ [渲染进程-IPC] 目标目录删除失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 删除目标目录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 更新目标目录
   */
  async updateGoalFolder(GoalFolder: GoalFolder): Promise<ApiResponse<IGoalFolder>> {
    try {
      // 使用深度序列化确保数据可以安全传输
      const GoalFolderDTO = GoalFolder.toDTO();
      const data = JSON.parse(JSON.stringify(GoalFolderDTO));

      const response = await ipcInvokeWithAuth('goal:dir:update', data);

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标目录更新成功:', GoalFolder.name);
      } else {
        console.error('❌ [渲染进程-IPC] 目标目录更新失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 更新目标目录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }
}

// 导出单例实例
export const goalIpcClient = new GoalIpcClient();
