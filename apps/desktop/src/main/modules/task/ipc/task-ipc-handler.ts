/**
 * 改进的 Task IPC 处理器示例
 * 展示如何使用新的基础设施进行错误处理、日志和性能监控
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { TaskDesktopApplicationService } from '../application/TaskDesktopApplicationService';
import type { CreateTaskTemplateInput } from '@dailyuse/application-server';

export class TaskIPCHandler extends BaseIPCHandler {
  private taskService: TaskDesktopApplicationService;

  constructor() {
    super('TaskIPCHandler');
    this.taskService = new TaskDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 创建任务模板
    ipcMain.handle('task:create-template', async (event, input: CreateTaskTemplateInput) => {
      return this.handleRequest(
        'task:create-template',
        () => this.taskService.createTemplate(input),
        { accountUuid: input.accountUuid },
      );
    });

    // 获取任务模板
    ipcMain.handle('task:get-template', async (event, uuid: string) => {
      return this.handleRequest(
        'task:get-template',
        () => this.taskService.getTemplate(uuid),
      );
    });

    // 列出任务模板
    ipcMain.handle('task:list-templates', async (event, params: any) => {
      return this.handleRequest(
        'task:list-templates',
        () => this.taskService.listTemplates(params),
        { accountUuid: params?.accountUuid },
      );
    });

    // 更新任务模板
    ipcMain.handle('task:update-template', async (event, uuid: string, updates: any) => {
      return this.handleRequest(
        'task:update-template',
        () => this.taskService.updateTemplate(uuid, updates),
      );
    });

    // 删除任务模板
    ipcMain.handle('task:delete-template', async (event, uuid: string) => {
      return this.handleRequest(
        'task:delete-template',
        () => this.taskService.deleteTemplate(uuid),
      );
    });

    // 获取任务实例
    ipcMain.handle('task:get-instance', async (event, uuid: string) => {
      return this.handleRequest(
        'task:get-instance',
        () => this.taskService.getInstance(uuid),
      );
    });

    // 列出任务实例
    ipcMain.handle('task:list-instances', async (event, params: any) => {
      return this.handleRequest(
        'task:list-instances',
        () => this.taskService.listInstances(params),
        { accountUuid: params?.accountUuid },
      );
    });

    // 完成任务实例
    ipcMain.handle('task:complete-instance', async (event, uuid: string) => {
      return this.handleRequest(
        'task:complete-instance',
        () => this.taskService.completeInstance(uuid),
      );
    });

    // 获取仪表板数据
    ipcMain.handle('task:get-dashboard', async (event, accountUuid: string) => {
      return this.handleRequest(
        'task:get-dashboard',
        () => this.taskService.getDashboard(accountUuid),
        { accountUuid },
      );
    });

    this.logger.info(`Registered ${9} task IPC handlers`);
  }
}

// 导出单例
export const taskIPCHandler = new TaskIPCHandler();
