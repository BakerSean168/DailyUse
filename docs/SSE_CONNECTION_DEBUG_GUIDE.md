# SSE 连接调试指南

## 问题修复总结

### 修复内容

#### 1. SSE 客户端改进 (`SSEClient.ts`)
- ✅ 增加最大重连次数从 5 次到 10 次
- ✅ 添加页面可见性监听，页面重新可见时自动检查并重连
- ✅ 修复 `isDestroyed` 状态导致的无法重连问题
- ✅ 改进连接状态检查逻辑
- ✅ 添加重连定时器管理，避免内存泄漏
- ✅ 增强日志输出，便于调试

#### 2. 关键改进点

**问题 1：页面刷新后不会重新连接**
- **原因**: `isDestroyed` 设置为 true 后，即使调用 `connect()` 也不会建立连接
- **解决**: 在 `connect()` 方法中检查 `isDestroyed`，如果为 true 则重置状态

**问题 2：连接断开后没有自动重连**
- **原因**: EventSource 的自动重连机制在某些情况下不会触发
- **解决**: 
  - 在 `onerror` 中正确处理 CLOSED 状态
  - 添加页面可见性监听，页面重新激活时检查连接

**问题 3：浏览器网络面板看不到 SSE 连接**
- **原因**: 连接可能在建立后立即断开，或者根本没有成功建立
- **解决**: 
  - 添加详细的连接状态日志
  - 在连接建立前清理旧连接
  - 确保 token 有效性检查

## 使用方法

### 1. 查看 SSE 连接状态

在浏览器控制台中运行：
```javascript
// 查看连接状态
const status = window.sseClient?.getStatus();
console.log('SSE Status:', status);

// 手动触发连接
window.sseClient?.connect();

// 手动断开连接
window.sseClient?.disconnect();
```

### 2. 监控 SSE 事件

访问 SSE 监控页面：`/sse-monitor` (仅开发环境可见)

### 3. 查看浏览器网络面板

1. 打开浏览器开发者工具 (F12)
2. 切换到 **Network** (网络) 标签
3. 刷新页面
4. 查找 `sse/notifications/events` 请求
5. 点击该请求，查看：
   - **Headers**: 请求头和响应头
   - **EventStream**: 接收到的所有 SSE 事件
   - **Timing**: 连接建立时间

### 4. 验证 SSE 连接是否正常

**预期行为**：
1. 页面加载后，控制台应该看到：
   ```
   [SSE Client] connect() 被调用
   [SSE Client] 🚀 正在建立连接到: http://localhost:3888/api/v1/sse/notifications/events
   [SSE Client] EventSource 已创建, readyState: 0
   [SSE Client] ✅ onopen 触发 - 连接成功, readyState: 1
   [SSE Client] 🔗 连接建立事件触发
   ```

2. 浏览器网络面板应该看到：
   - 名称: `events?token=...`
   - 类型: `eventsource`
   - 状态: `200` (pending)
   - 大小: 从...流式传输

3. SSE 监控页面应该显示：
   - 连接状态: **已连接**
   - ReadyState: **OPEN**
   - 接收到 `connected` 事件

**如果连接失败**：
1. 检查控制台错误信息
2. 确认 token 有效（未过期）
3. 确认 API 服务器运行正常
4. 检查网络面板的响应状态码和错误信息

### 5. 常见问题排查

#### 问题：连接立即断开 (readyState: 2)
**可能原因**：
- Token 无效或已过期
- API 服务器未运行
- CORS 配置问题

**解决方法**：
```javascript
// 检查 token
console.log('Token:', localStorage.getItem('access_token'));

// 检查 API 是否可访问
fetch('http://localhost:3888/api/v1/health')
  .then(r => r.json())
  .then(console.log);
```

#### 问题：页面刷新后连接断开且不重连
**解决方法**：
- 已在代码中修复，`connect()` 方法会重置 `isDestroyed` 状态
- 如果仍有问题，手动调用：`window.sseClient.connect()`

#### 问题：网络面板看不到 SSE 连接
**检查步骤**：
1. 确认 SSE 客户端是否已初始化
2. 检查控制台是否有连接错误
3. 确认用户已登录（有有效 token）

## 调试技巧

### 1. 启用详细日志
所有关键操作都会输出日志，关注以下前缀：
- `[SSE Client]` - SSE 客户端日志
- `[SSE Auth]` - 后端认证日志
- `[SSE Manager]` - 后端连接管理器日志
- `[SSE]` - 后端 SSE 路由日志

### 2. 使用 SSE 监控页面
访问 `/sse-monitor` 可以：
- 实时查看连接状态
- 查看所有接收到的事件
- 过滤不同类型的事件
- 手动触发重连

### 3. 使用浏览器开发者工具
**Network 面板**：
- 查看 SSE 连接状态
- 查看接收到的事件流
- 查看请求/响应头

**Console 面板**：
- 查看详细的连接日志
- 手动执行 SSE 操作
- 调试事件处理

## 测试流程

### 完整测试流程

1. **启动服务**
   ```bash
   # 启动 API 服务器
   pnpm exec nx run api:dev
   
   # 启动 Web 服务器
   pnpm exec nx run web:vite:dev
   ```

2. **登录应用**
   - 访问 `http://localhost:5173`
   - 登录获取有效 token

3. **检查 SSE 连接**
   - 打开浏览器开发者工具
   - 查看 Console 中的 SSE 日志
   - 查看 Network 中的 SSE 连接

4. **测试事件接收**
   - 创建一个提醒
   - 等待提醒触发
   - 检查 SSE 监控页面是否收到事件
   - 检查通知列表页面是否显示通知

5. **测试重连机制**
   - 重启 API 服务器
   - 观察客户端是否自动重连
   - 刷新页面
   - 确认连接重新建立

## 性能优化建议

1. **控制日志输出**
   - 生产环境应关闭详细日志
   - 只保留错误和警告日志

2. **优化心跳频率**
   - 当前：30 秒一次
   - 可根据实际需求调整

3. **限制事件缓存**
   - SSE 监控页面应限制显示的事件数量
   - 避免内存占用过高

4. **连接池管理**
   - 后端应定期清理过期连接
   - 避免内存泄漏

## 下一步改进

- [ ] 添加连接质量监控（延迟、丢包率）
- [ ] 实现智能重连策略（根据网络状况调整）
- [ ] 添加离线事件缓存和同步
- [ ] 实现连接状态的 UI 指示器
- [ ] 添加 SSE 性能指标收集

---

**最后更新**: 2025-11-09  
**版本**: 1.0
