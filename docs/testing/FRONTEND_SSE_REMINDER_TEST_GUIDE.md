# 前端 SSE Reminder 测试指南

## 📋 测试目标

验证完整的 **Reminder → Schedule → Notification → SSE → 前端展示** 流程

## 🚀 快速开始

### 1️⃣ 启动后端服务

```bash
cd d:\myPrograms\DailyUse
pnpm --filter @dailyuse/api dev
```

确保后端运行在 `http://localhost:3888`

### 2️⃣ 打开测试页面

在浏览器中打开：
```
d:\myPrograms\DailyUse\test-frontend-reminder-sse.html
```

或者使用 VS Code 的 Live Server 扩展

### 3️⃣ 获取 Access Token

有两种方式：

#### 方式 A：从已登录的 Web 应用获取

1. 启动 Web 应用：`pnpm --filter @dailyuse/web dev`
2. 访问 `http://localhost:5173` 并登录
3. 打开浏览器 DevTools (F12)
4. 进入 **Application → Local Storage → http://localhost:5173**
5. 找到 `access_token` 并复制其值

#### 方式 B：通过 API 登录获取

```bash
curl -X POST http://localhost:3888/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "your_username",
    "password": "your_password"
  }'
```

从响应中复制 `data.accessToken`

### 4️⃣ 建立 SSE 连接

1. 在测试页面的输入框中粘贴 token
2. 点击 **🔌 建立 SSE 连接** 按钮
3. 等待连接成功（状态变为绿色 "已连接"）

### 5️⃣ 测试完整流程

点击 **🧪 测试完整流程** 按钮

## 📊 预期结果

### 成功的测试流程

```
Step 1: 创建 ReminderTemplate
  ✅ API 返回成功 (状态码 200/201)
  ✅ 返回 ReminderTemplate UUID

Step 2: 后端事件触发 (约 3-5 秒)
  ✅ ReminderTemplateCreated 事件被触发
  ✅ ReminderTemplateCreatedHandler 创建 ScheduleTask

Step 3: 调度器触发 (首次立即触发或等待)
  ✅ Scheduler 检测到待执行任务
  ✅ TaskTriggeredHandler 创建 Notification

Step 4: SSE 事件发送
  ✅ 前端接收到 SSE 事件：
     - schedule:reminder-triggered
     - schedule:popup-reminder (如果启用)
     - schedule:sound-reminder (如果启用)

Step 5: 前端展示
  ✅ 日志输出显示接收事件
  ✅ 通知预览区域显示新通知
  ✅ 统计计数器更新
  ✅ 浏览器原生通知弹窗（如果授权）
  ✅ 播放提示音
```

### 📈 监控指标

| 指标 | 说明 | 预期值 |
|------|------|--------|
| **SSE 连接状态** | EventSource 连接状态 | ✅ 已连接 (绿色) |
| **认证状态** | Token 验证状态 | ✅ 已认证 (绿色) |
| **接收事件数** | 总共接收的 SSE 事件数 | 逐渐递增 |
| **提醒通知数** | reminder-triggered 事件数 | ≥ 1 |
| **声音提醒** | sound-reminder 事件数 | ≥ 1 (如果启用) |
| **弹窗提醒** | popup-reminder 事件数 | ≥ 1 (如果启用) |
| **SSE 事件** | 所有 SSE 事件总数 | ≥ 3 |

## 🔍 调试技巧

### 查看浏览器控制台

打开 DevTools (F12) → Console，查看详细日志：

```javascript
// 应该看到类似的输出：
[SSE Client] 连接到: http://localhost:3888/api/v1/schedules/events
[SSE Client] EventSource 已创建, readyState: 0
[SSE Client] ✅ onopen 触发 - 连接成功, readyState: 1
[SSE Client] 🔗 连接建立事件触发: {"clientId":"..."}
[SSE Client] 💓 心跳: {"timestamp":"..."}
[SSE Client] 🔔 弹窗提醒事件: {"data":{...}}
[SSE Client] 🔊 声音提醒事件: {"data":{...}}
```

### 查看网络请求

DevTools → Network → EventStream：

- 应该看到一个持久的 `events?token=...` 连接
- Type: `eventsource`
- Status: `200` (Pending)
- 可以查看接收到的事件消息

### 后端日志验证

在后端控制台查看：

```bash
# 应该看到：
[ReminderApplicationService] Creating ReminderTemplate...
[EventBus] Emitting: ReminderTemplateCreated
[ReminderTemplateCreatedHandler] Handling event...
[ScheduleTaskDomainService] Creating ScheduleTask...
[Scheduler] Task ready to execute...
[TaskTriggeredHandler] Creating notification...
[SSEService] Sending event to client: schedule:reminder-triggered
```

## 🐛 常见问题

### ❌ SSE 连接失败

**原因**：
- Token 无效或过期
- 后端服务未启动
- CORS 配置问题

**解决方案**：
1. 确认后端运行在 `http://localhost:3888`
2. 重新获取新的 access token
3. 检查后端 CORS 配置是否允许 `http://localhost`

### ❌ 收不到 SSE 事件

**原因**：
- ScheduleTask 尚未到达执行时间
- Event handler 未注册
- SSE 连接未成功建立

**解决方案**：
1. 等待 5-10 秒（首次可能有延迟）
2. 查看后端日志确认事件发送
3. 重新建立 SSE 连接
4. 运行后端手动测试脚本验证流程：
   ```bash
   cd apps/api
   npx tsx src/__tests__/manual/test-full-reminder-flow.ts
   ```

### ❌ 通知权限被拒绝

**解决方案**：
1. 浏览器地址栏左侧 → 站点设置 → 通知 → 允许
2. 刷新页面
3. 重新建立连接

### ⚠️ 声音无法播放

**原因**：
- 浏览器自动播放策略限制
- 用户未与页面交互

**解决方案**：
1. 先点击页面任意位置（与页面交互）
2. Chrome: 设置 → 隐私和安全 → 网站设置 → 声音 → 允许网站播放声音

## 📝 测试检查清单

- [ ] ✅ 后端服务已启动 (localhost:3888)
- [ ] ✅ 获取到有效的 access token
- [ ] ✅ SSE 连接成功建立
- [ ] ✅ 创建 ReminderTemplate 成功
- [ ] ✅ 接收到 connected 事件
- [ ] ✅ 接收到 heartbeat 事件
- [ ] ✅ 接收到 reminder-triggered 事件
- [ ] ✅ 通知预览区域显示新通知
- [ ] ✅ 统计计数器正常更新
- [ ] ✅ 浏览器原生通知弹窗（可选）
- [ ] ✅ 播放提示音（可选）
- [ ] ✅ 日志输出详细且无错误

## 🎯 进阶测试

### 测试循环提醒

1. 创建 1 分钟间隔的提醒
2. 等待 1 分钟
3. 验证是否收到第二次提醒

### 测试多通道投递

1. 创建启用所有通道的提醒：
   - `notificationSound: true`
   - `notificationPopup: true`
2. 验证同时收到：
   - SSE 事件
   - 浏览器通知
   - 声音播放

### 压力测试

1. 快速创建多个提醒
2. 验证所有事件都能正确接收
3. 检查性能和响应时间

## 📞 需要帮助？

如果遇到问题：

1. **查看日志**：测试页面 + 浏览器控制台 + 后端控制台
2. **运行后端测试**：验证后端流程是否正常
3. **检查网络**：DevTools → Network → EventStream
4. **重置状态**：清空日志 → 断开连接 → 重新连接

## 🎉 成功示例

成功的测试应该显示：

```
实时日志：
[14:30:15] 🚀 测试页面已加载
[14:30:15] 📝 请先输入 token 并建立 SSE 连接
[14:30:20] 🔌 正在建立 SSE 连接...
[14:30:21] ✅ SSE 连接已建立
[14:30:21] 🔗 连接确认: 客户端ID = abc123...
[14:30:25] 🧪 开始测试完整流程...
[14:30:25] 📝 Step 1: 创建 ReminderTemplate...
[14:30:26] ✅ ReminderTemplate 创建成功: def456...
[14:30:26] ⏳ 等待 SSE 事件触发（可能需要几秒钟）...
[14:30:30] 🔔 收到提醒触发事件!
[14:30:30] 📨 提醒内容: {"title":"Frontend Test","message":"🔔 前端测试提醒..."}
[14:30:30] 💬 收到弹窗提醒事件!
[14:30:30] 💬 触发弹窗提醒!
[14:30:30] 🔊 收到声音提醒事件!
[14:30:30] 🔊 触发声音提醒!
```

**统计数据：**
- 🔊 声音提醒: 1
- 💬 弹窗提醒: 1  
- 📨 SSE 事件: 3

---

**测试愉快！** 🎉
