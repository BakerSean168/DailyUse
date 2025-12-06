/**
 * Goal IPC Handlers
 *
 * 处理 Goal 模块的所有 IPC 通道
 */

import { ipcMain } from 'electron';
import { GoalContainer } from '@dailyuse/infrastructure-server';
import type { Goal } from '@dailyuse/domain-server/goal';

/**
 * 注册 Goal 模块的 IPC 处理器
 */
export function registerGoalIpcHandlers(): void {
  const getGoalRepo = () => GoalContainer.getInstance().getGoalRepository();
  const getStatisticsRepo = () => GoalContainer.getInstance().getStatisticsRepository();

  // ===== Goal CRUD =====

  ipcMain.handle('goal:create', async (_, request) => {
    const repo = getGoalRepo();
    const { Goal } = await import('@dailyuse/domain-server/goal');
    const goal = Goal.create(request);
    await repo.save(goal);
    return goal.toServerDTO(true);
  });

  ipcMain.handle('goal:list', async (_, params) => {
    const repo = getGoalRepo();
    const goals = await repo.findByAccountUuid(params?.accountUuid ?? 'default', {
      status: params?.status,
      folderUuid: params?.dirUuid,
      includeChildren: params?.includeChildren ?? true,
    });
    return {
      goals: goals.map((g: Goal) => g.toServerDTO(true)),
      total: goals.length,
      page: params?.page ?? 1,
      pageSize: params?.limit ?? 100,
    };
  });

  ipcMain.handle('goal:get', async (_, uuid, includeChildren = true) => {
    const repo = getGoalRepo();
    const goal = await repo.findById(uuid, { includeChildren });
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }
    return goal.toServerDTO(includeChildren);
  });

  ipcMain.handle('goal:update', async (_, uuid, request) => {
    const repo = getGoalRepo();
    const goal = await repo.findById(uuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }
    // 使用 updateBasicInfo 方法更新目标属性
    goal.updateBasicInfo({
      title: request.title,
      description: request.description,
      importance: request.importance,
      urgency: request.urgency,
      category: request.category,
      color: request.color,
    });
    await repo.save(goal);
    return goal.toServerDTO(true);
  });

  ipcMain.handle('goal:delete', async (_, uuid) => {
    const repo = getGoalRepo();
    await repo.delete(uuid);
    return { success: true };
  });

  // ===== Goal Status =====

  ipcMain.handle('goal:activate', async (_, uuid) => {
    const repo = getGoalRepo();
    const goal = await repo.findById(uuid);
    if (!goal) throw new Error(`Goal not found: ${uuid}`);
    goal.activate();
    await repo.save(goal);
    return goal.toServerDTO();
  });

  ipcMain.handle('goal:pause', async (_, uuid) => {
    const repo = getGoalRepo();
    const goal = await repo.findById(uuid);
    if (!goal) throw new Error(`Goal not found: ${uuid}`);
    // TODO: 实现 pause 方法
    await repo.save(goal);
    return goal.toServerDTO();
  });

  ipcMain.handle('goal:complete', async (_, uuid) => {
    const repo = getGoalRepo();
    const goal = await repo.findById(uuid);
    if (!goal) throw new Error(`Goal not found: ${uuid}`);
    goal.complete();
    await repo.save(goal);
    return goal.toServerDTO();
  });

  ipcMain.handle('goal:archive', async (_, uuid) => {
    const repo = getGoalRepo();
    const goal = await repo.findById(uuid);
    if (!goal) throw new Error(`Goal not found: ${uuid}`);
    goal.archive();
    await repo.save(goal);
    return goal.toServerDTO();
  });

  // ===== Search =====

  ipcMain.handle('goal:search', async (_, params) => {
    const repo = getGoalRepo();
    // TODO: 实现搜索功能
    const goals = await repo.findByAccountUuid(params?.accountUuid ?? 'default', {
      status: params?.status,
      includeChildren: true,
    });
    const filtered = goals.filter((g: Goal) =>
      g.title.toLowerCase().includes((params?.query ?? '').toLowerCase())
    );
    return {
      goals: filtered.map((g: Goal) => g.toServerDTO(true)),
      total: filtered.length,
      page: params?.page ?? 1,
      pageSize: params?.limit ?? 100,
    };
  });

  // ===== KeyResult Management =====

  ipcMain.handle('goal:keyResult:add', async (_, goalUuid, request) => {
    const repo = getGoalRepo();
    const goal = await repo.findById(goalUuid, { includeChildren: true });
    if (!goal) throw new Error(`Goal not found: ${goalUuid}`);
    
    const { KeyResult } = await import('@dailyuse/domain-server/goal');
    const keyResult = KeyResult.create({
      goalUuid,
      ...request,
    });
    goal.addKeyResult(keyResult);
    await repo.save(goal);
    return keyResult.toServerDTO();
  });

  ipcMain.handle('goal:keyResult:list', async (_, goalUuid) => {
    const repo = getGoalRepo();
    const goal = await repo.findById(goalUuid, { includeChildren: true });
    if (!goal) throw new Error(`Goal not found: ${goalUuid}`);
    return {
      keyResults: goal.keyResults.map((kr) => kr.toServerDTO()),
      total: goal.keyResults.length,
    };
  });

  ipcMain.handle('goal:keyResult:update', async (_, goalUuid, keyResultUuid, request) => {
    const repo = getGoalRepo();
    const goal = await repo.findById(goalUuid, { includeChildren: true });
    if (!goal) throw new Error(`Goal not found: ${goalUuid}`);
    
    const keyResult = goal.keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) throw new Error(`KeyResult not found: ${keyResultUuid}`);
    
    // TODO: 实现更新逻辑
    await repo.save(goal);
    return keyResult.toServerDTO();
  });

  ipcMain.handle('goal:keyResult:delete', async (_, goalUuid, keyResultUuid) => {
    const repo = getGoalRepo();
    const goal = await repo.findById(goalUuid, { includeChildren: true });
    if (!goal) throw new Error(`Goal not found: ${goalUuid}`);
    
    goal.removeKeyResult(keyResultUuid);
    await repo.save(goal);
    return { success: true };
  });

  ipcMain.handle('goal:keyResult:batchUpdateWeights', async (_, goalUuid, request) => {
    const repo = getGoalRepo();
    const goal = await repo.findById(goalUuid, { includeChildren: true });
    if (!goal) throw new Error(`Goal not found: ${goalUuid}`);
    
    // TODO: 实现批量更新权重
    await repo.save(goal);
    return {
      keyResults: goal.keyResults.map((kr) => kr.toServerDTO()),
      total: goal.keyResults.length,
    };
  });

  ipcMain.handle('goal:progressBreakdown', async (_, goalUuid) => {
    const repo = getGoalRepo();
    const goal = await repo.findById(goalUuid, { includeChildren: true });
    if (!goal) throw new Error(`Goal not found: ${goalUuid}`);
    
    return goal.getProgressBreakdown();
  });

  // ===== GoalReview Management =====

  ipcMain.handle('goal:review:create', async (_, goalUuid, request) => {
    // TODO: 实现复盘创建
    return { uuid: 'todo', ...request };
  });

  ipcMain.handle('goal:review:list', async (_, goalUuid) => {
    // TODO: 实现复盘列表
    return { reviews: [], total: 0 };
  });

  ipcMain.handle('goal:review:update', async (_, goalUuid, reviewUuid, request) => {
    // TODO: 实现复盘更新
    return { uuid: reviewUuid, ...request };
  });

  ipcMain.handle('goal:review:delete', async (_, goalUuid, reviewUuid) => {
    // TODO: 实现复盘删除
    return { success: true };
  });

  // ===== GoalRecord Management =====

  ipcMain.handle('goal:record:create', async (_, goalUuid, keyResultUuid, request) => {
    // TODO: 实现记录创建
    return { uuid: 'todo', ...request };
  });

  ipcMain.handle('goal:record:listByKeyResult', async (_, goalUuid, keyResultUuid, params) => {
    // TODO: 实现记录列表
    return { records: [], total: 0 };
  });

  ipcMain.handle('goal:record:listByGoal', async (_, goalUuid, params) => {
    // TODO: 实现记录列表
    return { records: [], total: 0 };
  });

  ipcMain.handle('goal:record:delete', async (_, goalUuid, keyResultUuid, recordUuid) => {
    // TODO: 实现记录删除
    return { success: true };
  });

  // ===== Aggregate View =====

  ipcMain.handle('goal:aggregate', async (_, goalUuid) => {
    const repo = getGoalRepo();
    const goal = await repo.findById(goalUuid, { includeChildren: true });
    if (!goal) throw new Error(`Goal not found: ${goalUuid}`);
    return goal.toServerDTO(true);
  });

  ipcMain.handle('goal:clone', async (_, goalUuid, request) => {
    const repo = getGoalRepo();
    const goal = await repo.findById(goalUuid, { includeChildren: request?.includeKeyResults });
    if (!goal) throw new Error(`Goal not found: ${goalUuid}`);
    
    // 使用 Goal.create 创建克隆
    const { Goal: GoalClass } = await import('@dailyuse/domain-server/goal');
    const cloned = GoalClass.create({
      accountUuid: goal.accountUuid,
      title: request?.name || `${goal.title} (Copy)`,
      description: goal.description || undefined,
      importance: goal.importance,
      urgency: goal.urgency,
      category: goal.category || undefined,
      tags: goal.tags,
      startDate: goal.startDate || undefined,
      targetDate: goal.targetDate || undefined,
      folderUuid: goal.folderUuid || undefined,
    });
    await repo.save(cloned);
    return cloned.toServerDTO(true);
  });

  console.log('[IPC] Goal handlers registered');
}
