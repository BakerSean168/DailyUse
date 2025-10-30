# Goal 模块 E2E 测试

## 📋 测试文件列表

### 1. `goal-crud.spec.ts` - Goal CRUD 基础功能测试

测试 Goal 模块的核心 CRUD 操作和状态管理。

**测试场景**:
- ✅ [P0] 创建新目标
- ✅ [P0] 更新目标信息
- ✅ [P0] 删除目标
- ✅ [P1] 查看目标详情
- ✅ [P1] 激活目标
- ✅ [P1] 完成目标
- ✅ [P2] 筛选目标

**运行测试**:
```bash
cd /workspaces/DailyUse/apps/web

# 运行所有 Goal CRUD 测试
npx playwright test goal/goal-crud.spec.ts

# UI 模式运行
npx playwright test goal/goal-crud.spec.ts --ui

# 调试模式
npx playwright test goal/goal-crud.spec.ts --debug
```

---

## 🎯 测试覆盖

| Story | 功能 | 测试状态 | 覆盖率 |
|-------|------|---------|--------|
| 2-1 | Goal CRUD 基础功能 | ✅ 完成 | 100% |
| 2-2 | Key Result 管理 | 🔄 待实现 | - |
| 2-3 | KR 权重快照 | �� 未开始 | - |
| 2-4 | 目标进度自动计算 | 📋 未开始 | - |
| 2-5 | 专注周期聚焦模式 | 📋 未开始 | - |

---

## 🏗️ 测试架构

### Page Object Model

使用 `GoalPage` 类封装页面操作:

```typescript
import { GoalPage } from '../page-objects/GoalPage';

const goalPage = new GoalPage(page);
await goalPage.navigate();
await goalPage.createGoal({ title: 'Test Goal' });
await goalPage.expectGoalToExist('Test Goal');
```

### 测试辅助函数

```typescript
// 登录
await login(page, TEST_USER.username, TEST_USER.password);

// 导航
await navigateToGoals(page);

// CRUD 操作
await createGoal(page, { title: 'Test Goal' });
await editGoal(page, 'Test Goal', { description: 'Updated' });
await deleteGoal(page, 'Test Goal');
```

---

## 📊 测试报告

### 查看最新报告

```bash
npx playwright show-report
```

### 查看测试追踪

```bash
# 运行测试生成追踪
npx playwright test goal/ --trace on

# 查看追踪
npx playwright show-trace test-results/.../trace.zip
```

---

## 🐛 常见问题

### 测试失败: 登录超时

**原因**: API 服务未启动

**解决**:
```bash
# 启动 API 服务
nx run api:dev
```

### 测试失败: 元素未找到

**原因**: UI 更新导致选择器失效

**解决**:
1. 检查 `GoalPage.ts` 中的选择器
2. 使用更宽松的选择器或 data-testid
3. 增加等待时间

### 测试数据未清理

**原因**: 测试中断或清理失败

**手动清理**:
```bash
# 登录 Web 应用，手动删除 E2E 开头的测试目标
```

---

## ✅ 下一步计划

- [ ] 添加 Key Result 管理测试
- [ ] 添加 Goal Folder 测试
- [ ] 添加进度计算测试
- [ ] 添加批量操作测试
- [ ] 集成 CI/CD 流水线

---

## 📚 相关文档

- [E2E 快速开始](../../E2E_QUICK_START.md)
- [完整 E2E 测试指南](../../E2E_TESTING_GUIDE.md)
- [Goal 模块文档](/docs/modules/goal/)
- [Story 2-1: Goal CRUD 基础功能](/docs/stories/2-1-goal-crud-basics.md)
