# Goal 模块测试套件

这是 DailyUse 应用中 Goal 模块的完整测试套件。测试覆盖了目标管理的所有核心功能，包括领域实体、状态管理、业务逻辑和组件交互。

## 📁 测试结构

```
src/modules/Goal/
├── domain/
│   ├── aggregates/
│   │   ├── goal.test.ts           # Goal 聚合根测试
│   │   └── GoalFolder.test.ts        # GoalFolder 聚合根测试
│   └── entities/
│       ├── keyResult.test.ts      # KeyResult 实体测试
│       └── record.test.ts         # GoalRecord 实体测试
├── presentation/
│   ├── stores/
│   │   └── goalStore.test.ts      # Pinia 状态管理测试
│   ├── composables/
│   │   └── useGoalService.test.ts # Composable 测试
│   └── components/
│       └── GoalFolder.test.ts        # Vue 组件逻辑测试
├── test-setup.ts                  # 测试环境设置
├── vitest.config.ts              # 测试配置
├── test-runner.mjs               # 测试运行器
└── TEST_README.md                # 测试说明文档
```

## 🧪 测试覆盖范围

### Domain 层测试 (领域层)

#### 1. Goal 聚合根 (`goal.test.ts`)

- ✅ 构造函数和基本属性验证
- ✅ 属性验证和边界条件检查
- ✅ 关键结果管理（添加、删除、更新）
- ✅ 进度计算（加权进度、时间进度）
- ✅ 记录管理和状态同步
- ✅ 复盘管理
- ✅ 目标状态管理（激活、暂停、完成、归档）
- ✅ 快照创建和数据转换
- ✅ 静态方法和工具函数
- ✅ 边界情况和错误处理

#### 2. GoalFolder 聚合根 (`GoalFolder.test.ts`)

- ✅ 目录创建和属性管理
- ✅ 排序配置和层级关系
- ✅ 数据验证和错误处理
- ✅ 静态方法和数据转换
- ✅ 生命周期管理
- ✅ 边界情况测试

#### 3. KeyResult 实体 (`keyResult.test.ts`)

- ✅ 关键结果属性管理
- ✅ 进度计算（基础进度、加权进度）
- ✅ 完成状态自动管理
- ✅ 权重和计算方法验证
- ✅ 数据转换和克隆
- ✅ 边界值和异常处理

#### 4. GoalRecord 实体 (`record.test.ts`)

- ✅ 记录创建和属性管理
- ✅ 记录更新和生命周期
- ✅ 数据验证和约束检查
- ✅ 静态方法和数据转换
- ✅ 边界情况和错误处理

### Presentation 层测试 (表现层)

#### 5. Goal Store (`goalStore.test.ts`)

- ✅ 初始状态和状态同步
- ✅ 目标查询 Getters（按状态、目录过滤）
- ✅ 目录查询和排序逻辑
- ✅ 记录统计和汇总
- ✅ 系统目录识别
- ✅ 错误处理和数据一致性
- ✅ 统计功能测试

#### 6. useGoalService Composable (`useGoalService.test.ts`)

- ✅ 目标 CRUD 操作
- ✅ 目标目录 CRUD 操作
- ✅ 记录管理操作
- ✅ 复盘管理操作
- ✅ 数据同步操作
- ✅ 错误处理和用户反馈
- ✅ 日志记录和边界情况

#### 7. GoalFolder 组件 (`GoalFolder.test.ts`)

- ✅ 组件逻辑和状态管理
- ✅ 事件处理和数据流
- ✅ Store 集成测试
- ✅ 样式逻辑和条件渲染
- ✅ 错误处理和边界情况

## 🚀 运行测试

### 运行所有 Goal 模块测试

```bash
# 使用项目配置运行
npm test -- src/modules/Goal

# 或使用 vitest 直接运行
npx vitest src/modules/Goal

# 运行测试并生成覆盖率报告
npx vitest src/modules/Goal --coverage
```

### 运行特定测试文件

```bash
# 运行领域层测试
npx vitest src/modules/Goal/domain

# 运行表现层测试
npx vitest src/modules/Goal/presentation

# 运行特定文件
npx vitest src/modules/Goal/domain/aggregates/goal.test.ts
```

### 使用自定义测试运行器

```bash
# 运行 Goal 模块专用测试套件
node src/modules/Goal/test-runner.mjs
```

### 监听模式运行

```bash
# 监听文件变化并自动运行测试
npx vitest src/modules/Goal --watch
```

## 📊 测试统计

| 测试类别                | 测试文件数 | 测试用例数 | 覆盖范围           |
| ----------------------- | ---------- | ---------- | ------------------ |
| Domain 聚合根           | 2          | ~50        | 目标和目录核心逻辑 |
| Domain 实体             | 2          | ~40        | 关键结果和记录管理 |
| Presentation Store      | 1          | ~30        | 状态管理和查询     |
| Presentation Composable | 1          | ~25        | 业务操作封装       |
| Presentation Component  | 1          | ~15        | 组件逻辑验证       |
| **总计**                | **7**      | **~160**   | **全模块覆盖**     |

## 🔧 测试配置说明

### 环境配置 (`test-setup.ts`)

- 全局模拟 (`useSnackbar`, 系统常量)
- 领域基类模拟 (`AggregateRoot`, `Entity`)
- 测试工具函数
- 控制台模拟工具

### Vitest 配置 (`vitest.config.ts`)

- 测试文件匹配模式
- 覆盖率配置和阈值
- 路径别名设置
- 报告输出配置

## 🧩 测试策略

### 1. 单元测试

- **Domain 层**: 纯业务逻辑测试，无外部依赖
- **Entity 测试**: 属性验证、方法行为、数据转换
- **静态方法**: 工具函数和类型检查方法

### 2. 集成测试

- **Store 测试**: 状态管理与领域实体集成
- **Composable 测试**: 业务服务与用户界面集成
- **组件测试**: Vue 组件逻辑与状态管理集成

### 3. 边界测试

- **参数边界**: 最大值、最小值、空值处理
- **异常情况**: 错误输入、网络异常、数据损坏
- **并发场景**: 同时操作、状态竞争条件

### 4. 回归测试

- **数据兼容性**: DTO 转换、版本升级
- **API 契约**: 方法签名、返回值格式
- **行为一致性**: 相同输入产生相同输出

## 📈 覆盖率目标

- **行覆盖率**: ≥ 80%
- **分支覆盖率**: ≥ 80%
- **函数覆盖率**: ≥ 80%
- **语句覆盖率**: ≥ 80%

## 🐛 常见测试场景

### Domain 层

```typescript
// 测试目标创建
const goal = new Goal({
  name: '减肥目标',
  color: '#FF5733',
  analysis: { motive: '健康', feasibility: '高' },
});

// 测试关键结果管理
const keyResult = new KeyResult({
  /* ... */
});
goal.addKeyResult(keyResult);
expect(goal.keyResults).toHaveLength(1);

// 测试进度计算
expect(goal.progress).toBe(expectedProgress);
```

### Store 层

```typescript
// 测试状态同步
const store = useGoalStore();
await store.syncGoalState(goal);
expect(store.goals).toContain(goal);

// 测试查询功能
const activeGoals = store.getActiveGoals;
expect(activeGoals.every((g) => g.lifecycle.status === 'active')).toBe(true);
```

### Service 层

```typescript
// 测试业务操作
const { handleCreateGoal } = useGoalServices();
await handleCreateGoal(goal);
expect(mockShowSuccess).toHaveBeenCalledWith(expect.stringContaining('创建成功'));
```

## 🔍 调试测试

### 调试单个测试

```bash
# 只运行匹配的测试
npx vitest src/modules/Goal -t "应该正确计算进度"

# 详细输出模式
npx vitest src/modules/Goal --reporter=verbose

# 调试模式
npx vitest src/modules/Goal --inspect-brk
```

### 查看覆盖率报告

```bash
# 生成 HTML 覆盖率报告
npx vitest src/modules/Goal --coverage
# 报告位置: coverage/goal-module/index.html
```

## 📝 贡献测试

### 添加新测试

1. 在相应目录创建 `.test.ts` 文件
2. 遵循现有测试结构和命名规范
3. 包含正常、边界和异常情况测试
4. 添加适当的注释和说明

### 测试规范

- 使用描述性的测试名称
- 遵循 AAA 模式 (Arrange, Act, Assert)
- 每个测试只验证一个行为
- 使用适当的测试数据和模拟

### 更新文档

- 添加新测试类别到统计表格
- 更新覆盖范围说明
- 添加新的测试场景示例

---

## 💡 最佳实践

1. **测试隔离**: 每个测试独立，不依赖其他测试的结果
2. **模拟外部依赖**: 使用 vi.mock() 模拟外部模块和服务
3. **数据驱动**: 使用测试数据生成器，避免硬编码
4. **错误优先**: 优先测试错误和边界情况
5. **可读性**: 测试代码应该易读易懂，就像文档一样

这个测试套件确保 Goal 模块的稳定性、可靠性和可维护性。所有测试都经过精心设计，涵盖了从底层领域逻辑到上层用户界面的完整数据流。
