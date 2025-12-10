/**
 * Account IPC 处理器
 * 处理所有与账户相关的 IPC 请求
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { AccountDesktopApplicationService, type CreateAccountInput } from '../application/AccountDesktopApplicationService';

export class AccountIPCHandler extends BaseIPCHandler {
  private accountService: AccountDesktopApplicationService;

  constructor() {
    super('AccountIPCHandler');
    this.accountService = new AccountDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 创建账户
    ipcMain.handle('account:create', async (event, input: CreateAccountInput) => {
      return this.handleRequest(
        'account:create',
        () => this.accountService.createAccount(input),
      );
    });

    // 获取账户
    ipcMain.handle('account:get', async (event, uuid: string) => {
      return this.handleRequest(
        'account:get',
        () => this.accountService.getAccount(uuid),
        { accountUuid: uuid },
      );
    });

    // 获取当前用户
    ipcMain.handle('account:get-current', async () => {
      return this.handleRequest(
        'account:get-current',
        () => this.accountService.getCurrentUser(),
      );
    });

    // 更新账户
    ipcMain.handle('account:update', async (event, payload: { uuid: string; updates: any }) => {
      return this.handleRequest(
        'account:update',
        () => this.accountService.updateAccount(payload.uuid, payload.updates),
        { accountUuid: payload.uuid },
      );
    });

    // 获取订阅
    ipcMain.handle('account:get-subscription', async () => {
      return this.handleRequest(
        'account:get-subscription',
        () => this.accountService.getSubscription(),
      );
    });

    // 获取资料
    ipcMain.handle('account:get-profile', async (event, uuid: string) => {
      return this.handleRequest(
        'account:get-profile',
        () => this.accountService.getProfile(uuid),
        { accountUuid: uuid },
      );
    });

    // 更新资料
    ipcMain.handle('account:update-profile', async (event, payload: { uuid: string; updates: any }) => {
      return this.handleRequest(
        'account:update-profile',
        () => this.accountService.updateProfile(payload.uuid, payload.updates),
        { accountUuid: payload.uuid },
      );
    });

    // 删除账户
    ipcMain.handle('account:delete', async (event, uuid: string) => {
      return this.handleRequest(
        'account:delete',
        () => this.accountService.deleteAccount(uuid),
        { accountUuid: uuid },
      );
    });

    this.logger.info('Registered Account IPC handlers');
  }
}

export const accountIPCHandler = new AccountIPCHandler();
