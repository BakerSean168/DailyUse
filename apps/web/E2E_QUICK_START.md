# E2E 测试快速开始

## 🚀 5 分钟快速启动

### 1. 确保服务运行

```bash
# 终端 1: API 服务器 (端口 3888)
cd apps/api
pnpm dev

# 终端 2: Web 前端 (端口 5173)
cd apps/web
pnpm dev
```

验证服务：

- API: http://localhost:3888/api-docs
- Web: http://localhost:5173

### 2. 创建测试用户 (首次运行)

```bash
cd apps/api
npx tsx src/__tests__/manual/setup-e2e-test-user.ts
```

输出示例：

```
✅ 测试用户已存在: testuser
   Account UUID: 5e41f716-c0f1-46f0-b1b2-a0dc61703c54
   UserProfile UUID: efee3d2e-dd4f-4936-8a56-63e02cae5458
```

### 3. 运行测试

```bash
cd apps/web

# 快速运行 (无头模式)
pnpm e2e

# 可视化模式 (推荐首次运行)
pnpm e2e:headed

# 调试模式
pnpm e2e:debug
```

## 📊 预期结果

### 成功输出示例

```
Running 2 tests using 1 worker

  ✓ [chromium] › reminder.spec.ts:45:3 › 创建每分钟提醒并验证接收通知 (185.2s)
  ✓ [chromium] › reminder.spec.ts:139:3 › 创建提醒后立即验证 SSE 连接 (12.3s)

  2 passed (197.5s)
```

### 测试日志示例

```
========================================
🚀 开始 E2E 测试
========================================

📝 Step 1: 用户登录
[Auth] 开始登录: testuser
✅ 登录成功

📝 Step 2: 导航到 Reminder 页面
[Navigation] 导航到 Reminder 页面
✅ 成功进入 Reminder 页面

📝 Step 3: 创建每分钟提醒
✅ Reminder 创建成功并显示在列表中

📝 Step 4: 等待提醒触发 (最多 3 分钟)
⏰ 开始等待...
   - 预期第一次触发: ~1 分钟后
   - 预期第二次触发: ~2 分钟后
   - 最大等待时间: 3 分钟

[Notification] 已等待 60 秒...
[Notification] 已等待 65 秒...
[Notification] ✅ 收到提醒通知!

📝 Step 5: 验证通知接收
📡 捕获到 3 个 SSE 事件:
   1. [schedule:reminder-triggered] at 2025-10-07T04:35:00.000Z
   2. [schedule:popup-reminder] at 2025-10-07T04:35:00.100Z
   3. [schedule:sound-reminder] at 2025-10-07T04:35:00.150Z

╔════════════════════════════════════════════════════════════╗
║              ✅ E2E 测试完成                               ║
╠════════════════════════════════════════════════════════════╣
║  Reminder 名称: E2E Test - 1759812345678                   ║
║  创建时间: 12:34:56                                        ║
║  首次触发: 72s 后                                          ║
║  SSE 事件数: 3                                             ║
║  Reminder 事件: 3                                          ║
╚════════════════════════════════════════════════════════════╝
```

## 🐛 常见问题

### 问题 1: 测试用户不存在

**错误**: `登录失败 - 用户名或密码错误`

**解决**:

```bash
cd apps/api
npx tsx src/__tests__/manual/setup-e2e-test-user.ts
```

### 问题 2: 服务未启动

**错误**: `page.goto: net::ERR_CONNECTION_REFUSED`

**解决**: 确保 API 和 Web 服务都在运行

```bash
# 检查端口
netstat -ano | findstr :3888  # API
netstat -ano | findstr :5173  # Web
```

### 问题 3: 超时未收到通知

**可能原因**:

- Reminder 创建失败
- 调度器未运行
- SSE 连接断开

**调试步骤**:

1. 检查 API 日志中的调度器启动信息
2. 手动在 Web UI 中创建 Reminder 验证
3. 使用 `pnpm e2e:debug` 逐步执行

### 问题 4: 浏览器未安装

**错误**: `Executable doesn't exist at C:\Users\...\chromium-1194\chrome.exe`

**解决**:

```bash
cd apps/web
npx playwright install chromium
```

## 📝 下一步

- 查看完整文档: [`E2E_TESTING_GUIDE.md`](./E2E_TESTING_GUIDE.md)
- 查看实施总结: [`../docs/testing/E2E_TESTING_IMPLEMENTATION_SUMMARY.md`](../../docs/testing/E2E_TESTING_IMPLEMENTATION_SUMMARY.md)
- 添加更多测试用例
- 集成到 CI/CD

---

**提示**: 首次运行建议使用 `pnpm e2e:headed` 以观察完整的测试流程！
