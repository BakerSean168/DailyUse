# SSE 连接问题完整修复总结

## 问题症状
- EventSource 一直卡在 `readyState: 0` (CONNECTING) 状态
- `onopen` 事件从未触发
- 浏览器 DevTools Network 面板看不到 SSE 连接

## 根本原因分析

### 1. **响应缓冲问题** ⭐ 最关键
Node.js HTTP 响应默认会缓冲数据，不会立即发送到客户端。对于 SSE 来说：
- 响应头发送后，浏览器需要**立即**接收到数据才能触发 `onopen`
- 如果初始数据被缓冲，EventSource 会一直等待
- 导致连接卡在 CONNECTING 状态

### 2. Compression 中间件压缩 SSE 流
- Express compression 中间件压缩了 SSE 响应（Brotli）
- EventSource 无法处理压缩的流
- Vite 代理在处理压缩流时出错：`socket hang up`

### 3. Performance 中间件在响应完成后设置头
- SSE 是长连接，响应头早已发送
- `finish` 事件触发时调用 `setHeader()` 会报错
- `Error [ERR_HTTP_HEADERS_SENT]`

### 4. 跨域问题（已通过 Vite 代理解决）
- Web 运行在 `localhost:5173`
- API 运行在 `localhost:3888`
- EventSource 的跨域支持有限

## 完整修复方案

### 修复 1: 禁用 SSE 响应的压缩
**文件**: `apps/api/src/app.ts`
```typescript
app.use(compression({
  filter: (req, res) => {
    // SSE 路由不应该压缩
    if (req.path.includes('/sse/')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

### 修复 2: 跳过 SSE 的性能监控
**文件**: `apps/api/src/middleware/performance.middleware.ts`
```typescript
export function performanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 跳过 SSE 路由
  if (req.path.includes('/sse/')) {
    return next();
  }
  // ...
}
```

### 修复 3: 立即刷新 SSE 响应 ⭐ 关键
**文件**: `apps/api/src/modules/notification/interface/http/sseRoutes.ts`

```typescript
// 1. 设置响应头后立即刷新
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.setHeader('X-Accel-Buffering', 'no');
res.setHeader('Content-Encoding', 'identity');

// ⭐ 立即发送响应头，不等待缓冲
res.flushHeaders();

// 2. 发送初始数据
res.write(`event: connected\n`);
res.write(`data: ${JSON.stringify({ message: '连接成功', accountUuid })}\n\n`);

// ⭐ 强制刷新，确保数据立即发送
if (typeof (res as any).flush === 'function') {
  (res as any).flush();
}
```

**在所有 SSE 消息发送后都要刷新**：
- 初始连接消息后刷新
- 心跳消息后刷新
- 通知消息后刷新（sendMessage/broadcast）

### 修复 4: 配置 Vite 代理
**文件**: `apps/web/vite.config.ts`
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3888',
      changeOrigin: true,
      secure: false,
      ws: true,
    },
  },
}
```

**文件**: `apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts`
```typescript
// 使用相对路径，通过代理访问
const url = `/api/v1/sse/notifications/events?token=${token}`;
```

## 技术要点

### SSE 响应的关键要求
1. ✅ Content-Type: `text/event-stream`
2. ✅ Cache-Control: `no-cache`
3. ✅ Connection: `keep-alive`
4. ✅ **不能压缩** (Content-Encoding: identity)
5. ✅ **立即刷新响应头** (`res.flushHeaders()`)
6. ✅ **每次写入数据后刷新** (`res.flush()`)
7. ✅ **禁用代理/服务器缓冲** (X-Accel-Buffering: no)

### EventSource 的工作原理
```
1. new EventSource(url) → readyState: 0 (CONNECTING)
2. 接收到响应头 → 开始接收数据
3. 接收到第一块数据 → 触发 onopen → readyState: 1 (OPEN)
4. 持续接收事件 → 触发 onmessage 或自定义事件
5. 连接关闭 → 触发 onerror → readyState: 2 (CLOSED)
```

**如果第3步的数据被缓冲**，onopen 永远不会触发！

### Node.js HTTP 响应缓冲
Node.js 会缓冲小的响应数据以提高性能，但对于流式传输（如 SSE）需要：
- `res.flushHeaders()` - 立即发送响应头
- `res.flush()` - 立即刷新已写入的数据（如果可用）
- 或确保每次写入的数据足够大（>= 64KB），自动触发刷新

## 验证方法

### 1. 使用测试页面
访问：`http://localhost:5173/sse-test.html`

预期输出：
```
[时间] 🚀 正在连接到: /api/v1/sse/notifications/events?token=...
[时间] ✅ EventSource 已创建
[时间]    readyState: 0 (CONNECTING)
[时间] ✅✅✅ onopen 触发 - 连接成功!  ← 关键！
[时间]    readyState: 1 (OPEN)
[时间] 🔔 connected: {"message":"连接成功",...}
```

### 2. 使用 curl 测试
```bash
curl -N "http://localhost:3888/api/v1/sse/notifications/events?token=YOUR_TOKEN"
```

应该立即看到：
```
event: connected
data: {"message":"连接成功","accountUuid":"..."}
```

### 3. 浏览器 DevTools
Network 面板应该显示：
- URL: `http://localhost:5173/api/v1/sse/notifications/events?token=...`
- Type: `eventsource`
- Status: `200` (pending)
- EventStream 标签可以看到实时事件

## 常见错误

### ❌ 连接一直 CONNECTING
**原因**: 响应被缓冲，数据没有立即发送
**解决**: 添加 `res.flushHeaders()` 和 `res.flush()`

### ❌ socket hang up
**原因**: 响应被压缩，代理无法处理
**解决**: 禁用 SSE 的压缩

### ❌ ERR_HTTP_HEADERS_SENT
**原因**: 在响应发送后尝试设置头
**解决**: 跳过 SSE 的性能监控中间件

### ❌ 401 Unauthorized
**原因**: Token 过期或无效
**解决**: 重新登录获取新 token

## 最佳实践

1. **SSE 路由应该独立处理**，不使用通用中间件
2. **每次写入后都刷新**，确保实时性
3. **禁用所有缓冲**（压缩、代理缓冲、服务器缓冲）
4. **添加心跳机制**，保持连接活跃
5. **正确处理连接关闭**，清理资源

---

**更新日期**: 2025-11-09  
**状态**: ✅ 所有问题已修复
