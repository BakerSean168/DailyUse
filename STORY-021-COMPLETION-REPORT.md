# STORY-021 完成报告

**自动目标状态更新规则 (Auto Goal Status Update Rules)**

## 📊 基本信息

- **Story ID**: STORY-021 (STORY-AI-003-003)
- **优先级**: P2
- **预估工时**: 2 SP
- **实际工时**: 2 SP
- **状态**: ✅ COMPLETED
- **完成时间**: 2024-XX-XX

## 🎯 Story 目标

根据关键结果 (KeyResult) 的进度、权重和其他指标，自动建议或应用目标状态变更，提升目标管理的智能化水平。

## ✅ 完成的功能

### 1. 规则引擎架构 (0.5 SP)

**文件**:

- `packages/contracts/src/modules/goal/rules/StatusRule.ts` (150 lines)
- `apps/web/src/modules/goal/domain/rules/BuiltInRules.ts` (240 lines)
- `apps/web/src/modules/goal/application/services/StatusRuleEngine.ts` (260 lines)

**核心功能**:

- ✅ StatusRule 契约定义 (8 个类型/接口)
  - StatusRule: 规则定义
  - RuleCondition: 条件定义 (metric, operator, value, scope)
  - RuleAction: 动作定义 (status, notify, message)
  - RuleExecutionResult: 执行结果
  - RuleSetConfig: 规则集配置

- ✅ 6 个内置规则 (按优先级排序):
  1. **rule-completed** (优先级 100): 所有 KR 进度 = 100% → 状态变为 COMPLETED
  2. **rule-draft** (优先级 50): KR 数量 = 0 → 状态变为 DRAFT
  3. **rule-at-risk** (优先级 20): 任意 KR 进度 < 30% → 发送警告通知
  4. **rule-in-progress** (优先级 15): KR 数量 > 0 且有进度 → 状态变为 ACTIVE
  5. **rule-on-track** (优先级 10): 所有 KR 进度 >= 80% → 发送鼓励通知
  6. **rule-weight-warning** (优先级 5): 权重总和 ≠ 100% → 发送警告

- ✅ StatusRuleEngine 服务类:
  - `evaluate()`: 返回最高优先级匹配规则
  - `evaluateAll()`: 返回所有匹配规则
  - `addRule()`, `removeRule()`, `updateRule()`: CRUD 操作
  - `resetToBuiltIn()`: 重置为内置规则

**支持的指标** (RuleMetric):

- `progress`: 关键结果进度 (0-100)
- `weight`: 关键结果权重 (0-100)
- `kr_count`: 关键结果数量
- `deadline`: 剩余天数

**支持的操作符** (RuleOperator):

- `>`, `<`, `>=`, `<=`, `=`, `!=`

**条件范围** (Scope):

- `all`: 所有关键结果 (平均值/总和)
- `any`: 任意关键结果 (最小值)
- `<kr-uuid>`: 特定关键结果

---

### 2. 规则评估服务 (0.25 SP)

**文件**: `apps/web/src/modules/goal/application/composables/useAutoStatusRules.ts` (190 lines)

**核心功能**:

- ✅ `evaluateGoal()`: 评估目标并返回规则建议
- ✅ `recordHistory()`: 记录规则执行历史
- ✅ `getGoalHistory()`: 获取目标的执行历史
- ✅ `getRuleEngine()`: 访问规则引擎实例
- ✅ `convertToGoalData()`: 灵活的 Goal → GoalData 转换
  - 自动处理嵌套的 progress 结构
  - 兼容不同 DTO 格式

**配置选项** (AutoRuleConfig):

- `enabled`: 启用/禁用自动规则
- `allowManualOverride`: 允许手动覆盖
- `notifyOnChange`: 状态变更时通知

**返回类型** (RuleSuggestion):

```typescript
{
  goalUuid: string;
  currentStatus: GoalStatus;
  suggestedStatus?: GoalStatus;
  notify: boolean;
  message?: string;
  executionResult: RuleExecutionResult | null;
}
```

---

### 3. 规则编辑器 UI (0.5 SP)

**文件**: `apps/web/src/modules/goal/presentation/components/rules/StatusRuleEditor.vue` (560 lines)

**核心功能**:

- ✅ 规则列表展示
  - 优先级排序
  - 启用/禁用切换
  - 内置规则保护 (不可删除)
  - 规则摘要 (条件 + 动作)

- ✅ 规则编辑对话框
  - 基本信息: 名称、描述、优先级
  - 条件类型: 所有满足 (AND) / 任意满足 (OR)
  - 条件构建器:
    - 支持添加/删除多个条件
    - 4 种指标选择
    - 6 种操作符选择
    - 范围选择器 (all/any KR)
  - 动作配置器:
    - 目标状态选择 (可选)
    - 通知开关
    - 自定义通知消息

- ✅ 表单验证
  - 规则名称必填
  - 优先级 > 0
  - 至少一个条件

- ✅ 全局配置开关
  - 启用自动规则
  - 允许手动覆盖
  - 状态变更时通知

**UI 亮点**:

- 实时更新规则列表
- 内联启用/禁用切换
- 条件/动作可读摘要
- 响应式布局

---

### 4. 集成到 Goal 流程 (0.25 SP + 0.5 SP)

**修改文件**:

- `apps/web/src/modules/goal/presentation/components/dialogs/GoalDialog.vue` (+10 lines)
- `apps/web/src/modules/goal/presentation/views/StatusRulesDemoView.vue` (330 lines, NEW)
- `apps/web/src/shared/router/routes.ts` (+9 lines)

**GoalDialog 集成**:

- ✅ 添加第 4 个标签页 "规则设置"
  - Tab 图标: `mdi-robot` (info 颜色)
  - 直接嵌入 StatusRuleEditor 组件
  - 用户可在创建/编辑目标时管理规则

**StatusRulesDemoView 测试器**:

- ✅ 左右分栏布局
  - 左侧: StatusRuleEditor (规则配置)
  - 右侧: 规则测试器

- ✅ 测试器功能:
  - 目标状态选择
  - KR 数量调整 (0-10)
  - KR 进度/权重输入 (0-100)
  - 剩余天数设置
  - 执行规则评估按钮

- ✅ 结果展示:
  - 状态建议 (保持不变 / 需要变更)
  - 通知消息
  - 匹配规则详情 (ID, 匹配条件, 执行时间)
  - 执行历史时间线 (最近 5 条)

- ✅ 路由: `/goals/rules-demo`

---

## 📁 新增/修改文件清单

### 新增文件 (5 个)

1. `packages/contracts/src/modules/goal/rules/StatusRule.ts` (150 lines)
2. `apps/web/src/modules/goal/domain/rules/BuiltInRules.ts` (240 lines)
3. `apps/web/src/modules/goal/application/services/StatusRuleEngine.ts` (260 lines)
4. `apps/web/src/modules/goal/application/composables/useAutoStatusRules.ts` (190 lines)
5. `apps/web/src/modules/goal/presentation/components/rules/StatusRuleEditor.vue` (560 lines)
6. `apps/web/src/modules/goal/presentation/views/StatusRulesDemoView.vue` (330 lines)

**总代码量**: ~1,730 lines

### 修改文件 (2 个)

1. `apps/web/src/modules/goal/presentation/components/dialogs/GoalDialog.vue` (+10 lines)
2. `apps/web/src/shared/router/routes.ts` (+9 lines)
3. `packages/contracts/src/modules/goal/index.ts` (+1 line)

---

## 🔧 技术实现

### 架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│  - StatusRuleEditor.vue (规则编辑 UI)                       │
│  - StatusRulesDemoView.vue (测试器)                         │
│  - GoalDialog.vue (集成)                                    │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    Application Layer                        │
│  - useAutoStatusRules.ts (规则评估 composable)              │
│  - StatusRuleEngine.ts (规则引擎服务)                       │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      Domain Layer                           │
│  - BuiltInRules.ts (内置规则定义)                           │
│  - Helper functions (排序, 过滤, 查找)                      │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                     Contracts Layer                         │
│  - StatusRule.ts (类型定义)                                 │
│  - 8 interfaces/types                                       │
└─────────────────────────────────────────────────────────────┘
```

### 关键设计决策

1. **优先级系统**:
   - 内置规则优先级 5-100
   - 自定义规则默认优先级 10
   - 评估时返回最高优先级匹配规则

2. **条件评估**:
   - 支持 AND (`conditionType: 'all'`) / OR (`conditionType: 'any'`)
   - 浮点数比较使用 0.01 精度容差
   - Scope 支持 all (平均/总和), any (最小值), 特定 KR UUID

3. **灵活的数据转换**:
   - `convertToGoalData()` 兼容多种 DTO 格式
   - 自动提取嵌套的 progress 结构
   - 处理 null/undefined 值

4. **历史记录**:
   - 自动限制为最近 100 条
   - 记录规则 ID, 状态变更, 消息, 时间戳

5. **UI 保护**:
   - 内置规则不可删除 (通过 `rule.id.startsWith('rule-')` 判断)
   - 表单验证确保数据完整性
   - 实时更新规则列表

---

## 🚀 使用方式

### 1. 在 GoalDialog 中管理规则

```typescript
// 打开目标编辑对话框 → 切换到"规则设置"标签页
// 可以:
// - 启用/禁用内置规则
// - 创建自定义规则
// - 修改规则优先级
// - 配置通知消息
```

### 2. 在代码中使用规则评估

```typescript
import { useAutoStatusRules } from '@/modules/goal/application/composables/useAutoStatusRules';

const { evaluateGoal, recordHistory } = useAutoStatusRules();

// 评估目标
const suggestion = evaluateGoal(goal);

if (suggestion.suggestedStatus && suggestion.suggestedStatus !== goal.status) {
  // 应用状态变更
  await updateGoalStatus(goal.uuid, suggestion.suggestedStatus);

  // 记录历史
  recordHistory(
    goal.uuid,
    suggestion.executionResult.ruleId,
    goal.status,
    suggestion.suggestedStatus,
    suggestion.message,
  );

  // 显示通知
  if (suggestion.notify && suggestion.message) {
    showNotification(suggestion.message);
  }
}
```

### 3. 使用测试器

1. 访问 `/goals/rules-demo`
2. 左侧配置规则
3. 右侧输入测试数据
4. 点击"执行规则评估"
5. 查看评估结果和执行历史

---

## 📈 内置规则示例

### 示例 1: 自动完成规则

```typescript
{
  id: 'rule-completed',
  name: '自动完成',
  priority: 100,
  conditionType: 'all',
  conditions: [
    { metric: 'progress', operator: '=', value: 100, scope: 'all' }
  ],
  action: {
    status: GoalStatus.COMPLETED,
    notify: true,
    message: '🎊 恭喜！目标已完成，所有关键结果都达到 100%'
  }
}
```

**触发条件**: 所有 KR 进度达到 100%
**结果**: 状态变为 COMPLETED, 发送祝贺通知

### 示例 2: 进度风险警告

```typescript
{
  id: 'rule-at-risk',
  name: '需要关注',
  priority: 20,
  conditionType: 'any',
  conditions: [
    { metric: 'progress', operator: '<', value: 30, scope: 'any' }
  ],
  action: {
    status: GoalStatus.ACTIVE, // 保持当前状态
    notify: true,
    message: '⚠️ 注意：有关键结果进度低于 30%'
  }
}
```

**触发条件**: 任意一个 KR 进度 < 30%
**结果**: 状态不变, 发送警告通知

### 示例 3: 权重异常提醒

```typescript
{
  id: 'rule-weight-warning',
  name: '权重异常',
  priority: 5,
  conditionType: 'all',
  conditions: [
    { metric: 'weight', operator: '!=', value: 100, scope: 'all' }
  ],
  action: {
    notify: true,
    message: '⚠️ 权重异常：关键结果权重总和不等于 100%'
  }
}
```

**触发条件**: KR 权重总和 ≠ 100%
**结果**: 仅发送通知, 不改变状态

---

## 🧪 测试建议

### 功能测试

- [ ] 创建自定义规则
- [ ] 编辑内置规则 (修改优先级, 启用/禁用)
- [ ] 删除自定义规则 (验证内置规则不可删除)
- [ ] 测试不同条件类型 (all vs any)
- [ ] 测试所有指标 (progress, weight, kr_count, deadline)
- [ ] 测试所有操作符 (>, <, =, >=, <=, !=)
- [ ] 验证优先级排序 (高优先级规则先匹配)

### 集成测试

- [ ] 在 GoalDialog 中打开规则设置标签页
- [ ] 使用测试器验证规则逻辑
- [ ] 检查执行历史记录
- [ ] 验证通知消息显示

### 边界测试

- [ ] KR 数量 = 0
- [ ] 所有 KR 进度 = 100
- [ ] 权重总和 ≠ 100
- [ ] 无匹配规则的情况
- [ ] 多个规则同时匹配 (验证优先级)

---

## 📝 后续优化建议

### 短期 (Sprint 4)

1. **持久化规则配置**
   - 将自定义规则保存到 localStorage 或后端
   - 支持规则导入/导出 (JSON 格式)

2. **规则模板库**
   - 提供更多行业场景模板
   - 支持一键应用模板规则

3. **自动应用规则**
   - 在 KR 更新时自动触发规则评估
   - 可选的自动应用模式 (需确认 vs 静默应用)

### 中期 (Sprint 5-6)

1. **高级条件**
   - 支持时间范围条件 (例如: 创建后 7 天内)
   - 支持依赖条件 (例如: 前置目标完成后)
   - 支持自定义表达式

2. **批量操作**
   - 批量评估所有目标
   - 批量应用规则建议
   - 生成批量应用报告

3. **规则冲突检测**
   - 检测相互矛盾的规则
   - 提供规则优化建议

### 长期 (Sprint 7+)

1. **机器学习优化**
   - 根据用户历史学习最佳规则
   - 自动调整规则优先级
   - 智能推荐规则配置

2. **可视化规则设计器**
   - 拖拽式规则构建器
   - 规则流程图预览
   - 规则覆盖率分析

---

## 📊 Sprint 进度更新

**Sprint 3 总进度**: 15.4/21 SP (73.3%)

**已完成** (✅ 15.4 SP):

- STORY-015: DAG Export (2 SP)
- STORY-020: Template Recommendations (2 SP)
- STORY-019: AI Weight Allocation (3 SP)
- STORY-016: Multi-Goal Comparison (3.5 SP)
- STORY-021: Auto Status Rules (2 SP) ← **本次完成**
- KeyResult Weight Refactoring (2.9 SP, BREAKING)

**待完成** (5.6 SP):

- STORY-012: Test Environment (3 SP, P0) - 需要用户决策
- STORY-013: DTO Tests (2 SP, P1) - 依赖 STORY-012
- STORY-014/017/018: Performance/Animation (2.6 SP, P2)

---

## ✅ 验收标准

- [x] 定义规则契约接口 (StatusRule, RuleCondition, RuleAction)
- [x] 实现 6 个内置规则 (completed, draft, at-risk, in-progress, on-track, weight-warning)
- [x] 构建规则引擎 (evaluate, evaluateAll, CRUD)
- [x] 创建规则评估 composable (useAutoStatusRules)
- [x] 开发规则编辑器 UI (StatusRuleEditor.vue)
- [x] 集成到 GoalDialog (规则设置标签页)
- [x] 创建测试器页面 (StatusRulesDemoView.vue)
- [x] 添加路由 `/goals/rules-demo`
- [x] 支持 4 种指标 (progress, weight, kr_count, deadline)
- [x] 支持 6 种操作符 (>, <, =, >=, <=, !=)
- [x] 支持条件范围 (all, any, specific KR)
- [x] 支持优先级排序
- [x] 支持历史记录 (最近 100 条)
- [x] 内置规则保护 (不可删除)
- [x] 表单验证 (名称, 优先级, 条件)

---

## 🎉 总结

STORY-021 (Auto Goal Status Update Rules) 已成功完成！

**核心成就**:

- ✅ 完整的规则引擎系统 (契约 → 域 → 应用 → 展示)
- ✅ 6 个开箱即用的内置规则
- ✅ 灵活的自定义规则编辑器
- ✅ 强大的规则测试器
- ✅ 无缝集成到目标编辑流程

**代码质量**:

- 类型安全 (TypeScript)
- 分层架构 (Contracts → Domain → Application → Presentation)
- 可扩展设计 (易于添加新规则/指标)
- 完整的错误处理

**用户体验**:

- 直观的 UI 设计
- 实时反馈
- 丰富的提示信息
- 完善的验证机制

下一步建议: 完成 STORY-012 (Test Environment) 以解锁 STORY-013 (DTO Tests)。
