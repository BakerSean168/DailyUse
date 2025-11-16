# 重复规则结束条件增强实施报告

## 📋 需求说明

用户反馈：
> "你这没实现表单中切换重复规则时的使用默认数据的方法吧；应该是在 taskTemplate 中添加专门的更新重复规则结束方式的方法，切换到指定方式时，使用默认值才对吧。还有这些应该直接用枚举类型而非字面量吧。"

**核心问题**：
1. ❌ 没有专门的方法来更新重复规则的结束条件
2. ❌ 切换结束条件类型时没有提供默认值
3. ❌ 使用字符串字面量而非枚举类型（类型不安全）

## ✅ 解决方案

### 1. 添加结束条件类型枚举

**文件**：`packages/contracts/src/modules/task/enums.ts`

```typescript
/**
 * 重复规则结束条件类型
 */
export enum RecurrenceEndConditionType {
  NEVER = 'NEVER',           // 永不结束
  END_DATE = 'END_DATE',     // 指定日期结束
  OCCURRENCES = 'OCCURRENCES', // 指定次数结束
}
```

**导出**：`packages/contracts/src/index.ts`
```typescript
export {
  // ... 其他枚举
  RecurrenceEndConditionType,  // ✅ 新增
} from './modules/task/enums';
```

**优势**：
- ✅ 类型安全：编译时检查，避免拼写错误
- ✅ 代码提示：IDE 自动补全
- ✅ 可维护性：集中管理，修改方便
- ✅ 文档化：枚举值即文档

---

### 2. 在 TaskTemplate 中添加专门的更新方法

**文件**：`packages/domain-server/src/task/aggregates/TaskTemplate.ts`

#### 新方法：`updateRecurrenceEndCondition()`

```typescript
/**
 * 更新重复规则的结束条件（使用枚举类型和默认值）
 * @param endConditionType 结束条件类型
 * @param customValue 自定义值（日期时间戳或重复次数）
 */
public updateRecurrenceEndCondition(
  endConditionType: RecurrenceEndConditionType,
  customValue?: number,
): void {
  // 1. 验证：只有重复任务才能更新
  if (this._taskType !== TaskType.RECURRING) {
    throw new InvalidTaskTemplateStateError(
      'Only RECURRING tasks have recurrence rules.', 
      { ... }
    );
  }

  // 2. 验证：重复规则必须存在
  if (!this._recurrenceRule) {
    throw new InvalidTaskTemplateStateError(
      'Recurrence rule is not set', 
      { ... }
    );
  }

  let updatedRule: RecurrenceRule;

  // 3. 根据类型应用不同策略（带默认值）
  switch (endConditionType) {
    case RecurrenceEndConditionType.NEVER:
      // 永不结束：清空 endDate 和 occurrences
      updatedRule = this._recurrenceRule.withNeverEnd();
      break;

    case RecurrenceEndConditionType.END_DATE:
      // 指定日期结束：使用提供的日期，如果没有则默认为 30 天后
      const endDate = customValue ?? Date.now() + 30 * 86400000;
      updatedRule = this._recurrenceRule.withEndDate(endDate);
      break;

    case RecurrenceEndConditionType.OCCURRENCES:
      // 指定次数结束：使用提供的次数，如果没有则默认为 10 次
      const occurrences = customValue ?? 10;
      updatedRule = this._recurrenceRule.withOccurrences(occurrences);
      break;

    default:
      throw new InvalidTaskTemplateStateError(
        `Invalid end condition type: ${endConditionType}`,
        { ... }
      );
  }

  // 4. 更新状态和记录历史
  const oldRuleDTO = this._recurrenceRule.toServerDTO();
  this._recurrenceRule = updatedRule;
  this._updatedAt = Date.now();
  
  this.addHistory('recurrence_end_condition_updated', {
    oldRule: oldRuleDTO,
    newRule: updatedRule.toServerDTO(),
    endConditionType,
  });

  // 5. 发布领域事件
  this.addDomainEvent({
    eventType: 'task_template.recurrence_changed',
    aggregateId: this.uuid,
    occurredOn: new Date(this._updatedAt),
    accountUuid: this._accountUuid,
    payload: {
      taskTemplate: this.toServerDTO(),
      oldRecurrenceRule: oldRuleDTO,
      newRecurrenceRule: updatedRule.toServerDTO(),
    },
  });
}
```

---

## 🎯 核心特性

### 1. 智能默认值

当用户切换结束条件类型时，自动提供合理的默认值：

| 结束条件类型 | 默认行为 | 说明 |
|------------|---------|------|
| `NEVER` | 清空 endDate 和 occurrences | 永不结束 |
| `END_DATE` | 30 天后 | `Date.now() + 30 * 86400000` |
| `OCCURRENCES` | 10 次 | 适合大多数场景 |

**使用示例**：

```typescript
// 1. 切换到"永不结束"（无需提供值）
template.updateRecurrenceEndCondition(RecurrenceEndConditionType.NEVER);

// 2. 切换到"指定日期结束"（使用默认值：30天后）
template.updateRecurrenceEndCondition(RecurrenceEndConditionType.END_DATE);

// 3. 切换到"指定日期结束"（自定义值）
const endDate = new Date('2025-12-31').getTime();
template.updateRecurrenceEndCondition(
  RecurrenceEndConditionType.END_DATE, 
  endDate
);

// 4. 切换到"指定次数"（使用默认值：10次）
template.updateRecurrenceEndCondition(RecurrenceEndConditionType.OCCURRENCES);

// 5. 切换到"指定次数"（自定义值：20次）
template.updateRecurrenceEndCondition(
  RecurrenceEndConditionType.OCCURRENCES, 
  20
);
```

### 2. 类型安全

**修改前**（字符串字面量）：
```typescript
// ❌ 容易拼写错误，IDE 无提示
if (endConditionType === 'never') { ... }
if (endConditionType === 'neverr') { ... } // 运行时才发现错误！
```

**修改后**（枚举类型）：
```typescript
// ✅ 类型安全，IDE 自动补全
if (endConditionType === RecurrenceEndConditionType.NEVER) { ... }
if (endConditionType === RecurrenceEndConditionType.NEVERR) { ... } 
// ⬆️ 编译时错误：Property 'NEVERR' does not exist
```

### 3. 完整的领域事件

每次更新都会：
- ✅ 记录历史（`addHistory`）
- ✅ 发布领域事件（`task_template.recurrence_changed`）
- ✅ 更新时间戳（`_updatedAt`）

这样可以追踪用户的操作历史，支持审计和撤销功能。

---

## 📦 前端集成示例

### Vue 组件中使用

```vue
<template>
  <v-radio-group v-model="endConditionType" @change="handleEndConditionChange">
    <v-radio 
      :label="'永不结束'" 
      :value="RecurrenceEndConditionType.NEVER" 
    />
    <v-radio 
      :label="'指定日期结束'" 
      :value="RecurrenceEndConditionType.END_DATE" 
    />
    <v-radio 
      :label="'指定次数结束'" 
      :value="RecurrenceEndConditionType.OCCURRENCES" 
    />
  </v-radio-group>

  <!-- 根据类型显示不同的输入框 -->
  <v-text-field
    v-if="endConditionType === RecurrenceEndConditionType.END_DATE"
    v-model="endDate"
    type="date"
    label="结束日期"
  />

  <v-text-field
    v-if="endConditionType === RecurrenceEndConditionType.OCCURRENCES"
    v-model="occurrences"
    type="number"
    label="重复次数"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RecurrenceEndConditionType } from '@dailyuse/contracts';

const endConditionType = ref(RecurrenceEndConditionType.NEVER);
const endDate = ref<string>('');
const occurrences = ref<number>(10);

// 切换结束条件类型时，使用默认值
const handleEndConditionChange = (type: RecurrenceEndConditionType) => {
  switch (type) {
    case RecurrenceEndConditionType.NEVER:
      // 调用 TaskTemplate.updateRecurrenceEndCondition(NEVER)
      template.value.updateRecurrenceEndCondition(type);
      break;

    case RecurrenceEndConditionType.END_DATE:
      // 如果没有设置日期，使用默认值（30天后）
      if (!endDate.value) {
        template.value.updateRecurrenceEndCondition(type); // 使用默认值
      } else {
        const timestamp = new Date(endDate.value).getTime();
        template.value.updateRecurrenceEndCondition(type, timestamp);
      }
      break;

    case RecurrenceEndConditionType.OCCURRENCES:
      // 使用当前输入的次数，如果为空则使用默认值（10次）
      template.value.updateRecurrenceEndCondition(
        type, 
        occurrences.value || undefined // 如果为0则使用默认值
      );
      break;
  }
};
</script>
```

---

## 🔄 与现有代码的集成

### RecurrenceRule 已有的便捷方法

`RecurrenceRule` 值对象已经提供了这些方法：

```typescript
// 更新结束条件 - 便捷方法
rule.withNeverEnd()                  // 永不结束
rule.withEndDate(endDate)            // 设置结束日期
rule.withOccurrences(occurrences)    // 设置重复次数
```

**TaskTemplate.updateRecurrenceEndCondition()** 方法内部就是调用这些方法：

```typescript
switch (endConditionType) {
  case RecurrenceEndConditionType.NEVER:
    updatedRule = this._recurrenceRule.withNeverEnd(); // ✅
    break;
  case RecurrenceEndConditionType.END_DATE:
    updatedRule = this._recurrenceRule.withEndDate(endDate); // ✅
    break;
  case RecurrenceEndConditionType.OCCURRENCES:
    updatedRule = this._recurrenceRule.withOccurrences(occurrences); // ✅
    break;
}
```

---

## 📊 架构设计

### 分层职责

```
┌─────────────────────────────────────────────────┐
│         Presentation Layer (Vue Component)       │
│  - 用户交互                                      │
│  - 表单验证                                      │
│  - 使用枚举类型避免拼写错误                       │
└────────────────┬────────────────────────────────┘
                 │ 调用
┌────────────────▼────────────────────────────────┐
│       Application Layer (Application Service)    │
│  - 协调业务逻辑                                  │
│  - 事务管理                                      │
└────────────────┬────────────────────────────────┘
                 │ 调用
┌────────────────▼────────────────────────────────┐
│         Domain Layer (TaskTemplate)              │
│  ✅ updateRecurrenceEndCondition()               │
│     - 业务规则验证                               │
│     - 应用默认值                                 │
│     - 更新聚合根状态                             │
│     - 发布领域事件                               │
└────────────────┬────────────────────────────────┘
                 │ 使用
┌────────────────▼────────────────────────────────┐
│       Value Object (RecurrenceRule)              │
│  - withNeverEnd()                                │
│  - withEndDate(endDate)                          │
│  - withOccurrences(occurrences)                  │
│  - 不可变性保证                                  │
└─────────────────────────────────────────────────┘
```

### 为什么要在 TaskTemplate 中添加方法？

**原因 1：聚合根职责**
- `TaskTemplate` 是聚合根，负责维护内部一致性
- 直接修改 `RecurrenceRule` 无法触发领域事件和历史记录

**原因 2：业务规则封装**
- 默认值策略是业务规则，应该在领域层实现
- 表单层只负责展示和用户交互

**原因 3：事务边界**
- `TaskTemplate` 是事务边界，所有修改都应该通过它

**错误示例**（绕过聚合根）：
```typescript
// ❌ 错误：直接修改值对象，绕过聚合根
template.recurrenceRule = template.recurrenceRule.withNeverEnd();
// 问题：
// 1. 没有验证（模板类型、状态等）
// 2. 没有记录历史
// 3. 没有发布领域事件
// 4. 没有更新时间戳
```

**正确示例**（通过聚合根）：
```typescript
// ✅ 正确：通过聚合根更新
template.updateRecurrenceEndCondition(RecurrenceEndConditionType.NEVER);
// 优势：
// 1. ✅ 完整的业务规则验证
// 2. ✅ 自动记录历史
// 3. ✅ 自动发布领域事件
// 4. ✅ 自动更新时间戳
```

---

## 🎉 总结

### 完成的工作

1. ✅ **添加枚举类型**
   - `RecurrenceEndConditionType` 枚举
   - 导出到 `@dailyuse/contracts`
   - 类型安全，避免拼写错误

2. ✅ **添加专门的更新方法**
   - `TaskTemplate.updateRecurrenceEndCondition()`
   - 智能默认值（30天后 / 10次）
   - 完整的验证和事件发布

3. ✅ **构建验证**
   - contracts 包构建成功 ✅
   - domain-server 包构建成功 ✅

### 核心优势

| 特性 | 修改前 | 修改后 |
|-----|--------|--------|
| **类型安全** | ❌ 字符串字面量 | ✅ 枚举类型 |
| **默认值** | ❌ 无默认值 | ✅ 智能默认值 |
| **专门方法** | ❌ 没有 | ✅ `updateRecurrenceEndCondition()` |
| **领域事件** | ❌ 手动发布 | ✅ 自动发布 |
| **历史记录** | ❌ 手动记录 | ✅ 自动记录 |
| **IDE 支持** | ❌ 无自动补全 | ✅ 完整提示 |

### 使用建议

**前端开发者**：
```typescript
import { RecurrenceEndConditionType } from '@dailyuse/contracts';

// ✅ 使用枚举，避免魔法字符串
template.updateRecurrenceEndCondition(RecurrenceEndConditionType.NEVER);

// ❌ 不要用字符串字面量
template.updateRecurrenceEndCondition('never'); // 类型错误
```

**后端开发者**：
```typescript
// ✅ 通过聚合根更新
template.updateRecurrenceEndCondition(type, value);

// ❌ 不要绕过聚合根
template.recurrenceRule = template.recurrenceRule.withNeverEnd();
```

---

**设计更优雅**、**代码更安全**、**维护更容易**！🚀
