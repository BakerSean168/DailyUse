/**
 * 账户模块事件处理器
 * Account Module Event Handlers
 */

// @ts-nocheck - Some types not yet defined
import { eventBus } from '@dailyuse/utils';
import {
  AUTH_EVENTS,
  type UserLoggedInEventPayload,
} from '../../../authentication/application/events/authEvents';
import { useAccountStore } from '../../presentation/stores/accountStore';
import { accountApiClient } from '../../infrastructure/api/accountApiClient';
import { AccountContracts } from '@dailyuse/contracts';

/**
 * 账户模块事件处理器类
 * 负责监听其他模块的事件并处理与账户相关的业务逻辑
 */
export class AccountEventHandlers {
  private static initialized = false;

  /**
   * 初始化账户模块事件监听器
   */
  static initializeEventHandlers(): void {
    if (AccountEventHandlers.initialized) {
      console.log('⚠️ [AccountEventHandlers] 事件处理器已经初始化，跳过重复初始化');
      return;
    }

    console.log('🎯 [AccountEventHandlers] 初始化账户模块事件处理器');

    // 监听用户登录成功事件
    eventBus.on(AUTH_EVENTS.USER_LOGGED_IN, AccountEventHandlers.handleUserLoggedIn);

    // 监听用户登出事件（可选，用于清理账户数据）
    eventBus.on(AUTH_EVENTS.USER_LOGGED_OUT, AccountEventHandlers.handleUserLoggedOut);

    AccountEventHandlers.initialized = true;
    console.log('✅ [AccountEventHandlers] 账户模块事件处理器初始化完成');
  }

  /**
   * 销毁事件监听器
   */
  static destroyEventHandlers(): void {
    if (!AccountEventHandlers.initialized) {
      return;
    }

    console.log('🗑️ [AccountEventHandlers] 销毁账户模块事件处理器');

    eventBus.off(AUTH_EVENTS.USER_LOGGED_IN, AccountEventHandlers.handleUserLoggedIn);
    eventBus.off(AUTH_EVENTS.USER_LOGGED_OUT, AccountEventHandlers.handleUserLoggedOut);

    AccountEventHandlers.initialized = false;
    console.log('✅ [AccountEventHandlers] 账户模块事件处理器已销毁');
  }

  /**
   * 处理用户登录成功事件
   * 当用户登录成功时，自动获取完整的账户信息
   */
  private static async handleUserLoggedIn(payload: UserLoggedInEventPayload): Promise<void> {
    try {
      console.log('📥 [AccountEventHandlers] 处理用户登录成功事件', {
        accountUuid: payload?.accountUuid,
        username: payload?.username,
      });

      // 检查 payload 是否存在且包含必要的数据
      if (!payload || !payload.accountUuid) {
        console.error('❌ [AccountEventHandlers] payload 或 accountUuid 为空', payload);
        return;
      }

      const accountStore = useAccountStore();
      accountStore.setLoading(true);
      accountStore.setError(null);

      try {
        // 通过 /accounts/me 获取当前登录用户的完整信息
        const accountDTO = await accountApiClient.getMyProfile();
        
        console.log('✅ [AccountEventHandlers] 成功获取账户信息', {
          accountUuid: accountDTO.uuid,
          username: accountDTO.username,
        });

        // 将账户信息保存到 store（使用新的 setCurrentAccount 方法）
        accountStore.setCurrentAccount(accountDTO);

        console.log('💾 [AccountEventHandlers] 账户信息已保存到 AccountStore');
      } catch (error) {
        console.error('❌ [AccountEventHandlers] 获取账户信息失败', error);
        accountStore.setError(error instanceof Error ? error.message : '获取账户信息失败');
      } finally {
        accountStore.setLoading(false);
      }
    } catch (error) {
      console.error('❌ [AccountEventHandlers] 处理用户登录事件失败', error);
    }
  }

  /**
   * 处理用户登出事件
   * 清理账户相关数据
   */
  private static async handleUserLoggedOut(): Promise<void> {
    try {
      console.log('📤 [AccountEventHandlers] 处理用户登出事件');

      const accountStore = useAccountStore();

      // 清理账户数据
      accountStore.clearCurrentAccount();

      console.log('🧹 [AccountEventHandlers] 账户数据已清理');
    } catch (error) {
      console.error('❌ [AccountEventHandlers] 处理用户登出事件失败', error);
    }
  }

  /**
   * 手动触发账户信息刷新
   * 可以被其他组件调用来主动刷新账户信息
   */
  static async refreshAccountInfo(accountUuid: string): Promise<void> {
    try {
      console.log('🔄 [AccountEventHandlers] 手动刷新账户信息', { accountUuid });

      const accountStore = useAccountStore();
      accountStore.setLoading(true);
      accountStore.setError(null);

      const accountDTO = await accountApiClient.getMyProfile();
      console.log('✅ [AccountEventHandlers] 成功获取账户信息', {
        accountUuid: accountDTO.uuid,
        username: accountDTO.username,
      });

      accountStore.setCurrentAccount(accountDTO);
      console.log('✅ [AccountEventHandlers] 账户信息刷新完成');
    } catch (error) {
      console.error('❌ [AccountEventHandlers] 刷新账户信息失败', error);
      const accountStore = useAccountStore();
      accountStore.setError(error instanceof Error ? error.message : '刷新账户信息失败');
    } finally {
      const accountStore = useAccountStore();
      accountStore.setLoading(false);
    }
  }

  /**
   * 检查是否已初始化
   */
  static isInitialized(): boolean {
    return AccountEventHandlers.initialized;
  }
}
