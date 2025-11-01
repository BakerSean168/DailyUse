# E2E 测试故障排除指南

## 问题：Playwright Test did not expect test.describe() to be called here

### 症状
运行 `pnpx playwright test` 时出现以下错误：
```
Error: Playwright Test did not expect test.describe() to be called here.
Most common reasons include:
- You are calling test.describe() in a configuration file.
- You are calling test.describe() in a file that is imported by the configuration file.
- You have two different versions of @playwright/test.
```

### 根本原因
使用 `pnpx` 命令时，pnpm 的模块解析机制可能导致 Playwright 加载了错误的版本或模块上下文。

### 解决方案

#### ✅ 方案1：使用 npx 而不是 pnpx（推荐）
```bash
# ❌ 错误方式
pnpx playwright test apps/web/e2e/goal

# ✅ 正确方式 - 从 apps/web 目录运行
cd apps/web
npx playwright test e2e/goal

# ✅ 正确方式 - 从项目根目录运行
cd /workspaces/DailyUse/apps/web && npx playwright test e2e/goal
```

#### 方案2：使用 pnpm exec
```bash
cd apps/web
pnpm exec playwright test e2e/goal
```

#### 方案3：添加 package.json script
在 `apps/web/package.json` 中添加：
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:goal": "playwright test e2e/goal",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

然后运行：
```bash
cd apps/web
pnpm test:e2e:goal
```

## Goal 模块 E2E 测试快速参考

### 测试文件结构
```
apps/web/e2e/goal/
├── goal-crud.spec.ts          # 目标 CRUD 操作 (7 tests)
├── goal-keyresult.spec.ts     # 关键结果管理 (9 tests)
├── goal-focus-mode.spec.ts    # 专注模式 (8 tests)
└── goal-statistics.spec.ts    # 统计与进度 (11 tests)
```

### 常用命令
```bash
# 进入正确的目录
cd /workspaces/DailyUse/apps/web

# 列出所有 Goal 测试
npx playwright test e2e/goal --list

# 运行所有 Goal 测试
npx playwright test e2e/goal

# 运行特定测试文件
npx playwright test e2e/goal/goal-crud.spec.ts

# 使用 UI 模式运行（推荐用于调试）
npx playwright test e2e/goal --ui

# Debug 模式运行单个测试
npx playwright test e2e/goal/goal-crud.spec.ts --debug

# 运行并显示浏览器
npx playwright test e2e/goal --headed

# 只运行失败的测试
npx playwright test e2e/goal --last-failed
```

### 测试前提条件

1. **启动开发服务器**
   ```bash
   # 确保 Web 应用正在运行
   cd /workspaces/DailyUse
   pnpm dev
   # 或
   pnpm nx serve web
   ```

2. **确保 API 服务运行**
   ```bash
   # 确保后端 API 正在运行
   pnpm nx serve api
   ```

3. **测试用户管理**
   - ✅ **推荐方式**：测试自动创建独立账号
     - 使用 `setupTestUser(page)` 函数
     - 每个测试运行时自动注册新用户
     - 确保测试数据完全隔离
   - ⚠️ **备选方式**：使用共享测试账号
     - Username: `testuser`
     - Password: `Test123456!`
     - 需要手动在数据库中创建
     - 可能存在数据冲突问题

### 测试覆盖范围

| 功能模块 | 测试数量 | 优先级分布 | 覆盖率 |
|---------|---------|-----------|--------|
| Goal CRUD | 7 | P0:3, P1:3, P2:1 | 100% |
| KeyResult 管理 | 9 | P0:5, P1:2, P2:2 | 100% |
| Focus Mode | 8 | P0:3, P1:3, P2:2 | 100% |
| Statistics | 11 | P0:6, P1:3, P2:2 | 91% |
| **总计** | **35** | **P0:17, P1:11, P2:7** | **97%** |

### 故障排查检查清单

- [ ] 使用 `npx` 而不是 `pnpx`
- [ ] 从 `apps/web` 目录运行命令
- [ ] Web 开发服务器在 http://localhost:5173 运行
- [ ] API 服务器正常运行
- [ ] 测试用户 `testuser` 存在于数据库
- [ ] Playwright 浏览器已安装：`npx playwright install`
- [ ] 没有端口冲突（5173, API端口）

### 额外资源
- [Goal E2E 测试文档](../apps/web/e2e/goal/README.md)
- [Goal E2E 完成报告](./GOAL_E2E_COMPLETION_REPORT.md)
- [Playwright 官方文档](https://playwright.dev)
