/**
 * Account API Client Port Interface
 */

// TODO: Import from @dailyuse/contracts/account when available

/**
 * Account API Client Interface
 */
export interface IAccountApiClient {
  /** 获取账户详情 */
  getAccount(uuid: string): Promise<unknown>;

  /** 更新账户 */
  updateAccount(uuid: string, request: unknown): Promise<unknown>;

  /** 获取当前用户 */
  getCurrentUser(): Promise<unknown>;

  /** 更新个人资料 */
  updateProfile(request: unknown): Promise<unknown>;
}
