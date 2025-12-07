# STORY-008: 认证与账户模块

## 📋 Story 概述

**Story ID**: STORY-008  
**Epic**: EPIC-002 (Desktop Application Development)  
**优先级**: P1 (核心价值)  
**预估工时**: 3-4 天  
**状态**: ✅ Completed  
**前置依赖**: STORY-002, STORY-003, STORY-004

---

## 🎯 用户故事

**作为** DailyUse 桌面用户  
**我希望** 能够登录我的账户并管理个人信息  
**以便于** 保护我的数据安全并在多设备间同步  

---

## 📋 验收标准

### 功能验收 - 认证

- [x] 登录页面（邮箱/密码）
- [x] 注册页面
- [x] 忘记密码流程
- [x] 自动登录（记住登录状态）
- [x] 登出功能
- [ ] 会话过期处理

### 功能验收 - 账户管理

- [x] 个人资料查看/编辑
- [x] 密码修改
- [ ] 头像上传
- [x] 账户安全设置

### 技术验收

- [x] Token 安全存储（Electron safeStorage）
- [ ] 离线认证支持
- [x] 会话刷新机制

---

## 📐 技术设计

### 文件结构（实际实现 - React TSX）

```
apps/desktop/src/
├── renderer/
│   ├── hooks/
│   │   ├── index.ts               # Hook exports
│   │   ├── useAuth.ts             # Auth hook (login, logout, register, password)
│   │   └── useAccount.ts          # Account hook (profile, preferences)
│   └── views/
│       ├── auth/
│       │   ├── index.ts                  # Auth views exports
│       │   ├── LoginView.tsx             # 登录页
│       │   ├── RegisterView.tsx          # 注册页
│       │   ├── ForgotPasswordView.tsx    # 忘记密码
│       │   ├── ResetPasswordView.tsx     # 重置密码
│       │   └── components/
│       └── account/
│           ├── index.ts              # Account views exports
│           ├── ProfileView.tsx       # 个人资料
│           ├── SecurityView.tsx      # 安全设置
│           └── components/
│       │       ├── LoginForm.vue       # 登录表单
│       │       └── RegisterForm.vue    # 注册表单
│       │
│       └── account/
│           ├── ProfileView.vue         # 个人资料
│           ├── SecurityView.vue        # 安全设置
│           └── components/
│               ├── AvatarUpload.vue    # 头像上传
│               └── PasswordChange.vue  # 密码修改
│
├── shared/
│   └── composables/
│       ├── useAuth.ts                  # 认证逻辑
│       └── useAccount.ts               # 账户逻辑
│
└── main/
    └── shared/
        └── auth/
            └── tokenStorage.ts         # 安全 Token 存储
```

### Token 安全存储

```typescript
// apps/desktop/src/main/shared/auth/tokenStorage.ts
import { safeStorage } from 'electron';
import Store from 'electron-store';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const store = new Store<{ encryptedToken?: string }>();

export class TokenStorage {
  private static instance: TokenStorage;
  
  static getInstance(): TokenStorage {
    if (!TokenStorage.instance) {
      TokenStorage.instance = new TokenStorage();
    }
    return TokenStorage.instance;
  }
  
  saveToken(tokenData: TokenData): void {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption not available');
    }
    
    const jsonData = JSON.stringify(tokenData);
    const encrypted = safeStorage.encryptString(jsonData);
    store.set('encryptedToken', encrypted.toString('base64'));
  }
  
  getToken(): TokenData | null {
    const encrypted = store.get('encryptedToken');
    if (!encrypted) return null;
    
    try {
      const buffer = Buffer.from(encrypted, 'base64');
      const decrypted = safeStorage.decryptString(buffer);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }
  
  clearToken(): void {
    store.delete('encryptedToken');
  }
  
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return Date.now() < token.expiresAt;
  }
}
```

### Auth Composable

```typescript
// useAuth.ts
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { AuthContainer } from '@dailyuse/infrastructure-client';
import {
  LoginService,
  RegisterService,
  LogoutService,
  RefreshTokenService,
} from '@dailyuse/application-client';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@dailyuse/contracts/auth';

export function useAuth() {
  const router = useRouter();
  const container = AuthContainer.getInstance();
  
  // State
  const isAuthenticated = ref(false);
  const currentUser = ref<AuthResponse['user'] | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Services
  const loginService = new LoginService(container);
  const registerService = new RegisterService(container);
  const logoutService = new LogoutService(container);
  
  // Actions
  async function login(credentials: LoginRequest) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await loginService.execute(credentials);
      
      // 保存 token (通过 IPC 调用主进程)
      await window.electronAPI.invoke('auth:saveToken', {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
      });
      
      isAuthenticated.value = true;
      currentUser.value = response.user;
      
      router.push('/dashboard');
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }
  
  async function logout() {
    try {
      await logoutService.execute();
    } finally {
      await window.electronAPI.invoke('auth:clearToken');
      isAuthenticated.value = false;
      currentUser.value = null;
      router.push('/login');
    }
  }
  
  async function checkAuth() {
    const isValid = await window.electronAPI.invoke<boolean>('auth:isTokenValid');
    isAuthenticated.value = isValid;
    
    if (isValid) {
      // 获取当前用户信息
      currentUser.value = await window.electronAPI.invoke('auth:getCurrentUser');
    }
  }
  
  return {
    isAuthenticated: computed(() => isAuthenticated.value),
    currentUser: computed(() => currentUser.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    login,
    logout,
    checkAuth,
  };
}
```

### 路由守卫

```typescript
// router/guards.ts
import type { Router } from 'vue-router';
import { useAuth } from '@/shared/composables/useAuth';

export function setupAuthGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const { isAuthenticated, checkAuth } = useAuth();
    
    // 检查认证状态
    await checkAuth();
    
    const publicPages = ['/login', '/register', '/forgot-password'];
    const authRequired = !publicPages.includes(to.path);
    
    if (authRequired && !isAuthenticated.value) {
      next('/login');
    } else if (!authRequired && isAuthenticated.value) {
      next('/dashboard');
    } else {
      next();
    }
  });
}
```

---

## 🏗️ 技术实现方案 (架构师补充)

> 本节由架构师 Agent 补充，提供详细技术实现指导

### 1. IPC 通道与服务映射

#### Auth 模块 (16 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `auth:login` | AuthService.login() | 用户名/邮箱密码登录 |
| `auth:loginWithEmail` | AuthService.loginWithEmail() | 邮箱验证码登录 |
| `auth:loginWithPhone` | AuthService.loginWithPhone() | 手机验证码登录 |
| `auth:register` | AuthService.register() | 用户注册 |
| `auth:logout` | AuthService.logout() | 退出登录 |
| `auth:refreshToken` | AuthService.refreshToken() | 刷新 Token |
| `auth:validateToken` | AuthService.validateToken() | 验证 Token 有效性 |
| `auth:changePassword` | AuthService.changePassword() | 修改密码 |
| `auth:resetPassword` | AuthService.resetPassword() | 重置密码 |
| `auth:sendVerificationCode` | AuthService.sendVerificationCode() | 发送验证码 |
| `auth:generateApiKey` | AuthService.generateApiKey() | 生成 API Key |
| `auth:revokeApiKey` | AuthService.revokeApiKey() | 撤销 API Key |
| `auth:listApiKeys` | AuthService.listApiKeys() | 列出 API Keys |
| `auth:listSessions` | AuthService.listSessions() | 列出活跃会话 |
| `auth:terminateSession` | AuthService.terminateSession() | 终止指定会话 |
| `auth:listDevices` | AuthService.listDevices() | 列出已登录设备 |

#### Account 模块 (20 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `account:create` | AccountService.create() | 创建账户 |
| `account:get` | AccountService.get() | 获取账户信息 |
| `account:list` | AccountService.list() | 列出账户 |
| `account:delete` | AccountService.delete() | 删除账户 |
| `account:profile:get` | AccountService.getProfile() | 获取个人资料 |
| `account:profile:update` | AccountService.updateProfile() | 更新个人资料 |
| `account:preferences:get` | AccountService.getPreferences() | 获取偏好设置 |
| `account:preferences:update` | AccountService.updatePreferences() | 更新偏好设置 |
| `account:avatar:upload` | AccountService.uploadAvatar() | 上传头像 |
| `account:avatar:delete` | AccountService.deleteAvatar() | 删除头像 |
| `account:email:add` | AccountService.addEmail() | 添加邮箱 |
| `account:email:verify` | AccountService.verifyEmail() | 验证邮箱 |
| `account:email:remove` | AccountService.removeEmail() | 移除邮箱 |
| `account:email:setPrimary` | AccountService.setPrimaryEmail() | 设为主邮箱 |
| `account:phone:add` | AccountService.addPhone() | 添加手机 |
| `account:phone:verify` | AccountService.verifyPhone() | 验证手机 |
| `account:phone:remove` | AccountService.removePhone() | 移除手机 |
| `account:subscription:get` | AccountService.getSubscription() | 获取订阅信息 |
| `account:subscription:update` | AccountService.updateSubscription() | 更新订阅 |
| `account:subscription:cancel` | AccountService.cancelSubscription() | 取消订阅 |

### 2. Token 安全存储架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process                          │
├─────────────────────────────────────────────────────────────┤
│  useAuth.ts                                                  │
│  ├── login() → electronAPI.invoke('auth:login', credentials) │
│  ├── logout() → electronAPI.invoke('auth:logout')           │
│  └── checkAuth() → electronAPI.invoke('auth:validateToken') │
└────────────────────────┬────────────────────────────────────┘
                         │ IPC
┌────────────────────────▼────────────────────────────────────┐
│                    Main Process                              │
├─────────────────────────────────────────────────────────────┤
│  auth-ipc.handler.ts                                         │
│  └── TokenStorage (使用 safeStorage API)                     │
│      ├── safeStorage.encryptString(token)                   │
│      ├── safeStorage.decryptString(encrypted)               │
│      └── 降级: 加密文件存储                                   │
└─────────────────────────────────────────────────────────────┘
```

#### TokenStorage 实现

```typescript
// apps/desktop/src/main/services/token-storage.ts
import { safeStorage } from 'electron';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class TokenStorage {
  private readonly tokenPath: string;

  constructor() {
    this.tokenPath = path.join(app.getPath('userData'), 'auth.enc');
  }

  async save(tokens: TokenData): Promise<void> {
    const json = JSON.stringify(tokens);
    
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(json);
      await fs.promises.writeFile(this.tokenPath, encrypted);
    } else {
      // 降级: 使用 AES 加密 (需要 machine-id 作为 key)
      const encrypted = this.fallbackEncrypt(json);
      await fs.promises.writeFile(this.tokenPath + '.fallback', encrypted);
    }
  }

  async load(): Promise<TokenData | null> {
    try {
      if (safeStorage.isEncryptionAvailable() && 
          fs.existsSync(this.tokenPath)) {
        const encrypted = await fs.promises.readFile(this.tokenPath);
        const json = safeStorage.decryptString(encrypted);
        return JSON.parse(json);
      }
      
      // 降级读取
      const fallbackPath = this.tokenPath + '.fallback';
      if (fs.existsSync(fallbackPath)) {
        const encrypted = await fs.promises.readFile(fallbackPath, 'utf-8');
        const json = this.fallbackDecrypt(encrypted);
        return JSON.parse(json);
      }
      
      return null;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await fs.promises.unlink(this.tokenPath);
      await fs.promises.unlink(this.tokenPath + '.fallback');
    } catch {
      // 文件不存在，忽略
    }
  }

  private fallbackEncrypt(data: string): string {
    // 使用 crypto 模块 + machine-id 实现
    // ... 降级加密实现
  }

  private fallbackDecrypt(data: string): string {
    // 降级解密实现
  }
}
```

### 3. Renderer 侧 Composables

#### useAuth.ts

```typescript
// apps/desktop/src/renderer/composables/useAuth.ts
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { defineStore } from 'pinia';

interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  const isAuthenticated = computed(() => user.value !== null);
  
  async function login(email: string, password: string) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const result = await window.electronAPI.invoke<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>('auth:login', { email, password });
      
      user.value = result.user;
      // Token 由 main process 安全存储，renderer 只保存 user 信息
      
      return { success: true };
    } catch (e) {
      error.value = (e as Error).message;
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function loginWithCode(type: 'email' | 'phone', target: string, code: string) {
    const channel = type === 'email' ? 'auth:loginWithEmail' : 'auth:loginWithPhone';
    isLoading.value = true;
    
    try {
      const result = await window.electronAPI.invoke(channel, { [type]: target, code });
      user.value = result.user;
      return { success: true };
    } catch (e) {
      error.value = (e as Error).message;
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function logout() {
    try {
      await window.electronAPI.invoke('auth:logout');
    } finally {
      user.value = null;
    }
  }
  
  async function checkAuth() {
    try {
      const result = await window.electronAPI.invoke<{ valid: boolean; user: User }>('auth:validateToken');
      if (result.valid) {
        user.value = result.user;
      }
      return result.valid;
    } catch {
      return false;
    }
  }
  
  async function refreshToken() {
    try {
      await window.electronAPI.invoke('auth:refreshToken');
      return true;
    } catch {
      user.value = null;
      return false;
    }
  }
  
  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    loginWithCode,
    logout,
    checkAuth,
    refreshToken,
  };
});

// Composable wrapper for components
export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();
  
  async function loginAndRedirect(email: string, password: string, redirect = '/dashboard') {
    const result = await store.login(email, password);
    if (result.success) {
      router.push(redirect);
    }
    return result;
  }
  
  async function logoutAndRedirect() {
    await store.logout();
    router.push('/login');
  }
  
  return {
    ...store,
    loginAndRedirect,
    logoutAndRedirect,
  };
}
```

#### useAccount.ts

```typescript
// apps/desktop/src/renderer/composables/useAccount.ts
import { ref, computed } from 'vue';

interface Profile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  timezone: string;
  language: string;
}

interface Preferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  emailNotifications: boolean;
  weekStartDay: 0 | 1;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

export function useAccount() {
  const profile = ref<Profile | null>(null);
  const preferences = ref<Preferences | null>(null);
  const isLoading = ref(false);
  
  async function loadProfile() {
    isLoading.value = true;
    try {
      profile.value = await window.electronAPI.invoke<Profile>('account:profile:get');
    } finally {
      isLoading.value = false;
    }
  }
  
  async function updateProfile(updates: Partial<Profile>) {
    isLoading.value = true;
    try {
      profile.value = await window.electronAPI.invoke<Profile>('account:profile:update', updates);
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function uploadAvatar(filePath: string) {
    // 从 main process 读取文件并上传
    const result = await window.electronAPI.invoke<{ url: string }>('account:avatar:upload', { filePath });
    if (profile.value) {
      profile.value.avatar = result.url;
    }
    return result;
  }
  
  async function loadPreferences() {
    preferences.value = await window.electronAPI.invoke<Preferences>('account:preferences:get');
  }
  
  async function updatePreferences(updates: Partial<Preferences>) {
    preferences.value = await window.electronAPI.invoke<Preferences>('account:preferences:update', updates);
  }
  
  async function changePassword(currentPassword: string, newPassword: string) {
    return window.electronAPI.invoke('auth:changePassword', { currentPassword, newPassword });
  }
  
  return {
    profile,
    preferences,
    isLoading,
    loadProfile,
    updateProfile,
    uploadAvatar,
    loadPreferences,
    updatePreferences,
    changePassword,
  };
}
```

### 4. 自动登录与会话管理

```typescript
// apps/desktop/src/renderer/router/guards.ts
import { useAuthStore } from '@/composables/useAuth';

export async function setupAuthGuard(router: Router) {
  const authStore = useAuthStore();
  
  // 应用启动时检查认证状态
  let authChecked = false;
  
  router.beforeEach(async (to, from, next) => {
    // 首次加载检查 token
    if (!authChecked) {
      authChecked = true;
      await authStore.checkAuth();
    }
    
    const requiresAuth = to.meta.requiresAuth !== false;
    const isAuthPage = ['/login', '/register', '/forgot-password'].includes(to.path);
    
    if (requiresAuth && !authStore.isAuthenticated) {
      // 未登录，重定向到登录页
      next({ path: '/login', query: { redirect: to.fullPath } });
    } else if (isAuthPage && authStore.isAuthenticated) {
      // 已登录，离开登录页
      next('/dashboard');
    } else {
      next();
    }
  });
}

// Token 自动刷新 (可选: 使用 axios interceptor)
// apps/desktop/src/renderer/plugins/auth-refresh.ts
export function setupTokenRefresh() {
  let refreshTimer: ReturnType<typeof setInterval> | null = null;
  const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 分钟
  
  const authStore = useAuthStore();
  
  watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
      if (isAuth) {
        refreshTimer = setInterval(async () => {
          const success = await authStore.refreshToken();
          if (!success) {
            // Token 刷新失败，可能需要重新登录
            clearInterval(refreshTimer!);
          }
        }, REFRESH_INTERVAL);
      } else {
        if (refreshTimer) {
          clearInterval(refreshTimer);
          refreshTimer = null;
        }
      }
    },
    { immediate: true }
  );
}
```

### 5. 安全考虑

| 安全问题 | 解决方案 |
|---------|---------|
| Token 存储 | 使用 Electron safeStorage API |
| XSS 攻击 | Token 不暴露给 Renderer (仅存 Main) |
| CSRF | API 使用 Token 认证，无 Cookie |
| 会话劫持 | 支持设备管理 + 会话终止 |
| 密码泄露 | 密码在 Main 进程加密传输 |

### 6. 错误码映射

```typescript
// packages/contracts/src/auth/auth-errors.ts
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'AUTH_001',
  TOKEN_EXPIRED: 'AUTH_002',
  TOKEN_INVALID: 'AUTH_003',
  ACCOUNT_LOCKED: 'AUTH_004',
  EMAIL_NOT_VERIFIED: 'AUTH_005',
  TOO_MANY_ATTEMPTS: 'AUTH_006',
  WEAK_PASSWORD: 'AUTH_007',
  EMAIL_IN_USE: 'AUTH_008',
} as const;

// Renderer 侧错误处理
function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    AUTH_001: '邮箱或密码错误',
    AUTH_002: '登录已过期，请重新登录',
    AUTH_003: '认证无效',
    AUTH_004: '账户已锁定，请联系客服',
    AUTH_005: '请先验证邮箱',
    AUTH_006: '尝试次数过多，请稍后再试',
    AUTH_007: '密码强度不足',
    AUTH_008: '邮箱已被使用',
  };
  return messages[code] || '未知错误';
}
```

---

## 📝 Task 分解

### Task 8.1: 登录/注册流程 (1.5 天)

**子任务**:
- [ ] 创建 LoginView.vue
- [ ] 创建 RegisterView.vue
- [ ] 创建 ForgotPasswordView.vue
- [ ] 实现 useAuth.ts composable
- [ ] 配置路由守卫

### Task 8.2: Token 安全存储 (1 天)

**子任务**:
- [ ] 实现 TokenStorage (使用 safeStorage)
- [ ] 注册 auth IPC handlers
- [ ] 实现自动登录检查
- [ ] 实现会话刷新

### Task 8.3: 账户管理 (1-1.5 天)

**子任务**:
- [ ] 创建 ProfileView.vue
- [ ] 创建 SecurityView.vue
- [ ] 实现 AvatarUpload.vue (本地文件选择)
- [ ] 实现 PasswordChange.vue
- [ ] 实现 useAccount.ts composable

---

## 🔗 依赖关系

### 前置依赖

- ⏳ STORY-002/003/004 (基础架构)

### 后续影响

- 🔜 所有需要认证的功能

---

## ⚠️ 风险 & 缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| safeStorage 不可用 | 低 | 高 | 降级到加密文件存储 |
| Token 泄露 | 低 | 高 | 使用 safeStorage + 短期 Token |

---

## ✅ 完成定义 (DoD)

- [ ] 登录/注册正常工作
- [ ] Token 安全存储
- [ ] 自动登录功能
- [ ] 会话过期处理
- [ ] 代码已提交并通过 Review

---

**创建日期**: 2025-12-06  
**负责人**: Dev Agent  
**预计开始**: Phase 2 (Week 4-5)
