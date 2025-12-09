/**
 * Goal Application Service - Renderer
 *
 * 目标应用服务 - 渲染进程
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
  // Types
  type CreateGoalInput,
  type CreateGoalFolderInput,
  type SearchGoalsInput,
  type CloneGoalInput,
} from '@dailyuse/application-client';
import type {
  GoalClientDTO,
  KeyResultClientDTO,
  GoalFolderClientDTO,
  GoalRecordClientDTO,
  UpdateGoalRequest,
  AddKeyResultRequest,
  UpdateKeyResultRequest,
  UpdateGoalFolderRequest,
  CreateGoalRecordRequest,
} from '@dailyuse/contracts/goal';

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

  async listGoals() {
    return listGoals();
  }

  async getGoal(goalId: string): Promise<GoalClientDTO | null> {
    try {
      return await getGoal(goalId);
    } catch {
      return null;
    }
  }

  async createGoal(input: CreateGoalInput): Promise<GoalClientDTO> {
    return createGoal(input);
  }

  async updateGoal(uuid: string, request: UpdateGoalRequest) {
    return updateGoal(uuid, request);
  }

  async deleteGoal(goalId: string): Promise<void> {
    return deleteGoal(goalId);
  }

  async activateGoal(goalId: string): Promise<GoalClientDTO> {
    return activateGoal(goalId);
  }

  async pauseGoal(goalId: string): Promise<GoalClientDTO> {
    return pauseGoal(goalId);
  }

  async completeGoal(goalId: string): Promise<GoalClientDTO> {
    return completeGoal(goalId);
  }

  async archiveGoal(goalId: string): Promise<GoalClientDTO> {
    return archiveGoal(goalId);
  }

  async cloneGoal(input: CloneGoalInput) {
    return cloneGoal(input);
  }

  async searchGoals(input: SearchGoalsInput) {
    return searchGoals(input);
  }

  // ===== Key Result Operations =====

  async getKeyResults(goalId: string) {
    return getKeyResults(goalId);
  }

  async createKeyResult(goalUuid: string, request: Omit<AddKeyResultRequest, 'goalUuid'>) {
    return createKeyResult(goalUuid, request);
  }

  async updateKeyResult(goalUuid: string, keyResultUuid: string, request: UpdateKeyResultRequest) {
    return updateKeyResult(goalUuid, keyResultUuid, request);
  }

  async deleteKeyResult(goalUuid: string, keyResultUuid: string) {
    return deleteKeyResult(goalUuid, keyResultUuid);
  }

  // ===== Folder Operations =====

  async listFolders(): Promise<GoalFolderClientDTO[]> {
    return listGoalFolders();
  }

  async getFolder(folderId: string): Promise<GoalFolderClientDTO | null> {
    try {
      return await getGoalFolder(folderId);
    } catch {
      return null;
    }
  }

  async createFolder(input: CreateGoalFolderInput): Promise<GoalFolderClientDTO> {
    return createGoalFolder(input);
  }

  async updateFolder(uuid: string, request: UpdateGoalFolderRequest) {
    return updateGoalFolder(uuid, request);
  }

  async deleteFolder(folderId: string): Promise<void> {
    return deleteGoalFolder(folderId);
  }

  // ===== Record Operations =====

  async getRecordsByGoal(goalId: string, params?: { page?: number; limit?: number; dateRange?: { start?: string; end?: string } }) {
    return getGoalRecordsByGoal(goalId, params);
  }

  async createRecord(goalUuid: string, keyResultUuid: string, request: CreateGoalRecordRequest) {
    return createGoalRecord(goalUuid, keyResultUuid, request);
  }

  async deleteRecord(goalUuid: string, keyResultUuid: string, recordUuid: string) {
    return deleteGoalRecord(goalUuid, keyResultUuid, recordUuid);
  }
}

// 导出单例
export const goalApplicationService = GoalApplicationService.getInstance();
