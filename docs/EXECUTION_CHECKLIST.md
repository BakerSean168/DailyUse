# ✅ 执行清单 - Goal 模块重构

**状态**：准备开始  
**优先级**：🟡 中等（改进架构）  
**预计时间**：75-110 分钟  
**难度**：🟡 中等

---

## 🎯 目标确认

- [ ] 删除 GoalWebApplicationService（重复的服务）
- [ ] 所有功能迁移到 GoalManagementApplicationService
- [ ] 完善模块初始化逻辑
- [ ] 简化组件数据加载
- [ ] 所有测试通过

---

## 📋 第 1 步：服务整合（30-45 分钟）

### 1.1 添加方法到 GoalManagementApplicationService

**文件**：`apps/web/src/modules/goal/application/services/GoalManagementApplicationService.ts`

需要添加的方法：

- [ ] `syncAllGoals()` - 同步 Goal 和 Folder
- [ ] `createKeyResultForGoal()` - 创建 KeyResult
- [ ] `getKeyResultsByGoal()` - 获取 KeyResults
- [ ] `updateKeyResultForGoal()` - 更新 KeyResult
- [ ] `deleteKeyResultForGoal()` - 删除 KeyResult
- [ ] `batchUpdateKeyResultWeights()` - 批量更新权重
- [ ] `getProgressBreakdown()` - 获取进度详情
- [ ] `createGoalRecord()` - 创建记录
- [ ] `getGoalRecordsByKeyResult()` - 获取记录
- [ ] `getGoalRecordsByGoal()` - 获取所有记录
- [ ] `createGoalReview()` - 创建复盘
- [ ] `getGoalReviewsByGoal()` - 获取复盘
- [ ] `updateGoalReview()` - 更新复盘
- [ ] `deleteGoalReview()` - 删除复盘
- [ ] `getGoalAggregateView()` - 获取聚合视图
- [ ] `cloneGoal()` - 克隆 Goal
- [ ] `refreshGoalWithKeyResults()` - 刷新 KeyResults
- [ ] `refreshGoalWithReviews()` - 刷新 Reviews

**参考**：GoalWebApplicationService.ts （从这里复制代码）

### 1.2 验证编译

```bash
nx run web:type-check
```

- [ ] 无 TypeScript 错误

---

## 📋 第 2 步：更新导出和导入（15-20 分钟）

### 2.1 更新 services/index.ts

**文件**：`apps/web/src/modules/goal/application/services/index.ts`

- [ ] 删除：`export { GoalWebApplicationService }`
- [ ] 删除：`export { goalWebApplicationService }`
- [ ] 保留：`goalManagementApplicationService` 导出

### 2.2 更新 application/index.ts

**文件**：`apps/web/src/modules/goal/application/index.ts`

- [ ] 删除：`export { GoalWebApplicationService }`

### 2.3 更新 useKeyResult.ts

**文件**：`apps/web/src/modules/goal/presentation/composables/useKeyResult.ts`

查找替换：
```
import { goalWebApplicationService }
↓
import { goalManagementApplicationService }
```

- [ ] 替换导入
- [ ] 替换所有调用（5 处）：
  - `goalWebApplicationService.getKeyResultsByGoal` → `goalManagementApplicationService.getKeyResultsByGoal`
  - `goalWebApplicationService.createKeyResultForGoal` → `goalManagementApplicationService.createKeyResultForGoal`
  - `goalWebApplicationService.updateKeyResultForGoal` → `goalManagementApplicationService.updateKeyResultForGoal`
  - `goalWebApplicationService.deleteKeyResultForGoal` → `goalManagementApplicationService.deleteKeyResultForGoal`

### 2.4 更新 useGoal.ts

**文件**：`apps/web/src/modules/goal/presentation/composables/useGoal.ts`

- [ ] 替换导入：`goalWebApplicationService` → `goalManagementApplicationService`
- [ ] 替换导入中的销毁器（约 15+ 处）：
  - `goalWebApplicationService.syncAllGoals` → `goalManagementApplicationService.syncAllGoals`
  - `goalWebApplicationService.createKeyResultForGoal` → `goalManagementApplicationService.createKeyResultForGoal`
  - 等等...

### 2.5 更新 useGoalManagement.ts

**文件**：`apps/web/src/modules/goal/presentation/composables/useGoalManagement.ts`

- [ ] 替换导入：`goalWebApplicationService` → `goalManagementApplicationService`
- [ ] 替换所有调用

### 2.6 更新 SearchDataProvider.ts

**文件**：`apps/web/src/shared/services/SearchDataProvider.ts`

- [ ] 替换导入
- [ ] 替换使用

### 2.7 验证所有替换完成

```bash
grep -r "goalWebApplicationService" apps/web/src/ --include="*.ts" --include="*.vue"
```

- [ ] 应该没有结果（除了测试 mock）

### 2.8 验证编译

```bash
nx run web:type-check
```

- [ ] 无 TypeScript 错误

---

## 📋 第 3 步：完善初始化逻辑（10-15 分钟）

### 3.1 更新 initialization/index.ts

**文件**：`apps/web/src/modules/goal/initialization/index.ts`

关键改动：

```typescript
// 在 goalUserDataSyncTask 中，修改初始化逻辑
// 使用新的 syncAllGoals 方法

const goalUserDataSyncTask: InitializationTask = {
  initialize: async (context?: { accountUuid?: string }) => {
    try {
      // 改为直接调用 syncAllGoals
      const result = await goalManagementApplicationService.syncAllGoals();
      
      (store as any).setInitialized(true);
      console.log('✅ [Goal] 用户 Goal 数据同步完成');
    } catch (error) {
      console.error('❌ [Goal] 用户 Goal 数据同步失败:', error);
    }
  },
};
```

- [ ] 替换数据加载逻辑
- [ ] 删除不必要的代码

### 3.2 验证编译

```bash
nx run web:type-check
```

- [ ] 无 TypeScript 错误

---

## 📋 第 4 步：简化组件逻辑（10-15 分钟）

### 4.1 更新 KeyResultDetailView.vue

**文件**：`apps/web/src/modules/goal/presentation/views/KeyResultDetailView.vue`

简化 `loadData()` 方法：

```typescript
// 修改前：每次刷新都要加载
const loadData = async () => {
  if (!goal.value || !goal.value.keyResults?.length) {
    await fetchGoalById(goalUuid.value, true);
  }
};

// 修改后：直接从 store 读取
const loadData = async () => {
  // Goal 数据已在模块初始化时加载
  // 如果找不到说明有问题
  if (!goal.value) {
    console.error('Goal not found in store');
    error.value = '目标不存在';
  }
};
```

- [ ] 更新 loadData() 方法
- [ ] 移除不必要的 API 调用

### 4.2 验证

```bash
nx run web:type-check
```

- [ ] 无 TypeScript 错误

---

## 📋 第 5 步：删除文件（1 分钟）

### 5.1 删除 GoalWebApplicationService.ts

```bash
rm apps/web/src/modules/goal/application/services/GoalWebApplicationService.ts
```

- [ ] 文件已删除

### 5.2 验证

```bash
# 应该没有搜索结果
grep -r "GoalWebApplicationService" apps/web/src/ --include="*.ts"
```

- [ ] 没有剩余引用

---

## 📋 第 6 步：更新测试（5-10 分钟）

### 6.1 更新 useGoal.test.ts

**文件**：`apps/web/src/modules/goal/presentation/composables/__tests__/useGoal.test.ts`

- [ ] 更新 mock 配置
  - 从 `GoalWebApplicationService` 改为 `GoalManagementApplicationService`

### 6.2 更新 SearchDataProvider.integration.spec.ts

**文件**：`apps/web/src/shared/services/__tests__/SearchDataProvider.integration.spec.ts`

- [ ] 更新 mock 配置

### 6.3 运行测试

```bash
nx run web:test
```

- [ ] 所有测试通过

---

## 🧪 第 7 步：完整验证（20-30 分钟）

### 7.1 编译检查

```bash
nx run web:type-check
```

- [ ] ✅ 无 TypeScript 错误

### 7.2 Lint 检查

```bash
nx run web:lint
```

- [ ] ✅ 无 Lint 错误

### 7.3 单元测试

```bash
nx run web:test
```

- [ ] ✅ 所有测试通过

### 7.4 构建验证

```bash
nx run web:build
```

- [ ] ✅ 构建成功

### 7.5 应用启动测试

启动应用，验证：

- [ ] ✅ 应用启动正常
- [ ] ✅ 用户登录后 Goal 数据加载到 store
- [ ] ✅ 打开 Goal 详情页无错误
- [ ] ✅ KeyResult 列表显示正常
- [ ] ✅ 删除 KeyResult 功能正常
- [ ] ✅ 页面刷新后数据仍然存在

---

## 🔍 问题排查

### 问题：找不到导出

**症状**：`Cannot find name 'goalManagementApplicationService'`

**解决**：
1. 检查 services/index.ts 是否正确导出
2. 检查导入路径是否正确

### 问题：TypeScript 错误

**症状**：`Property 'xxx' does not exist`

**解决**：
1. 验证方法是否已添加到 GoalManagementApplicationService
2. 检查方法签名是否正确

### 问题：测试失败

**症状**：Mock 不匹配

**解决**：
1. 更新测试 mock 配置
2. 检查 spy 和 stub 是否指向正确的服务

### 问题：应用启动失败

**症状**：初始化错误

**解决**：
1. 检查 initialization/index.ts 逻辑
2. 查看控制台错误信息
3. 验证 syncAllGoals 方法实现

---

## 📝 提交指南

### 推荐的 commit 分法

```bash
# Commit 1：添加方法
git commit -m "feat: 将 GoalWebApplicationService 方法迁移到 GoalManagementApplicationService"

# Commit 2：更新导入
git commit -m "refactor: 替换 goalWebApplicationService 导入为 goalManagementApplicationService"

# Commit 3：删除文件
git commit -m "refactor: 删除已重构的 GoalWebApplicationService"

# Commit 4：初始化和组件优化
git commit -m "refactor: 完善 Goal 模块初始化逻辑和组件加载流程"

# Commit 5：测试更新
git commit -m "test: 更新 Goal 模块相关测试"
```

---

## ✨ 完成标志

所有以下条件都满足时，表示重构完成：

- [ ] ✅ 没有 GoalWebApplicationService 文件
- [ ] ✅ 没有 GoalWebApplicationService 导入
- [ ] ✅ 没有 goalWebApplicationService 使用
- [ ] ✅ 编译无错误
- [ ] ✅ Lint 无警告
- [ ] ✅ 所有测试通过
- [ ] ✅ 应用能启动
- [ ] ✅ Goal 数据在应用启动时加载
- [ ] ✅ 组件能正确显示数据

---

## 📞 需要帮助？

参考文档：
- `ARCHITECTURE_CLEANUP_PLAN.md` - 详细的架构分析
- `MIGRATION_STEPS.md` - 具体的迁移步骤
- `NEXT_STEPS_SUMMARY.md` - 快速参考

