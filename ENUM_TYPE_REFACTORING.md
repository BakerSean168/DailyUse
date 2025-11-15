# 枚举类型重构 - 最佳实践

## 问题背景

**原始实现（使用字面量字符串）**：
```typescript
// ❌ 使用魔法字符串
const currentStatus = ref('active');
const statusFilters = [
  { label: '进行中', value: 'active' },
  { label: '草稿', value: 'draft' },
];

// ❌ 需要运行时转换
const filtered = allTemplates.filter((template) => {
  return template.status === currentStatus.value.toUpperCase(); // 'ACTIVE' vs 'active'
});
```

**问题**：
1. ❌ **类型不安全**：字符串拼写错误无法在编译时发现
2. ❌ **运行时转换**：需要 `.toUpperCase()` 转换
3. ❌ **维护困难**：魔法字符串散布在代码各处
4. ❌ **IDE 支持差**：无自动补全，无重构支持
5. ❌ **容易出错**：如 `'draft'` 状态在枚举中不存在

## 改进方案

### 1. 直接使用 Contracts 中的枚举类型

**导入枚举**：
```typescript
import { TaskContracts } from '@dailyuse/contracts';

// 同时导入类型和值
const TaskTemplateStatus = TaskContracts.TaskTemplateStatus;
type TaskTemplateStatus = TaskContracts.TaskTemplateStatus;
```

**枚举定义（来自 contracts）**：
```typescript
// packages/contracts/src/modules/task/enums.ts
export enum TaskTemplateStatus {
  ACTIVE = 'ACTIVE',      // 激活
  PAUSED = 'PAUSED',      // 暂停
  ARCHIVED = 'ARCHIVED',  // 归档
  DELETED = 'DELETED',    // 删除
}
```

### 2. 使用枚举值替代字面量

**状态筛选器配置**：
```typescript
// ✅ 使用枚举值
const statusFilters = [
  { label: '进行中', value: TaskTemplateStatus.ACTIVE, icon: 'mdi-play-circle' },
  { label: '已暂停', value: TaskTemplateStatus.PAUSED, icon: 'mdi-pause-circle' },
  { label: '已归档', value: TaskTemplateStatus.ARCHIVED, icon: 'mdi-archive' },
];
```

**状态变量**：
```typescript
// ✅ 使用枚举类型
const currentStatus = ref<TaskTemplateStatus>(TaskTemplateStatus.ACTIVE);
```

**筛选逻辑**：
```typescript
// ✅ 直接比较，无需转换
const filteredTemplates = computed(() => {
  const allTemplates = taskStore.getAllTaskTemplates;
  
  const filtered = allTemplates.filter((template) => {
    return template.status === currentStatus.value; // 类型安全
  });

  return filtered;
});
```

**工具函数**：
```typescript
// ✅ 使用枚举参数类型
const getTemplateCountByStatus = (status: TaskTemplateStatus) => {
  return taskStore.getAllTaskTemplates.filter(
    (template) => template.status === status
  ).length;
};

const getStatusChipColor = (status: TaskTemplateStatus) => {
  switch (status) {
    case TaskTemplateStatus.ACTIVE:
      return 'success';
    case TaskTemplateStatus.PAUSED:
      return 'warning';
    case TaskTemplateStatus.ARCHIVED:
      return 'info';
    case TaskTemplateStatus.DELETED:
      return 'error';
    default:
      return 'default';
  }
};
```

**条件渲染**：
```typescript
// ✅ 使用枚举值比较
<v-btn 
  v-if="currentStatus === TaskTemplateStatus.ACTIVE"
  @click="createTemplate()"
>
  创建第一个模板
</v-btn>
```

**状态文本**：
```typescript
const getEmptyStateText = () => {
  switch (currentStatus.value) {
    case TaskTemplateStatus.ACTIVE:
      return '暂无进行中的模板';
    case TaskTemplateStatus.PAUSED:
      return '暂无暂停的模板';
    case TaskTemplateStatus.ARCHIVED:
      return '暂无归档的模板';
    case TaskTemplateStatus.DELETED:
      return '暂无已删除的模板';
    default:
      return '暂无模板';
  }
};
```

## 优势对比

### 修改前（字面量字符串）
```typescript
// ❌ 问题示例
const currentStatus = ref('active');  // 拼写错误：'activ' 无法检测

// ❌ 运行时转换
template.status === currentStatus.value.toUpperCase()

// ❌ switch 语句无法检查完整性
switch (currentStatus.value) {
  case 'active': return '...';
  case 'draft': return '...';  // 枚举中不存在
  // 遗漏 'deleted' 分支
}

// ❌ 函数参数类型不明确
const getColor = (status: string) => { ... }
getColor('任意字符串');  // 编译通过，运行时出错
```

### 修改后（枚举类型）
```typescript
// ✅ 类型安全
const currentStatus = ref<TaskTemplateStatus>(TaskTemplateStatus.ACTIVE);
// currentStatus.value = 'activ';  // ❌ 编译错误

// ✅ 直接比较
template.status === currentStatus.value  // 类型匹配

// ✅ switch 语句完整性检查
switch (currentStatus.value) {
  case TaskTemplateStatus.ACTIVE: return '...';
  case TaskTemplateStatus.PAUSED: return '...';
  case TaskTemplateStatus.ARCHIVED: return '...';
  // ⚠️ 如果遗漏 DELETED，TypeScript 会警告
}

// ✅ 函数参数类型明确
const getColor = (status: TaskTemplateStatus) => { ... }
getColor('任意字符串');  // ❌ 编译错误
getColor(TaskTemplateStatus.ACTIVE);  // ✅ 正确
```

## IDE 支持对比

### 使用字面量
```typescript
currentStatus.value = 'act' + '...'  // 无自动补全
```

### 使用枚举
```typescript
currentStatus.value = TaskTemplateStatus.  // 自动补全：ACTIVE, PAUSED, ARCHIVED, DELETED
```

## 重构清单

- [x] **导入枚举类型**
  ```typescript
  const TaskTemplateStatus = TaskContracts.TaskTemplateStatus;
  type TaskTemplateStatus = TaskContracts.TaskTemplateStatus;
  ```

- [x] **更新状态变量类型**
  ```typescript
  const currentStatus = ref<TaskTemplateStatus>(TaskTemplateStatus.ACTIVE);
  ```

- [x] **更新筛选器配置**
  ```typescript
  const statusFilters = [
    { label: '进行中', value: TaskTemplateStatus.ACTIVE },
    // ...
  ];
  ```

- [x] **更新筛选逻辑**
  ```typescript
  // 移除 .toUpperCase()
  template.status === currentStatus.value
  ```

- [x] **更新工具函数**
  ```typescript
  const getColor = (status: TaskTemplateStatus) => { ... }
  ```

- [x] **更新条件判断**
  ```typescript
  v-if="currentStatus === TaskTemplateStatus.ACTIVE"
  ```

- [x] **更新 switch 语句**
  ```typescript
  switch (currentStatus.value) {
    case TaskTemplateStatus.ACTIVE: ...
    case TaskTemplateStatus.PAUSED: ...
    // ...
  }
  ```

## 跨模块应用

### Task 模块（已完成 ✅）
- ✅ TaskTemplateManagement.vue - 使用 `TaskTemplateStatus` 枚举
- ✅ 移除所有 `.toUpperCase()` 转换
- ✅ 所有函数使用枚举类型参数

### Goal 模块（建议改进 🔄）
**当前实现**：
```typescript
// GoalListView.vue - 仍使用字面量
const statusTabs = [
  { label: '进行中', value: 'active' },  // ❌
];
```

**建议改进**：
```typescript
import { GoalContracts } from '@dailyuse/contracts';
const GoalStatus = GoalContracts.GoalStatus;

const statusTabs = [
  { label: '进行中', value: GoalStatus.ACTIVE },  // ✅
];
```

### Reminder 模块（建议改进 🔄）
- 需要检查是否有类似的状态筛选逻辑
- 应用相同的枚举类型改进

## 最佳实践总结

### ✅ DO（推荐做法）
1. **使用枚举类型**：从 contracts 导入并使用枚举
2. **类型注解**：为变量和参数添加枚举类型
3. **直接比较**：枚举值可以直接比较，无需转换
4. **完整的 switch**：确保处理所有枚举值
5. **配置驱动**：使用枚举值构建配置对象

### ❌ DON'T（避免做法）
1. **避免字面量字符串**：不要使用 `'active'`, `'paused'` 等
2. **避免运行时转换**：不需要 `.toUpperCase()`, `.toLowerCase()`
3. **避免 string 类型**：使用具体的枚举类型而非泛型 `string`
4. **避免魔法字符串**：散布在代码各处的字符串常量
5. **避免不存在的值**：如 `'draft'` 在 `TaskTemplateStatus` 中不存在

## 类型安全保障

### 编译时检查
```typescript
// ✅ 编译时捕获错误
const status: TaskTemplateStatus = 'invalid';  // ❌ 类型错误

// ✅ switch 完整性检查
const getText = (status: TaskTemplateStatus): string => {
  switch (status) {
    case TaskTemplateStatus.ACTIVE:
      return 'Active';
    // ⚠️ 遗漏其他分支，TypeScript 会警告
  }
};

// ✅ 函数调用检查
getStatusColor('random');  // ❌ 类型错误
getStatusColor(TaskTemplateStatus.ACTIVE);  // ✅ 正确
```

### 运行时保障
```typescript
// ✅ 枚举值是常量，运行时不会改变
TaskTemplateStatus.ACTIVE === 'ACTIVE'  // true

// ✅ 可以安全地序列化和反序列化
JSON.stringify({ status: TaskTemplateStatus.ACTIVE })
// {"status":"ACTIVE"}
```

## 迁移指南

### 步骤 1：导入枚举
```typescript
import { TaskContracts } from '@dailyuse/contracts';
const TaskTemplateStatus = TaskContracts.TaskTemplateStatus;
type TaskTemplateStatus = TaskContracts.TaskTemplateStatus;
```

### 步骤 2：更新状态变量
```typescript
// 修改前
const currentStatus = ref('active');

// 修改后
const currentStatus = ref<TaskTemplateStatus>(TaskTemplateStatus.ACTIVE);
```

### 步骤 3：更新配置对象
```typescript
// 修改前
{ value: 'active' }

// 修改后
{ value: TaskTemplateStatus.ACTIVE }
```

### 步骤 4：移除转换逻辑
```typescript
// 修改前
template.status === currentStatus.value.toUpperCase()

// 修改后
template.status === currentStatus.value
```

### 步骤 5：更新函数签名
```typescript
// 修改前
const getColor = (status: string) => { ... }

// 修改后
const getColor = (status: TaskTemplateStatus) => { ... }
```

### 步骤 6：更新 switch 语句
```typescript
// 修改前
switch (currentStatus.value) {
  case 'active': return '...';
}

// 修改后
switch (currentStatus.value) {
  case TaskTemplateStatus.ACTIVE: return '...';
}
```

## 总结

使用枚举类型而非字面量字符串的优势：

1. **类型安全** ✅ - 编译时错误检测
2. **IDE 支持** ✅ - 自动补全和重构
3. **可维护性** ✅ - 集中管理，易于修改
4. **代码简洁** ✅ - 无需运行时转换
5. **文档化** ✅ - 枚举即文档
6. **防错性** ✅ - 避免拼写错误

**结论**：在所有模块中统一使用枚举类型，弃用字面量字符串！
