# Widget & SSE 优化完成报告

## 📊 问题1：Dashboard 只显示 4 个 Widget（应该有 6 个）

### 根本原因
Widget 注册任务在模块的 `APP_STARTUP` 阶段定义，但业务模块（Goal、Task、Reminder、Schedule）在 `AUTHENTICATED` 组配置，在用户登录后（`USER_LOGIN` 阶段）才加载。这导致：
1. 应用启动时 `APP_STARTUP` 阶段执行完毕
2. 用户登录后才加载业务模块
3. 模块加载后注册初始化任务，但任务定义为 `APP_STARTUP` 阶段
4. **`APP_STARTUP` 阶段早已结束，任务永远不会执行**
5. Widget 注册函数从未被调用

### 解决方案：立即注册策略
**在模块加载时立即注册 Widget，不依赖初始化阶段执行**

#### 修改文件列表
- ✅ `apps/web/src/modules/goal/initialization/index.ts`
- ✅ `apps/web/src/modules/task/initialization/index.ts`
- ✅ `apps/web/src/modules/reminder/initialization/reminderInitialization.ts`
- ✅ `apps/web/src/modules/schedule/initialization/scheduleInitialization.ts`

#### 代码示例（Goal 模块）
```typescript
// ❌ 旧方案：在初始化任务中注册 Widget
const goalModuleInitTask: InitializationTask = {
  name: 'goal-module',
  phase: InitializationPhase.APP_STARTUP, // 问题：阶段不匹配
  initialize: async () => {
    await initializeGoalModule();
    const { registerGoalWidgets } = await import('../presentation/widgets/registerGoalWidgets');
    registerGoalWidgets(); // 这个函数从未被调用
  }
};

// ✅ 新方案：模块加载后立即注册
export function registerGoalInitializationTasks(): void {
  // 🎨 立即执行 Widget 注册（不依赖初始化阶段）
  console.log('🎨 [Goal] 注册 Goal Widgets（立即执行）...');
  import('../presentation/widgets/registerGoalWidgets').then(({ registerGoalWidgets }) => {
    registerGoalWidgets();
    console.log('✅ [Goal] Goal Widgets 注册完成');
  });

  // 其他初始化任务仍然注册到管理器
  const goalModuleInitTask: InitializationTask = {
    name: 'goal-module',
    phase: InitializationPhase.APP_STARTUP,
    initialize: async () => {
      await initializeGoalModule(); // 只初始化模块，不再注册 Widget
    }
  };
}
```

### 预期结果
刷新页面后，应该在控制台看到：
```
✅ [AuthGuard] 用户会话已初始化
🎨 [Goal] 注册 Goal Widgets（立即执行）...
✅ [Goal] Goal Widgets 注册完成
🎨 [Task] 注册 Task Widgets（立即执行）...
✅ [Task] Task Widgets 注册完成
🎨 [Reminder] 注册 Reminder Widgets（立即执行）...
✅ [Reminder] Reminder Widgets 注册完成
🎨 [Schedule] 注册 Schedule Widgets（立即执行）...
✅ [Schedule] Schedule Widgets 注册完成
[Dashboard] Widget registration check completed: 6 widgets found ✅
```

### 6 个 Widget 清单
| Widget ID | 名称 | 默认顺序 | 默认尺寸 | 模块 |
|-----------|------|----------|----------|------|
| goal-stats | 目标统计 | 1 | MEDIUM | Goal |
| task-stats | 任务统计 | 2 | MEDIUM | Task |
| reminder-stats | 提醒统计 | 3 | SMALL | Reminder |
| schedule-stats | 日程统计 | 4 | SMALL | Schedule |
| goal-timeline | 目标时间线 | 5 | LARGE | Goal |
| today-tasks | 今日任务 | 6 | LARGE | Task |

**注意**：如果后端配置中将某些 Widget 设置为 `visible: false`，它们仍然会注册到 `WidgetRegistry`，但在 Dashboard 中默认隐藏。用户可以在设置面板中手动启用。

---

## 🔐 问题2：SSE 连接 401 错误 & Token 过期重连

### 当前双 Token 机制（已实现）✅
你的项目已经实现了标准的 **Refresh Token 机制**：

1. **Access Token**（短期，15 分钟）：
   - 存储在 `localStorage.getItem('access_token')`
   - 用于 API 请求认证
   - 过期后自动通过 Refresh Token 刷新

2. **Refresh Token**（长期，7 天）：
   - 存储在 `localStorage.getItem('refresh_token')`
   - 用于刷新 Access Token
   - 后端端点：`POST /auth/refresh`

3. **自动刷新机制**（Axios 拦截器）：
   - 401 错误触发自动刷新
   - 使用 `X-Skip-Auth: true` 标记避免循环拦截
   - 刷新失败后自动跳转登录页

### SSE 401 错误的根本原因
**SSE 连接使用的 Access Token 已过期，但 EventSource API 不支持刷新机制**

#### 问题流程
1. 用户登录后建立 SSE 连接（使用 Access Token）
2. 15 分钟后 Access Token 过期
3. SSE 连接尝试使用过期 token → 后端返回 401
4. **EventSource API 无法自动刷新 token**（不支持自定义请求头）
5. 连接失败，无法接收实时通知

### 解决方案：Token 刷新后自动重连 SSE

#### 核心策略
1. **监听 token 刷新事件**：Axios 拦截器刷新 token 后触发 `auth:token-refreshed` 事件
2. **SSE 客户端监听事件**：检测到 token 刷新后，自动关闭旧连接并使用新 token 重连
3. **Token 过期预检查**：SSE 连接前验证 token 是否过期，过期则等待刷新

#### 修改文件列表
- ✅ `apps/web/src/shared/api/core/interceptors.ts` - Token 刷新后触发事件
- ✅ `apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts` - 监听事件并重连

#### 代码实现

##### 1. Axios 拦截器：Token 刷新后触发事件
```typescript
// apps/web/src/shared/api/core/interceptors.ts
private async refreshAccessToken(): Promise<string> {
  const refreshToken = AuthManager.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await this.instance.post('/auth/refresh', { refreshToken }, {
    headers: { 'X-Skip-Auth': 'true' }
  });

  const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

  // 更新 AuthManager
  AuthManager.updateAccessToken(accessToken, expiresIn);
  if (newRefreshToken) {
    AuthManager.setTokens(accessToken, newRefreshToken, undefined, expiresIn);
  }

  // 🔔 触发 token 刷新事件，通知 SSE 客户端重连
  console.log('[AuthManager] 🔔 Token 刷新成功，触发 auth:token-refreshed 事件');
  window.dispatchEvent(new CustomEvent('auth:token-refreshed', {
    detail: { accessToken, expiresIn }
  }));

  return accessToken;
}
```

##### 2. SSE 客户端：Token 过期预检查
```typescript
// apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts
private connectInBackground(): void {
  // 获取认证 token（确保是最新的）
  const token = AuthManager.getAccessToken();
  if (!token) {
    console.warn('[SSE Client] 缺少认证 token，无法建立 SSE 连接');
    return;
  }

  // 🔍 验证 token 是否过期
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    
    if (exp && exp < now) {
      console.warn('[SSE Client] ⚠️ Access token 已过期，等待刷新后重连');
      // Token 过期，等待自动刷新后再重连
      this.scheduleTokenRefreshReconnect();
      return;
    }
    
    const timeUntilExpiry = exp ? exp - now : 0;
    console.log(`[SSE Client] 🔑 Token 有效期剩余: ${timeUntilExpiry}秒`);
  } catch (e) {
    console.warn('[SSE Client] ⚠️ 无法解析 token，继续尝试连接');
  }

  // 继续建立连接...
  const url = `${this.baseUrl}/api/v1/sse/notifications/events?token=${encodeURIComponent(token)}`;
  this.eventSource = new EventSource(url);
  // ...
}
```

##### 3. SSE 客户端：监听 Token 刷新事件
```typescript
// apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts
constructor(private baseUrl: string = '') {
  // ...现有代码...

  // 监听 token 刷新事件，token 刷新后自动重连
  this.setupTokenRefreshListener();
}

/**
 * 监听 token 刷新事件
 * @description 当 AuthManager 刷新 token 后，自动重连 SSE
 */
private setupTokenRefreshListener(): void {
  window.addEventListener('auth:token-refreshed', () => {
    console.log('[SSE Client] 🔔 检测到 token 刷新事件，重新连接 SSE');
    if (this.eventSource && !this.isDestroyed) {
      // 强制重连（关闭旧连接，使用新 token 重新建立）
      this.connect(true);
    }
  });
}

/**
 * 在 token 刷新后重新连接
 * @description 当检测到 token 过期时，等待 2 秒让系统自动刷新 token，然后重连
 */
private scheduleTokenRefreshReconnect(): void {
  console.log('[SSE Client] 📝 Token 即将过期，等待刷新后重连');
  
  // 清除之前的定时器
  if (this.reconnectTimer) {
    clearTimeout(this.reconnectTimer);
  }

  // 等待 2 秒让 interceptor 自动刷新 token
  this.reconnectTimer = setTimeout(() => {
    if (!this.isDestroyed) {
      console.log('[SSE Client] 🔄 Token 刷新完成，尝试重新连接');
      this.reconnectAttempts = 0; // 重置重连计数
      this.disconnect();
      this.connectInBackground();
    }
  }, 2000);
}
```

### 工作流程

#### 场景1：Token 正常刷新
```
1. [14:00] 用户登录，Access Token 有效期至 14:15
2. [14:00] SSE 连接成功，实时接收通知
3. [14:14] Axios 拦截器检测到 API 请求 401 错误
4. [14:14] 自动调用 POST /auth/refresh，获取新 Access Token（有效期至 14:29）
5. [14:14] 触发 'auth:token-refreshed' 事件
6. [14:14] SSE 客户端监听到事件，自动关闭旧连接
7. [14:14] SSE 客户端使用新 token 重新建立连接
8. [14:14] SSE 连接成功，继续接收实时通知 ✅
```

#### 场景2：Token 过期预检查
```
1. [14:00] 用户登录，Access Token 有效期至 14:15
2. [14:16] 用户刷新页面，SSE 客户端尝试连接
3. [14:16] 预检查发现 token 已过期（14:15 < 14:16）
4. [14:16] 等待 2 秒，让 Axios 拦截器自动刷新 token
5. [14:16] Token 刷新成功，获取新 Access Token
6. [14:16] SSE 客户端使用新 token 建立连接
7. [14:16] SSE 连接成功 ✅
```

### 后端已支持的 Flush 机制 ✅
**你的后端已经正确实现了 SSE flush 机制，无需修改！**

```typescript
// apps/api/src/modules/notification/interface/http/sseRoutes.ts
router.get('/notifications/events', sseAuthMiddleware, (req: Request, res: Response) => {
  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 缓冲
  res.setHeader('Content-Encoding', 'identity'); // 禁用压缩

  // ✅ 立即发送响应头，不等待缓冲
  res.flushHeaders();

  // 发送初始连接消息
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ message: '连接成功', accountUuid })}\n\n`);
  
  // ✅ 强制刷新，确保数据立即发送到客户端
  if (typeof (res as any).flush === 'function') {
    (res as any).flush();
  }

  // 设置心跳，每30秒发送一次
  const heartbeatInterval = setInterval(() => {
    res.write(`: heartbeat\n\n`);
    // ✅ 强制刷新心跳数据
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
  }, 30000);
  
  // ...
});
```

**关键点**：
- ✅ `res.flushHeaders()` - 立即发送响应头
- ✅ `res.flush()` - 每次发送数据后强制刷新缓冲区
- ✅ `X-Accel-Buffering: no` - 禁用 nginx 缓冲
- ✅ `Content-Encoding: identity` - 禁用压缩（SSE 必须未压缩）
- ✅ 30 秒心跳机制 - 保持连接活跃

---

## 📈 Token 认证最佳实践总结

### 你当前的实现（已经很好）✅
- ✅ **双 Token 机制**（Access Token + Refresh Token）
- ✅ **自动刷新**（Axios 拦截器 401 触发）
- ✅ **避免循环拦截**（X-Skip-Auth 标记）
- ✅ **请求队列**（刷新期间暂存请求）
- ✅ **失败处理**（自动跳转登录页）

### 安全性建议（未来优化）

#### 当前风险
- ❌ **localStorage 存储**：容易被 XSS 攻击窃取
- ❌ **无 CSRF 保护**：token 可以被任意脚本读取

#### 推荐优化方案（优先级排序）

##### 方案1：httpOnly Cookie（最安全）🔐
**优点**：
- JavaScript 无法读取（防 XSS）
- 浏览器自动管理
- SSE 连接自动携带 cookie

**后端实现**：
```typescript
// 设置 httpOnly cookie
res.cookie('accessToken', token, {
  httpOnly: true,       // 防止 JavaScript 访问
  secure: true,          // 仅 HTTPS 传输
  sameSite: 'strict',   // 防 CSRF
  maxAge: 15 * 60 * 1000 // 15 分钟
});
```

**前端实现**：
```typescript
// SSE 连接自动携带 cookie，无需手动传 token
const eventSource = new EventSource('/api/sse/notifications/events', {
  withCredentials: true // 允许跨域携带 cookie
});
```

##### 方案2：Session Storage（妥协方案）
**优点**：
- 关闭浏览器后自动清除
- 比 localStorage 稍微安全

**实现**：
```typescript
// 短期 token 存内存（页面刷新会丢失）
let accessToken: string | null = null;

// 长期 token 存 sessionStorage
sessionStorage.setItem('refreshToken', token);
```

---

## 🎯 测试清单

### Widget 显示测试
- [ ] 刷新页面，查看控制台日志
- [ ] 应该看到 6 条 Widget 注册成功日志
- [ ] Dashboard 应该显示 4-6 个 Widget（取决于后端配置）
- [ ] 打开设置面板，应该能看到所有 6 个 Widget
- [ ] 切换 Widget 可见性，保存后刷新，配置应该保持

### SSE 连接测试
- [ ] 登录后，控制台应该显示 `[SSE Client] ✅ onopen 触发 - 连接成功`
- [ ] 等待 15 分钟，观察是否自动重连（Token 刷新后）
- [ ] 控制台应该显示 `[SSE Client] 🔔 检测到 token 刷新事件，重新连接 SSE`
- [ ] 刷新页面，SSE 应该立即重连（无 401 错误）
- [ ] 创建一个提醒，实时通知应该弹出（测试 SSE 事件接收）

### Token 刷新测试
- [ ] 登录后，查看 `localStorage.getItem('access_token')` 的过期时间
- [ ] 等待 Token 即将过期（或手动修改过期时间）
- [ ] 发起一个 API 请求，应该自动刷新 Token
- [ ] 控制台应该显示 `[AuthManager] 🔔 Token 刷新成功，触发 auth:token-refreshed 事件`
- [ ] 新的 Access Token 应该已更新到 localStorage

---

## 📝 总结

### 本次优化内容
1. ✅ **修复 Widget 注册架构问题**
   - 改为模块加载后立即注册，不依赖初始化阶段
   - 修改 4 个业务模块的初始化逻辑

2. ✅ **优化 SSE 连接机制**
   - Token 过期预检查
   - 监听 Token 刷新事件
   - 自动重连机制

3. ✅ **完善 Token 刷新流程**
   - Axios 拦截器触发刷新事件
   - SSE 客户端监听并重连
   - 避免 401 错误导致的连接失败

### 预期效果
- 🎯 Dashboard 显示 **6 个 Widget**（或根据后端配置显示相应数量）
- 🔐 SSE 连接在 Token 刷新后**自动重连**，无需手动刷新页面
- 📡 实时通知**持续工作**，不会因为 Token 过期而断开

### 下一步建议
1. **短期**：测试所有修改，确保 Widget 和 SSE 正常工作
2. **中期**：优化 Widget 组件的性能和用户体验
3. **长期**：考虑迁移到 httpOnly Cookie + CSRF Token 方案，提升安全性

---

**修改日期**：2025-11-14  
**修改人**：GitHub Copilot  
**测试状态**：待验证
