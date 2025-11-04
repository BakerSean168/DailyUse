# 🔄 Goal 模块服务迁移步骤（详细）

**问题**：GoalWebApplicationService 和 GoalManagementApplicationService 功能重复

**目标**：
1. ✅ 删除 GoalWebApplicationService
2. ✅ 将所有功能迁移到 GoalManagementApplicationService
3. ✅ 更新所有导入和使用

---

## 📊 受影响的文件

### 直接使用 GoalWebApplicationService 的文件

```
1. 使用 goalWebApplicationService 的文件（需要改为 goalManagementApplicationService）
   ├─ useKeyResult.ts (composable)
   ├─ useGoal.ts (composable)
   ├─ useGoalManagement.ts (composable)
   ├─ SearchDataProvider.ts (service)
   └─ SearchDataProvider.integration.spec.ts (test)

2. 导入 GoalWebApplicationService 的文件
   ├─ services/index.ts
   ├─ application/index.ts
   └─ __tests__/useGoal.test.ts

3. 初始化相关
   └─ initialization/index.ts (需要使用正确的服务)
```

---

## 🚀 迁移步骤

### 第 1 步：添加缺失的方法到 GoalManagementApplicationService

需要从 GoalWebApplicationService 复制这些方法：

```typescript
// 这些方法需要添加到 GoalManagementApplicationService
1. syncAllGoals()              // 同步所有 Goal 和 Folder 数据
2. refreshGoalWithKeyResults() // 刷新指定 Goal 的 KeyResults
3. refreshGoalWithReviews()    // 刷新指定 Goal 的 Reviews
4. getProgressBreakdown()      // 获取进度分解详情
5. getGoalAggregateView()      // 获取 Goal 聚合视图
6. cloneGoal()                 // 克隆 Goal
```

**位置**：
- 源：GoalWebApplicationService.ts （待迁移）
- 目标：GoalManagementApplicationService.ts

### 第 2 步：更新导出（services/index.ts）

```typescript
// 修改前
export { GoalWebApplicationService } from './GoalWebApplicationService';
export { goalWebApplicationService } from './GoalWebApplicationService';

// 修改后
// 删除 GoalWebApplicationService 的导出
// 保持 goalManagementApplicationService 导出不变
```

### 第 3 步：创建别名以保持兼容性（可选）

如果要平滑过渡，可以在 GoalManagementApplicationService 添加：

```typescript
// 为了向后兼容，可以导出两个别名
export const goalWebApplicationService = goalManagementApplicationService;
```

### 第 4 步：更新所有使用处

需要替换所有 `goalWebApplicationService` 为 `goalManagementApplicationService`

**文件列表**：

```
1. composables/useKeyResult.ts
   - 替换：import { goalWebApplicationService }
   - 替换为：import { goalManagementApplicationService }
   - 替换所有调用

2. composables/useGoal.ts
   - 替换：import { goalWebApplicationService }
   - 替换为：import { goalManagementApplicationService }
   - 替换所有调用（约 15+ 处）

3. composables/useGoalManagement.ts
   - 替换：import { goalWebApplicationService }
   - 替换为：import { goalManagementApplicationService }
   - 替换所有调用

4. shared/services/SearchDataProvider.ts
   - 替换：import GoalWebApplicationService
   - 替换为：import { goalManagementApplicationService }
   - 替换所有调用

5. shared/services/__tests__/SearchDataProvider.integration.spec.ts
   - 替换：vi.mock('...GoalWebApplicationService')
   - 替换为对应的新文件

6. __tests__/useGoal.test.ts
   - 更新 mock 配置
```

### 第 5 步：更新初始化逻辑（initialization/index.ts）

```typescript
// 修改前
const [goalsResp, foldersResp] = await Promise.all([
  getGoalManagementService.getGoals({ limit: 100 }),
  getGoalFolderService.getGoalFolders({ limit: 100 }),
]);

// 修改后：使用新的 syncAllGoals 方法
await goalManagementApplicationService.syncAllGoals();
```

### 第 6 步：删除文件

```bash
rm apps/web/src/modules/goal/application/services/GoalWebApplicationService.ts
```

### 第 7 步：更新 application/index.ts

```typescript
// 修改前
export { GoalWebApplicationService } from './services/GoalWebApplicationService';

// 修改后
// 删除这一行
```

### 第 8 步：验证

```bash
# 检查是否还有剩余的引用
grep -r "GoalWebApplicationService" apps/web/src/

# 检查是否还有剩余的 goalWebApplicationService
grep -r "goalWebApplicationService" apps/web/src/

# 编译检查
nx run web:type-check

# 构建检查
nx run web:build
```

---

## ⚠️ 注意事项

### 1. 向后兼容性

如果其他项目依赖 GoalWebApplicationService，可以：

```typescript
// 在 services/index.ts 中保留别名
export { GoalManagementApplicationService as GoalWebApplicationService };
export { goalManagementApplicationService as goalWebApplicationService };
```

### 2. 测试更新

需要更新的测试文件：

```
- __tests__/useGoal.test.ts
- shared/services/__tests__/SearchDataProvider.integration.spec.ts
```

### 3. 初始化流程确认

修改前需要确认：

```typescript
// 检查 goalManagementApplicationService 中是否有：
1. getGoals() 方法
2. getGoalFolders() 方法（通过 goalFolderApplicationService）
3. syncAllGoals() 方法（需要新增）
```

---

## 🛠️ 快速迁移命令

```bash
# 1. 查看所有引用
grep -r "goalWebApplicationService" apps/web/src/ --include="*.ts" --include="*.vue"

# 2. 查看 GoalWebApplicationService 定义
grep -r "GoalWebApplicationService" apps/web/src/ --include="*.ts"

# 3. 查看导入位置
grep -r "from.*GoalWebApplicationService" apps/web/src/ --include="*.ts"
```

---

## 📋 迁移检查清单

- [ ] 确认 GoalManagementApplicationService 包含所有必要方法
- [ ] 添加 syncAllGoals() 方法到 GoalManagementApplicationService
- [ ] 添加 refreshGoalWithKeyResults() 方法
- [ ] 添加 refreshGoalWithReviews() 方法
- [ ] 添加 getProgressBreakdown() 方法
- [ ] 添加 getGoalAggregateView() 方法
- [ ] 添加 cloneGoal() 方法
- [ ] 更新 services/index.ts 导出
- [ ] 更新 useKeyResult.ts 导入
- [ ] 更新 useGoal.ts 导入（约 15+ 处）
- [ ] 更新 useGoalManagement.ts 导入
- [ ] 更新 SearchDataProvider.ts 导入
- [ ] 更新 SearchDataProvider.integration.spec.ts
- [ ] 更新 useGoal.test.ts
- [ ] 更新 initialization/index.ts 逻辑
- [ ] 更新 application/index.ts 导出
- [ ] 删除 GoalWebApplicationService.ts 文件
- [ ] 运行 TypeScript 检查：`nx run web:type-check`
- [ ] 运行单元测试：`nx run web:test`
- [ ] 运行 Lint：`nx run web:lint`
- [ ] 构建验证：`nx run web:build`

---

## 🔐 风险评估

### 低风险
- ✅ 这是内部重构，不涉及 API 变化
- ✅ 功能完全相同
- ✅ 可以逐步进行（先更新一个文件，再下一个）

### 中等风险
- ⚠️ 涉及多个文件的导入变更
- ⚠️ 需要更新测试 mock
- ⚠️ 初始化逻辑变更

### 缓解方案
- ✅ 先在本地测试
- ✅ 逐文件迁移
- ✅ 每次修改后运行测试
- ✅ 保留 git 历史记录

