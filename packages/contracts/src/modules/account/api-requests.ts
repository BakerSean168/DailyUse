/**
 * Account Module - API Request/Response DTOs
 * 账户模块 API 请求响应类型定义
 */

import type { AccountServerDTO } from './aggregates/AccountServer';
import type { SubscriptionServerDTO } from './entities/SubscriptionServer';
import type { AccountHistoryServerDTO } from './entities/AccountHistoryServer';
import type { AccountStatus, SubscriptionPlan, ThemeType } from './enums';

// ============ API 响应类型（服务端返回给前端）============

/**
 * 单个账户响应
 */
export type AccountDTO = AccountServerDTO;

/**
 * 账户列表响应
 */
export interface AccountListResponseDTO {
  accounts: AccountServerDTO[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * 订阅信息响应
 */
export type SubscriptionDTO = SubscriptionServerDTO;

/**
 * 账户历史响应
 */
export interface AccountHistoryListResponseDTO {
  history: AccountHistoryServerDTO[];
  total: number;
  page?: number;
  limit?: number;
}

// ============ API 请求类型（前端发送给服务端）============

/**
 * 创建账户请求
 */
export interface CreateAccountRequest {
  username: string;
  email: string;
  password?: string; // 可选，可能通过第三方登录
  displayName: string;
  timezone?: string;
  language?: string;
}

/**
 * 更新账户资料请求
 */
export interface UpdateAccountProfileRequest {
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  language?: string;
  dateOfBirth?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
}

/**
 * 更新账户偏好请求
 */
export interface UpdateAccountPreferencesRequest {
  theme?: ThemeType;
  accentColor?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
  privacy?: {
    profileVisibility?: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
    showOnlineStatus?: boolean;
    allowSearchByEmail?: boolean;
  };
}

/**
 * 更新邮箱请求
 */
export interface UpdateEmailRequest {
  newEmail: string;
  password: string; // 需要密码验证
}

/**
 * 验证邮箱请求
 */
export interface VerifyEmailRequest {
  code: string; // 验证码
}

/**
 * 更新手机号请求
 */
export interface UpdatePhoneRequest {
  newPhoneNumber: string;
  password: string;
}

/**
 * 验证手机号请求
 */
export interface VerifyPhoneRequest {
  code: string;
}

/**
 * 订阅计划请求
 */
export interface SubscribePlanRequest {
  plan: SubscriptionPlan;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  paymentMethod?: string;
}

/**
 * 取消订阅请求
 */
export interface CancelSubscriptionRequest {
  reason?: string;
  feedback?: string;
}

/**
 * 账户查询参数
 */
export interface AccountQueryParams {
  status?: AccountStatus;
  search?: string; // 搜索用户名或邮箱
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastActiveAt' | 'username';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 账户统计响应
 */
export interface AccountStatsResponseDTO {
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
  suspendedAccounts: number;
  deletedAccounts: number;
  newAccountsToday: number;
  newAccountsThisWeek: number;
  newAccountsThisMonth: number;
}
