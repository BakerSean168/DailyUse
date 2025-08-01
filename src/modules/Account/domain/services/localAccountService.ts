import type { AccountRegistrationRequest } from "../../index";
import type { TResponse } from "../../../../shared/types/response";
import { accountIpcClient } from "../../infrastructure/ipcs/accountIpcClient";

/**
 * 本地用户服务 - 渲染进程轻量级客户端
 * 负责与主进程通信，所有业务逻辑都在主进程处理
 * 
 * 架构说明：
 * - 渲染进程：只负责 UI 和 API 调用
 * - 主进程：处理所有业务逻辑、数据持久化、安全验证
 */
class LocalAccountService {
  // 单例实例
  private static instance: LocalAccountService;

  /**
   * 私有构造函数，确保只能通过 getInstance 方法创建实例
   */
  private constructor() {}

  /**
   * 获取 LocalAccountService 的单例实例
   * @returns LocalAccountService 实例
   */
  public static getInstance(): LocalAccountService {
    if (!LocalAccountService.instance) {
      LocalAccountService.instance = new LocalAccountService();
    }
    return LocalAccountService.instance;
  }

  /**
   * 用户注册
   * @param form - 注册表单数据
   * @returns 注册成功的用户信息
   */
  async register(form: AccountRegistrationRequest): Promise<TResponse> {
    try {
      console.log('🔄 [渲染进程-用户服务] 开始注册流程:', form.username);

      // 调用 API 客户端
      const response = await accountIpcClient.accountRegistration(form);
      
      if (response.success) {
        console.log('✅ [渲染进程-用户服务] 注册成功');
      } else {
        console.log('❌ [渲染进程-用户服务] 注册失败:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ [渲染进程-用户服务] 注册异常:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "注册失败",
        data: null,
      };
    }
  }

  // /**
  //  * 用户登录
  //  * @param credentials - 登录凭证
  //  * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise
  //  */
  // async login(credentials: any): Promise<TResponse> {
  //   try {
  //     console.log('🔄 [渲染进程-用户服务] 开始登录流程:', credentials.username);

  //     // 调用 API 客户端
  //     const response = await accountIpcClient.login(credentials);
      
  //     if (response.success && response.data) {
  //       console.log('✅ [渲染进程-用户服务] 登录成功');
        
  //       // 登录成功后，初始化用户数据
  //       try {
  //         await UserDataInitService.initUserData(response.data.username);
  //         console.log('✅ [渲染进程-用户服务] 用户数据初始化成功');
  //       } catch (error) {
  //         console.error('❌ [渲染进程-用户服务] 用户数据初始化失败:', error);
  //       }
  //     } else {
  //       console.log('❌ [渲染进程-用户服务] 登录失败:', response.message);
  //     }

  //     return response;
  //   } catch (error) {
  //     console.error('❌ [渲染进程-用户服务] 登录异常:', error);
  //     throw error;
  //   }
  // }

  // /**
  //  * 用户注销
  //  * @param username - 要注销的用户名
  //  * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise
  //  */
  // async deregistration(username: string): Promise<TResponse> {
  //   try {
  //     console.log('🔄 [渲染进程-用户服务] 开始注销流程:', username);

  //     // 需要先获取用户ID
  //     const usersResult = await accountIpcClient.getAllUsers();
  //     if (usersResult.success && usersResult.data) {
  //       const user = usersResult.data.find((u: any) => u.username === username);
  //       if (user) {
  //         const response = await accountIpcClient.deregisterAccount(user.uuid);
  //         console.log(response.success ? '✅ [渲染进程-用户服务] 注销成功' : '❌ [渲染进程-用户服务] 注销失败:', response.message);
  //         return response;
  //       }
  //     }
      
  //     return {
  //       success: false,
  //       message: '用户不存在',
  //       data: null
  //     };
  //   } catch (error) {
  //     console.error('❌ [渲染进程-用户服务] 注销异常:', error);
  //     throw error;
  //   }
  // }

  // /**
  //  * 获取所有用户信息
  //  * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise
  //  */
  // async getAllUsers(): Promise<TResponse> {
  //   try {
  //     console.log('🔄 [渲染进程-用户服务] 获取用户列表');

  //     // 调用 API 客户端
  //     const response = await accountIpcClient.getAllUsers();
      
  //     console.log(response.success ? '✅ [渲染进程-用户服务] 获取用户列表成功' : '❌ [渲染进程-用户服务] 获取用户列表失败:', response.message);
  //     return response;
  //   } catch (error) {
  //     console.error('❌ [渲染进程-用户服务] 获取用户列表异常:', error);
  //     throw error;
  //   }
  // }

  // /**
  //  * 更新用户信息
  //  * @param username - 要更新的用户名
  //  * @param updateData - 新的用户数据
  //  * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise
  //  */
  // async updateUserInfo(
  //   username: string,
  //   updateData: {
  //     email?: string;
  //     phone?: string;
  //     firstName?: string;
  //     lastName?: string;
  //     bio?: string;
  //     avatar?: string;
  //   }
  // ): Promise<TResponse> {
  //   try {
  //     console.log('🔄 [渲染进程-用户服务] 更新用户信息:', username);

  //     // 需要先获取用户ID
  //     const usersResult = await accountIpcClient.getAllUsers();
  //     if (usersResult.success && usersResult.data) {
  //       const user = usersResult.data.find((u: any) => u.username === username);
  //       if (user) {
  //         const response = await accountIpcClient.updateUserInfo(user.uuid, updateData);
  //         console.log(response.success ? '✅ [渲染进程-用户服务] 更新成功' : '❌ [渲染进程-用户服务] 更新失败:', response.message);
  //         return response;
  //       }
  //     }
      
  //     return {
  //       success: false,
  //       message: '用户不存在',
  //       data: null
  //     };
  //   } catch (error) {
  //     console.error('❌ [渲染进程-用户服务] 更新用户信息异常:', error);
  //     throw error;
  //   }
  // }

  // /**
  //  * 用户登出（已弃用 - 新架构需要使用令牌）
  //  * @param _username - 要登出的用户名（已弃用，标记为未使用）
  //  * @param _accountType - 账号类型（已弃用，标记为未使用）
  //  * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise
  //  * @deprecated 请使用 logoutWithToken(token) 方法
  //  */
  // async logout(_username: string, _accountType: string): Promise<TResponse> {
  //   console.warn('logout(username, accountType) 方法已弃用，请使用 logoutWithToken(token) 方法');
    
  //   return {
  //     success: false,
  //     message: '新架构下需要使用会话令牌登出，请调用 logoutWithToken(token) 方法',
  //     data: null
  //   };
  // }

  // /**
  //  * 使用会话令牌登出（新架构）
  //  * @param token - 会话令牌
  //  * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise
  //  */
  // async logoutWithToken(token: string): Promise<TResponse> {
  //   try {
  //     console.log('🔄 [渲染进程-用户服务] 开始登出流程');

  //     // 调用 API 客户端
  //     const response = await accountIpcClient.logout(token);
      
  //     console.log(response.success ? '✅ [渲染进程-用户服务] 登出成功' : '❌ [渲染进程-用户服务] 登出失败:', response.message);
  //     return response;
  //   } catch (error) {
  //     console.error('❌ [渲染进程-用户服务] 登出异常:', error);
  //     throw error;
  //   }
  // }

  // /**
  //  * 验证会话
  //  * @param token - 会话令牌
  //  * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise
  //  */
  // async validateSession(token: string): Promise<TResponse> {
  //   try {
  //     console.log('🔄 [渲染进程-用户服务] 验证会话');

  //     // 调用 API 客户端
  //     const response = await accountIpcClient.validateSession(token);
      
  //     console.log(response.success ? '✅ [渲染进程-用户服务] 会话验证成功' : '❌ [渲染进程-用户服务] 会话验证失败:', response.message);
  //     return response;
  //   } catch (error) {
  //     console.error('❌ [渲染进程-用户服务] 会话验证异常:', error);
  //     throw error;
  //   }
  // }

  // /**
  //  * 修改密码
  //  * @param accountUuid - 账号ID
  //  * @param oldPassword - 旧密码
  //  * @param newPassword - 新密码
  //  * @returns {Promise<TResponse>} 返回一个包含以下结构的 Promise
  //  */
  // async changePassword(accountUuid: string, oldPassword: string, newPassword: string): Promise<TResponse> {
  //   try {
  //     console.log('🔄 [渲染进程-用户服务] 修改密码');

  //     // 调用 API 客户端
  //     const response = await accountIpcClient.changePassword(accountUuid, oldPassword, newPassword);
      
  //     console.log(response.success ? '✅ [渲染进程-用户服务] 修改密码成功' : '❌ [渲染进程-用户服务] 修改密码失败:', response.message);
  //     return response;
  //   } catch (error) {
  //     console.error('❌ [渲染进程-用户服务] 修改密码异常:', error);
  //     throw error;
  //   }
  // }
}

// 导出 LocalAccountService 的单例实例
export const localAccountService = LocalAccountService.getInstance();
