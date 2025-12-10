/**
 * Goal IPC 处理器
 * 处理所有与目标相关的 IPC 请求
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { GoalDesktopApplicationService } from '../application/GoalDesktopApplicationService';
import type { CreateGoalInput, UpdateGoalInput } from '@dailyuse/application-server';

export class GoalIPCHandler extends BaseIPCHandler {
  private goalService: GoalDesktopApplicationService;

  constructor() {
    super('GoalIPCHandler');
    this.goalService = new GoalDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 创建目标
    ipcMain.handle('goal:create', async (event, params: CreateGoalInput) => {
      return this.handleRequest(
        'goal:create',
        () => this.goalService.createGoal(params),
        { accountUuid: params.accountUuid },
      );
    });

    // 获取目标
    ipcMain.handle('goal:get', async (event, payload: { uuid: string; includeChildren?: boolean }) => {
      return this.handleRequest(
        'goal:get',
        () => this.goalService.getGoal(payload.uuid, payload.includeChildren),
      );
    });

    // 列出目标
    ipcMain.handle('goal:list', async (event, params: { accountUuid?: string; status?: string; folderUuid?: string; includeChildren?: boolean }) => {
      return this.handleRequest(
        'goal:list',
        () => this.goalService.listGoals(params),
        { accountUuid: params.accountUuid },
      );
    });

    // 更新目标
    ipcMain.handle('goal:update', async (event, payload: { uuid: string; params: UpdateGoalInput }) => {
      return this.handleRequest(
        'goal:update',
        () => this.goalService.updateGoal(payload.uuid, payload.params),
      );
    });

    // 删除目标
    ipcMain.handle('goal:delete', async (event, uuid: string) => {
      return this.handleRequest(
        'goal:delete',
        () => this.goalService.deleteGoal(uuid),
      );
    });

    // 激活目标
    ipcMain.handle('goal:activate', async (event, uuid: string) => {
      return this.handleRequest(
        'goal:activate',
        () => this.goalService.activateGoal(uuid),
      );
    });

    // 归档目标
    ipcMain.handle('goal:archive', async (event, uuid: string) => {
      return this.handleRequest(
        'goal:archive',
        () => this.goalService.archiveGoal(uuid),
      );
    });

    // 完成目标
    ipcMain.handle('goal:complete', async (event, uuid: string) => {
      return this.handleRequest(
        'goal:complete',
        () => this.goalService.completeGoal(uuid),
      );
    });

    // 获取目标统计
    ipcMain.handle('goal:get-statistics', async (event, accountUuid?: string) => {
      return this.handleRequest(
        'goal:get-statistics',
        () => this.goalService.getGoalStatistics(accountUuid),
        { accountUuid },
      );
    });

    this.logger.info('Registered Goal IPC handlers');
  }
}

export const goalIPCHandler = new GoalIPCHandler();
