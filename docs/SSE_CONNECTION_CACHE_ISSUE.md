# SSE 连接问题（缓存与压缩）

## 问题详情

### 现象描述
在开发环境中使用 Server-Sent Events (SSE) 实现实时通知推送时，遇到了以下问题：

1. **前端连接状态异常**
   - EventSource 的 `readyState` 一直停留在 `0`（CONNECTING 状态）
   - 无法触发 `onopen` 事件
   - 连接超时后自动断开

2. **后端无法推送消息**
   - 前端显示"连接成功"
   - 后端日志显示"连接不存在"
   ```
   [WARN] [SSERoutes] [SSE Manager] 连接不存在
   [WARN] [NotificationApplicationService] ⚠️ [SSE推送] 用户未连接SSE，推送失败
   ```

3. **网络层问题**
   - 响应头显示 `content-encoding: br`（Brotli 压缩）
   - SSE 流被压缩后无法正常工作
   - 跨域请求问题（localhost:5173 → localhost:3888）

### 根本原因

SSE 连接失败的核心问题是 **多层压缩和缓冲**：

1. **Vite 开发服务器压缩**：Vite 默认启用压缩中间件，会对代理后的响应进行 Brotli 压缩
2. **Express 后端压缩**：Express 使用 compression 中间件压缩所有响应
3. **Node.js 响应缓冲**：Node.js 默认会缓冲响应数据，不会立即发送
4. **跨域问题**：前端 5173 端口直接请求后端 3888 端口触发 CORS

这些因素导致：
- SSE 的 `text/event-stream` 流被压缩破坏
- 初始连接消息被缓冲，无法触发 `onopen` 事件
- 后端虽然创建了连接对象，但由于流被破坏，连接立即失效
- 前端看到"连接成功"消息（因为最终收到了数据），但后端连接已经丢失

## 解决方案

### 1. 配置 Vite 代理避免跨域

**文件**：`apps/web/vite.config.ts`

```typescript
export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 5173,
      // 🔑 关键：完全禁用 Vite 的压缩中间件
      compress: false,
      proxy: {
        '/api': {
          target: 'http://localhost:3888',
          changeOrigin: true,
          secure: false,
          ws: true,
          // 禁用代理层的压缩
          compress: false,
          // SSE 特定配置
          onProxyRes: (proxyRes: any, req: any, res: any) => {
            if (req.url?.includes('/sse/')) {
              // 删除可能存在的压缩相关头
              delete proxyRes.headers['content-encoding'];
              // 防止下游再次压缩
              proxyRes.headers['x-no-compression'] = 'true';
            }
          },
        },
      },
    },
  };
});
```

**关键点**：
- `server.compress: false` - 完全禁用 Vite 服务器的压缩
- `proxy['/api'].compress: false` - 禁用代理层的压缩
- `onProxyRes` 回调中删除 `content-encoding` 头

### 2. 后端过滤 SSE 路由的压缩

**文件**：`apps/api/src/app.ts`

```typescript
// 压缩中间件 - 排除 SSE 路由
app.use(
  compression({
    filter: (req: Request, res: Response): boolean => {
      // SSE 路由不压缩
      if (req.path.includes('/sse/')) {
        return false;
      }
      // 其他路由使用默认压缩策略
      return compression.filter(req, res);
    },
  })
);
```

**原理**：通过 `filter` 函数让 compression 中间件跳过所有 `/sse/` 路径的请求。

### 3. 性能监控中间件跳过 SSE

**文件**：`apps/api/src/middleware/performance.middleware.ts`

```typescript
export const performanceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // SSE 路由直接放行，避免在响应结束后设置 header
  if (req.path.includes('/sse/')) {
    return next();
  }
  
  // ... 正常的性能监控逻辑
};
```

**原因**：SSE 连接是长连接，响应不会结束，性能监控中间件在连接关闭后设置 header 会报错。

### 4. 强制刷新响应缓冲

**文件**：`apps/api/src/modules/notification/interface/http/sseRoutes.ts`

```typescript
router.get('/events', authenticateJWT, async (req: Request, res: Response) => {
  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  
  // 🔑 关键：立即发送响应头，不等待缓冲
  res.flushHeaders();

  // 发送初始连接事件
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ message: '连接成功', accountUuid })}\n\n`);
  
  // 🔑 关键：立即刷新数据，触发前端 onopen 事件
  res.flush();

  // 注册连接到 SSE Manager
  sseManager.addConnection(accountUuid, res);
  
  // ... 处理连接关闭
});
```

**关键点**：
- `res.flushHeaders()` - 立即发送 HTTP 响应头，不等待 Node.js 缓冲
- `res.flush()` - 立即刷新数据到客户端，触发 `onopen` 事件

### 5. 前端使用相对路径

**文件**：`apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts`

```typescript
export class SSEClient {
  connect(force = false): void {
    const token = this.authService.getAccessToken();
    if (!token) return;

    // 使用相对路径，通过 Vite 代理访问
    const url = `/api/v1/sse/notifications/events?token=${token}`;
    
    this.eventSource = new EventSource(url);
    
    // 添加连接超时处理
    this.connectionTimeout = window.setTimeout(() => {
      if (this.eventSource?.readyState === EventSource.CONNECTING) {
        console.warn('[SSE] 连接超时，尝试重连');
        this.eventSource?.close();
        this.reconnect();
      }
    }, 10000);
    
    // ... 事件处理
  }
}
```

**改进点**：
- 使用相对路径 `/api/...` 而不是 `http://localhost:3888/...`
- 通过 Vite 代理避免跨域
- 添加 10 秒连接超时机制

### 6. 避免前端重复连接（⭐ 关键）

**问题**：前端多处调用 `sseClient.connect()` 导致重复连接，后端 SSEManager 只保留最新连接，旧连接被关闭但前端不知道。

**解决方案**：确保全局只有一个连接入口点

**文件 1**：`apps/web/src/modules/notification/initialization/sseInitialization.ts`
```typescript
export function registerSSEInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // ⚠️ 禁用重复的连接任务
  // 原因：NotificationInitializationManager 已统一管理 SSE 连接
  /*
  const sseConnectionTask: InitializationTask = {
    // ... 连接逻辑
  };
  const sseHealthCheckTask: InitializationTask = {
    // ... 健康检查逻辑
  };
  */

  // 仅注册事件监听器任务
  manager.registerTask(sseEventHandlersTask);
  
  console.log('📝 [SSE] SSE 模块初始化任务已注册（仅事件监听器）');
}
```

**文件 2**：`apps/web/src/modules/notification/application/initialization/NotificationInitializationManager.ts`
```typescript
private async initializeSSEConnection(): Promise<void> {
  console.log('[NotificationInit] 初始化 SSE 连接...');

  try {
    await sseClient.connect();
    
    const status = sseClient.getStatus();
    this.sseConnected = status.connected;

    if (status.connected) {
      console.log('[NotificationInit] ✅ SSE 连接建立成功');
    } else {
      console.log('[NotificationInit] SSE 连接未建立，但将在后台继续尝试');
      // ⚠️ 禁用外部重试：SSEClient 内部已有重连机制
    }
  } catch (error) {
    console.warn('[NotificationInit] ⚠️ SSE 初始化失败，但继续执行:', error);
    this.sseConnected = false;
  }
}
```

**关键改动**：
- 禁用 `sseInitialization.ts` 中的连接和健康检查任务
- 只保留 `NotificationInitializationManager.initializeSSEConnection()`
- 禁用外部重试逻辑，依赖 SSEClient 内部重连机制

## 实战经验

### 调试技巧

#### 1. 使用独立测试页面
创建 `sse-test.html` 直接测试连接：

```html
<!DOCTYPE html>
<html>
<head>
    <title>SSE Test</title>
</head>
<body>
    <h1>SSE Connection Test</h1>
    <div id="status">未连接</div>
    <div id="messages"></div>
    
    <script>
        const token = 'YOUR_TOKEN_HERE';
        const url = `http://localhost:3888/api/v1/sse/notifications/events?token=${token}`;
        
        const eventSource = new EventSource(url);
        
        eventSource.onopen = () => {
            document.getElementById('status').textContent = 
                '✅ 连接成功 - readyState: ' + eventSource.readyState;
        };
        
        eventSource.addEventListener('connected', (e) => {
            console.log('Connected:', e.data);
            const div = document.createElement('div');
            div.textContent = `[connected] ${e.data}`;
            document.getElementById('messages').appendChild(div);
        });
        
        eventSource.onerror = (e) => {
            console.error('SSE Error:', e);
            document.getElementById('status').textContent = 
                '❌ 错误 - readyState: ' + eventSource.readyState;
        };
    </script>
</body>
</html>
```

#### 2. 创建 Token 快速获取脚本
`get-new-token.sh`：

```bash
#!/bin/bash

# 登录获取 token
RESPONSE=$(curl -s -X POST http://localhost:3888/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your_password"
  }')

# 提取并显示 token
echo $RESPONSE | jq -r '.data.accessToken'
```

#### 3. 检查网络层压缩
在浏览器 DevTools Network 面板中：
- ✅ 正确：`content-type: text/event-stream`，**无** `content-encoding` 头
- ❌ 错误：`content-encoding: br` 或 `gzip` 存在

#### 4. 监控 SSE 连接状态
```typescript
// 在浏览器控制台实时监控
setInterval(() => {
  const es = window.eventSource; // 需要暴露 EventSource 实例
  console.log('SSE State:', {
    readyState: es?.readyState,
    states: {
      0: 'CONNECTING',
      1: 'OPEN', 
      2: 'CLOSED'
    }[es?.readyState],
    url: es?.url
  });
}, 2000);
```

### 常见陷阱

#### ❌ 陷阱 1：只配置了代理层的 compress: false
```typescript
// ❌ 不够
proxy: {
  '/api': {
    compress: false  // 仅禁用代理层压缩
  }
}

// ✅ 正确
server: {
  compress: false,  // 禁用 Vite 服务器压缩
  proxy: {
    '/api': {
      compress: false  // 禁用代理层压缩
    }
  }
}
```

#### ❌ 陷阱 2：只在后端禁用压缩，忽略 Vite
即使后端不压缩，Vite 开发服务器也会在代理响应时添加压缩。

#### ❌ 陷阱 3：忘记调用 res.flush()
```typescript
// ❌ 不会触发 onopen
res.write(`data: hello\n\n`);

// ✅ 立即触发 onopen
res.write(`data: hello\n\n`);
res.flush();
```

#### ❌ 陷阱 4：使用绝对 URL 导致跨域
```typescript
// ❌ 跨域问题
const url = 'http://localhost:3888/api/v1/sse/...';

// ✅ 通过代理避免跨域
const url = '/api/v1/sse/...';
```

#### ❌ 陷阱 5：前端重复调用 connect() 导致连接覆盖
```typescript
// ❌ 错误：多处初始化导致重复连接
// NotificationInitializationManager.ts
await sseClient.connect();

// sseInitialization.ts  
await sseClient.connect();  // 第二次连接会覆盖第一次

// ✅ 正确：确保全局只有一个连接点
// 方案1: 只在一个地方初始化
// main.ts 或 App.vue
sseClient.connect();

// 方案2: connect() 内部检查防止重复
connect(): void {
  if (this.eventSource?.readyState === EventSource.OPEN) {
    console.log('[SSE] 连接已存在，跳过');
    return;
  }
  // ...建立连接
}
```

**问题详情**：
- 后端 SSEManager 每个用户只保留一个连接
- 新连接会关闭旧连接：`oldConnection.end()`
- 但前端第一个连接不知道被关闭，继续接收数据
- 第二个连接被注册到 Manager，但可能因为各种原因失效
- 推送通知时使用第二个连接，导致推送失败

**症状**：
- 浏览器 Network 面板显示两个 SSE 连接
- 第一个连接能收到旧通知，第二个只有心跳
- 后端日志显示"连接不存在"（因为第二个连接已失效）

### 验证清单

成功建立 SSE 连接需要满足：

- [ ] 前端 `readyState` 为 `1`（OPEN）
- [ ] 触发 `onopen` 事件
- [ ] 收到 `connected` 事件
- [ ] 响应头无 `content-encoding`
- [ ] 响应头有 `content-type: text/event-stream`
- [ ] 后端日志显示"连接已添加"
- [ ] 后端可成功推送消息（"消息已发送"）
- [ ] 前端收到推送的通知

## 经验总结

### 核心原则

1. **SSE 流不能压缩**
   - Brotli/Gzip 压缩会破坏 `text/event-stream` 格式
   - 必须在所有中间件层禁用压缩

2. **SSE 流不能缓冲**
   - Node.js 默认缓冲响应
   - 必须显式调用 `flushHeaders()` 和 `flush()`

3. **SSE 流不能跨域**（开发环境）
   - 使用 Vite 代理避免 CORS 预检请求
   - 生产环境需正确配置 CORS 头

4. **SSE 是长连接**
   - 不要在性能监控等中间件中处理 SSE 路由
   - 避免在连接关闭后设置响应头

### 架构建议

#### 开发环境
```
Frontend (5173)  →  Vite Proxy  →  Backend (3888)
                    (no compress)   (no compress for /sse/)
```

#### 生产环境
```
Frontend  →  Nginx  →  Backend
            (no gzip for /sse/)
            (proxy_buffering off)
```

Nginx 配置示例：
```nginx
location /api/v1/sse/ {
    proxy_pass http://backend:3888;
    
    # 禁用代理缓冲
    proxy_buffering off;
    
    # 禁用 gzip 压缩
    gzip off;
    
    # SSE 特定头
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding on;
    
    # 超时设置
    proxy_read_timeout 24h;
    proxy_send_timeout 24h;
}
```

### 性能考虑

1. **连接数限制**
   - 浏览器对同一域名限制 6 个并发连接（HTTP/1.1）
   - SSE 会占用一个连接
   - 考虑使用 HTTP/2（单域名支持多路复用）

2. **心跳机制**
   ```typescript
   // 后端定期发送心跳，保持连接活跃
   const heartbeat = setInterval(() => {
     res.write(': heartbeat\n\n');
     res.flush();
   }, 30000); // 每 30 秒
   ```

3. **重连策略**
   ```typescript
   // 前端指数退避重连
   private reconnect(): void {
     const delay = Math.min(1000 * 2 ** this.retryCount, 30000);
     setTimeout(() => this.connect(), delay);
     this.retryCount++;
   }
   ```

### 调试工具推荐

1. **浏览器 DevTools**
   - Network 面板查看响应头和数据流
   - Console 监控 EventSource 状态

2. **curl 测试**
   ```bash
   curl -N -H "Accept: text/event-stream" \
     "http://localhost:3888/api/v1/sse/notifications/events?token=YOUR_TOKEN"
   ```

3. **自定义调试组件**
   创建 SSE 监控页面实时显示连接状态和消息

## 信息参考

### 技术文档

1. **MDN - Server-sent events**
   - https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
   - EventSource API 完整文档

2. **HTML Living Standard - Server-sent events**
   - https://html.spec.whatwg.org/multipage/server-sent-events.html
   - SSE 协议规范

3. **Node.js Stream API**
   - https://nodejs.org/api/stream.html
   - 理解 `flush()` 和响应流

4. **Vite Server Options**
   - https://vitejs.dev/config/server-options.html
   - Vite 代理和压缩配置

5. **Express compression**
   - https://github.com/expressjs/compression
   - 压缩中间件 filter 选项

### 相关问题

1. **Stack Overflow: EventSource stuck in CONNECTING**
   - 关键词：Node.js SSE response buffering
   - 解决方案：`res.flushHeaders()` + `res.flush()`

2. **GitHub Issues: Vite proxy compresses SSE**
   - vitejs/vite#xxxx
   - 解决方案：`server.compress: false`

3. **Nginx SSE Configuration**
   - 关键词：nginx proxy_buffering SSE
   - 配置：`proxy_buffering off`, `gzip off`

### 调试历程

本问题的完整调试过程：

1. ✅ 发现 `readyState` 停留在 0
2. ✅ 添加连接超时和强制重连机制
3. ✅ 配置 Vite 代理解决跨域
4. ✅ 发现响应被压缩（`content-encoding: br`）
5. ✅ 在后端过滤 SSE 路由的压缩
6. ✅ 修复性能监控中间件干扰
7. ✅ 添加 `res.flush()` 解决缓冲问题
8. ✅ 前端连接成功但后端显示"连接不存在"
9. ✅ 发现 Vite 服务器仍在压缩
10. ✅ 添加 `server.compress: false` 完全禁用压缩
11. ✅ 发现前端重复连接导致 Manager 中连接被覆盖

### 测试文件

本次调试创建的测试工具：

1. `sse-test.html` - 独立测试页面
2. `get-new-token.sh` - Token 快速获取
3. `test-sse-connection.sh` - curl 测试脚本
4. `apps/web/src/pages/SSEMonitor.vue` - 监控组件

---

**文档版本**：v2.1  
**最后更新**：2025-11-09  
**作者**：AI Assistant  
**状态**：✅ 问题已完全解决，架构已优化

## 最终解决方案总结

### 问题根源
1. **Vite 开发服务器压缩** - 破坏 SSE 流
2. **Express 后端压缩** - 破坏 SSE 流
3. **Node.js 响应缓冲** - 延迟 onopen 事件
4. **前端重复连接** - 导致连接覆盖和推送失败

### 解决步骤
1. ✅ Vite 配置：`server.compress: false`
2. ✅ 后端过滤：compression middleware 跳过 `/sse/` 路由
3. ✅ 强制刷新：`res.flushHeaders()` + `res.flush()`
4. ✅ 禁用重复连接：只保留一个初始化入口点
5. ✅ 优化 SSE 事件架构：后端根据 channels 发送特定事件

### SSE 事件架构（优化后）

#### 后端推送策略
```typescript
// 1. 始终发送 notification:created（更新通知列表）
sseManager.sendMessage(accountUuid, 'notification:created', { notification });

// 2. 根据 channels 发送 UI 触发事件
if (channels.includes('IN_APP')) {
  // 触发应用内弹窗
  sseManager.sendMessage(accountUuid, 'notification:popup-reminder', { notification });
}

if (channels.includes('PUSH')) {
  // 触发系统通知
  sseManager.sendMessage(accountUuid, 'notification:system-notification', { notification });
}

if (metadata?.sound) {
  // 触发声音提醒
  sseManager.sendMessage(accountUuid, 'notification:sound-reminder', { notification, sound });
}
```

#### 前端事件处理流程
```
SSE Event                          Event Bus                    UI Action
─────────────────────────────────────────────────────────────────────────────
notification:created          →   notification:created      →   更新通知列表
notification:popup-reminder   →   ui:show-popup-reminder   →   显示应用内弹窗
notification:sound-reminder   →   ui:play-reminder-sound   →   播放提醒音效
notification:system-notification → system:show-notification →   显示系统通知
```

#### 事件类型说明

| SSE 事件 | 触发条件 | 前端行为 | 备注 |
|---------|---------|---------|------|
| `notification:created` | 通知创建 | 更新通知列表 | 始终发送 |
| `notification:popup-reminder` | `IN_APP` channel | 显示应用内弹窗 | 根据配置 |
| `notification:sound-reminder` | 有声音配置 | 播放提醒音效 | 根据配置 |
| `notification:system-notification` | `PUSH` channel | 显示系统通知 | 需要权限 |
| `heartbeat` | 定时发送 | 保持连接活跃 | 每 30 秒 |

### 验证方法
```bash
# 1. 重启 Vite 开发服务器
pnpm exec nx run web:vite:dev

# 2. 检查浏览器 Network 面板
# ✅ 只有一个 SSE 连接
# ✅ 无 content-encoding 头
# ✅ content-type: text/event-stream

# 3. 检查后端日志
# ✅ [SSE Manager] 新连接建立
# ✅ [SSE Manager] 消息已发送（不再是"连接不存在"）
# ✅ popup-reminder 事件已发送
# ✅ sound-reminder 事件已发送

# 4. 测试通知推送
# ✅ 前端成功收到 notification:created 事件
# ✅ 前端自动显示弹窗（如果配置了 IN_APP channel）
# ✅ 前端自动播放声音（如果配置了声音）
# ✅ 前端显示系统通知（如果配置了 PUSH channel 且有权限）
```

### 架构优势

#### ✅ 职责分离
- **后端**：根据业务逻辑决定发送哪些事件
- **前端**：响应式处理事件，触发对应 UI 行为

#### ✅ 可扩展性
- 新增通知渠道：只需添加新的事件类型
- 自定义 UI 行为：监听对应事件并处理

#### ✅ 调试友好
- 每个事件独立，易于追踪
- 后端日志清晰显示发送了哪些事件
- 前端可独立测试每种 UI 行为
