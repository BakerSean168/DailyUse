import { ipcMain } from 'electron';
import { MainGoalApplicationService } from '../../application/services/mainGoalApplicationService';
import { withAuth } from '@electron/modules/Authentication/application/services/authTokenService';

// 创建应用服务实例

/**
 * Goal 模块 IPC 处理器
 * 注册所有目标相关的 IPC 通信
 */
export async function registerGoalIpcHandlers() {
  const goalApplicationService = await MainGoalApplicationService.getInstance();
  // ========== 目标目录 IPC ==========

  ipcMain.handle(
    'goal:dir:create',
    withAuth(async (_event, [GoalFolderData], auth) => {
      try {
        if (!auth.accountUuid) {
          return { success: false, message: '未登录或登录已过期，请重新登录' };
        }
        const dir = await goalApplicationService.createGoalFolder(auth.accountUuid, GoalFolderData);
        const dirDTO = dir.toDTO();
        return { success: true, data: dirDTO, message: '创建成功' };
      } catch (error) {
        console.error('[GoalIpc] 创建目标目录失败:', error);
        return { success: false, message: '创建目标目录失败' };
      }
    }),
  );

  ipcMain.handle(
    'goal:dir:get-all',
    withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const dirs = await goalApplicationService.getAllGoalFolders(auth.accountUuid);
      const dirDTOs = dirs.map((dir) => dir.toDTO());
      return { success: true, data: dirDTOs };
    }),
  );

  ipcMain.handle(
    'goal:dir:delete',
    withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      await goalApplicationService.deleteGoalFolder(auth.accountUuid, uuid);
      return { success: true, message: '删除成功' };
    }),
  );

  ipcMain.handle(
    'goal:dir:update',
    withAuth(async (_event, [GoalFolderData], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const dir = await goalApplicationService.updateGoalFolder(auth.accountUuid, GoalFolderData);
      const dirDTO = dir.toDTO();
      return { success: true, data: dirDTO, message: '更新成功' };
    }),
  );

  // ========== 目标 IPC ==========

  ipcMain.handle(
    'goal:create',
    withAuth(async (_event, [goalData], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const goal = await goalApplicationService.createGoal(auth.accountUuid, goalData);
      const goalDTO = goal.toDTO();
      return { success: true, data: goalDTO, message: '创建成功' };
    }),
  );

  ipcMain.handle(
    'goal:get-all',
    withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const goals = await goalApplicationService.getAllGoals(auth.accountUuid);
      const goalDTOs = goals.map((goal) => goal.toDTO());
      return { success: true, data: goalDTOs };
    }),
  );

  ipcMain.handle(
    'goal:get-by-id',
    withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const goal = await goalApplicationService.getGoalById(auth.accountUuid, uuid);
      if (!goal) {
        return { success: false, message: '目标不存在' };
      }
      const goalDTO = goal.toDTO();
      return { success: true, data: goalDTO };
    }),
  );

  ipcMain.handle(
    'goal:update',
    withAuth(async (_event, [goalData], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const updatedGoal = await goalApplicationService.updateGoal(auth.accountUuid, goalData);
      const goalDTO = updatedGoal.toDTO();
      return { success: true, data: goalDTO, message: '更新成功' };
    }),
  );

  ipcMain.handle(
    'goal:delete',
    withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      await goalApplicationService.deleteGoal(auth.accountUuid, uuid);
      return { success: true, message: '删除成功' };
    }),
  );

  ipcMain.handle(
    'goal:delete-all',
    withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      await goalApplicationService.deleteAllGoals(auth.accountUuid);
      return { success: true, message: '全部删除成功' };
    }),
  );

  // ========== 关键结果 IPC ==========

  ipcMain.handle(
    'goal:removeKeyResult',
    withAuth(async (_event, [goalUuid, keyResultId], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const goal = await goalApplicationService.removeKeyResultFromGoal(
        auth.accountUuid,
        goalUuid,
        keyResultId,
      );
      const goalDTO = goal.toDTO();
      return { success: true, data: goalDTO, message: '删除成功' };
    }),
  );

  // ========== 记录 IPC ==========

  ipcMain.handle(
    'goal:addGoalRecordToGoal',
    withAuth(async (_event, [recordDTO], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const result = await goalApplicationService.addGoalRecordToGoal(auth.accountUuid, recordDTO);
      // result 结构: { goal, record }
      const { goal, record } = result;
      const resultDTO = {
        goalDTO: goal.toDTO(),
        recordDTO: record.toDTO(),
      };
      return { success: true, data: resultDTO, message: '添加成功' };
    }),
  );

  ipcMain.handle(
    'goal:removeGoalRecord',
    withAuth(async (_event, [goalUuid, recordId], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const goal = await goalApplicationService.removeGoalRecordFromGoal(
        auth.accountUuid,
        goalUuid,
        recordId,
      );
      const goalDTO = goal.toDTO();
      return { success: true, data: goalDTO, message: '删除成功' };
    }),
  );

  ipcMain.handle(
    'goal:getAllGoalRecords',
    withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const records = await goalApplicationService.getAllGoalRecords(auth.accountUuid);
      const recordDTOs = records.map((r) => (r.toDTO ? r.toDTO() : r));
      return { success: true, data: recordDTOs };
    }),
  );

  ipcMain.handle(
    'goal:getGoalRecordsByGoal',
    withAuth(async (_event, [goalUuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const records = await goalApplicationService.getGoalRecordsByGoalUuid(
        auth.accountUuid,
        goalUuid,
      );
      const recordDTOs = records.map((r) => (r.toDTO ? r.toDTO() : r));
      return { success: true, data: recordDTOs };
    }),
  );

  ipcMain.handle(
    'goal:deleteGoalRecord',
    withAuth(async (_event, [recordId], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      await goalApplicationService.deleteGoalRecord(auth.accountUuid, recordId);
      return { success: true, message: '删除成功' };
    }),
  );

  // ========== 复盘 IPC ==========

  ipcMain.handle(
    'goal:addReview',
    withAuth(async (_event, [reviewData], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      console.log('addReview', reviewData);
      const result = await goalApplicationService.addReviewToGoal(auth.accountUuid, reviewData);
      const resultDTO = {
        ...result,
        goal: result.goal?.toDTO ? result.goal.toDTO() : result.goal,
        review: result.review?.toDTO ? result.review.toDTO() : result.review,
      };
      return { success: true, data: resultDTO, message: '添加成功' };
    }),
  );

  ipcMain.handle(
    'goal:updateReview',
    withAuth(async (_event, [reviewData], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const result = await goalApplicationService.updateReviewInGoal(auth.accountUuid, reviewData);
      // result 结构: { goal, review }
      const resultDTO = {
        ...result,
        goal: result.goal?.toDTO ? result.goal.toDTO() : result.goal,
        review: result.review?.toDTO ? result.review.toDTO() : result.review,
      };
      return { success: true, data: resultDTO, message: '更新成功' };
    }),
  );

  ipcMain.handle(
    'goal:removeReview',
    withAuth(async (_event, [reviewData], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }

      const goal = await goalApplicationService.removeReviewFromGoal(auth.accountUuid, reviewData);
      const goalDTO = goal?.toDTO ? goal.toDTO() : goal;
      return { success: true, data: goalDTO, message: '删除成功' };
    }),
  );

  console.log('✅ Goal IPC handlers registered');
}

/**
 * 取消注册所有 Goal 相关的 IPC 处理器
 */
export function unregisterGoalIpcHandlers() {
  const channels = [
    'goal:dir:create',
    'goal:dir:get-all',
    'goal:dir:delete',
    'goal:dir:update',
    'goal:create',
    'goal:get-all',
    'goal:get-by-id',
    'goal:update',
    'goal:delete',
    'goal:delete-all',

    'goal:removeKeyResult',

    'goal:addGoalRecordToGoal',
    'goal:removeGoalRecord',
    'goal:getAllGoalRecords',
    'goal:getGoalRecordsByGoal',
    'goal:deleteGoalRecord',
    'goal:addReview',
    'goal:updateReview',
    'goal:removeReview',
  ];

  channels.forEach((channel) => {
    ipcMain.removeAllListeners(channel);
  });

  console.log('✅ Goal IPC handlers unregistered');
}
