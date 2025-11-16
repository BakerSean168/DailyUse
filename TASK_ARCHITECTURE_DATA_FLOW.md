# Task 模块数据流架构说明

## 📋 架构概览

```
┌────────────────────────────────────────────────────────────┐
│                      组件层 (Component)                      │
│  - TaskTemplateList.vue                                     │
│  - TaskInstanceCard.vue                                     │
│  - Dashboard.vue                                            │
└───────────────────┬────────────────────────────────────────┘
                    │ 使用 Composable
                    ↓
┌────────────────────────────────────────────────────────────┐
│                  组合层 (Composables)                        │
│  - useTaskTemplate()                                        │
│  - useTaskInstance()                                        │
│  → 提供响应式数据 computed(() => taskStore.xxx)             │
│  → 提供操作方法（调用 Application Service）                  │
└───────────────────┬────────────────────────────────────────┘
                    │ 调用服务 + 读取 Store
                    ↓
┌────────────────────────────────────────────────────────────┐
│              应用服务层 (Application Service)                │
│  - TaskTemplateApplicationService                           │
│  - TaskInstanceApplicationService                           │
│  → 调用 API Client 获取数据                                  │
│  → 将 DTO 转换为领域对象                                     │
│  → 更新 Store（缓存）                                        │
└─────┬─────────────────────────────────┬────────────────────┘
      │                                 │
      ↓ 调用 API                        ↓ 更新缓存
┌─────────────────────────┐  ┌─────────────────────────────┐
│  API 客户端层 (API Client) │  │    状态管理层 (Pinia Store)    │
│  - taskTemplateApiClient  │  │    - useTaskStore()           │
│  - taskInstanceApiClient  │  │    → taskTemplates: []        │
│  → 使用统一的 apiClient    │  │    → taskInstances: []        │
│  → 自动处理认证（JWT）     │  │    → Getters（响应式）         │
│  → 错误重试、日志记录      │  │    → Actions（同步修改）       │
└──────────┬──────────────┘  └──────────┬──────────────────┘
           │                             │
           │ HTTP Request                │ 响应式数据流
           ↓                             ↑
    ┌───────────┐                 ┌────────────┐
    │  后端 API  │                 │  组件自动更新 │
    └───────────┘                 └────────────┘
```

---

## 🔄 完整数据流示例

### 场景 1：创建任务模板

```typescript
// 1️⃣ 组件调用
<script setup>
const { createTaskTemplate, taskTemplates } = useTaskTemplate();

async function handleCreate() {
  await createTaskTemplate({
    title: "早期",
    taskType: "RECURRING",
    recurrenceRule: { frequency: "DAILY" }
  });
}
</script>

<template>
  <!-- taskTemplates 是响应式的，Store 更新后自动刷新 -->
  <div v-for="template in taskTemplates" :key="template.uuid">
    {{ template.title }}
  </div>
</template>

// 2️⃣ Composable 转发
// apps/web/src/modules/task/presentation/composables/useTaskTemplate.ts
export function useTaskTemplate() {
  const taskStore = useTaskStore();
  
  // 响应式数据（computed 自动追踪 Store 变化）
  const taskTemplates = computed(() => taskStore.getAllTaskTemplates);
  
  // 操作方法
  async function createTaskTemplate(request: any) {
    // 调用 Application Service
    const result = await taskTemplateApplicationService.createTaskTemplate(request);
    return result;
  }
  
  return {
    taskTemplates: readonly(taskTemplates), // ✅ 响应式，只读
    createTaskTemplate, // ✅ 操作方法
  };
}

// 3️⃣ Application Service 处理
// apps/web/src/modules/task/application/services/TaskTemplateApplicationService.ts
async createTaskTemplate(request: any) {
  // Step 1: 调用 API Client
  const templateDTO = await taskTemplateApiClient.createTaskTemplate(request);
  
  // Step 2: 转换为领域对象
  const entityTemplate = TaskTemplate.fromClientDTO(templateDTO);
  
  // Step 3: 添加到 Store（触发响应式更新）
  this.taskStore.addTaskTemplate(entityTemplate);
  
  // Step 4: 返回 DTO（给调用者）
  return templateDTO;
}

// 4️⃣ API Client 发送请求
// apps/web/src/modules/task/infrastructure/api/taskApiClient.ts
async createTaskTemplate(request) {
  // 使用统一的 apiClient（自动添加 Authorization header）
  return await apiClient.post('/tasks/templates', request);
  // ✅ apiClient 自动：
  //    - 添加 JWT token
  //    - 处理错误重试
  //    - 记录日志
  //    - 解析响应
}

// 5️⃣ Store 更新（触发响应式）
// apps/web/src/modules/task/presentation/stores/taskStore.ts
export const useTaskStore = defineStore('task', {
  state: () => ({
    taskTemplates: [] as TaskTemplate[],
  }),
  
  actions: {
    addTaskTemplate(template: TaskTemplate) {
      this.taskTemplates.push(template);
      // ✅ Pinia 自动通知所有使用 taskTemplates 的 computed
    },
  },
  
  getters: {
    getAllTaskTemplates(state): TaskTemplate[] {
      return state.taskTemplates;
    },
  },
});

// 6️⃣ 组件自动更新（Vue 响应式系统）
// taskTemplates 是 computed(() => taskStore.getAllTaskTemplates)
// Store 更新 → computed 重新计算 → 组件重新渲染 ✅
```

---

### 场景 2：SSE 实时同步（创建模板后自动加载实例）

```typescript
// 1️⃣ 后端生成实例后发布事件
// apps/api/src/modules/task/application/services/TaskInstanceGenerationService.ts
eventBus.emit('task.instances.generated', {
  strategy: instances.length <= 20 ? 'full' : 'summary',
  templateUuid,
  instanceCount: 100,
  dateRange: { from, to },
  instances: instances.length <= 20 ? instances.map(i => i.toClientDTO()) : undefined,
});

// 2️⃣ TaskEventHandler 监听并推送
// apps/api/src/modules/task/application/services/TaskEventHandler.ts
eventBus.on('task.instances.generated', async (event) => {
  SSEConnectionManager.sendMessage(
    accountUuid,
    'task:instances-generated',
    event.payload
  );
});

// 3️⃣ 前端 SSEClient 接收事件
// apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts
this.eventSource.addEventListener('task:instances-generated', (event) => {
  this.handleTaskEvent('instances-generated', event.data);
});

private handleTaskEvent(eventType: string, data: string) {
  const parsedData = JSON.parse(data);
  // 转发到前端事件总线
  eventBus.emit('task:instances-generated', parsedData);
}

// 4️⃣ TaskInstanceSyncService 智能加载
// apps/web/src/modules/task/services/taskInstanceSyncService.ts
eventBus.on('task:instances-generated', async (data) => {
  if (data.strategy === 'full' && data.instances) {
    // 小数据量：直接使用推送的数据
    await this.updateStoreWithInstances(data.instances);
  } else {
    // 大数据量：智能预加载
    await this.smartLoadInstances(data.templateUuid, data.dateRange);
  }
});

private async smartLoadInstances(templateUuid, dateRange) {
  // P0（立即）：加载今天
  await this.loadInstancesByDateRange(templateUuid, todayStart, todayEnd);
  
  // P1（1秒后）：预加载本周
  setTimeout(() => {
    this.preloadQueue.push({ templateUuid, weekRange });
    this.processPreloadQueue();
  }, 1000);
}

private async loadInstancesByDateRange(templateUuid, from, to) {
  // ✅ 使用 API Client（自动认证）
  const instances = await taskTemplateApiClient.getInstancesByDateRange(
    templateUuid,
    from,
    to
  );
  
  // ✅ 更新 Store（触发响应式）
  await this.updateStoreWithInstances(instances);
}

// 5️⃣ Store 批量更新
private async updateStoreWithInstances(instances) {
  const taskStore = useTaskStore();
  
  // 转换 DTO 为领域对象
  const domainInstances = instances.map(dto => TaskInstance.fromClientDTO(dto));
  
  // 去重 + 排序 + 一次性更新（减少响应式触发）
  const existingUuids = new Set(taskStore.taskInstances.map(i => i.uuid));
  const newInstances = domainInstances.filter(i => !existingUuids.has(i.uuid));
  
  // ✅ 批量更新（只触发一次响应式）
  taskStore.taskInstances = [...taskStore.taskInstances, ...newInstances]
    .sort((a, b) => a.instanceDate - b.instanceDate);
}

// 6️⃣ 组件自动刷新
// Dashboard.vue
<script setup>
const { taskInstances } = useTaskInstance();
// ✅ taskInstances 是 computed(() => taskStore.getAllTaskInstances)
// Store 更新后自动刷新，无需手动调用
</script>

<template>
  <div v-for="instance in taskInstances">
    {{ instance.title }} - {{ new Date(instance.instanceDate).toLocaleDateString() }}
  </div>
</template>
```

---

## 🔑 关键设计原则

### 1. **单向数据流**
```
用户操作 → Composable → Application Service → API Client → 后端
                                              ↓
                                          Store 更新
                                              ↓
                                          组件自动刷新
```

### 2. **职责分离**

| 层级 | 职责 | 不负责 |
|------|-----|--------|
| **Component** | UI 渲染、用户交互 | ❌ API 调用、数据转换 |
| **Composable** | 提供响应式数据、转发操作 | ❌ 直接修改 Store、调用 API |
| **Application Service** | 协调 API + Store、DTO 转换 | ❌ UI 逻辑、路由跳转 |
| **API Client** | HTTP 请求、认证、错误处理 | ❌ 数据缓存、业务逻辑 |
| **Store (Pinia)** | 状态缓存、Getters、同步修改 | ❌ 异步操作、API 调用 |

### 3. **响应式数据流**

```typescript
// ✅ 正确：使用 computed 包装 Store 数据
const taskTemplates = computed(() => taskStore.getAllTaskTemplates);

// ❌ 错误：直接返回数组（失去响应式）
const taskTemplates = taskStore.getAllTaskTemplates;
```

### 4. **统一的 API 认证**

```typescript
// ✅ 正确：使用 apiClient（自动处理 token）
const data = await apiClient.post('/tasks/templates', request);

// ❌ 错误：手动 fetch + localStorage（token 格式可能错误）
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}` // ❌ 不推荐
  }
});
```

---

## 🐛 常见问题排查

### 问题 1：组件数据不更新

**症状**：创建/删除任务后，列表没有自动刷新

**原因**：
1. ❌ Composable 没有使用 `computed()` 包装
2. ❌ Application Service 没有更新 Store
3. ❌ Store 的 state 是深层嵌套对象（Vue 无法检测）

**解决方案**：
```typescript
// ✅ Composable 必须用 computed
const taskTemplates = computed(() => taskStore.getAllTaskTemplates);

// ✅ Application Service 必须更新 Store
this.taskStore.addTaskTemplate(entityTemplate);

// ✅ Store 更新时使用新数组（触发响应式）
this.taskTemplates = [...this.taskTemplates, newTemplate];
```

---

### 问题 2：JWT 认证失败

**症状**：`JWT验证失败: JsonWebTokenError: jwt malformed`

**原因**：
1. ❌ 直接使用 `fetch()` 绕过 `apiClient`
2. ❌ 手动从 `localStorage` 获取 token（格式错误）

**解决方案**：
```typescript
// ✅ 使用统一的 API Client
const instances = await taskTemplateApiClient.getInstancesByDateRange(uuid, from, to);

// ✅ apiClient 自动处理认证
// - 从 AuthStore 获取 token
// - 添加 Authorization: Bearer <token>
// - token 过期时自动刷新
```

---

### 问题 3：路由冲突

**症状**：API 请求返回 404 或被错误的路由处理

**原因**：Express 路由匹配顺序错误

**解决方案**：
```typescript
// ✅ 特定路由在前，通用路由在后
router.get('/:uuid/instances', TaskTemplateController.getInstancesByDateRange);
router.use('/instances', taskInstanceRoutes); // 放后面

// ❌ 错误顺序：通用路由拦截了所有请求
router.use('/instances', taskInstanceRoutes); // ❌ 这会拦截 /:uuid/instances
router.get('/:uuid/instances', ...); // ❌ 永远不会执行
```

---

## 📊 性能优化

### 1. **批量更新 Store**
```typescript
// ✅ 一次性更新（只触发一次响应式）
taskStore.taskInstances = [...existing, ...newInstances].sort(...);

// ❌ 循环插入（触发 N 次响应式）
newInstances.forEach(inst => taskStore.taskInstances.push(inst));
```

### 2. **智能预加载**
```typescript
// P0（0秒）：立即加载今天 → Dashboard 需要
// P1（1秒）：预加载本周 → TaskInstanceManagement 需要
// P2（按需）：用户切换时加载
```

### 3. **混合推送策略**
```typescript
// ≤20个：推送完整数据（避免额外 API 调用）
// >20个：只推送摘要（减少网络传输）
```

---

## ✅ 总结

**当前架构的优势**：
1. ✅ **解耦性强**：各层职责清晰，易于维护
2. ✅ **响应式自动**：Store 更新 → 组件自动刷新
3. ✅ **认证统一**：apiClient 自动处理 JWT
4. ✅ **易于测试**：各层可独立测试
5. ✅ **性能优化**：批量更新、智能预加载

**最佳实践**：
1. ✅ 组件只使用 Composable，不直接调用 Service
2. ✅ Composable 用 `computed()` 包装 Store 数据
3. ✅ Application Service 负责 API + Store 协调
4. ✅ 统一使用 `apiClient`，不要手动 `fetch`
5. ✅ Store 只做同步操作，异步在 Service 层

---

**文档更新时间**：2025-11-16  
**架构版本**：v2.0（基于 Pinia + Composables + Application Service）
