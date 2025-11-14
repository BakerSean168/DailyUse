# Token 刷新事件总线实现

## 📋 实现概述

实现了基于事件总线的 Token 自动刷新机制，解决了 401 错误导致的请求失败问题。

## 🎯 核心流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     Token 刷新事件流程                            │
└─────────────────────────────────────────────────────────────────┘

1️⃣ API 请求收到 401 错误
   ↓
2️⃣ Axios 拦截器：暂停请求，加入队列
   ↓
3️⃣ 发布事件：auth:token-refresh-requested
   ↓
4️⃣ TokenRefreshHandler 监听事件，调用 refresh API
   ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ 5️⃣ Token 刷新成功                                           │
   │    ↓                                                        │
   │ 6️⃣ 发布事件：auth:token-refreshed                           │
   │    ↓                                                        │
   │ 7️⃣ Axios 拦截器监听事件，重试队列中的请求                    │
   │    ↓                                                        │
   │ 8️⃣ SSE Client 监听事件，强制重连（使用新 token）             │
   │    ↓                                                        │
   │ ✅ 所有请求恢复正常                                          │
   └─────────────────────────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────────────────────────┐
   │ 5️⃣ Token 刷新失败（Refresh Token 过期）                     │
   │    ↓                                                        │
   │ 6️⃣ 发布事件：auth:token-refresh-failed                      │
   │    ↓                                                        │
   │ 7️⃣ 发布事件：auth:session-expired                           │
   │    ↓                                                        │
   │ 8️⃣ Axios 拦截器清空请求队列                                 │
   │    ↓                                                        │
   │ 9️⃣ 跳转到登录页                                             │
   │    ↓                                                        │
   │ ❌ 用户需要重新登录                                          │
   └─────────────────────────────────────────────────────────────┘
```

## 🔧 核心实现

### 1. Axios 拦截器（interceptors.ts）

**职责**：
- 检测 401 错误
- 暂停失败的请求，加入队列
- 发布 token 刷新请求事件
- 监听 token 刷新成功/失败事件，处理队列

**关键代码**：

```typescript
// 1️⃣ 检测到 401 错误，暂停请求
if (error.response?.status === 401 && !config._retry) {
  config._retry = true;
  
  if (this.isRefreshing) {
    // 如果正在刷新，将请求加入队列
    return new Promise((resolve, reject) => {
      this.failedQueue.push({ resolve, reject, config });
    });
  }

  // 开始刷新 token
  this.isRefreshing = true;
  
  // 2️⃣ 发布事件：请求刷新 token
  window.dispatchEvent(new CustomEvent('auth:token-refresh-requested', {
    detail: { reason: '401 Unauthorized', url: config.url }
  }));

  // 3️⃣ 将当前请求加入队列
  return new Promise((resolve, reject) => {
    this.failedQueue.push({ resolve, reject, config });
  });
}

// 4️⃣ 监听 token 刷新成功事件
window.addEventListener('auth:token-refreshed', ((event: CustomEvent) => {
  const { accessToken } = event.detail;
  this.processQueue(null, accessToken); // 重试队列中的请求
}) as EventListener);

// 5️⃣ 监听 token 刷新失败事件
window.addEventListener('auth:token-refresh-failed', ((event: CustomEvent) => {
  const error = event.detail?.error || new Error('Token refresh failed');
  this.processQueue(error, null); // 清空队列
}) as EventListener);
```

### 2. Token 刷新处理器（tokenRefreshHandler.ts）

**职责**：
- 监听 token 刷新请求事件
- 调用 API 刷新 token
- 发布刷新成功/失败事件
- 处理刷新失败时的跳转逻辑

**关键代码**：

```typescript
class TokenRefreshHandler {
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  initialize(): void {
    // 1️⃣ 监听 token 刷新请求事件
    window.addEventListener('auth:token-refresh-requested', ((event: CustomEvent) => {
      console.log('[TokenRefreshHandler] 🔔 收到 Token 刷新请求');
      this.handleTokenRefresh();
    }) as EventListener);
  }

  private async handleTokenRefresh(): Promise<string> {
    // 防止重复刷新
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh()
      .finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  private async performTokenRefresh(): Promise<string> {
    try {
      // 2️⃣ 调用 API 刷新 token（Refresh Token 从 Cookie 自动发送）
      const response = await apiClient.post<any>(
        '/auth/sessions/refresh',
        {},
        { headers: { 'X-Skip-Auth': 'true' } } as any
      );

      const { accessToken, expiresIn } = response.data;
      AuthManager.updateAccessToken(accessToken, expiresIn);

      // 3️⃣ 发布刷新成功事件
      window.dispatchEvent(new CustomEvent('auth:token-refreshed', {
        detail: { accessToken, expiresIn }
      }));

      return accessToken;
    } catch (error: any) {
      // 4️⃣ 解析错误信息
      const errorCode = error?.response?.data?.errors?.[0]?.code;
      const userMessage = error?.response?.data?.errors?.[0]?.message;

      // 5️⃣ 发布刷新失败事件
      window.dispatchEvent(new CustomEvent('auth:token-refresh-failed', {
        detail: { error, errorCode, message: userMessage }
      }));

      // 6️⃣ 发布 session 过期事件（用于 UI 提示）
      window.dispatchEvent(new CustomEvent('auth:session-expired', {
        detail: { message: userMessage, reason: 'refresh-token-expired' }
      }));

      // 7️⃣ 跳转到登录页
      router.push({ name: 'auth', query: { reason: 'token_expired' } });

      throw error;
    }
  }
}
```

### 3. SSE 客户端（SSEClient.ts）

**职责**：
- 监听 token 刷新成功事件
- 检测 token 过期，等待刷新
- 刷新后自动重连 SSE

**关键代码**：

```typescript
class SSEClient {
  constructor() {
    // 1️⃣ 监听 token 刷新事件
    this.setupTokenRefreshListener();
  }

  private setupTokenRefreshListener(): void {
    window.addEventListener('auth:token-refreshed', () => {
      console.log('[SSE Client] 🔔 检测到 token 刷新事件，重新连接 SSE');
      if (this.eventSource && !this.isDestroyed) {
        // 强制重连
        this.connect(true);
      }
    });
  }

  private connectInBackground(): void {
    // 2️⃣ 验证 token 是否过期
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    
    if (exp && exp < now) {
      console.warn('[SSE Client] ⚠️ Access token 已过期，需要刷新');
      // 3️⃣ Token 过期，等待自动刷新后再重连
      this.scheduleTokenRefreshReconnect();
      return;
    }

    // 4️⃣ 建立 SSE 连接
    const url = `${this.baseUrl}/api/v1/sse/notifications/events?token=${token}`;
    this.eventSource = new EventSource(url);
  }

  private scheduleTokenRefreshReconnect(): void {
    console.log('[SSE Client] 📝 Token 已过期，等待系统自动刷新后重连');
    
    // 清除现有连接，等待 auth:token-refreshed 事件触发重连
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.isConnecting = false;
  }
}
```

## 📂 文件结构

```
apps/web/src/
├── modules/authentication/
│   └── infrastructure/
│       └── tokenRefreshHandler.ts           # ✅ 新增：Token 刷新处理器
│
├── shared/
│   ├── api/core/
│   │   └── interceptors.ts                  # ✅ 修改：添加事件监听器
│   │
│   └── initialization/
│       └── AppInitializationManager.ts      # ✅ 修改：注册 Token 刷新处理器
│
└── modules/notification/infrastructure/sse/
    └── SSEClient.ts                         # ✅ 已有：监听 token 刷新事件
```

## 🎯 关键改进

### 1. **请求队列管理**

```typescript
private failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
  config: ExtendedAxiosRequestConfig; // ✅ 新增：保存原始请求配置
}> = [];
```

**改进**：
- 队列不仅保存 resolve/reject，还保存完整的请求配置
- Token 刷新成功后，可以完整重试请求（包括 URL、headers、body 等）

### 2. **防止重复刷新**

```typescript
class TokenRefreshHandler {
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  private async handleTokenRefresh(): Promise<string> {
    // 如果已经在刷新中，返回现有的 Promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh()
      .finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }
}
```

**改进**：
- 多个 401 请求同时触发刷新时，只执行一次 refresh API 调用
- 所有请求共享同一个刷新 Promise

### 3. **友好的错误提示**

```typescript
// 解析后端错误码，显示友好提示
if (errorCode === 'REFRESH_TOKEN_EXPIRED') {
  friendlyMessage = '登录已过期（30天），请重新登录';
} else if (errorCode === 'SESSION_REVOKED') {
  friendlyMessage = '会话已被撤销，请重新登录';
} else if (errorCode === 'SESSION_INVALID') {
  friendlyMessage = '会话无效，请重新登录';
} else if (errorCode === 'MISSING_REFRESH_TOKEN') {
  friendlyMessage = 'Refresh token 缺失，请重新登录';
}
```

### 4. **SSE 自动重连**

```typescript
// Token 刷新成功后，SSE 自动重连
window.addEventListener('auth:token-refreshed', () => {
  console.log('[SSE Client] 🔔 检测到 token 刷新事件，重新连接 SSE');
  this.connect(true); // 强制重连，使用新 token
});
```

## 📊 事件总线架构

```typescript
┌─────────────────────────────────────────────────────────────────┐
│                        事件总线事件                               │
└─────────────────────────────────────────────────────────────────┘

1️⃣ auth:token-refresh-requested
   - 发布者：Axios 拦截器（检测到 401 错误）
   - 监听者：TokenRefreshHandler
   - 载荷：{ reason: string, url: string }

2️⃣ auth:token-refreshed
   - 发布者：TokenRefreshHandler（刷新成功）
   - 监听者：
     * Axios 拦截器（重试队列中的请求）
     * SSE Client（强制重连）
   - 载荷：{ accessToken: string, expiresIn: number }

3️⃣ auth:token-refresh-failed
   - 发布者：TokenRefreshHandler（刷新失败）
   - 监听者：Axios 拦截器（清空队列）
   - 载荷：{ error: Error, errorCode: string, message: string }

4️⃣ auth:session-expired
   - 发布者：TokenRefreshHandler（刷新失败）
   - 监听者：UI 组件（显示友好提示）
   - 载荷：{ message: string, reason: string, errorCode: string }
```

## 🧪 测试场景

### 场景 1：Token 过期，自动刷新成功

```
1. 用户操作 → API 请求（Dashboard 加载数据）
2. Access Token 已过期 → 后端返回 401
3. Axios 拦截器：
   - 暂停请求，加入队列
   - 发布 auth:token-refresh-requested
4. TokenRefreshHandler：
   - 调用 /auth/sessions/refresh
   - 更新 Access Token
   - 发布 auth:token-refreshed
5. Axios 拦截器：
   - 监听到 auth:token-refreshed
   - 使用新 token 重试队列中的请求
6. SSE Client：
   - 监听到 auth:token-refreshed
   - 强制重连，使用新 token
7. ✅ 所有请求恢复正常，用户无感知
```

### 场景 2：Refresh Token 过期，跳转登录

```
1. 用户操作 → API 请求
2. Access Token 已过期 → 后端返回 401
3. Axios 拦截器：
   - 暂停请求，加入队列
   - 发布 auth:token-refresh-requested
4. TokenRefreshHandler：
   - 调用 /auth/sessions/refresh
   - 后端返回 401（Refresh Token 过期）
   - 清除所有 token
   - 发布 auth:token-refresh-failed
   - 发布 auth:session-expired
   - 跳转到登录页
5. Axios 拦截器：
   - 监听到 auth:token-refresh-failed
   - 清空请求队列
6. ❌ 用户看到友好提示："登录已过期（30天），请重新登录"
```

### 场景 3：多个请求同时 401

```
1. Dashboard 同时发起 10 个 API 请求
2. 所有请求都返回 401（Access Token 过期）
3. 第一个请求：
   - 发布 auth:token-refresh-requested
   - 开始刷新 token
4. 后续 9 个请求：
   - 检测到 isRefreshing = true
   - 直接加入队列，不重复刷新
5. TokenRefreshHandler：
   - 只执行一次 refresh API 调用
   - 发布 auth:token-refreshed
6. Axios 拦截器：
   - 使用新 token 重试所有 10 个请求
7. ✅ 避免了 10 次重复的 refresh 调用
```

## 🔍 调试日志

```typescript
// Axios 拦截器
[API Info] 🔐 检测到 401 错误，暂停请求并请求刷新 Token
[API Info] ⏸️ Token 正在刷新中，请求加入队列 (queueSize: 5)

// Token 刷新处理器
[TokenRefreshHandler] 🔔 收到 Token 刷新请求
[TokenRefreshHandler] 🔄 开始刷新 Token...
[TokenRefreshHandler] ✅ Token 刷新成功，有效期: 3600 秒

// Axios 拦截器
[API Info] 🔄 Token 刷新成功，重试队列中的请求 (queueSize: 5)
[API Info] 🔄 重试请求（从队列）: /api/goal/instances
[API Info] 🔄 重试请求（从队列）: /api/task/instances

// SSE 客户端
[SSE Client] 🔔 检测到 token 刷新事件，重新连接 SSE
[SSE Client] 🚀 正在建立连接到: /api/v1/sse/notifications/events?token=...
[SSE Client] ✅ onopen 触发 - 连接成功
```

## ✅ 实现完成

### 已完成
- ✅ Axios 拦截器：检测 401 错误，暂停请求，加入队列
- ✅ Token 刷新处理器：监听刷新请求，调用 refresh API
- ✅ 事件总线集成：4 个核心事件（请求刷新、刷新成功、刷新失败、session 过期）
- ✅ SSE 自动重连：监听 token 刷新成功事件
- ✅ 防止重复刷新：多个请求共享同一个刷新 Promise
- ✅ 友好错误提示：解析后端错误码，显示用户友好消息
- ✅ 初始化集成：在 AppInitializationManager 中注册 TokenRefreshHandler

### 待验证
- ⏳ 运行时验证：需要重新启动前端，测试 401 自动刷新
- ⏳ SSE 重连验证：确认 token 刷新后 SSE 自动重连成功

## 🚀 测试步骤

1. **重新启动前端**：
   ```bash
   cd apps/web
   npm run dev
   ```

2. **验证 Token 刷新处理器初始化**：
   - 打开浏览器控制台
   - 查找日志：`[TokenRefreshHandler] 🚀 初始化 Token 刷新处理器`
   - 查找日志：`[TokenRefreshHandler] ✅ 事件监听器已注册`

3. **模拟 Token 过期**：
   - 登录系统
   - 打开浏览器控制台，执行：
     ```javascript
     // 清除 token，模拟过期
     localStorage.removeItem('access_token');
     ```
   - 刷新页面或执行任何 API 操作
   - 预期：系统自动刷新 token，请求重试成功

4. **验证日志输出**：
   ```
   [API Info] 🔐 检测到 401 错误，暂停请求并请求刷新 Token
   [TokenRefreshHandler] 🔔 收到 Token 刷新请求
   [TokenRefreshHandler] 🔄 开始刷新 Token...
   [TokenRefreshHandler] ✅ Token 刷新成功，有效期: 3600 秒
   [API Info] 🔄 Token 刷新成功，重试队列中的请求
   [SSE Client] 🔔 检测到 token 刷新事件，重新连接 SSE
   ```

5. **验证 SSE 重连**：
   - 检查 SSE 连接状态
   - 确认没有 401 错误
   - 确认心跳正常

## 📚 相关文档

- `HTTPONLY_COOKIE_MIGRATION_GUIDE.md` - httpOnly Cookie 迁移指南
- `TOKEN_REFRESH_OPTIMIZATION_COMPLETE.md` - Token 优化总结
- `SSE_AND_XSKIPAUTH_FIX.md` - SSE 认证修复

## 🎉 核心优势

1. **用户无感知**：Token 自动刷新，不需要重新登录
2. **性能优化**：多个 401 请求只触发一次 refresh 调用
3. **架构解耦**：通过事件总线实现模块间通信，避免直接依赖
4. **易于调试**：完整的日志输出，清晰的事件流程
5. **错误容错**：刷新失败时显示友好提示，优雅降级到登录页
