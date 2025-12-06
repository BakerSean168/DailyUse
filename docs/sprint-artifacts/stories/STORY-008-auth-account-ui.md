# STORY-008: 认证与账户模块

## 📋 Story 概述

**Story ID**: STORY-008  
**Epic**: EPIC-002 (Desktop Application Development)  
**优先级**: P1 (核心价值)  
**预估工时**: 3-4 天  
**状态**: 🔵 Ready for Dev  
**前置依赖**: STORY-002, STORY-003, STORY-004

---

## 🎯 用户故事

**作为** DailyUse 桌面用户  
**我希望** 能够登录我的账户并管理个人信息  
**以便于** 保护我的数据安全并在多设备间同步  

---

## 📋 验收标准

### 功能验收 - 认证

- [ ] 登录页面（邮箱/密码）
- [ ] 注册页面
- [ ] 忘记密码流程
- [ ] 自动登录（记住登录状态）
- [ ] 登出功能
- [ ] 会话过期处理

### 功能验收 - 账户管理

- [ ] 个人资料查看/编辑
- [ ] 密码修改
- [ ] 头像上传
- [ ] 账户安全设置

### 技术验收

- [ ] Token 安全存储（Electron safeStorage）
- [ ] 离线认证支持
- [ ] 会话刷新机制

---

## 📐 技术设计

### 文件结构

```
apps/desktop/src/
├── renderer/
│   └── views/
│       ├── auth/
│       │   ├── LoginView.vue           # 登录页
│       │   ├── RegisterView.vue        # 注册页
│       │   ├── ForgotPasswordView.vue  # 忘记密码
│       │   └── components/
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
