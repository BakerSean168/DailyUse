/**
 * Goal Application Service - Renderer
 *
 * 目标应用服务 - 渲染进程
 * 
 * EPIC-015 重构: 添加 DTO→Entity 转换
 * - 所有返回值使用 Entity 类型
 * - 使用 Entity.fromClientDTO() 进行转换
 */

import {
  // Goal Use Cases
  listGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  activateGoal,
  pauseGoal,
  completeGoal,
  archiveGoal,
  cloneGoal,
  searchGoals,
  // Key Result Use Cases
  getKeyResults,
  createKeyResult,
  updateKeyResult,
  deleteKeyResult,
  // Folder Use Cases
  listGoalFolders,
  getGoalFolder,
  createGoalFolder,
  updateGoalFolder,
  deleteGoalFolder,
  // Record Use Cases
  getGoalRecordsByGoal,
  createGoalRecord,
  deleteGoalRecord,
  // Review Use Cases
  getGoalReviews,
  createGoalReview,
  updateGoalReview,
  deleteGoalReview,
  // Types
  type CreateGoalInput,
  type CreateGoalFolderInput,
  type SearchGoalsInput,
  type CloneGoalInput,
} from '@dailyuse/application-client';
import type {
  UpdateGoalRequest,
  AddKeyResultRequest,
  UpdateKeyResultRequest,
  UpdateGoalFolderRequest,
  CreateGoalRecordRequest,
  CreateGoalReviewRequest,
  UpdateGoalReviewRequest,
} from '@dailyuse/contracts/goal';
import { 
  Goal, 
  GoalFolder,
  KeyResult,
  GoalRecord,
  GoalReview,
} from '@dailyuse/domain-client/goal';

/**
 * Goal Application Service
 */
export class GoalApplicationService {
  private static instance: GoalApplicationService;

  private constructor() {}

  static getInstance(): GoalApplicationService {
    if (!GoalApplicationService.instance) {
      GoalApplicationService.instance = new GoalApplicationService();
    }
    return GoalApplicationService.instance;
  }

  // ===== Goal Operations =====

  async listGoals(): Promise<{ goals: Goal[] }> {
    const response = await listGoals();
    return {
      goals: response.goals.map(dto => Goal.fromClientDTO(dto)),
    };
  }

  async getGoal(goalId: string): Promise<Goal | null> {
    try {
      const dto = await getGoal(goalId);
      return Goal.fromClientDTO(dto);
    } catch {
      return null;
    }
  }

  async createGoal(input: CreateGoalInput): Promise<Goal> {
    const dto = await createGoal(input);
    return Goal.fromClientDTO(dto);
  }

  async updateGoal(uuid: string, request: UpdateGoalRequest): Promise<Goal> {
    const dto = await updateGoal(uuid, request);
    return Goal.fromClientDTO(dto);
  }

  async deleteGoal(goalId: string): Promise<void> {
    return deleteGoal(goalId);
  }

  async activateGoal(goalId: string): Promise<Goal> {
    const dto = await activateGoal(goalId);
    return Goal.fromClientDTO(dto);
  }

  async pauseGoal(goalId: string): Promise<Goal> {
    const dto = await pauseGoal(goalId);
    return Goal.fromClientDTO(dto);
  }

  async completeGoal(goalId: string): Promise<Goal> {
    const dto = await completeGoal(goalId);
    return Goal.fromClientDTO(dto);
  }

  async archiveGoal(goalId: string): Promise<Goal> {
    const dto = await archiveGoal(goalId);
    return Goal.fromClientDTO(dto);
  }

  async cloneGoal(input: CloneGoalInput): Promise<Goal> {
    const dto = await cloneGoal(input);
    return Goal.fromClientDTO(dto);
  }

  async searchGoals(input: SearchGoalsInput): Promise<{ goals: Goal[]; pagination: { page: number; limit: number; total: number } }> {
    const response = await searchGoals(input);
    return {
      goals: response.goals,
      pagination: response.pagination,
    };
  }

  // ===== Key Result Operations =====

  async getKeyResults(goalId: string): Promise<KeyResult[]> {
    const response = await getKeyResults(goalId);
    return response.keyResults.map(dto => KeyResult.fromServerDTO(dto));
  }

  async createKeyResult(goalUuid: string, request: Omit<AddKeyResultRequest, 'goalUuid'>): Promise<KeyResult> {
    const dto = await createKeyResult(goalUuid, request);
    return KeyResult.fromClientDTO(dto);
  }

  async updateKeyResult(goalUuid: string, keyResultUuid: string, request: UpdateKeyResultRequest): Promise<KeyResult> {
    const dto = await updateKeyResult(goalUuid, keyResultUuid, request);
    return KeyResult.fromClientDTO(dto);
  }

  async deleteKeyResult(goalUuid: string, keyResultUuid: string): Promise<void> {
    return deleteKeyResult(goalUuid, keyResultUuid);
  }

  // ===== Folder Operations =====

  async listFolders(): Promise<GoalFolder[]> {
    const dtos = await listGoalFolders();
    return dtos.map(dto => GoalFolder.fromClientDTO(dto));
  }

  async getFolder(folderId: string): Promise<GoalFolder | null> {
    try {
      const dto = await getGoalFolder(folderId);
      return GoalFolder.fromClientDTO(dto);
    } catch {
      return null;
    }
  }

  async createFolder(input: CreateGoalFolderInput): Promise<GoalFolder> {
    const dto = await createGoalFolder(input);
    return GoalFolder.fromClientDTO(dto);
  }

  async updateFolder(uuid: string, request: UpdateGoalFolderRequest): Promise<GoalFolder> {
    const dto = await updateGoalFolder(uuid, request);
    return GoalFolder.fromClientDTO(dto);
  }

  async deleteFolder(folderId: string): Promise<void> {
    return deleteGoalFolder(folderId);
  }

  // ===== Record Operations =====

  async getRecordsByGoal(goalId: string, params?: { page?: number; limit?: number; dateRange?: { start?: string; end?: string } }): Promise<{ records: GoalRecord[]; total: number }> {
    const response = await getGoalRecordsByGoal(goalId, params);
    return {
      records: response.records.map(dto => GoalRecord.fromClientDTO(dto)),
      total: response.total,
    };
  }

  async createRecord(goalUuid: string, keyResultUuid: string, request: CreateGoalRecordRequest): Promise<GoalRecord> {
    const dto = await createGoalRecord(goalUuid, keyResultUuid, request);
    return GoalRecord.fromClientDTO(dto);
  }

  async deleteRecord(goalUuid: string, keyResultUuid: string, recordUuid: string): Promise<void> {
    return deleteGoalRecord(goalUuid, keyResultUuid, recordUuid);
  }

  // ===== Review Operations =====

  async getReviews(goalUuid: string): Promise<GoalReview[]> {
    const response = await getGoalReviews(goalUuid);
    // 转换为 Entity 类型
    return (response.reviews as any[]).map(dto => GoalReview.fromClientDTO(dto));
  }

  async createReview(goalUuid: string, request: CreateGoalReviewRequest): Promise<GoalReview> {
    const dto = await createGoalReview(goalUuid, request);
    return GoalReview.fromClientDTO(dto as any);
  }

  async updateReview(goalUuid: string, reviewUuid: string, request: UpdateGoalReviewRequest): Promise<GoalReview> {
    const dto = await updateGoalReview(goalUuid, reviewUuid, request);
    return GoalReview.fromClientDTO(dto as any);
  }

  async deleteReview(goalUuid: string, reviewUuid: string): Promise<void> {
    return deleteGoalReview(goalUuid, reviewUuid);
  }
}

// 导出单例
export const goalApplicationService = GoalApplicationService.getInstance();
