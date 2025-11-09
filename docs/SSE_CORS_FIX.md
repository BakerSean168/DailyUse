# SSE 跨域问题解决方案

## 问题描述

EventSource 连接一直卡在 `readyState: 0` (CONNECTING) 状态，无法成功建立连接。

### 根本原因

**跨域请求**：Web 应用运行在 `localhost:5173`，API 服务运行在 `localhost:3888`。

EventSource (SSE) 在跨域场景下有严格限制：
- 某些浏览器对 EventSource 的 CORS 支持不完整
- 即使配置了 CORS，浏览器可能仍然阻止连接

## 解决方案

### ✅ 方案 1: 使用 Vite 代理（已实施）

通过 Vite 开发服务器的代理功能，将 `/api` 请求代理到后端服务器。

**优点**：
- ✅ 避免跨域问题（同源请求）
- ✅ 开发环境配置简单
- ✅ 符合前端开发最佳实践

**配置位置**：
- `apps/web/vite.config.ts` - 添加了 proxy 配置
- `apps/web/.env.development` - 环境变量配置
- `apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts` - 使用相对路径

### 配置详情

#### 1. Vite 代理配置

```typescript
// apps/web/vite.config.ts
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

#### 2. SSEClient 改动

```typescript
// 之前：使用绝对 URL（跨域）
const url = `http://localhost:3888/api/v1/sse/notifications/events?token=...`

// 之后：使用相对 URL（通过代理，同源）
const url = `/api/v1/sse/notifications/events?token=...`
```

## 重启指南

### 🔴 必须重启 Vite 开发服务器

Vite 代理配置只在服务器启动时加载，必须重启才能生效。

```bash
# 停止当前的 Vite 服务器 (Ctrl+C)

# 重新启动
pnpm exec nx run web:vite:dev
```

## 验证步骤

### 1. 检查代理是否工作

访问：`http://localhost:5173/api/v1/health`

应该返回：`{"status":"ok"}`

### 2. 测试 SSE 连接

1. 刷新浏览器页面
2. 访问 `/sse-monitor`
3. 点击"重新连接"

**预期行为**：
```
[SSE Client] 🚀 正在建立连接到: /api/v1/sse/notifications/events?token=...
[SSE Client] ✅ onopen 触发 - 连接成功, readyState: 1
[SSE Client] 🔗 连接建立事件触发
```

### 3. 检查浏览器 Network 面板

- 找到 `events?token=...` 请求
- **重要**：请求地址应该是 `http://localhost:5173/api/v1/sse/...`（而不是 3888 端口）
- 类型：`eventsource`
- 状态：`200` (pending)
- 可以查看实时事件流

## 其他方案对比

### 方案 2: 配置 CORS（已弃用）

虽然已在后端配置 CORS，但 EventSource 在某些浏览器中仍有跨域限制。

**缺点**：
- ❌ 浏览器兼容性问题
- ❌ 需要额外的 CORS 头配置
- ❌ 生产环境可能需要不同配置

### 方案 3: 使用 WebSocket

完全替换 SSE 为 WebSocket。

**缺点**：
- ❌ 需要重写大量代码
- ❌ WebSocket 更复杂（双向通信）
- ❌ SSE 对于单向推送已足够

## 生产环境配置

生产环境通常使用反向代理（Nginx、Caddy 等）：

```nginx
# nginx.conf 示例
location /api/ {
    proxy_pass http://api-server:3888/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    
    # SSE 特定配置
    proxy_buffering off;
    proxy_cache off;
    proxy_set_header X-Accel-Buffering no;
}
```

## 故障排除

### 问题 1: 重启后仍然连接失败

**检查**：
1. 确认 Vite 服务器已重启
2. 清除浏览器缓存
3. 查看控制台日志中的 URL（应该是相对路径）

### 问题 2: 代理请求返回 404

**检查**：
1. API 服务器是否运行：`curl http://localhost:3888/api/v1/health`
2. Vite 代理配置是否正确
3. 查看 Vite 终端输出的代理日志

### 问题 3: Token 认证失败

**检查**：
1. Token 是否过期（在控制台运行 `testSSEConnection(token)`）
2. 后端日志是否有认证错误
3. Token 格式是否正确

---

**最后更新**: 2025-11-09  
**状态**: ✅ 已解决跨域问题，等待重启验证
