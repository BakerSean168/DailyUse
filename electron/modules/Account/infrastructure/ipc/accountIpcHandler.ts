import { ipcMain } from "electron";
import { 
  AccountDeactivationService, 
  AccountDeactivationResult 
} from "../../application/services/accountDeactivationService";
import { MainAccountApplicationService } from "../../application/services/mainAccountApplicationService";
import type { AccountRegistrationRequest, AccountDTO } from '../../domain/types/account';
import { withAuth } from '@electron/modules/Authentication/application/services/authTokenService';

/**
 * Account 模块的 IPC 处理器
 * 处理来自渲染进程的账号相关请求
 */
export class AccountIpcHandler {
  private deactivationService: AccountDeactivationService | null = null;
  private accountApplicationService: MainAccountApplicationService | null = null;
  private _isInitialized = false;

  constructor() {
    // 构造函数中不直接初始化服务
  }

  /**
   * 异步初始化服务
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      console.log('🔄 [AccountIpc] 开始初始化账号IPC处理器...');
      this.accountApplicationService = new MainAccountApplicationService();
      
      // 设置IPC处理器
      await this.setupIpcHandlers();
      
      this._isInitialized = true;
      console.log('✅ [AccountIpc] 账号IPC处理器初始化完成');
    } catch (error) {
      console.error('❌ [AccountIpc] 账号IPC处理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否已初始化
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 确保服务已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this._isInitialized) {
      throw new Error('AccountIpcHandler 尚未初始化，请先调用 initialize()');
    }
  }

  /**
   * 设置IPC处理器
   */
  private async setupIpcHandlers(): Promise<void> {
    ipcMain.handle(
      'account:register',
      async (_event, request: AccountRegistrationRequest): Promise<TResponse<AccountDTO>> => {
        try {
          await this.ensureInitialized();
          
          console.log('🏠 [AccountIpc] 收到账号注册请求:', request);
          
          const response = await this.accountApplicationService!.register(request);
          if (response.success && response.data) {
            console.log('✅ [AccountIpc] 账号注册成功:', response.data);
            return {
              success: true,
              data: response.data.toDTO(),
              message: '账号注册成功'
            };
          } else {
            console.error('❌ [AccountIpc] 账号注册失败:', response.message);
            throw new Error(response.message || '账号注册失败，请稍后重试');
          }
        } catch (error) {
          console.error('❌ [AccountIpc] 账号注册处理异常:', error);
          throw error;
        }
      }
    );
    ipcMain.handle(
      'account:get-by-id',
      withAuth(async (_event, [accountUuid], auth): Promise<TResponse<AccountDTO>> => {
        try {
          await this.ensureInitialized();
          
          if (!auth.accountUuid) {
            return {
              success: false,
              message: '未登录或登录已过期，请重新登录',
            };
          }
          
          const response = await this.accountApplicationService!.getAccountById(accountUuid);
          if (response.success && response.data) {
            console.log('📝 [AccountIpc] 获取账号信息成功');
            const accountDTO = response.data.toDTO();
            return {
              success: true,
              data: accountDTO,
              message: '获取账号信息成功'
            };
          } else {
            console.error('❌ [AccountIpc] 获取账号信息失败:', response.message);
            return {
              success: false,
              message: '获取账号信息失败，请稍后重试',
            };
          }
        } catch (error) {
          console.error('❌ [AccountIpc] 获取账号信息失败:', error);
          return {
            success: false,
            message: '获取账号信息失败，请稍后重试',
          };
        }
      })
    );
    // 处理账号注销请求
    ipcMain.handle(
      'account:request-deactivation', 
      withAuth(async (_event, [request], auth): Promise<AccountDeactivationResult> => {
        try {
          await this.ensureInitialized();

          if (!auth.accountUuid) {
            return {
              success: false,
              accountUuid: request.accountUuid,
              message: '未登录或登录已过期，请重新登录',
              requiresVerification: false,
              errorCode: 'PERMISSION_DENIED'
            };
          }
          
          console.log('🏠 [AccountIpc] 收到账号注销请求:', {
            accountUuid: request.accountUuid,
            requestedBy: request.requestedBy
          });
          
          const result = await this.deactivationService!.requestAccountDeactivation(request);
          
          console.log('📤 [AccountIpc] 账号注销请求处理完成:', {
            accountUuid: request.accountUuid,
            success: result.success,
            requiresVerification: result.requiresVerification
          });
          
          return result;
        } catch (error) {
          console.error('❌ [AccountIpc] 账号注销请求处理异常:', error);
          
          return {
            success: false,
            accountUuid: request.accountUuid,
            message: '账号注销请求处理异常，请稍后重试',
            requiresVerification: false,
            errorCode: 'SYSTEM_ERROR'
          };
        }
      })
    );

    console.log('✅ [AccountIpc] Account IPC handlers registered');
  }

  /**
   * 清理资源
   */
  async destroy(): Promise<void> {
    if (!this._isInitialized) return;

    try {
      // 移除IPC监听器
      ipcMain.removeHandler('account:register');
      ipcMain.removeHandler('account:request-deactivation');
      ipcMain.removeHandler('account:force-deactivation');
      ipcMain.removeHandler('account:get-info');
      
      // 清理注销服务
      if (this.deactivationService) {
        await this.deactivationService.destroy();
        this.deactivationService = null;
      }
      
      this.accountApplicationService = null;
      this._isInitialized = false;
      
      console.log('🧹 [AccountIpc] Account IPC handlers cleaned up');
    } catch (error) {
      console.error('❌ [AccountIpc] 清理账号IPC处理器失败:', error);
    }
  }
}

/**
 * 异步服务管理器
 */
class AsyncAccountIpcService {
  private handlerPromise: Promise<AccountIpcHandler> | null = null;
  private handler: AccountIpcHandler | null = null;

  /**
   * 初始化服务（只会初始化一次）
   */
  async initialize(): Promise<AccountIpcHandler> {
    if (this.handlerPromise) {
      return this.handlerPromise;
    }

    this.handlerPromise = this.createHandler();
    return this.handlerPromise;
  }

  /**
   * 创建处理器
   */
  private async createHandler(): Promise<AccountIpcHandler> {
    try {
      const handler = new AccountIpcHandler();
      await handler.initialize();
      this.handler = handler;
      return handler;
    } catch (error) {
      // 如果初始化失败，重置状态以便重试
      this.handlerPromise = null;
      throw error;
    }
  }

  /**
   * 获取服务实例（如果未初始化则等待）
   */
  async getInstance(): Promise<AccountIpcHandler> {
    if (this.handler && this.handler.isInitialized) {
      return this.handler;
    }

    return this.initialize();
  }

  /**
   * 检查服务是否已初始化
   */
  isInitialized(): boolean {
    return this.handler?.isInitialized ?? false;
  }

  /**
   * 清理服务
   */
  async cleanup(): Promise<void> {
    if (this.handler) {
      await this.handler.destroy();
      this.handler = null;
    }
    this.handlerPromise = null;
  }
}

/**
 * 导出单例实例
 */
const asyncAccountIpcService = new AsyncAccountIpcService();

export async function initializeAccountIpcHandler(): Promise<AccountIpcHandler> {
  return asyncAccountIpcService.initialize();
}

export async function getAccountIpcHandler(): Promise<AccountIpcHandler> {
  return asyncAccountIpcService.getInstance();
}

export function isAccountIpcHandlerInitialized(): boolean {
  return asyncAccountIpcService.isInitialized();
}

export async function cleanupAccountIpcHandler(): Promise<void> {
  await asyncAccountIpcService.cleanup();
}