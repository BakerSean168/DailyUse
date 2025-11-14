# Token 自动刷新测试指南

## 🎯 测试目标

验证基于事件总线的 Token 自动刷新机制是否正常工作。

## 🚀 快速测试步骤

### 1. 启动前端应用

```bash
cd apps/web
npm run dev
```

### 2. 验证初始化（打开浏览器控制台）

查找以下日志：

```
✅ [Infrastructure] Token 刷新处理器已初始化
[TokenRefreshHandler] 🚀 初始化 Token 刷新处理器
[TokenRefreshHandler] ✅ 事件监听器已注册
```

如果看到这些日志，说明 Token 刷新处理器已正确初始化。

### 3. 登录系统

正常登录，确保有有效的 Access Token 和 Refresh Token（Cookie）。

### 4. 测试场景 A：模拟 Token 过期（自动刷新）

在浏览器控制台执行：

```javascript
// 1. 删除 Access Token，模拟过期
localStorage.removeItem('access_token');
sessionStorage.removeItem('access_token');

// 2. 触发任何 API 请求（例如刷新 Dashboard）
location.reload();
```

**预期结果**：

✅ 控制台日志：
```
[API Info] 🔐 检测到 401 错误，暂停请求并请求刷新 Token
[TokenRefreshHandler] 🔔 收到 Token 刷新请求
[TokenRefreshHandler] 🔄 开始刷新 Token...
[TokenRefreshHandler] ✅ Token 刷新成功，有效期: 3600 秒
[API Info] 🔄 Token 刷新成功，重试队列中的请求 (queueSize: X)
[API Info] 🔄 重试请求（从队列）: /api/xxx
[SSE Client] 🔔 检测到 token 刷新事件，重新连接 SSE
[SSE Client] 🚀 正在建立连接到: /api/v1/sse/notifications/events?token=...
[SSE Client] ✅ onopen 触发 - 连接成功
```

✅ 页面正常加载，无 401 错误  
✅ SSE 连接成功，无报错  
✅ Dashboard 数据正常显示

### 5. 测试场景 B：清除所有 Token（跳转登录）

在浏览器控制台执行：

```javascript
// 清除所有 token 和 cookie
localStorage.clear();
sessionStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
});

// 触发任何 API 请求
location.reload();
```

**预期结果**：

✅ 控制台日志：
```
[TokenRefreshHandler] ❌ Token 刷新失败
[TokenRefreshHandler] ⚠️ Refresh token 缺失，请重新登录
```

✅ 自动跳转到登录页（`/auth/login`）  
✅ URL 包含 reason 参数：`?reason=missing-refresh-token`

### 6. 测试场景 C：多个请求同时 401

在浏览器控制台执行：

```javascript
// 1. 删除 Access Token
localStorage.removeItem('access_token');
sessionStorage.removeItem('access_token');

// 2. 同时发起多个 API 请求
const apiClient = (await import('@/shared/api')).apiClient;

// 并发 10 个请求
Promise.all([
  apiClient.get('/goal/instances'),
  apiClient.get('/task/instances'),
  apiClient.get('/notification/instances'),
  apiClient.get('/repository/instances'),
  apiClient.get('/reminder/instances'),
  apiClient.get('/goal/instances'),
  apiClient.get('/task/instances'),
  apiClient.get('/notification/instances'),
  apiClient.get('/repository/instances'),
  apiClient.get('/reminder/instances'),
]).then(() => {
  console.log('✅ 所有请求成功');
}).catch(err => {
  console.error('❌ 请求失败', err);
});
```

**预期结果**：

✅ 控制台日志：
```
[API Info] 🔐 检测到 401 错误，暂停请求并请求刷新 Token
[API Info] ⏸️ Token 正在刷新中，请求加入队列 (queueSize: 1)
[API Info] ⏸️ Token 正在刷新中，请求加入队列 (queueSize: 2)
...
[API Info] ⏸️ Token 正在刷新中，请求加入队列 (queueSize: 9)
[TokenRefreshHandler] 🔔 收到 Token 刷新请求
[TokenRefreshHandler] 🔄 开始刷新 Token...
[TokenRefreshHandler] ✅ Token 刷新成功，有效期: 3600 秒
[API Info] 🔄 Token 刷新成功，重试队列中的请求 (queueSize: 10)
[API Info] 🔄 重试请求（从队列）: /api/goal/instances
[API Info] 🔄 重试请求（从队列）: /api/task/instances
...
✅ 所有请求成功
```

✅ **只执行一次 token 刷新**（防止重复刷新）  
✅ 所有 10 个请求都成功重试  
✅ 没有报错

## 🔍 常见问题排查

### 问题 1：Token 刷新处理器未初始化

**症状**：控制台没有 `[TokenRefreshHandler]` 相关日志

**解决方案**：
1. 检查 `AppInitializationManager.ts` 是否注册了 `token-refresh-handler` 任务
2. 确认 `main.ts` 正确导入并调用了 `AppInitializationManager.initializeApp()`
3. 重新启动前端应用

### 问题 2：401 错误后没有自动刷新

**症状**：收到 401 错误，但没有触发 token 刷新

**可能原因**：
1. Token 刷新处理器未初始化（参考问题 1）
2. Refresh Token 缺失（Cookie 中没有 `refreshToken`）
3. 请求被识别为认证请求（如 `/auth/login`），跳过了刷新逻辑

**解决方案**：
1. 检查 Cookie 中是否有 `refreshToken`
2. 确认请求 URL 不是认证相关接口
3. 查看浏览器控制台，搜索 `auth:token-refresh-requested` 事件

### 问题 3：SSE 仍然报 401 错误

**症状**：Token 刷新成功，但 SSE 连接仍然 401

**可能原因**：
1. SSE 客户端没有监听 `auth:token-refreshed` 事件
2. SSE 重连逻辑有问题
3. 新 token 还未生效（时间差）

**解决方案**：
1. 检查 SSE 客户端的 `setupTokenRefreshListener()` 方法
2. 查看控制台，确认 `[SSE Client] 🔔 检测到 token 刷新事件` 日志
3. 手动执行 `sseClient.connect(true)` 强制重连

### 问题 4：刷新 token 后请求仍然失败

**症状**：Token 刷新成功，但重试请求仍然 401

**可能原因**：
1. 新 token 未正确更新到 `localStorage`
2. 队列中的请求配置丢失
3. Axios 拦截器未正确处理队列

**解决方案**：
1. 检查 `AuthManager.updateAccessToken()` 是否正确保存 token
2. 验证队列中的请求配置是否包含完整的 `config` 对象
3. 查看 `processQueue()` 方法，确认正确设置了 `Authorization` header

## 📊 成功指标

- ✅ Token 刷新处理器正确初始化
- ✅ 401 错误自动触发 token 刷新
- ✅ 多个请求只触发一次 refresh 调用
- ✅ 刷新成功后所有请求自动重试
- ✅ SSE 连接在 token 刷新后自动重连
- ✅ Refresh token 过期时优雅降级到登录页
- ✅ 错误提示友好，用户体验良好

## 🎉 验证完成

如果所有测试场景都通过，说明 Token 自动刷新机制已正确实现！

用户现在可以：
- 无感知地自动刷新 token（不需要重新登录）
- 在 token 过期时继续使用应用（自动恢复）
- 在 refresh token 过期时看到友好提示（优雅降级）

## 📚 相关文档

- `TOKEN_REFRESH_EVENT_BUS_IMPLEMENTATION.md` - 完整实现文档
- `HTTPONLY_COOKIE_MIGRATION_GUIDE.md` - httpOnly Cookie 迁移指南
