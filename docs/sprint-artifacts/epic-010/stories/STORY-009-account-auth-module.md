# STORY-009: Account & Auth 模块实现

> **EPIC**: EPIC-010 Desktop 全面 DDD 模块化重构  
> **Sprint**: Sprint 3  
> **预估**: 6 小时  
> **优先级**: P1  
> **依赖**: STORY-001

---

## 📋 概述

Desktop 是离线优先应用，Account 模块主要管理本地用户和离线账户。
当前 IPC handlers 返回占位数据，需要实现本地用户管理。

---

## 🎯 目标

1. 实现 Desktop 本地账户管理
2. 支持可选的在线账户同步（预留接口）
3. 管理用户 Profile 和偏好设置

---

## ✅ 验收标准 (AC)

### AC-1: 本地账户
```gherkin
Given Desktop 应用首次启动
When 用户打开应用
Then 应自动创建/加载本地账户
And 可获取当前用户信息 (account:me:get)
```

### AC-2: Profile 管理
```gherkin
Given 本地账户已存在
When 调用以下 channels:
  - account:profile:get
  - account:profile:update
  - account:profile:upload-avatar
  - account:profile:remove-avatar
Then 应正确管理用户资料
```

### AC-3: Subscription 信息
```gherkin
Given 本地账户
When 调用 account:subscription:get
Then 应返回 Desktop 本地订阅信息
And plan 为 'desktop-free'
```

---

## 📁 任务清单

### Task 9.1: 创建 AccountDesktopApplicationService

**文件**: `apps/desktop/src/main/modules/account/application/AccountDesktopApplicationService.ts`

```typescript
/**
 * Account Desktop Application Service
 * 
 * Desktop 离线模式的账户管理
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '@dailyuse/utils';
import type {
  AccountClientDTO,
  ProfileClientDTO,
  SubscriptionClientDTO,
} from '@dailyuse/contracts/account';

const logger = createLogger('AccountDesktopAppService');

interface LocalAccount {
  uuid: string;
  name: string;
  email: string;
  avatarPath?: string;
  createdAt: number;
  updatedAt: number;
  preferences: Record<string, unknown>;
}

export class AccountDesktopApplicationService {
  private localAccount: LocalAccount | null = null;
  private readonly accountFilePath: string;

  constructor() {
    // 用户数据目录
    const userDataPath = app.getPath('userData');
    this.accountFilePath = path.join(userDataPath, 'local-account.json');
    
    // 加载或创建本地账户
    this.loadOrCreateLocalAccount();
  }

  private loadOrCreateLocalAccount(): void {
    try {
      if (fs.existsSync(this.accountFilePath)) {
        const data = fs.readFileSync(this.accountFilePath, 'utf-8');
        this.localAccount = JSON.parse(data);
        logger.info('Local account loaded', { uuid: this.localAccount?.uuid });
      } else {
        this.createLocalAccount();
      }
    } catch (error) {
      logger.error('Failed to load local account', error);
      this.createLocalAccount();
    }
  }

  private createLocalAccount(): void {
    this.localAccount = {
      uuid: `local-${Date.now()}`,
      name: 'Desktop User',
      email: 'local@desktop.app',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      preferences: {},
    };
    this.saveLocalAccount();
    logger.info('Local account created', { uuid: this.localAccount.uuid });
  }

  private saveLocalAccount(): void {
    try {
      const dir = path.dirname(this.accountFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.accountFilePath, JSON.stringify(this.localAccount, null, 2));
    } catch (error) {
      logger.error('Failed to save local account', error);
    }
  }

  // ===== Current User (Me) =====

  async getCurrentUser(): Promise<AccountClientDTO> {
    if (!this.localAccount) {
      this.loadOrCreateLocalAccount();
    }

    return {
      uuid: this.localAccount!.uuid,
      email: this.localAccount!.email,
      name: this.localAccount!.name,
      avatarUrl: this.localAccount!.avatarPath,
      createdAt: new Date(this.localAccount!.createdAt).toISOString(),
      updatedAt: new Date(this.localAccount!.updatedAt).toISOString(),
      isLocal: true,
    };
  }

  async updateCurrentUser(request: {
    name?: string;
    email?: string;
  }): Promise<AccountClientDTO> {
    if (!this.localAccount) {
      throw new Error('No local account');
    }

    if (request.name) this.localAccount.name = request.name;
    if (request.email) this.localAccount.email = request.email;
    this.localAccount.updatedAt = Date.now();
    
    this.saveLocalAccount();
    
    return this.getCurrentUser();
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    // Desktop 离线模式不支持密码
    return { success: false, error: 'Password not supported in desktop offline mode' };
  }

  async changeEmail(newEmail: string): Promise<{ success: boolean; error?: string }> {
    if (!this.localAccount) {
      return { success: false, error: 'No local account' };
    }

    this.localAccount.email = newEmail;
    this.localAccount.updatedAt = Date.now();
    this.saveLocalAccount();

    return { success: true };
  }

  async verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Email verification not supported in desktop offline mode' };
  }

  async deleteCurrentUser(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Cannot delete local account' };
  }

  // ===== Profile =====

  async getProfile(uuid?: string): Promise<ProfileClientDTO | null> {
    if (!this.localAccount) {
      return null;
    }

    return {
      uuid: this.localAccount.uuid,
      name: this.localAccount.name,
      email: this.localAccount.email,
      avatarUrl: this.localAccount.avatarPath,
      bio: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: app.getLocale(),
    };
  }

  async updateProfile(uuid: string, request: {
    name?: string;
    bio?: string;
    timezone?: string;
    locale?: string;
  }): Promise<ProfileClientDTO> {
    if (!this.localAccount) {
      throw new Error('No local account');
    }

    if (request.name) this.localAccount.name = request.name;
    this.localAccount.updatedAt = Date.now();
    this.saveLocalAccount();

    return (await this.getProfile(uuid))!;
  }

  async uploadAvatar(uuid: string, imageData: Buffer | string): Promise<{ success: boolean; avatarUrl: string | null }> {
    try {
      const userDataPath = app.getPath('userData');
      const avatarsDir = path.join(userDataPath, 'avatars');
      
      if (!fs.existsSync(avatarsDir)) {
        fs.mkdirSync(avatarsDir, { recursive: true });
      }

      const avatarPath = path.join(avatarsDir, `${uuid}.png`);
      
      if (typeof imageData === 'string') {
        // Base64 数据
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(avatarPath, Buffer.from(base64Data, 'base64'));
      } else {
        fs.writeFileSync(avatarPath, imageData);
      }

      if (this.localAccount) {
        this.localAccount.avatarPath = avatarPath;
        this.localAccount.updatedAt = Date.now();
        this.saveLocalAccount();
      }

      return { success: true, avatarUrl: avatarPath };
    } catch (error) {
      logger.error('Failed to upload avatar', error);
      return { success: false, avatarUrl: null };
    }
  }

  async removeAvatar(uuid: string): Promise<{ success: boolean }> {
    try {
      if (this.localAccount?.avatarPath) {
        if (fs.existsSync(this.localAccount.avatarPath)) {
          fs.unlinkSync(this.localAccount.avatarPath);
        }
        this.localAccount.avatarPath = undefined;
        this.localAccount.updatedAt = Date.now();
        this.saveLocalAccount();
      }
      return { success: true };
    } catch (error) {
      logger.error('Failed to remove avatar', error);
      return { success: false };
    }
  }

  // ===== Subscription =====

  async getSubscription(): Promise<SubscriptionClientDTO> {
    return {
      plan: 'desktop-free',
      status: 'active',
      features: [
        'offline-mode',
        'local-storage',
        'unlimited-tasks',
        'unlimited-goals',
        'unlimited-schedules',
        'unlimited-reminders',
        'ai-basic', // 有限的 AI 功能
      ],
      expiresAt: null, // 永不过期
      autoRenew: false,
    };
  }

  async upgradePlan(planId: string): Promise<{ success: boolean; error?: string }> {
    return { 
      success: false, 
      error: 'Plan upgrade not available in desktop offline mode. Please use the web version.' 
    };
  }

  async cancelSubscription(): Promise<{ success: boolean; error?: string }> {
    return { 
      success: false, 
      error: 'Desktop free plan cannot be cancelled' 
    };
  }

  // ===== Preferences =====

  async getPreferences(): Promise<Record<string, unknown>> {
    return this.localAccount?.preferences || {};
  }

  async updatePreferences(updates: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.localAccount) {
      throw new Error('No local account');
    }

    this.localAccount.preferences = {
      ...this.localAccount.preferences,
      ...updates,
    };
    this.localAccount.updatedAt = Date.now();
    this.saveLocalAccount();

    return this.localAccount.preferences;
  }
}
```

### Task 9.2: 创建 Account IPC Handlers

**文件**: `apps/desktop/src/main/modules/account/ipc/account.ipc-handlers.ts`

```typescript
/**
 * Account IPC Handlers
 */

import { ipcMain } from 'electron';
import { AccountDesktopApplicationService } from '../application/AccountDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountIPC');

let appService: AccountDesktopApplicationService | null = null;

function getAppService(): AccountDesktopApplicationService {
  if (!appService) {
    appService = new AccountDesktopApplicationService();
  }
  return appService;
}

export function registerAccountIpcHandlers(): void {
  // ===== Me (Current User) =====

  ipcMain.handle('account:me:get', async () => {
    try {
      return await getAppService().getCurrentUser();
    } catch (error) {
      logger.error('Failed to get current user', error);
      throw error;
    }
  });

  ipcMain.handle('account:me:update', async (_, request) => {
    try {
      return await getAppService().updateCurrentUser(request);
    } catch (error) {
      logger.error('Failed to update current user', error);
      throw error;
    }
  });

  ipcMain.handle('account:me:change-password', async (_, oldPassword, newPassword) => {
    return getAppService().changePassword(oldPassword, newPassword);
  });

  ipcMain.handle('account:me:change-email', async (_, newEmail) => {
    return getAppService().changeEmail(newEmail);
  });

  ipcMain.handle('account:me:verify-email', async (_, token) => {
    return getAppService().verifyEmail(token);
  });

  ipcMain.handle('account:me:delete', async () => {
    return getAppService().deleteCurrentUser();
  });

  // ===== Profile =====

  ipcMain.handle('account:profile:get', async (_, uuid) => {
    try {
      return await getAppService().getProfile(uuid);
    } catch (error) {
      logger.error('Failed to get profile', error);
      throw error;
    }
  });

  ipcMain.handle('account:profile:update', async (_, uuid, request) => {
    try {
      return await getAppService().updateProfile(uuid, request);
    } catch (error) {
      logger.error('Failed to update profile', error);
      throw error;
    }
  });

  ipcMain.handle('account:profile:upload-avatar', async (_, uuid, imageData) => {
    try {
      return await getAppService().uploadAvatar(uuid, imageData);
    } catch (error) {
      logger.error('Failed to upload avatar', error);
      throw error;
    }
  });

  ipcMain.handle('account:profile:remove-avatar', async (_, uuid) => {
    try {
      return await getAppService().removeAvatar(uuid);
    } catch (error) {
      logger.error('Failed to remove avatar', error);
      throw error;
    }
  });

  // ===== Subscription =====

  ipcMain.handle('account:subscription:get', async () => {
    try {
      return await getAppService().getSubscription();
    } catch (error) {
      logger.error('Failed to get subscription', error);
      throw error;
    }
  });

  ipcMain.handle('account:subscription:upgrade', async (_, planId) => {
    return getAppService().upgradePlan(planId);
  });

  ipcMain.handle('account:subscription:cancel', async () => {
    return getAppService().cancelSubscription();
  });

  // ===== Preferences =====

  ipcMain.handle('account:preferences:get', async () => {
    try {
      return await getAppService().getPreferences();
    } catch (error) {
      logger.error('Failed to get preferences', error);
      throw error;
    }
  });

  ipcMain.handle('account:preferences:update', async (_, updates) => {
    try {
      return await getAppService().updatePreferences(updates);
    } catch (error) {
      logger.error('Failed to update preferences', error);
      throw error;
    }
  });

  logger.info('Account IPC handlers registered');
}
```

### Task 9.3: 创建模块入口

**文件**: `apps/desktop/src/main/modules/account/index.ts`

```typescript
/**
 * Account Module - Desktop Main Process
 */

import { registerAccountIpcHandlers } from './ipc/account.ipc-handlers';
import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountModule');

export function registerAccountModule(): void {
  InitializationManager.getInstance().registerModule(
    'account',
    InitializationPhase.CORE_SERVICES, // 账户是核心服务
    async () => {
      registerAccountIpcHandlers();
      logger.info('Account module initialized');
    }
  );
}

export { AccountDesktopApplicationService } from './application/AccountDesktopApplicationService';
```

---

## 📚 技术上下文

### Desktop 离线模式

Desktop 是离线优先应用，账户管理与 Web 版本不同：
- 使用本地文件存储账户信息
- 不支持密码认证（无服务器）
- Subscription 返回固定的 desktop-free 计划
- 预留在线同步接口（未来可实现）

### 数据存储位置

- Windows: `%APPDATA%\DailyUse\local-account.json`
- macOS: `~/Library/Application Support/DailyUse/local-account.json`
- Linux: `~/.config/DailyUse/local-account.json`

---

## 🔗 依赖关系

- **依赖**: STORY-001 (基础设施)
- **被依赖**: 
  - 所有需要 accountUuid 的模块

---

## 📝 备注

- 头像存储在本地文件系统，不上传到服务器
- 考虑添加数据导出功能
- 未来可添加可选的云同步功能
