# Token 认证的循环拦截问题与 X-Skip-Auth 解决方案

## 📚 目录

- [基础概念](#基础概念)
- [使用指南](#使用指南)
- [实战经验](#实战经验)
- [经验总结](#经验总结)
- [信息参考](#信息参考)

---

## 基础概念

### 什么是 Token 认证？

Token 认证是一种无状态的认证机制，常用于现代 Web 应用中：

```
┌─────────┐                        ┌─────────┐
│ Client  │  1. Login Request      │ Server  │
│         │ ─────────────────────> │         │
│         │                        │         │
│         │  2. Access Token +     │         │
│         │     Refresh Token      │         │
│         │ <───────────────────── │         │
│         │                        │         │
│         │  3. API Request +      │         │
│         │     Access Token       │         │
│         │ ─────────────────────> │         │
│         │                        │         │
│         │  4. Response           │         │
│         │ <───────────────────── │         │
└─────────┘                        └─────────┘
```

**核心组件：**

1. **Access Token（访问令牌）**
   - 短期有效（通常 1 小时）
   - 用于日常 API 请求
   - 存储在内存或 localStorage
   - 格式：JWT (JSON Web Token)

2. **Refresh Token（刷新令牌）**
   - 长期有效（通常 7-30 天）
   - 仅用于刷新 Access Token
   - 更严格的安全要求
   - 格式：JWT 或随机字符串

### JWT 的结构

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50VXVpZCI6IjEyMyIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NjI4MzczMjEsImV4cCI6MTc2Mjg0MDkyMX0.cupOnGEwN-kaqlcyWc8fIYnQM1rVS2quBphNC4PSlKk

├─ Header (算法和类型)
│  { "alg": "HS256", "typ": "JWT" }
│
├─ Payload (声明/数据)
│  {
│    "accountUuid": "123",
│    "type": "access",
│    "iat": 1762837321,  // 签发时间
│    "exp": 1762840921   // 过期时间
│  }
│
└─ Signature (签名)
   HMAC-SHA256(header + payload, secret)
```

### Token 刷新流程

```
┌─────────┐                        ┌─────────┐
│ Client  │                        │ Server  │
└────┬────┘                        └────┬────┘
     │                                  │
     │  1. API Request (Access Token)  │
     ├─────────────────────────────────>│
     │                                  │
     │  2. 401 Unauthorized (过期)      │
     │<─────────────────────────────────┤
     │                                  │
     │  3. Refresh Request              │
     │     POST /auth/refresh           │
     │     Body: { refreshToken }       │
     │     Header: X-Skip-Auth: true    │
     ├─────────────────────────────────>│
     │                                  │
     │     ↓ 后端处理流程 ↓              │
     │     - 不经过 authMiddleware      │
     │     - 从 body 提取 refreshToken  │
     │     - 查询数据库 Session         │
     │     - 验证 Session 有效性        │
     │     - 生成新的 Access Token      │
     │     - 生成新的 Refresh Token     │
     │     - 更新 Session 记录          │
     │                                  │
     │  4. New Access Token +           │
     │     New Refresh Token            │
     │<─────────────────────────────────┤
     │                                  │
     │  5. Retry Original Request       │
     │     (New Access Token)           │
     ├─────────────────────────────────>│
     │                                  │
     │  6. Success Response             │
     │<─────────────────────────────────┤
     │                                  │
```

**⚠️ 重要说明：**

1. **Refresh Token 不在 Authorization Header 中**
   - ✅ 正确：放在请求体 `{ refreshToken: "..." }`
   - ❌ 错误：`Authorization: Bearer <refreshToken>`

2. **Refresh 端点不需要 authMiddleware**
   - 原因：此时 Access Token 已过期，无法通过认证
   - 通过请求体中的 Refresh Token 进行认证

3. **后端通过 Refresh Token 查找 Session**
   - 在数据库中查找对应的 Session 记录
   - 验证 Session 状态（未过期、未撤销）
   - 验证通过后生成新的 Tokens

4. **常见错误：Refresh 请求返回 401**
   - 原因 1：后端没有注册 `/auth/refresh` 路由 → 404/401
   - 原因 2：Refresh Token 已过期 → 需要重新登录
   - 原因 3：Session 已被撤销（如全设备登出）→ 需要重新登录
   - 原因 4：CORS 配置缺少 `X-Skip-Auth` → Preflight 失败

---

## 使用指南

### 问题：Token 刷新的循环拦截陷阱

#### 场景描述

在 SPA（单页应用）中，通常使用 **HTTP 拦截器**（Axios Interceptor）来：

1. **请求拦截器**：自动在每个请求中添加 `Authorization: Bearer <access_token>`
2. **响应拦截器**：检测 401 错误，自动刷新 token 并重试

**问题出现：**

```typescript
// ❌ 危险：会导致无限循环！
axios.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 🔴 问题：这个刷新请求也会被请求拦截器拦截！
      const newToken = await axios.post('/auth/refresh', {
        refreshToken: getRefreshToken(),
      });
      // ...重试逻辑
    }
  },
);
```

**循环流程：**

```
1. 用户请求 /api/goals (Access Token 过期)
   ↓
2. 响应 401，触发 Token 刷新
   ↓
3. 发送刷新请求 POST /auth/refresh
   ↓
4. 请求拦截器发现有 Access Token（过期的）
   ↓
5. 自动添加 Authorization: Bearer <expired_token>
   ↓
6. 服务端验证 Token 失败，返回 401
   ↓
7. 响应拦截器再次触发刷新...
   ↓
8. 🔄 无限循环！
```

### 解决方案：X-Skip-Auth 标记

**核心思想：** 在刷新请求中添加一个特殊的请求头，告诉拦截器"跳过认证处理"。

#### 前端实现

```typescript
// apps/web/src/shared/api/core/interceptors.ts

export class InterceptorManager {
  private setupRequestInterceptors(): void {
    this.instance.interceptors.request.use((config) => {
      // ✅ 检查是否有跳过认证的标记
      if (config.headers?.['X-Skip-Auth'] === 'true') {
        // 有标记，跳过认证处理
        delete config.headers['X-Skip-Auth']; // 清理标记（不发送到服务器）
        return config; // 🎯 直接返回，不添加 Authorization header
      }

      // 正常流程：添加 Access Token
      if (this.config.enableAuth && AuthManager.isAuthenticated()) {
        const token = AuthManager.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      return config;
    });
  }

  private setupResponseInterceptors(): void {
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token 过期，需要刷新
          const newToken = await this.refreshAccessToken();
          // 重试原始请求
          return this.instance(error.config);
        }
      },
    );
  }

  /**
   * 刷新访问令牌
   */
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = AuthManager.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // ✅ 关键：添加 X-Skip-Auth 标记
    const response = await this.instance.post(
      '/auth/refresh',
      { refreshToken },
      {
        headers: {
          'X-Skip-Auth': 'true', // 🎯 告诉请求拦截器跳过认证
        },
      },
    );

    const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

    // 更新本地存储的 Token
    AuthManager.setTokens(accessToken, newRefreshToken, undefined, expiresIn);

    return accessToken;
  }
}
```

**X-Skip-Auth 的工作原理：**

```
1. 用户请求 /api/goals，Access Token 过期
   ↓
2. 响应拦截器捕获 401 错误
   ↓
3. 调用 refreshAccessToken()
   ↓
4. 发送刷新请求：
   POST /auth/refresh
   Headers: { 'X-Skip-Auth': 'true' }   // ← 添加标记
   Body: { refreshToken }
   ↓
5. 请求拦截器检测到 X-Skip-Auth
   ├─ 删除 X-Skip-Auth 头
   ├─ 跳过 "添加 Authorization header" 的逻辑
   └─ 直接返回 config（不添加 Access Token）
   ↓
6. 发送到服务器：
   POST /auth/refresh
   Headers: { 'Content-Type': 'application/json' }  // ✅ 没有 Authorization
   Body: { refreshToken }                           // ✅ Refresh Token 在这里
   ↓
7. 服务器验证 Refresh Token → 返回新的 Tokens
```

**为什么需要 X-Skip-Auth？**

| 场景       | 有 X-Skip-Auth                 | 没有 X-Skip-Auth                                |
| ---------- | ------------------------------ | ----------------------------------------------- |
| 刷新请求   | ✅ 不添加 Authorization        | ❌ 自动添加 Authorization: Bearer <过期的token> |
| 服务器收到 | ✅ 只有 body 中的 refreshToken | ❌ 既有过期的 Access Token，又有 Refresh Token  |
| 结果       | ✅ 验证 Refresh Token 成功     | ❌ 服务器可能先验证 Authorization（失败）       |

#### 后端 CORS 配置

由于 `X-Skip-Auth` 是自定义请求头，需要在服务端的 CORS 配置中明确允许：

```typescript
// apps/api/src/app.ts

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Skip-Auth', // ✅ 必须明确允许这个自定义头
      'Cache-Control',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400, // 24 hours
  }),
);
```

**CORS Preflight Request：**

```
浏览器：我要发送一个带有 X-Skip-Auth 头的请求，可以吗？
  ↓ OPTIONS /auth/refresh
服务端：可以，这些头我都允许：Content-Type, Authorization, X-Skip-Auth
  ↓ Access-Control-Allow-Headers: Content-Type, Authorization, X-Skip-Auth
浏览器：好的，那我发送真正的请求
  ↓ POST /auth/refresh (带 X-Skip-Auth: true)
```

---

## 实战经验

### 完整的认证流程实现

#### 1. Token 管理类

```typescript
// AuthManager.ts

class AuthManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';
  private static TOKEN_EXPIRY_KEY = 'token_expiry';

  /**
   * 设置 Tokens
   */
  static setTokens(
    accessToken: string,
    refreshToken: string,
    accountUuid?: string,
    expiresIn?: number,
  ): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);

    if (expiresIn) {
      const expiryTime = Date.now() + expiresIn * 1000;
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    }
  }

  /**
   * 获取 Access Token
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * 获取 Refresh Token
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * 检查是否已认证
   */
  static isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired();
  }

  /**
   * 检查 Token 是否过期
   */
  static isTokenExpired(): boolean {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return false;
    return Date.now() >= parseInt(expiry);
  }

  /**
   * 清除所有 Tokens
   */
  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }
}
```

#### 2. 拦截器管理器（完整版）

```typescript
// InterceptorManager.ts

export class InterceptorManager {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(axiosInstance: AxiosInstance) {
    this.instance = axiosInstance;
    this.setupInterceptors();
  }

  /**
   * 设置请求拦截器
   */
  private setupRequestInterceptors(): void {
    this.instance.interceptors.request.use(
      (config) => {
        // 🎯 检查跳过认证标记
        if (config.headers?.['X-Skip-Auth'] === 'true') {
          delete config.headers['X-Skip-Auth'];
          return config;
        }

        // 添加 Access Token
        const token = AuthManager.getAccessToken();
        if (token && AuthManager.isAuthenticated()) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error),
    );
  }

  /**
   * 设置响应拦截器
   */
  private setupResponseInterceptors(): void {
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // 不是 401 或已经重试过，直接拒绝
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        // 🔄 Token 刷新流程
        if (this.isRefreshing) {
          // 正在刷新，加入队列
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.instance(originalRequest);
          });
        }

        originalRequest._retry = true;
        this.isRefreshing = true;

        try {
          // 刷新 Token
          const newToken = await this.refreshAccessToken();

          // 处理队列中的请求
          this.processQueue(null, newToken);

          // 重试原始请求
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return this.instance(originalRequest);
        } catch (refreshError) {
          // 刷新失败，清理队列并跳转登录
          this.processQueue(refreshError, null);
          await this.handleUnauthorized();
          return Promise.reject(error);
        } finally {
          this.isRefreshing = false;
        }
      },
    );
  }

  /**
   * 刷新 Access Token
   */
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = AuthManager.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // 🎯 使用 X-Skip-Auth 避免循环拦截
      const response = await this.instance.post(
        '/auth/refresh',
        { refreshToken },
        {
          headers: {
            'X-Skip-Auth': 'true',
          },
        },
      );

      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

      // 更新 Token
      AuthManager.setTokens(accessToken, newRefreshToken, undefined, expiresIn);

      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * 处理队列中的请求
   */
  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else if (token) {
        promise.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  /**
   * 处理未授权错误
   */
  private async handleUnauthorized(): Promise<void> {
    AuthManager.clearTokens();

    // 跳转到登录页
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      window.location.href = `/auth?redirect=${encodeURIComponent(currentPath)}`;
    }
  }
}
```

#### 3. 后端 Token 生成

```typescript
// apps/api/src/modules/authentication/application/services/SessionManagementApplicationService.ts

import jwt from 'jsonwebtoken';

class SessionManagementApplicationService {
  /**
   * 生成访问令牌和刷新令牌
   */
  private generateTokens(): {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  } {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const accessTokenExpiresIn = 3600; // 1 hour
    const refreshTokenExpiresIn = 7 * 24 * 3600; // 7 days
    const expiresAt = Date.now() + accessTokenExpiresIn * 1000;

    // 🎯 生成 Access Token
    const accessToken = jwt.sign(
      {
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
      },
      secret,
      { expiresIn: accessTokenExpiresIn },
    );

    // 🎯 生成 Refresh Token（不同的 payload）
    const refreshToken = jwt.sign(
      {
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        purpose: 'token-refresh', // 额外的声明
      },
      secret,
      { expiresIn: refreshTokenExpiresIn },
    );

    return { accessToken, refreshToken, expiresAt };
  }

  /**
   * 刷新会话
   */
  async refreshSession(request: RefreshSessionRequest): Promise<RefreshSessionResponse> {
    // 1. 查询会话
    const session = await this.sessionRepository.findByRefreshToken(request.refreshToken);
    if (!session) {
      throw new Error('Session not found or expired');
    }

    // 2. 验证会话有效性
    const isValid = this.authenticationDomainService.validateSession(session);
    if (!isValid) {
      throw new Error('Session is invalid or expired');
    }

    // 3. 生成新的令牌
    const { accessToken, refreshToken, expiresAt } = this.generateTokens();

    // 4. 更新会话
    session.refreshAccessToken(accessToken, 60);
    session.refreshRefreshToken();

    // 5. 持久化
    await this.sessionRepository.save(session);

    // 6. 返回新的 Tokens
    return {
      success: true,
      session: {
        sessionUuid: session.uuid,
        accessToken,
        refreshToken,
        expiresAt,
      },
      message: 'Session refreshed successfully',
    };
  }
}
```

### 常见问题与解决

#### 问题 1：CORS Preflight 失败

**错误信息：**

```
Access to XMLHttpRequest at 'http://localhost:3888/api/v1/auth/refresh'
from origin 'http://127.0.0.1:5173' has been blocked by CORS policy:
Request header field x-skip-auth is not allowed by Access-Control-Allow-Headers
in preflight response.
```

**原因：** 自定义请求头 `X-Skip-Auth` 没有在 CORS `allowedHeaders` 中声明。

**解决：**

```typescript
// apps/api/src/app.ts
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Skip-Auth', // ✅ 添加这一行
      'Cache-Control',
    ],
  }),
);
```

#### 问题 2：Token 刷新后仍然返回 401

**原因：** 刷新请求本身也被拦截器添加了过期的 Access Token。

**解决：** 确保 `X-Skip-Auth` 标记被正确处理：

```typescript
// ✅ 正确
if (config.headers?.['X-Skip-Auth'] === 'true') {
  delete config.headers['X-Skip-Auth']; // 清理标记
  return config; // 直接返回，不添加 Authorization
}

// ❌ 错误
if (config.headers?.['X-Skip-Auth'] === 'true') {
  // 忘记 return，继续执行后面的代码
}
// 后面的代码仍然会添加 Authorization 头
```

#### 问题 3：多个请求同时触发刷新

**场景：** 用户同时发起多个 API 请求，Access Token 刚好过期。

**问题：** 每个请求都会触发 Token 刷新，导致多次刷新请求。

**解决：** 使用队列机制：

```typescript
private isRefreshing = false;
private failedQueue: Array<{ resolve, reject }> = [];

// 第一个 401 请求
if (this.isRefreshing) {
  // 已经在刷新，加入队列等待
  return new Promise((resolve, reject) => {
    this.failedQueue.push({ resolve, reject });
  });
}

// 开始刷新
this.isRefreshing = true;
const newToken = await this.refreshAccessToken();

// 刷新成功，处理队列中的所有请求
this.failedQueue.forEach(({ resolve }) => {
  resolve(newToken);
});
this.failedQueue = [];
this.isRefreshing = false;
```

#### 问题 4：刷新请求也返回 401 错误

**场景：** 前端调用 `/auth/refresh` 时收到 401 或 404 错误。

**常见原因和解决方案：**

##### 原因 1：后端没有注册 `/auth/refresh` 路由

**检查：** 确保后端路由文件中有 refresh 端点：

```typescript
// ❌ 错误：authenticationRoutes.ts 中缺少 refresh 路由
router.post('/login', AuthenticationController.login);
router.post('/logout', AuthenticationController.logout);
// 没有 refresh 路由！

// ✅ 正确：添加 refresh 路由
router.post('/login', AuthenticationController.login);
router.post('/logout', AuthenticationController.logout);
router.post('/refresh', SessionManagementController.refreshSession); // ✅ 添加这一行
```

**完整示例：**

```typescript
// apps/api/src/modules/authentication/interface/http/authenticationRoutes.ts
import { Router } from 'express';
import { AuthenticationController } from './AuthenticationController';
import { SessionManagementController } from './SessionManagementController';

const router = Router();

router.post('/login', AuthenticationController.login);
router.post('/logout', AuthenticationController.logout);

// ✅ 关键：添加 refresh 端点
router.post('/refresh', SessionManagementController.refreshSession);

export default router;
```

##### 原因 2：Refresh Token 验证失败

**刷新请求的认证流程：**

```
1. 前端发送刷新请求（不带 Authorization 头，带 X-Skip-Auth）
   POST /auth/refresh
   Body: { refreshToken: "refresh_jwt_token_here" }
   Headers: { X-Skip-Auth: 'true' }

2. 后端接收请求
   ├─ X-Skip-Auth 被 CORS preflight 允许
   ├─ 请求到达 /auth/refresh 端点（不经过 authMiddleware）
   └─ Controller 提取 body 中的 refreshToken

3. 后端验证 Refresh Token
   ├─ 在数据库中查找 Session（通过 refreshToken）
   ├─ 验证 Session 是否过期
   ├─ 验证 Session 是否有效（未撤销）
   └─ 验证成功 ✅

4. 后端生成新的 Tokens
   ├─ 生成新的 Access Token（1小时）
   ├─ 生成新的 Refresh Token（7天）
   └─ 更新 Session 记录

5. 返回新的 Tokens
   {
     accessToken: "new_access_token",
     refreshToken: "new_refresh_token",
     expiresIn: 3600
   }
```

**关键点：**

1. **Refresh Token 在请求体中，不在 Header 中**

   ```typescript
   // ✅ 正确：Refresh Token 在 body 里
   axios.post('/auth/refresh', {
     refreshToken: 'your_refresh_token_here',
   });

   // ❌ 错误：不要放在 Authorization header 里
   axios.post(
     '/auth/refresh',
     {},
     {
       headers: {
         Authorization: `Bearer ${refreshToken}`, // 错误！
       },
     },
   );
   ```

2. **Refresh 端点不需要 authMiddleware**

   ```typescript
   // ✅ 正确：refresh 路由不需要认证中间件
   api.use('/auth', authenticationRouter); // authenticationRouter 中的 /refresh 无中间件

   // ❌ 错误：对整个 /auth 路由添加中间件
   api.use('/auth', authMiddleware, authenticationRouter); // 这样 /refresh 也会要求 Access Token
   ```

3. **后端通过 Refresh Token 查找 Session**

   ```typescript
   // SessionManagementApplicationService.refreshSession()

   // 步骤 1：从数据库查找 Session
   const session = await this.sessionRepository.findByRefreshToken(
     request.refreshToken, // 使用请求体中的 refreshToken
   );

   if (!session) {
     // Refresh Token 无效或已过期
     throw new Error('Session not found or expired');
   }

   // 步骤 2：验证 Session 有效性
   const isValid = this.authenticationDomainService.validateSession(session);
   if (!isValid) {
     throw new Error('Session is invalid or expired');
   }

   // 步骤 3：生成新的 Tokens 并更新 Session
   // ...
   ```

##### 原因 3：Refresh Token 过期

**检查：** Refresh Token 的有效期

```typescript
// 后端 Token 生成
const refreshTokenExpiresIn = 7 * 24 * 3600; // 7 天

const refreshToken = jwt.sign(
  {
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    purpose: 'token-refresh',
  },
  secret,
  { expiresIn: refreshTokenExpiresIn },
);
```

**当 Refresh Token 过期时：**

- 后端 `findByRefreshToken()` 返回 `null`
- 抛出 "Session not found or expired" 错误
- 前端应该清理 Token 并跳转到登录页

```typescript
// 前端处理刷新失败
try {
  const newToken = await this.refreshAccessToken();
} catch (refreshError) {
  console.error('❌ [Auth] Token refresh failed', refreshError);

  // Refresh Token 也过期了，清理并跳转登录
  AuthManager.clearTokens();
  window.location.href = '/auth';

  return Promise.reject(error);
}
```

##### 原因 4：Session 被撤销

**场景：** 用户在其他设备上点击了"登出全部设备"

```typescript
// 登出全部设备会撤销所有 Session
async logoutAll(accountUuid: string) {
  await this.sessionRepository.revokeAllByAccountUuid(accountUuid);
}

// 当前设备尝试刷新时
const session = await this.sessionRepository.findByRefreshToken(refreshToken);
// session.status === 'REVOKED'

const isValid = this.authenticationDomainService.validateSession(session);
// 返回 false，因为 Session 已被撤销
```

**解决：** 这是正常行为，前端应该跳转到登录页

##### 调试 Refresh 401 错误的步骤

1. **检查路由是否注册**

   ```bash
   # 搜索 refresh 路由
   grep -r "'/refresh'" apps/api/src/
   ```

2. **检查 CORS 配置**

   ```typescript
   // 确保 X-Skip-Auth 在 allowedHeaders 中
   allowedHeaders: ['Content-Type', 'Authorization', 'X-Skip-Auth'];
   ```

3. **查看后端日志**

   ```typescript
   logger.info('[SessionManagementApplicationService] Starting session refresh');
   // 如果没有这条日志，说明请求没有到达 Controller
   ```

4. **验证 Refresh Token 格式**

   ```javascript
   // 浏览器 Console
   const refreshToken = localStorage.getItem('refresh_token');
   console.log('Refresh Token:', refreshToken);

   // 解码 JWT（不验证签名）
   function decodeJWT(token) {
     const payload = token.split('.')[1];
     return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
   }

   console.log('Decoded:', decodeJWT(refreshToken));
   // 检查 exp 字段是否过期
   ```

5. **检查数据库 Session 记录**

   ```sql
   -- 查看 Session 状态
   SELECT uuid, account_uuid, refresh_token_hash, status, expires_at
   FROM sessions
   WHERE refresh_token_hash = '<hash_of_refresh_token>'
   ORDER BY created_at DESC
   LIMIT 1;

   -- 检查是否过期或被撤销
   ```

---

## 经验总结

### 核心要点

1. **X-Skip-Auth 的本质**
   - 它是一个"标记"，不是"权限"
   - 告诉拦截器"这个请求很特殊，别管它"
   - 只在前端→后端的刷新请求中使用

2. **为什么需要它？**
   - 防止无限循环：刷新请求不应该被认证拦截器拦截
   - 避免鸡生蛋问题：刷新 Token 的请求不需要 Access Token

3. **安全考虑**
   - `X-Skip-Auth` 只是跳过"自动添加 Authorization 头"
   - 刷新请求仍然需要 `Refresh Token` 认证
   - 服务端不会因为 `X-Skip-Auth` 而放松验证

### 架构建议

```
┌─────────────────────────────────────────────────────────┐
│                   前端架构                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔐 AuthManager (Token 存储和管理)                       │
│      ├─ setTokens()                                     │
│      ├─ getAccessToken()                                │
│      ├─ getRefreshToken()                               │
│      ├─ isAuthenticated()                               │
│      └─ clearTokens()                                   │
│                                                          │
│  🔄 InterceptorManager (请求/响应拦截)                   │
│      ├─ 请求拦截器                                       │
│      │   ├─ 检查 X-Skip-Auth 标记                       │
│      │   └─ 自动添加 Authorization 头                   │
│      │                                                   │
│      └─ 响应拦截器                                       │
│          ├─ 检测 401 错误                               │
│          ├─ 触发 Token 刷新 (带 X-Skip-Auth)            │
│          ├─ 队列管理并发请求                             │
│          └─ 重试原始请求                                 │
│                                                          │
│  🎯 API Client (业务接口调用)                            │
│      ├─ login()                                         │
│      ├─ getGoals()                                      │
│      └─ updateProfile()                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   后端架构                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🌐 CORS 配置                                            │
│      └─ allowedHeaders: ['X-Skip-Auth', ...]           │
│                                                          │
│  🔐 Auth Middleware (JWT 验证)                           │
│      ├─ 提取 Authorization header                       │
│      ├─ 验证 JWT signature                              │
│      ├─ 检查过期时间                                     │
│      └─ 注入用户信息到 req.user                          │
│                                                          │
│  🎯 Auth Routes                                          │
│      ├─ POST /auth/login (生成 Tokens)                  │
│      ├─ POST /auth/refresh (刷新 Tokens)                │
│      └─ POST /auth/logout (撤销 Session)                │
│                                                          │
│  🛡️ Protected Routes (需要认证)                         │
│      ├─ GET /api/goals                                  │
│      ├─ POST /api/tasks                                 │
│      └─ ...                                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 最佳实践

#### ✅ DO（推荐）

1. **使用标记而非特殊路由**

   ```typescript
   // ✅ 好：使用 X-Skip-Auth 标记
   axios.post('/auth/refresh', data, {
     headers: { 'X-Skip-Auth': 'true' },
   });

   // ❌ 差：为刷新创建特殊路由
   axios.post('/auth/refresh-without-auth', data);
   ```

2. **清理标记以避免泄露**

   ```typescript
   // ✅ 好：检查后删除标记
   if (config.headers?.['X-Skip-Auth'] === 'true') {
     delete config.headers['X-Skip-Auth'];
     return config;
   }

   // ❌ 差：保留标记发送到服务器
   if (config.headers?.['X-Skip-Auth'] === 'true') {
     return config; // 标记会被发送到服务器
   }
   ```

3. **使用队列管理并发刷新**

   ```typescript
   // ✅ 好：只刷新一次
   if (this.isRefreshing) {
     return new Promise((resolve, reject) => {
       this.failedQueue.push({ resolve, reject });
     });
   }

   // ❌ 差：每个请求都刷新
   const newToken = await refreshAccessToken();
   ```

4. **刷新失败后清理状态**

   ```typescript
   // ✅ 好：清理并跳转登录
   try {
     await refreshAccessToken();
   } catch (error) {
     AuthManager.clearTokens();
     router.push('/auth');
   } finally {
     this.isRefreshing = false;
   }

   // ❌ 差：不清理，用户还以为自己登录了
   try {
     await refreshAccessToken();
   } catch (error) {
     // 什么都不做
   }
   ```

#### ❌ DON'T（避免）

1. **不要在服务端使用 X-Skip-Auth 做权限判断**

   ```typescript
   // ❌ 错误：服务端不应该依赖这个标记
   if (req.headers['x-skip-auth']) {
     return next(); // 跳过认证？绝对不行！
   }
   ```

2. **不要在所有请求中添加 X-Skip-Auth**

   ```typescript
   // ❌ 错误：破坏了认证体系
   axios.defaults.headers.common['X-Skip-Auth'] = 'true';
   ```

3. **不要忘记 CORS 配置**
   ```typescript
   // ❌ 错误：忘记在 allowedHeaders 中添加
   cors({
     allowedHeaders: ['Content-Type', 'Authorization'],
     // X-Skip-Auth 不在列表中，浏览器会阻止请求
   });
   ```

### 调试技巧

#### 1. 浏览器开发者工具

**Network 面板：**

```
查看 Preflight Request (OPTIONS):
  Request Headers:
    Access-Control-Request-Headers: x-skip-auth, content-type

  Response Headers:
    Access-Control-Allow-Headers: Content-Type, Authorization, X-Skip-Auth
    ✅ 如果包含 X-Skip-Auth，说明 CORS 配置正确
```

**Console 面板：**

```javascript
// 查看 Token 内容（不验证签名）
function decodeJWT(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(window.atob(base64));
}

const accessToken = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');

console.log('Access Token:', decodeJWT(accessToken));
console.log('Refresh Token:', decodeJWT(refreshToken));
```

#### 2. 日志记录

```typescript
// 前端拦截器日志
this.instance.interceptors.request.use((config) => {
  console.log('🔵 [Request]', {
    url: config.url,
    method: config.method,
    hasAuth: !!config.headers?.Authorization,
    skipAuth: config.headers?.['X-Skip-Auth'],
  });
  return config;
});

this.instance.interceptors.response.use(
  (response) => {
    console.log('✅ [Response]', {
      url: response.config.url,
      status: response.status,
    });
    return response;
  },
  (error) => {
    console.error('❌ [Error]', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  },
);
```

---

## 信息参考

### 相关文档

1. **本项目文档**
   - `/docs/troubleshooting/EXPRESS_ROUTE_AUTH_MIDDLEWARE_ISSUE.md` - 路由认证问题
   - `/docs/modules/auth-flows/USER_LOGIN_FLOW.md` - 用户登录流程
   - `/docs/packages/utils/SSE_TOKEN_AUTH_IMPLEMENTATION.md` - SSE Token 认证

2. **代码实现**
   - `/apps/web/src/shared/api/core/interceptors.ts` - 前端拦截器
   - `/apps/api/src/app.ts` - CORS 配置
   - `/apps/api/src/modules/authentication/` - 认证模块

### 外部资源

1. **JWT 规范**
   - [RFC 7519: JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
   - [JWT.io](https://jwt.io/) - JWT 在线调试工具

2. **CORS 规范**
   - [MDN: CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
   - [W3C: CORS Specification](https://www.w3.org/TR/cors/)

3. **Axios 文档**
   - [Axios Interceptors](https://axios-http.com/docs/interceptors)
   - [Axios Configuration](https://axios-http.com/docs/req_config)

### 工具推荐

1. **JWT 调试**
   - [jwt.io](https://jwt.io/) - 在线解码和验证 JWT
   - [JWT Inspector](https://jwt.io/) - Chrome 浏览器扩展

2. **API 测试**
   - [Postman](https://www.postman.com/) - API 测试工具
   - [Insomnia](https://insomnia.rest/) - REST API 客户端

3. **浏览器扩展**
   - [ModHeader](https://modheader.com/) - 修改 HTTP 请求头
   - [JSON Viewer](https://chrome.google.com/webstore/detail/json-viewer) - 格式化 JSON 响应

---

## 附录：完整示例代码

### 前端完整实现

```typescript
// src/shared/api/core/interceptors.ts

import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { AuthManager } from './auth-manager';

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  metadata?: {
    requestId: string;
    startTime: number;
  };
}

export class InterceptorManager {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];
  private requestId = 0;

  constructor(axiosInstance: AxiosInstance) {
    this.instance = axiosInstance;
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.setupRequestInterceptors();
    this.setupResponseInterceptors();
  }

  private setupRequestInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        // 生成请求ID
        const requestId = `req-${++this.requestId}-${Date.now()}`;
        config.metadata = { requestId, startTime: Date.now() };

        // 🎯 检查跳过认证标记
        if (config.headers?.['X-Skip-Auth'] === 'true') {
          console.log('🔓 [Auth] Skipping auth for refresh request');
          delete config.headers['X-Skip-Auth'];
          return config;
        }

        // 添加认证头
        if (AuthManager.isAuthenticated()) {
          const token = AuthManager.getAccessToken();
          if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        console.log('🔵 [Request]', {
          requestId,
          method: config.method?.toUpperCase(),
          url: config.url,
          hasAuth: !!config.headers?.Authorization,
        });

        return config;
      },
      (error) => {
        console.error('❌ [Request Error]', error);
        return Promise.reject(error);
      },
    );
  }

  private setupResponseInterceptors(): void {
    this.instance.interceptors.response.use(
      (response) => {
        const requestId = response.config.metadata?.requestId;
        console.log('✅ [Response]', {
          requestId,
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      async (error) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        console.error('❌ [Response Error]', {
          requestId: originalRequest.metadata?.requestId,
          status: error.response?.status,
          url: originalRequest.url,
        });

        // 不是 401 错误，或已经重试过
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        // 🔄 Token 刷新流程
        if (this.isRefreshing) {
          console.log('⏳ [Auth] Refresh in progress, queueing request');
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.instance(originalRequest);
          });
        }

        originalRequest._retry = true;
        this.isRefreshing = true;

        try {
          console.log('🔄 [Auth] Starting token refresh');
          const newToken = await this.refreshAccessToken();
          console.log('✅ [Auth] Token refreshed successfully');

          // 处理队列
          this.processQueue(null, newToken);

          // 重试原始请求
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return this.instance(originalRequest);
        } catch (refreshError) {
          console.error('❌ [Auth] Token refresh failed', refreshError);
          this.processQueue(refreshError, null);
          await this.handleUnauthorized();
          return Promise.reject(error);
        } finally {
          this.isRefreshing = false;
        }
      },
    );
  }

  /**
   * 刷新 Access Token
   */
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = AuthManager.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // 🎯 使用 X-Skip-Auth 标记避免循环拦截
      const response = await this.instance.post(
        '/auth/refresh',
        { refreshToken },
        {
          headers: {
            'X-Skip-Auth': 'true',
          },
        },
      );

      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

      // 更新本地存储
      AuthManager.setTokens(accessToken, newRefreshToken, undefined, expiresIn);

      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * 处理队列中的请求
   */
  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else if (token) {
        promise.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  /**
   * 处理未授权错误
   */
  private async handleUnauthorized(): Promise<void> {
    console.warn('🔒 [Auth] Unauthorized, clearing tokens and redirecting to login');
    AuthManager.clearTokens();

    // 跳转到登录页
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      window.location.href = `/auth?redirect=${encodeURIComponent(currentPath)}`;
    }
  }
}
```

### 后端完整实现

```typescript
// apps/api/src/app.ts (CORS 配置)

import cors from 'cors';
import express from 'express';

const app = express();

// CORS 配置
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.CLIENT_URL || ''].filter(
      Boolean,
    ),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Skip-Auth', // ✅ 允许自定义请求头
      'Cache-Control',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400, // 24 hours
  }),
);
```

```typescript
// apps/api/src/modules/authentication/application/services/SessionManagementApplicationService.ts

import jwt from 'jsonwebtoken';

export class SessionManagementApplicationService {
  /**
   * 刷新会话
   */
  async refreshSession(request: { refreshToken: string }): Promise<{
    success: boolean;
    session: {
      sessionUuid: string;
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
    };
    message: string;
  }> {
    console.log('🔄 [SessionManagement] Starting session refresh');

    // 1. 查询会话
    const session = await this.sessionRepository.findByRefreshToken(request.refreshToken);
    if (!session) {
      throw new Error('Session not found or expired');
    }

    // 2. 验证会话
    const isValid = this.authenticationDomainService.validateSession(session);
    if (!isValid) {
      throw new Error('Session is invalid or expired');
    }

    // 3. 生成新的令牌
    const { accessToken, refreshToken, expiresAt } = this.generateTokens();

    // 4. 更新会话
    session.refreshAccessToken(accessToken, 60);
    session.refreshRefreshToken();

    // 5. 持久化
    await this.sessionRepository.save(session);

    console.log('✅ [SessionManagement] Session refreshed successfully');

    return {
      success: true,
      session: {
        sessionUuid: session.uuid,
        accessToken,
        refreshToken,
        expiresAt,
      },
      message: 'Session refreshed successfully',
    };
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  private generateTokens(): {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  } {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const accessTokenExpiresIn = 3600; // 1 hour
    const refreshTokenExpiresIn = 7 * 24 * 3600; // 7 days
    const expiresAt = Date.now() + accessTokenExpiresIn * 1000;

    // 生成 Access Token
    const accessToken = jwt.sign(
      {
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
      },
      secret,
      { expiresIn: accessTokenExpiresIn },
    );

    // 生成 Refresh Token（不同的 payload）
    const refreshToken = jwt.sign(
      {
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        purpose: 'token-refresh',
      },
      secret,
      { expiresIn: refreshTokenExpiresIn },
    );

    return { accessToken, refreshToken, expiresAt };
  }
}
```

---

**总结：** `X-Skip-Auth` 是一个简单但强大的解决方案，用于避免 Token 刷新流程中的循环拦截问题。通过在刷新请求中添加这个特殊标记,我们告诉前端拦截器"这个请求不需要自动添加认证头"，从而打破了无限循环。记住，这只是前端的实现细节，服务端仍然需要通过 Refresh Token 进行严格的验证。

---

## 🔧 快速修复：添加缺失的 Refresh 路由

### 问题诊断

如果你的前端在调用 `/auth/refresh` 时收到 **404 Not Found** 或 **401 Unauthorized** 错误，很可能是因为后端没有注册这个路由。

**检查方法：**

```bash
# 在项目根目录执行
grep -n "'/refresh'" apps/api/src/modules/authentication/interface/http/authenticationRoutes.ts
```

如果没有输出，说明 refresh 路由缺失。

### 修复步骤

#### 1. 修改 `authenticationRoutes.ts`

```typescript
// apps/api/src/modules/authentication/interface/http/authenticationRoutes.ts

import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { AuthenticationController } from './AuthenticationController';
import { SessionManagementController } from './SessionManagementController'; // ✅ 导入
import { RegistrationController } from '../../../account/interface/http/RegistrationController';
import { deviceInfoMiddleware } from '../../../../shared/middlewares/index';

const router: ExpressRouter = Router();

// ... 其他路由 ...

router.post('/login', deviceInfoMiddleware, AuthenticationController.login);
router.post('/logout', AuthenticationController.logout);
router.post('/logout-all', AuthenticationController.logoutAll);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 刷新访问令牌
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 刷新令牌
 *     responses:
 *       200:
 *         description: Token 刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionUuid:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 expiresAt:
 *                   type: number
 *       401:
 *         description: Refresh Token 无效或已过期
 *       500:
 *         description: 服务器错误
 */
router.post('/refresh', SessionManagementController.refreshSession); // ✅ 添加这一行

// ... 其他路由 ...

export default router;
```

#### 2. 验证修复

**重启 API 服务器：**

```bash
# 停止当前服务
# Ctrl+C 或通过 PM2/Docker 重启

# 重新启动
npm run dev:api
# 或
nx serve api
```

**测试 Refresh 端点：**

```bash
# 使用 curl 测试
curl -X POST http://localhost:3888/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your_refresh_token_here"}'

# 期望结果：
# {
#   "code": 200,
#   "data": {
#     "sessionUuid": "...",
#     "accessToken": "...",
#     "refreshToken": "...",
#     "expiresAt": 1234567890
#   },
#   "message": "Session refreshed successfully"
# }
```

**或在浏览器中测试：**

```javascript
// 打开浏览器 Console
const refreshToken = localStorage.getItem('refresh_token');

fetch('http://localhost:3888/api/v1/auth/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ refreshToken }),
})
  .then((res) => res.json())
  .then((data) => console.log('✅ Refresh Success:', data))
  .catch((err) => console.error('❌ Refresh Failed:', err));
```

#### 3. 确认前端配置

确保前端调用的是正确的端点：

```typescript
// apps/web/src/shared/api/core/interceptors.ts

private async refreshAccessToken(): Promise<string> {
  const refreshToken = AuthManager.getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    // ✅ 确认路径正确
    const response = await this.instance.post(
      '/auth/refresh',  // 完整路径是：http://localhost:3888/api/v1/auth/refresh
      { refreshToken },
      {
        headers: {
          'X-Skip-Auth': 'true',
        },
      }
    );

    const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
    // ...
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
}
```

#### 4. 验证完整流程

1. **登录并获取 Tokens**

   ```bash
   curl -X POST http://localhost:3888/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "username": "test_user",
       "password": "Test@123456"
     }'
   ```

2. **等待 Access Token 过期**（或手动删除）

   ```javascript
   // 浏览器 Console
   localStorage.removeItem('access_token');
   ```

3. **发起需要认证的请求**

   ```javascript
   // 这会触发 401，然后自动刷新
   fetch('http://localhost:3888/api/v1/goals', {
     headers: {
       Authorization: `Bearer invalid_token`,
     },
   });
   ```

4. **观察 Network 面板**
   - 第一个请求：`GET /goals` → 401
   - 自动刷新：`POST /auth/refresh` → 200 ✅
   - 重试请求：`GET /goals` → 200 ✅

### 常见错误排查

| 错误               | 原因                               | 解决方案                            |
| ------------------ | ---------------------------------- | ----------------------------------- |
| 404 Not Found      | 路由未注册                         | 添加 `router.post('/refresh', ...)` |
| 401 Unauthorized   | Refresh Token 过期/无效            | 检查数据库 Session 记录             |
| CORS Error         | X-Skip-Auth 未在 allowedHeaders 中 | 添加到 CORS 配置                    |
| 500 Internal Error | SessionManagementController 未导入 | 检查 import 语句                    |
| Loop detected      | X-Skip-Auth 未正确处理             | 检查请求拦截器逻辑                  |

### 完整的路由结构

```
/api/v1/auth
├── POST /register          (注册)           [无需认证]
├── POST /login             (登录)           [无需认证]
├── POST /logout            (登出单设备)      [需要认证]
├── POST /logout-all        (登出全设备)      [需要认证]
├── POST /refresh           (刷新Token)      [通过RefreshToken认证] ✅ 关键
├── POST /two-factor/enable (启用2FA)        [需要认证]
└── POST /api-keys          (生成API密钥)    [需要认证]
```

**认证策略：**

- **无需认证**：直接访问
- **需要认证**：需要有效的 Access Token（通过 authMiddleware）
- **通过 Refresh Token 认证**：不经过 authMiddleware，通过请求体中的 refreshToken 验证

---

**修复完成后，你的 Token 刷新流程应该能够正常工作了！** 🎉
