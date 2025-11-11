# SSE 连接和 X-Skip-Auth 修复总结

## 🐛 问题 1：SSE 在登录页疯狂重连

### 问题描述

用户在登录页面时，控制台出现大量 SSE 连接失败日志：

```
[SSE Client] connectInBackground() 被调用
[SSE Client] 缺少认证 token，无法建立 SSE 连接
[SSE Client] connectInBackground() 被调用
[SSE Client] 缺少认证 token，无法建立 SSE 连接
... (无限循环)
```

### 根本原因

**SSEClient.ts 的 `connectInBackground()` 方法在没有 token 时会自动重试**：

```typescript
// ❌ 原来的逻辑
const token = AuthManager.getAccessToken();
if (!token) {
  console.error('[SSE Client] 缺少认证 token，无法建立 SSE 连接');
  // 1秒后重试
  if (!this.isDestroyed) {
    this.reconnectTimer = setTimeout(() => this.connectInBackground(), 1000);
  }
  return;
}
```

**触发路径：**

1. 页面加载 → `visibilitychange` 事件监听器被注册
2. 页面可见时 → 调用 `checkAndReconnect()`
3. `checkAndReconnect()` → 调用 `connect()`
4. `connect()` → 调用 `connectInBackground()`
5. 没有 token → 1秒后再次调用 `connectInBackground()`
6. 🔄 无限循环

### 修复方案

#### 修复 1：`connectInBackground()` 不再自动重试

```typescript
// ✅ 修复后
const token = AuthManager.getAccessToken();
if (!token) {
  console.warn('[SSE Client] 缺少认证 token，无法建立 SSE 连接（等待用户登录）');
  // ✅ 不再自动重试，等待用户登录后主动调用 connect()
  return;
}
```

**文件：** `/workspaces/DailyUse/apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts` (第 146 行)

#### 修复 2：`checkAndReconnect()` 检查是否已登录

```typescript
// ✅ 添加登录状态检查
private checkAndReconnect(): void {
  const status = this.getStatus();
  console.log('[SSE Client] 检查连接状态:', status);

  // ✅ 只有在已登录（有 token）时才尝试重连
  const hasToken = AuthManager.isAuthenticated();
  if (!hasToken) {
    console.log('[SSE Client] 用户未登录，跳过重连');
    return;
  }

  if (!status.connected && !this.isDestroyed && !this.isConnecting) {
    console.log('[SSE Client] 连接已断开，尝试重新连接');
    this.connect();
  }
}
```

**文件：** `/workspaces/DailyUse/apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts` (第 110 行)

### 效果

**修复前：**

- ❌ 登录页面：每秒尝试连接 SSE
- ❌ 控制台：大量错误日志
- ❌ 性能：无意义的网络请求

**修复后：**

- ✅ 登录页面：不尝试连接 SSE
- ✅ 控制台：只有一条警告日志
- ✅ 登录成功后：应用层主动调用 `sseClient.connect()`

---

## 🐛 问题 2：X-Skip-Auth 没有真正起作用

### 问题描述

用户疑问：

> "如果 refresh 不需要认证，那么是不是也不需要 x-skip-auth 了？"
> "x-skip-auth 头是怎么起作用的？"

### 发现的真相

**X-Skip-Auth 实际上没有被检查！**

#### 原始代码（有问题）

```typescript
// apps/web/src/shared/api/core/interceptors.ts

private setupRequestInterceptors(): void {
  this.instance.interceptors.request.use((config) => {
    // ❌ 没有检查 X-Skip-Auth 标记！

    // 直接添加认证头
    if (this.config.enableAuth && AuthManager.isAuthenticated()) {
      const token = AuthManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  });
}

// refreshAccessToken() 中添加了 X-Skip-Auth
const response = await this.instance.post(
  '/auth/refresh',
  { refreshToken },
  {
    headers: {
      'X-Skip-Auth': 'true', // ← 添加了，但没人检查！
    },
  }
);
```

**结果：**

- 刷新请求虽然设置了 `X-Skip-Auth: true`
- 但请求拦截器根本不检查这个头
- 仍然会添加 `Authorization: Bearer <expired_token>`
- 实际发送：既有过期的 Access Token，又有 Refresh Token

### 为什么之前能工作？

因为后端的 `/auth/refresh` 端点**没有使用 authMiddleware**：

```typescript
// ✅ refresh 路由不需要认证中间件
router.post('/refresh', SessionManagementController.refreshSession);

// ❌ 如果加了中间件，就会验证 Authorization header（失败）
router.post('/refresh', authMiddleware, SessionManagementController.refreshSession);
```

**所以：**

- 即使请求带了过期的 `Authorization` header
- 后端不检查它，只验证 body 中的 `refreshToken`
- 刷新仍然成功

**但这是有风险的：**

1. 如果后端误加了 authMiddleware，刷新会失败
2. 浪费带宽发送无用的过期 token
3. X-Skip-Auth 形同虚设

### 修复方案

#### 在请求拦截器中检查 X-Skip-Auth

```typescript
// ✅ 修复后
private setupRequestInterceptors(): void {
  this.instance.interceptors.request.use((config) => {
    // ✅ 检查 X-Skip-Auth 标记
    if (config.headers?.['X-Skip-Auth'] === 'true') {
      // 移除标记（不需要发送到服务器）
      delete config.headers['X-Skip-Auth'];

      // 🎯 直接返回，不添加 Authorization header
      return config;
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
```

**文件：** `/workspaces/DailyUse/apps/web/src/shared/api/core/interceptors.ts` (第 214 行)

### X-Skip-Auth 的完整工作流程

```
1. 用户请求 /api/goals，Access Token 过期
   ↓ 请求拦截器：添加 Authorization: Bearer <expired_token>
   ↓ 发送请求
   ↓
2. 服务器返回 401 Unauthorized
   ↓ 响应拦截器：捕获错误
   ↓
3. 调用 refreshAccessToken()
   ↓ 创建刷新请求：
   ↓   POST /auth/refresh
   ↓   Headers: { 'X-Skip-Auth': 'true' }
   ↓   Body: { refreshToken }
   ↓
4. 请求拦截器：
   ├─ 检测到 X-Skip-Auth = 'true'
   ├─ 删除 X-Skip-Auth 头
   └─ 🎯 跳过添加 Authorization header
   ↓
5. 实际发送到服务器：
   POST /auth/refresh
   Headers: { 'Content-Type': 'application/json' }  // ✅ 没有 Authorization
   Body: { refreshToken }                           // ✅ 只有 Refresh Token
   ↓
6. 服务器：
   ├─ 不经过 authMiddleware（路由配置）
   ├─ 从 body 提取 refreshToken
   ├─ 验证 refreshToken
   └─ 返回新的 Access Token + Refresh Token
   ↓
7. 响应拦截器：
   ├─ 更新本地 Tokens
   └─ 重试原始请求（/api/goals）
```

### 效果对比

| 修复前（X-Skip-Auth 无效）         | 修复后（X-Skip-Auth 生效）           |
| ---------------------------------- | ------------------------------------ |
| 刷新请求带过期的 Authorization     | 刷新请求不带 Authorization           |
| 浪费带宽                           | 节省带宽                             |
| 依赖后端不检查 Authorization       | 符合设计意图                         |
| 如果后端加了 authMiddleware 会失败 | 即使后端加了 authMiddleware 也能工作 |

---

## 📚 为什么需要 X-Skip-Auth？

### 回答用户的问题

**Q: "如果 refresh 不需要认证，那么是不是也不需要 x-skip-auth 了？"**

**A: 不是！虽然后端的 `/auth/refresh` 端点不需要 authMiddleware，但前端的请求拦截器会自动给所有请求添加 Authorization header。**

```typescript
// 前端拦截器的默认行为
interceptor.request.use((config) => {
  // 🤔 对于 /auth/refresh 请求，这个 token 已经过期了
  // 但拦截器不知道，它会自动添加
  config.headers.Authorization = `Bearer ${getAccessToken()}`;
  return config;
});
```

**如果不用 X-Skip-Auth：**

1. 前端发送刷新请求
2. 请求拦截器自动添加过期的 Access Token
3. 服务器收到：`Authorization: Bearer <expired>` + `body: { refreshToken }`
4. 如果后端有任何中间件检查 Authorization，会失败
5. 即使不检查，也是浪费

**使用 X-Skip-Auth：**

1. 前端发送刷新请求，添加 `X-Skip-Auth: true`
2. 请求拦截器检测到标记，**跳过添加 Authorization**
3. 服务器只收到：`body: { refreshToken }`
4. 干净、清晰、符合设计意图

### X-Skip-Auth 的设计目的

**它是前端内部的"暗号"：**

- 告诉请求拦截器："这个请求很特殊，别管它"
- 不是给服务器看的（会被删除）
- 是前端不同层次之间的通信机制

**类比：**

```
请求拦截器 = 门卫，看到每个人都会检查工牌
X-Skip-Auth = 特殊通行证，告诉门卫"这个人是去办理新工牌的，不要检查"
```

---

## ✅ 修复总结

### 修改的文件

1. **SSEClient.ts** (2 处修改)
   - ✅ `connectInBackground()`: 移除无 token 时的自动重试
   - ✅ `checkAndReconnect()`: 添加登录状态检查

2. **interceptors.ts** (1 处修改)
   - ✅ `setupRequestInterceptors()`: 添加 X-Skip-Auth 检查逻辑

3. **TOKEN_REFRESH_AND_SKIP_AUTH_HEADER.md** (1 处更新)
   - ✅ 更新 X-Skip-Auth 的工作原理说明

### 修复效果

| 问题        | 修复前            | 修复后              |
| ----------- | ----------------- | ------------------- |
| SSE 连接    | ❌ 登录页无限重试 | ✅ 登录页不尝试连接 |
| X-Skip-Auth | ❌ 形同虚设       | ✅ 真正起作用       |
| 刷新请求    | ❌ 带过期 token   | ✅ 干净的请求       |
| 控制台日志  | ❌ 大量错误       | ✅ 清爽安静         |

---

## 🧪 测试验证

### 1. 测试 SSE 不在登录页连接

```bash
# 打开应用登录页
# 检查控制台：应该只有一条警告
[SSE Client] 缺少认证 token，无法建立 SSE 连接（等待用户登录）

# 不应该有重复的连接尝试
```

### 2. 测试 X-Skip-Auth 生效

```javascript
// 浏览器 Console

// 1. 登录
// 2. 删除 access_token 模拟过期
localStorage.removeItem('access_token');

// 3. 发起需要认证的请求
fetch('http://localhost:3888/api/v1/goals', {
  headers: { Authorization: 'Bearer fake-token' },
});

// 4. 观察 Network 面板中的 /auth/refresh 请求
// ✅ 修复后：Request Headers 中没有 Authorization
// ❌ 修复前：Request Headers 中有 Authorization: Bearer <expired>
```

### 3. 完整流程测试

```bash
# 使用测试脚本
./test-token-refresh.sh

# 预期结果：
# ✅ 登录成功
# ✅ Token 刷新成功
# ✅ 新的 Access Token 可用
# ✅ 控制台日志清晰
```

---

## 💡 经验总结

### 1. SSE 连接时机

**原则：** SSE 连接应该在用户登录后建立，而不是应用启动时。

```typescript
// ❌ 错误：应用启动就连接
app.onMounted(() => {
  sseClient.connect();
});

// ✅ 正确：登录成功后连接
async function login() {
  await authService.login(username, password);
  await sseClient.connect(); // 登录后才连接
}
```

### 2. 拦截器标记的实现

**原则：** 如果添加了特殊标记，必须有对应的检查逻辑。

```typescript
// ❌ 错误：只添加标记，不检查
config.headers['X-Special'] = 'true'; // 没人检查这个

// ✅ 正确：添加标记 + 检查标记
// 1. 添加标记
config.headers['X-Skip-Auth'] = 'true';

// 2. 在拦截器中检查
if (config.headers?.['X-Skip-Auth'] === 'true') {
  delete config.headers['X-Skip-Auth'];
  return config; // 跳过后续逻辑
}
```

### 3. Token Refresh 最佳实践

**核心：** Refresh Token 在请求体中，不在 Authorization header 中。

```typescript
// ✅ 正确的刷新流程
1. Refresh 端点不使用 authMiddleware
2. 前端发送：body: { refreshToken }，不带 Authorization
3. 后端验证：从 body 提取 refreshToken，查询数据库
4. 返回新 Tokens

// ❌ 错误的刷新流程
1. Refresh 端点使用 authMiddleware
2. 前端发送：既有 Authorization，又有 body: { refreshToken }
3. 后端先验证 Authorization（失败，因为过期）
4. 请求被拒绝
```

---

## 📖 相关文档

- **Token 认证完整指南**: `/docs/authentication/TOKEN_REFRESH_AND_SKIP_AUTH_HEADER.md`
- **Token 刷新修复总结**: `/TOKEN_REFRESH_FIX_SUMMARY.md`
- **测试脚本**: `/test-token-refresh.sh`

---

**修复完成！** 🎉

现在的系统：

- ✅ SSE 只在登录后连接
- ✅ X-Skip-Auth 真正起作用
- ✅ Token 刷新流程干净清晰
- ✅ 控制台日志合理友好
