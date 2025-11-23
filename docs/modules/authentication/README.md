---
tags:
  - module
  - authentication
  - security
  - business-logic
description: 认证授权模块 - JWT认证、角色权限管理的完整实现文档
created: 2025-11-23T17:20:00
updated: 2025-11-23T17:20:00
---

# 🔐 Authentication Module - 认证授权模块

> 基于JWT的认证授权系统，支持角色权限管理和会话控制

## 📋 目录

- [模块概述](#模块概述)
- [核心概念](#核心概念)
- [认证流程](#认证流程)
- [API接口](#api接口)
- [使用示例](#使用示例)
- [安全策略](#安全策略)
- [权限控制](#权限控制)

---

## 🎯 模块概述

### 功能简介

认证授权模块提供完整的用户身份管理：

- 🔑 用户注册与登录
- 🎫 JWT令牌管理（Access Token + Refresh Token）
- 🍪 HttpOnly Cookie（安全存储）
- 👥 角色与权限管理（RBAC）
- 🔒 会话控制与踢出
- 📱 多设备登录管理
- 🔐 密码加密与重置
- 🛡️ 防暴力破解

### 技术特性

- **JWT认证**: 无状态、可扩展
- **双令牌机制**: Access Token（短期）+ Refresh Token（长期）
- **HttpOnly Cookie**: 防止XSS攻击
- **RBAC权限**: 角色-权限映射
- **Redis会话**: 快速会话查询
- **BCrypt加密**: 密码安全存储

---

## 💡 核心概念

### 令牌类型

```typescript
enum TokenType {
  ACCESS = 'access',   // 访问令牌（15分钟）
  REFRESH = 'refresh', // 刷新令牌（7天）
}
```

### 用户角色

```typescript
enum UserRole {
  USER = 'user',       // 普通用户
  ADMIN = 'admin',     // 管理员
  SUPER_ADMIN = 'super_admin', // 超级管理员
}
```

### 权限定义

```typescript
enum Permission {
  // 目标权限
  GOAL_READ = 'goal:read',
  GOAL_CREATE = 'goal:create',
  GOAL_UPDATE = 'goal:update',
  GOAL_DELETE = 'goal:delete',
  
  // 任务权限
  TASK_READ = 'task:read',
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  
  // 用户管理权限
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // 系统权限
  SYSTEM_SETTINGS = 'system:settings',
}
```

---

## 🔄 认证流程

### 注册流程

```
用户 → 提交注册信息 → 验证邮箱/手机 → 创建账户 → 返回令牌
```

### 登录流程

```
用户 → 输入凭证 → 验证凭证 → 生成JWT → 设置Cookie → 返回用户信息
```

### 令牌刷新流程

```
客户端 → 发送Refresh Token → 验证令牌 → 生成新Access Token → 更新Cookie
```

### 登出流程

```
用户 → 请求登出 → 清除Cookie → 加入黑名单 → 销毁会话
```

---

## 🏗 领域模型

### 聚合根: UserAggregate

```typescript
// apps/api/src/auth/domain/aggregates/user.aggregate.ts
export class UserAggregate {
  private constructor(
    public readonly id: string,
    private _email: Email,
    private _passwordHash: string,
    private _name: string,
    private _avatar: string | null,
    private _role: UserRole,
    private _permissions: Permission[],
    private _isActive: boolean,
    private _isEmailVerified: boolean,
    private _lastLoginAt: Date | null,
    private _loginAttempts: number,
    private _lockedUntil: Date | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private readonly events: DomainEvent[] = []
  ) {}

  static create(props: CreateUserProps): UserAggregate {
    const user = new UserAggregate(
      uuidv4(),
      Email.create(props.email),
      '', // 密码哈希将在创建后设置
      props.name,
      null,
      UserRole.USER,
      this.getDefaultPermissions(UserRole.USER),
      true,
      false,
      null,
      0,
      null,
      new Date(),
      new Date()
    );

    user.addEvent(new UserCreatedEvent(user.toPlainObject()));
    return user;
  }

  // Getters
  get email(): Email { return this._email; }
  get name(): string { return this._name; }
  get role(): UserRole { return this._role; }
  get isActive(): boolean { return this._isActive; }
  get isLocked(): boolean {
    return this._lockedUntil !== null && new Date() < this._lockedUntil;
  }

  // 业务方法
  async setPassword(password: string): Promise<void> {
    const hash = await bcrypt.hash(password, 10);
    this._passwordHash = hash;
    this._updatedAt = new Date();
  }

  async verifyPassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this._passwordHash);
  }

  recordLoginAttempt(): void {
    this._loginAttempts++;
    
    // 5次失败后锁定30分钟
    if (this._loginAttempts >= 5) {
      this._lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      this.addEvent(new UserLockedEvent({
        userId: this.id,
        lockedUntil: this._lockedUntil,
        reason: 'Too many failed login attempts',
      }));
    }
    
    this._updatedAt = new Date();
  }

  resetLoginAttempts(): void {
    this._loginAttempts = 0;
    this._lockedUntil = null;
    this._updatedAt = new Date();
  }

  recordLogin(): void {
    this._lastLoginAt = new Date();
    this.resetLoginAttempts();
    
    this.addEvent(new UserLoggedInEvent({
      userId: this.id,
      timestamp: this._lastLoginAt,
    }));
  }

  verifyEmail(): void {
    this._isEmailVerified = true;
    this._updatedAt = new Date();
    
    this.addEvent(new UserEmailVerifiedEvent({
      userId: this.id,
    }));
  }

  updateRole(role: UserRole): void {
    this._role = role;
    this._permissions = UserAggregate.getDefaultPermissions(role);
    this._updatedAt = new Date();
    
    this.addEvent(new UserRoleChangedEvent({
      userId: this.id,
      newRole: role,
    }));
  }

  hasPermission(permission: Permission): boolean {
    return this._permissions.includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  private static getDefaultPermissions(role: UserRole): Permission[] {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return Object.values(Permission);
      
      case UserRole.ADMIN:
        return [
          Permission.GOAL_READ,
          Permission.GOAL_CREATE,
          Permission.GOAL_UPDATE,
          Permission.TASK_READ,
          Permission.TASK_CREATE,
          Permission.TASK_UPDATE,
          Permission.USER_READ,
        ];
      
      case UserRole.USER:
      default:
        return [
          Permission.GOAL_READ,
          Permission.GOAL_CREATE,
          Permission.GOAL_UPDATE,
          Permission.TASK_READ,
          Permission.TASK_CREATE,
          Permission.TASK_UPDATE,
        ];
    }
  }
}
```

### 值对象: Email

```typescript
// apps/api/src/auth/domain/value-objects/email.vo.ts
export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(public readonly value: string) {}

  static create(email: string): Email {
    const normalized = email.toLowerCase().trim();
    
    if (!this.EMAIL_REGEX.test(normalized)) {
      throw new Error('Invalid email format');
    }
    
    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

---

## 🔌 API接口

### 基础路径

```
/api/auth
```

### 端点列表

#### 1. 用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "张三"
}
```

**响应** (201 Created):

```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "张三",
    "role": "user",
    "isEmailVerified": false,
    "createdAt": "2025-11-23T17:20:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**响应** (200 OK):

```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "张三",
    "role": "user",
    "permissions": ["goal:read", "goal:create", "task:read"],
    "lastLoginAt": "2025-11-23T17:20:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**设置Cookie**:

```
Set-Cookie: accessToken=...; HttpOnly; Secure; SameSite=Strict; Max-Age=900
Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

#### 3. 刷新令牌

```http
POST /api/auth/refresh
Cookie: refreshToken=...
```

**响应** (200 OK):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 4. 登出

```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

**响应** (204 No Content)

#### 5. 获取当前用户

```http
GET /api/auth/me
Authorization: Bearer {accessToken}
```

**响应** (200 OK):

```json
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "张三",
  "avatar": "https://cdn.example.com/avatars/user-123.jpg",
  "role": "user",
  "permissions": ["goal:read", "goal:create"],
  "isEmailVerified": true,
  "createdAt": "2025-11-23T17:20:00.000Z"
}
```

#### 6. 修改密码

```http
POST /api/auth/change-password
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

#### 7. 重置密码（忘记密码）

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**响应** (200 OK):

```json
{
  "message": "如果该邮箱存在，将收到密码重置邮件"
}
```

#### 8. 验证邮箱

```http
GET /api/auth/verify-email?token={verificationToken}
```

---

## 💻 使用示例

### 前端 - Vue 3

**登录表单组件**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const form = ref({
  email: '',
  password: '',
});

const isLoading = ref(false);
const error = ref('');

async function handleLogin() {
  error.value = '';
  isLoading.value = true;

  try {
    await authStore.login(form.value);
    router.push('/dashboard');
  } catch (err: any) {
    error.value = err.message || '登录失败，请检查邮箱和密码';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <v-card max-width="400" class="mx-auto">
    <v-card-title>登录</v-card-title>
    
    <v-card-text>
      <v-form @submit.prevent="handleLogin">
        <v-text-field
          v-model="form.email"
          label="邮箱"
          type="email"
          required
          :rules="[v => !!v || '请输入邮箱']"
        />
        
        <v-text-field
          v-model="form.password"
          label="密码"
          type="password"
          required
          :rules="[v => !!v || '请输入密码']"
        />
        
        <v-alert v-if="error" type="error" class="mb-3">
          {{ error }}
        </v-alert>
        
        <v-btn
          type="submit"
          color="primary"
          block
          :loading="isLoading"
        >
          登录
        </v-btn>
      </v-form>
    </v-card-text>
    
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="$router.push('/register')">
        注册账号
      </v-btn>
      <v-btn variant="text" @click="$router.push('/forgot-password')">
        忘记密码
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
```

### Pinia Store

```typescript
// apps/web/src/stores/auth.store.ts
import { defineStore } from 'pinia';
import type { User, LoginDto, RegisterDto } from '@dailyuse/contracts';
import { authApi } from '@/api/auth.api';
import { router } from '@/router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    accessToken: null as string | null,
    isAuthenticated: false,
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'admin' || state.user?.role === 'super_admin',
    
    hasPermission: (state) => (permission: string) => {
      return state.user?.permissions.includes(permission) ?? false;
    },
  },

  actions: {
    async register(dto: RegisterDto) {
      const response = await authApi.register(dto);
      this.setAuth(response);
    },

    async login(dto: LoginDto) {
      const response = await authApi.login(dto);
      this.setAuth(response);
    },

    async logout() {
      try {
        await authApi.logout();
      } finally {
        this.clearAuth();
        router.push('/login');
      }
    },

    async fetchCurrentUser() {
      try {
        const user = await authApi.getCurrentUser();
        this.user = user;
        this.isAuthenticated = true;
      } catch (error) {
        this.clearAuth();
      }
    },

    async refreshToken() {
      try {
        const response = await authApi.refreshToken();
        this.accessToken = response.accessToken;
      } catch (error) {
        this.clearAuth();
        router.push('/login');
      }
    },

    setAuth(data: { user: User; accessToken: string }) {
      this.user = data.user;
      this.accessToken = data.accessToken;
      this.isAuthenticated = true;
      
      // Cookie由服务端自动设置
    },

    clearAuth() {
      this.user = null;
      this.accessToken = null;
      this.isAuthenticated = false;
    },

    checkPermission(permission: string): boolean {
      return this.hasPermission(permission);
    },

    checkAnyPermission(permissions: string[]): boolean {
      return permissions.some(p => this.hasPermission(p));
    },

    checkAllPermissions(permissions: string[]): boolean {
      return permissions.every(p => this.hasPermission(p));
    },
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'auth',
        storage: localStorage,
        paths: ['user', 'isAuthenticated'],
      },
    ],
  },
});
```

### 路由守卫

```typescript
// apps/web/src/router/guards.ts
import { useAuthStore } from '@/stores/auth.store';

export function setupAuthGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();

    // 公开路由
    const publicRoutes = ['/login', '/register', '/forgot-password'];
    if (publicRoutes.includes(to.path)) {
      return next();
    }

    // 检查认证状态
    if (!authStore.isAuthenticated) {
      return next('/login');
    }

    // 检查权限
    const requiredPermissions = to.meta.permissions as string[];
    if (requiredPermissions) {
      const hasPermission = authStore.checkAllPermissions(requiredPermissions);
      if (!hasPermission) {
        return next('/403');
      }
    }

    // 检查角色
    const requiredRole = to.meta.role as string;
    if (requiredRole && authStore.user?.role !== requiredRole) {
      return next('/403');
    }

    next();
  });
}
```

### API拦截器

```typescript
// apps/web/src/api/interceptors.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // 发送Cookie
});

// 请求拦截器 - 添加Token
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore();
    const originalRequest = error.config;

    // Token过期，尝试刷新
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await authStore.refreshToken();
        // 重试原始请求
        return api(originalRequest);
      } catch (refreshError) {
        // 刷新失败，跳转登录
        authStore.clearAuth();
        router.push('/login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 🛡️ 安全策略

### 密码策略

```typescript
export class PasswordPolicy {
  private static readonly MIN_LENGTH = 8;
  private static readonly REQUIRE_UPPERCASE = true;
  private static readonly REQUIRE_LOWERCASE = true;
  private static readonly REQUIRE_DIGIT = true;
  private static readonly REQUIRE_SPECIAL_CHAR = true;

  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.MIN_LENGTH) {
      errors.push(`密码长度至少${this.MIN_LENGTH}个字符`);
    }

    if (this.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }

    if (this.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }

    if (this.REQUIRE_DIGIT && !/\d/.test(password)) {
      errors.push('密码必须包含数字');
    }

    if (this.REQUIRE_SPECIAL_CHAR && !/[!@#$%^&*]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

### 防暴力破解

```typescript
// Redis记录登录尝试
@Injectable()
export class BruteForceProtection {
  constructor(private readonly redis: Redis) {}

  async recordAttempt(email: string): Promise<void> {
    const key = `login_attempts:${email}`;
    const attempts = await this.redis.incr(key);
    
    if (attempts === 1) {
      await this.redis.expire(key, 3600); // 1小时后重置
    }

    if (attempts >= 5) {
      throw new TooManyAttemptsException('账号已被锁定，请30分钟后重试');
    }
  }

  async resetAttempts(email: string): Promise<void> {
    await this.redis.del(`login_attempts:${email}`);
  }
}
```

---

## 🔑 权限控制

### 装饰器

```typescript
// 权限检查装饰器
export function RequirePermissions(...permissions: Permission[]) {
  return applyDecorators(
    SetMetadata('permissions', permissions),
    UseGuards(PermissionsGuard)
  );
}

// 角色检查装饰器
export function RequireRole(...roles: UserRole[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(RolesGuard)
  );
}

// 使用示例
@Controller('admin')
@RequireRole(UserRole.ADMIN)
export class AdminController {
  @Get('users')
  @RequirePermissions(Permission.USER_READ)
  async getUsers() {
    // ...
  }

  @Delete('users/:id')
  @RequirePermissions(Permission.USER_DELETE)
  async deleteUser(@Param('id') id: string) {
    // ...
  }
}
```

---

## 📚 相关文档

- [[concepts/event-driven|事件驱动架构]]
- [[guides/development/security|安全最佳实践]]
- [[reference/api/authentication|认证API参考]]

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0
