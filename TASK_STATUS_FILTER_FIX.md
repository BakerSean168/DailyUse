# Task 模块状态筛选问题修复报告

## 问题描述

**现象**：
- 创建任务模板成功（状态码 201）
- Store 中模板总数为 1
- 但筛选结果为 0，UI 不显示创建的模板

**日志分析**：
```
📊 模板总数: 1
📋 模板详情: [{ uuid: '...', title: '1', status: 'ACTIVE' }]
🎯 当前筛选状态: active
📋 模板 1: status=ACTIVE, 匹配=false  ❌
✅ 筛选结果: 0
```

## 根本原因

**状态字符串大小写不匹配**：

```typescript
// 筛选器配置使用小写
const statusFilters = [
  { label: '进行中', value: 'active' },  // 小写
];

// 实体状态是大写（来自 TaskTemplateStatus 枚举）
enum TaskTemplateStatus {
  ACTIVE = 'ACTIVE',    // 大写
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

// 筛选逻辑直接比较，永远不匹配
template.status === currentStatus.value  // 'ACTIVE' === 'active' → false ❌
```

## 最佳实践分析

### Goal 模块（参考标准）

**状态定义**：
```typescript
enum GoalStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'DRAFT',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}
```

**筛选器配置**：
```typescript
const statusTabs = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },      // 小写，用户友好
  { label: '已暂停', value: 'paused' },
  { label: '已完成', value: 'completed' },
  { label: '已归档', value: 'archived' },
];
```

**筛选逻辑**：
```typescript
const filteredGoals = computed(() => {
  // ...
  const currentStatus = statusTabs[selectedStatusIndex.value]?.value;
  if (currentStatus && currentStatus !== 'all') {
    // ✅ 转换为大写进行匹配
    result = result.filter((goal: Goal) => 
      goal.status === currentStatus.toUpperCase()
    );
  }
  return result;
});
```

**数据同步机制**：
```typescript
// ApplicationService 层
async createGoal(request): Promise<GoalClientDTO> {
  // 1. 调用 API
  const goalData = await goalApiClient.createGoal(request);
  
  // 2. 转换为实体
  const goal = Goal.fromClientDTO(goalData);
  
  // 3. 立即同步到 Store
  this.goalStore.addOrUpdateGoal(goal);  // ✅ 关键步骤
  
  return goalData;
}
```

### Task 模块（修复前）

**问题代码**：
```typescript
// ❌ 筛选器包含不存在的状态
const statusFilters = [
  { label: '进行中', value: 'active' },
  { label: '草稿', value: 'draft' },        // ❌ TaskTemplateStatus 没有 DRAFT
  { label: '已暂停', value: 'paused' },
  { label: '已归档', value: 'archived' },
];

// ❌ 直接比较，不转换大小写
const filteredTemplates = computed(() => {
  return allTemplates.filter((template) => {
    return template.status === currentStatus.value;  // ❌ 'ACTIVE' !== 'active'
  });
});

// ❌ 计数方法也不转换
const getTemplateCountByStatus = (status: string) => {
  return taskStore.getAllTaskTemplates.filter(
    (template) => template.status === status  // ❌ 'ACTIVE' !== 'active'
  ).length;
};
```

## 解决方案

### 修复 1: 更新筛选器配置

```typescript
// 移除不存在的 'draft' 状态
// 注意：TaskTemplateStatus 枚举值为大写（ACTIVE, PAUSED, ARCHIVED, DELETED）
const statusFilters = [
  { label: '进行中', value: 'active', icon: 'mdi-play-circle' },
  { label: '已暂停', value: 'paused', icon: 'mdi-pause-circle' },
  { label: '已归档', value: 'archived', icon: 'mdi-archive' },
];
```

### 修复 2: 更新筛选逻辑

```typescript
// 计算属性
const filteredTemplates = computed(() => {
  const allTemplates = taskStore.getAllTaskTemplates;
  
  // ✅ 转换为大写进行匹配（与 Goal 模块保持一致）
  const statusUpperCase = currentStatus.value.toUpperCase();
  
  const filtered = allTemplates.filter((template) => {
    return template.status === statusUpperCase;
  });

  return filtered;
});
```

### 修复 3: 更新计数方法

```typescript
// 工具方法
const getTemplateCountByStatus = (status: string) => {
  // ✅ 转换为大写进行匹配
  const statusUpperCase = status.toUpperCase();
  return taskStore.getAllTaskTemplates.filter(
    (template) => template.status === statusUpperCase
  ).length;
};
```

## 数据同步验证

验证 Task 模块的数据同步机制是否正确：

```typescript
// ✅ TaskTemplateApplicationService.createTaskTemplate()
async createTaskTemplate(request: any): Promise<TaskTemplateClientDTO> {
  // 1. 调用 API
  const templateDTO = await taskTemplateApiClient.createTaskTemplate(request);

  // 2. 转换为实体对象
  const entityTemplate = TaskTemplate.fromClientDTO(templateDTO);
  
  // 3. 添加到缓存 ✅ 正确！
  this.taskStore.addTaskTemplate(entityTemplate);

  // 4. 更新同步时间
  this.taskStore.updateLastSyncTime();

  return templateDTO;
}
```

**结论**：数据同步机制正确，无需修改。

## 统一的架构模式

### 状态管理层次

```
UI Layer (小写状态字符串)
    ↓ .toUpperCase()
Store Layer (大写状态枚举)
    ↓
Domain Layer (枚举值)
```

### 标准流程

**创建实体流程**：
```
1. UI: 用户点击创建
2. UI: 调用 composable.createXxx(data)
3. Composable: 调用 applicationService.createXxx(data)
4. ApplicationService:
   a. 调用 apiClient.createXxx(data)          → API 请求
   b. 接收 DTO 响应
   c. 转换为实体: Entity.fromClientDTO(dto)
   d. 同步到 Store: store.addOrUpdateEntity(entity)  ← 关键！
   e. 返回 DTO
5. UI: 刷新界面（Store 自动响应式更新）
```

**筛选流程**：
```
1. UI: 用户选择筛选器（小写值，如 'active'）
2. Computed: 转换为大写 'ACTIVE'
3. Store: 按大写枚举值筛选
4. UI: 显示筛选结果
```

## 验证步骤

修复后验证：

1. ✅ **创建任务模板**
   ```
   - 点击"新建任务模板"
   - 填写表单并保存
   - 预期：模板立即显示在列表中
   ```

2. ✅ **状态筛选**
   ```
   - 切换状态标签（进行中/已暂停/已归档）
   - 预期：正确显示对应状态的模板
   ```

3. ✅ **状态计数**
   ```
   - 检查每个标签的计数徽章
   - 预期：数字与实际模板数量一致
   ```

4. ✅ **编译检查**
   ```bash
   pnpm nx run web:build
   # 预期：无类型错误
   ```

## 总结

### 问题根源
- 状态字符串大小写不匹配（UI 小写 vs 实体大写）
- 筛选器包含不存在的状态（'draft'）

### 修复方案
- ✅ 在筛选逻辑中添加 `.toUpperCase()` 转换
- ✅ 移除不存在的 'draft' 筛选器
- ✅ 统一计数方法的状态转换

### 最佳实践
1. **UI 层使用小写字符串**：用户友好，符合 URL 规范
2. **比较前转换为大写**：与枚举值匹配
3. **ApplicationService 负责数据同步**：创建/更新后立即同步到 Store
4. **Store 使用实体对象**：保持类型安全和领域逻辑

### 跨模块一致性
- ✅ Goal 模块：使用 `.toUpperCase()` 转换
- ✅ Task 模块：已修复，使用 `.toUpperCase()` 转换
- ✅ Reminder 模块：需验证是否一致

### 后续建议
1. 创建共享的状态筛选 composable（`useStatusFilter`）
2. 添加类型检查，确保筛选器值与枚举对应
3. 考虑在 contracts 中导出枚举值的小写映射
