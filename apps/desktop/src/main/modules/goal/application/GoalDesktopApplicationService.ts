/**
 * Goal Desktop Application Service
 *
 * 包装 @dailyuse/application-server/goal 的服务
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 */

import {
  // Use Cases
  createGoal,
  getGoal,
  listGoals,
  updateGoal,
  deleteGoal,
  activateGoal,
  archiveGoal,
  completeGoal,
  // Types
  type CreateGoalInput,
  type GetGoalInput,
  type ListGoalsInput,
  type UpdateGoalInput,
} from '@dailyuse/application-server';
import { GoalContainer } from '@dailyuse/infrastructure-server';
import type { GoalClientDTO, GoalFolderClientDTO } from '@dailyuse/contracts/goal';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalDesktopAppService');

export class GoalDesktopApplicationService {
  constructor() {
    // Container should be initialized by infrastructure module
  }

  // ===== Goal CRUD =====

  async createGoal(params: CreateGoalInput): Promise<GoalClientDTO> {
    logger.debug('Creating goal', { title: params.title });
    const result = await createGoal(params);
    return result.goal;
  }

  async getGoal(uuid: string, includeChildren = true): Promise<GoalClientDTO | null> {
    const result = await getGoal({ uuid, includeChildren });
    return result.goal;
  }

  async listGoals(params: {
    accountUuid?: string;
    status?: string;
    folderUuid?: string;
    includeChildren?: boolean;
  }): Promise<{ goals: GoalClientDTO[]; total: number }> {
    const input: ListGoalsInput = {
      accountUuid: params.accountUuid || 'default',
      status: params.status,
      folderUuid: params.folderUuid,
      includeChildren: params.includeChildren,
    };
    
    const result = await listGoals(input);
    return { goals: result.goals, total: result.total };
  }

  async updateGoal(uuid: string, params: UpdateGoalInput): Promise<GoalClientDTO> {
    const result = await updateGoal({ uuid, ...params });
    return result.goal;
  }

  async deleteGoal(uuid: string): Promise<void> {
    await deleteGoal({ uuid });
  }

  // ===== Goal Status =====

  async activateGoal(uuid: string): Promise<GoalClientDTO> {
    const result = await activateGoal({ uuid });
    return result.goal;
  }

  async archiveGoal(uuid: string): Promise<GoalClientDTO> {
    const result = await archiveGoal({ uuid });
    return result.goal;
  }

  async completeGoal(uuid: string): Promise<GoalClientDTO> {
    const result = await completeGoal({ uuid });
    return result.goal;
  }

  // ===== Goal Folder =====

  async createFolder(params: {
    accountUuid: string;
    name: string;
    parentUuid?: string;
    color?: string;
  }): Promise<GoalFolderClientDTO> {
    // Placeholder: To be fully implemented in later iteration
    // For now, return minimal folder structure
    return {
      uuid: '', // Would be generated
      accountUuid: params.accountUuid,
      name: params.name,
      color: params.color || '#333333',
      displayName: params.name,
      displayIcon: '📁',
      completionRate: 0,
      isDeleted: false,
      activeGoalCount: 0,
      sortOrder: 0,
      isSystemFolder: false,
      goalCount: 0,
      completedGoalCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  async listFolders(accountUuid: string): Promise<GoalFolderClientDTO[]> {
    // Placeholder: To be fully implemented in later iteration
    return [];
  }

  async updateFolder(
    uuid: string,
    params: {
      name?: string;
      color?: string;
      parentUuid?: string;
    },
  ): Promise<GoalFolderClientDTO> {
    // Placeholder: To be fully implemented in later iteration
    throw new Error('Not yet implemented');
  }

  async deleteFolder(uuid: string): Promise<void> {
    // Placeholder: To be fully implemented in later iteration
    throw new Error('Not yet implemented');
  }

  // ===== Statistics =====

  async getStatistics(accountUuid: string): Promise<{
    total: number;
    active: number;
    completed: number;
    archived: number;
  }> {
    const result = await listGoals({ accountUuid, includeChildren: false });
    
    return {
      total: result.total,
      active: result.goals.filter((g) => g.status === 'ACTIVE').length,
      completed: result.goals.filter((g) => g.status === 'COMPLETED').length,
      archived: result.goals.filter((g) => g.status === 'ARCHIVED').length,
    };
  }
}
