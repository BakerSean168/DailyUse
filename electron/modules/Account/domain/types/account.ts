import { DateTime } from "../../../../shared/types/myDateTime";

// 账号状态枚举
export enum AccountStatus {
  ACTIVE = "active",
  DISABLED = "disabled",
  SUSPENDED = "suspended",
  PENDING_VERIFICATION = "pending_verification"
}

// 账号类型枚举
export enum AccountType {
  LOCAL = "local",
  ONLINE = "online",
  GUEST = "guest"
}

// 账号接口
export interface IAccount {
  uuid: string;
  username: string;
  status: AccountStatus;
  accountType: AccountType;
  createdAt: DateTime;
  updatedAt: DateTime;
  lastLoginAt?: DateTime;
}

// 注册数据类型（包含密码，密码在 Authentication 模块处理）
export interface AccountRegistrationRequest {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
  // User 实体相关字段
  firstName?: string;
  lastName?: string;
  sex?: string;
  avatar?: string;
  bio?: string;
  // Account 相关字段
  accountType?: AccountType;
}

// 账号更新数据类型
export interface AccountUpdateData {
  email?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}



// 账号注销请求类型
export interface AccountDeactivationRequest {
  reason: string;
  confirmDeletion: boolean;
  feedback?: string;
}

export interface AccountDTO {
  uuid: string;
  username: string;
  status: AccountStatus;
  accountType: AccountType;
  createdAt: DateTime;
  updatedAt: DateTime;
  lastLoginAt?: DateTime;
  email?: string;
  emailVerificationToken?: string;
  isEmailVerified: boolean;
  phone?: string;
  phoneVerificationCode?: string;
  isPhoneVerified: boolean;
  roleIds?: Set<string>;
  user: UserDTO;
}

export interface UserDTO {
  uuid: string;
  firstName: string | null;
  lastName: string | null;
  sex: string | null;
  avatar: string | null;
  bio: string | null;
  socialAccounts: Map<string, string>;
}