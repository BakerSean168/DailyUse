# DailyUse Web E2E 测试套件

## 📋 测试覆盖模块

本测试套件覆盖以下核心业务模块的关键流程：

### 1. Authentication (认证模块)
- \\uth-login.spec.ts\\ - 登录流程
- \\uth-register.spec.ts\\ - 注册流程  
- \\uth-password.spec.ts\\ - 密码重置/修改

### 2. Account (账户模块)
- \\ccount-profile.spec.ts\\ - 个人资料管理
- \\ccount-settings.spec.ts\\ - 账户设置

### 3. Dashboard (仪表板模块)
- \\dashboard-overview.spec.ts\\ - 仪表板概览
- \\dashboard-widgets.spec.ts\\ - 小部件交互

### 4. Goal (目标模块) 
- \\goal/goal-crud.spec.ts\\ - 目标 CRUD
- (已存在)

### 5. Task (任务模块)
- \\	ask/task-*.spec.ts\\ - 任务相关测试
- (已存在)

### 6. Schedule (日程模块)
- \\schedule-crud.spec.ts\\ - 日程 CRUD
- \\schedule-calendar.spec.ts\\ - 日历视图

### 7. Notification (通知模块)
- \\
otification-center.spec.ts\\ - 通知中心
- \\
otification-preferences.spec.ts\\ - 通知偏好设置

### 8. Setting (设置模块)
- \\setting-appearance.spec.ts\\ - 外观设置
- \\setting-notifications.spec.ts\\ - 通知设置

## 🎯 测试优先级

- **P0** - 核心功能，必须通过（登录、CRUD、数据展示）
- **P1** - 重要功能（表单验证、错误处理）
- **P2** - 增强功能（UI交互、快捷键）
- **P3** - 可选功能（高级特性）

## 🚀 运行测试

### 运行所有测试
\\\ash
pnpm e2e
\\\

### 运行特定模块测试
\\\ash
pnpm e2e authentication/
pnpm e2e dashboard/
pnpm e2e goal/
\\\

### 调试模式
\\\ash
pnpm e2e:debug authentication/auth-login.spec.ts
\\\

### 可视化模式
\\\ash
pnpm e2e:headed dashboard/
\\\

## 📊 测试报告

测试完成后查看报告：
\\\ash
pnpm e2e:report
\\\

## 🔧 测试开发指南

### 命名规范
- 文件名：\\module-feature.spec.ts\\
- 测试用例：\\[P{优先级}] 应该{功能描述}\\

### 最佳实践
1. 使用 \\data-testid\\ 选择器
2. 添加合理的 timeout
3. 每个测试独立（cleanup in afterEach）
4. 使用 Page Object 模式（复杂交互）
5. 添加 console.log 便于调试

### 测试助手
使用 \\helpers/testHelpers.ts\\ 中的工具函数：
- \\login(page, username, password)\\
- \\createTestTask(...)\\
- \\createTestGoal(...)\\

## 📝 TODO

### 待补充的测试
- [ ] Reminder 模块 E2E 测试
- [ ] Editor 模块 E2E 测试
- [ ] Repository 模块 E2E 测试（除CRUD外）

### 待优化
- [ ] 添加更多 Page Objects
- [ ] 集成 CI/CD 自动化
- [ ] 添加性能测试基准
- [ ] 添加可访问性测试

## �� 问题反馈

发现测试问题请创建 Issue，标签：\\	est\\, \\2e\\

---

_最后更新: 2025-11-01_
