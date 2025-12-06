# STORY-005: 核心模块 UI - Goal & Task

## 📋 Story 概述

**Story ID**: STORY-005  
**Epic**: EPIC-002 (Desktop Application Development)  
**优先级**: P1 (核心价值)  
**预估工时**: 5-7 天  
**状态**: 🔵 Ready for Dev  
**前置依赖**: STORY-002, STORY-003, STORY-004

---

## 🎯 用户故事

**作为** DailyUse 桌面用户  
**我希望** 能够创建、查看、编辑和管理我的目标与任务  
**以便于** 有效追踪我的进度并完成我设定的目标  

---

## 📋 验收标准

### 功能验收 - Goal 模块

- [ ] 目标列表展示（支持树形结构）
- [ ] 创建新目标（标题、描述、截止日期、优先级）
- [ ] 编辑目标详情
- [ ] 删除目标（含确认提示）
- [ ] 目标状态切换（激活/暂停/完成）
- [ ] 进度可视化（进度条/百分比）
- [ ] 目标文件夹管理（创建/移动/删除）

### 功能验收 - Task 模块

- [ ] 任务列表展示（支持过滤/排序）
- [ ] 创建新任务（标题、描述、截止日期、优先级、关联目标）
- [ ] 编辑任务详情
- [ ] 删除任务
- [ ] 任务状态切换（待处理/进行中/已完成）
- [ ] 任务依赖关系可视化
- [ ] 任务统计图表（完成率、趋势）

### 功能验收 - Goal-Task 关联

- [ ] 在目标详情中显示关联任务
- [ ] 任务完成自动更新目标进度
- [ ] 目标下快速创建任务

### 技术验收

- [ ] 使用 `@dailyuse/application-client` 服务
- [ ] 通过 Container 获取 API Client
- [ ] 复用 `@dailyuse/ui-vuetify` 组件
- [ ] TypeScript 编译无错误

---

## 📐 技术设计

### 文件结构

```
apps/desktop/src/renderer/
├── views/
│   ├── goal/
│   │   ├── GoalListView.vue          # 目标列表页
│   │   ├── GoalDetailView.vue        # 目标详情页
│   │   ├── GoalFormDialog.vue        # 创建/编辑弹窗
│   │   └── components/
│   │       ├── GoalTree.vue          # 树形目标展示
│   │       ├── GoalCard.vue          # 目标卡片
│   │       ├── GoalProgress.vue      # 进度条组件
│   │       └── GoalFolderTree.vue    # 文件夹树
│   │
│   └── task/
│       ├── TaskListView.vue          # 任务列表页
│       ├── TaskDetailView.vue        # 任务详情页
│       ├── TaskFormDialog.vue        # 创建/编辑弹窗
│       └── components/
│           ├── TaskTable.vue         # 任务表格
│           ├── TaskCard.vue          # 任务卡片
│           ├── TaskDependencyGraph.vue # 依赖关系图
│           └── TaskStatistics.vue    # 统计图表
│
├── shared/
│   └── composables/
│       ├── useGoal.ts                # Goal 业务逻辑
│       └── useTask.ts                # Task 业务逻辑
```

### Composable 设计

```typescript
// useGoal.ts
import { ref, computed } from 'vue';
import { GoalContainer } from '@dailyuse/infrastructure-client';
import {
  GetAllGoalsService,
  GetGoalByIdService,
  CreateGoalService,
  UpdateGoalService,
  DeleteGoalService,
  ActivateGoalService,
  PauseGoalService,
  CompleteGoalService,
} from '@dailyuse/application-client';
import type { GoalClientDTO, CreateGoalRequest } from '@dailyuse/contracts/goal';

export function useGoal() {
  const container = GoalContainer.getInstance();
  
  // State
  const goals = ref<GoalClientDTO[]>([]);
  const currentGoal = ref<GoalClientDTO | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  
  // Services
  const getAllService = new GetAllGoalsService(container);
  const getByIdService = new GetGoalByIdService(container);
  const createService = new CreateGoalService(container);
  const updateService = new UpdateGoalService(container);
  const deleteService = new DeleteGoalService(container);
  
  // Actions
  async function fetchGoals(params?: { status?: string; dirUuid?: string }) {
    loading.value = true;
    error.value = null;
    try {
      const result = await getAllService.execute(params);
      goals.value = result.items;
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }
  
  async function createGoal(data: CreateGoalRequest) {
    const goal = await createService.execute(data);
    goals.value.push(goal);
    return goal;
  }
  
  async function updateGoal(uuid: string, data: Partial<CreateGoalRequest>) {
    const updated = await updateService.execute(uuid, data);
    const index = goals.value.findIndex(g => g.uuid === uuid);
    if (index !== -1) {
      goals.value[index] = updated;
    }
    return updated;
  }
  
  async function deleteGoal(uuid: string) {
    await deleteService.execute(uuid);
    goals.value = goals.value.filter(g => g.uuid !== uuid);
  }
  
  // Computed
  const activeGoals = computed(() => 
    goals.value.filter(g => g.status === 'active')
  );
  
  const completedGoals = computed(() => 
    goals.value.filter(g => g.status === 'completed')
  );
  
  return {
    // State
    goals: computed(() => goals.value),
    currentGoal: computed(() => currentGoal.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    // Computed
    activeGoals,
    completedGoals,
    
    // Actions
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}
```

### UI 组件复用

```vue
<!-- GoalListView.vue -->
<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-toolbar flat>
          <v-toolbar-title>我的目标</v-toolbar-title>
          <v-spacer />
          <v-btn color="primary" @click="showCreateDialog = true">
            <v-icon left>mdi-plus</v-icon>
            新建目标
          </v-btn>
        </v-toolbar>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="3">
        <GoalFolderTree 
          :folders="folders"
          @select="onFolderSelect"
        />
      </v-col>
      
      <v-col cols="9">
        <v-progress-linear v-if="loading" indeterminate />
        
        <GoalTree 
          v-else
          :goals="goals"
          @click="onGoalClick"
          @edit="onGoalEdit"
          @delete="onGoalDelete"
        />
      </v-col>
    </v-row>
    
    <GoalFormDialog
      v-model="showCreateDialog"
      :goal="editingGoal"
      @submit="onGoalSubmit"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGoal } from '@/shared/composables/useGoal';
import GoalTree from './components/GoalTree.vue';
import GoalFolderTree from './components/GoalFolderTree.vue';
import GoalFormDialog from './GoalFormDialog.vue';

const { goals, loading, fetchGoals, createGoal, updateGoal, deleteGoal } = useGoal();

const showCreateDialog = ref(false);
const editingGoal = ref(null);

onMounted(() => {
  fetchGoals();
});

// ... event handlers
</script>
```

---

## 📝 Task 分解

### Task 5.1: Goal 模块视图 (2-3 天)

**子任务**:
- [ ] 创建 GoalListView.vue
- [ ] 创建 GoalDetailView.vue
- [ ] 创建 GoalFormDialog.vue
- [ ] 创建 GoalTree.vue 组件
- [ ] 创建 GoalCard.vue 组件
- [ ] 创建 GoalProgress.vue 组件
- [ ] 创建 GoalFolderTree.vue 组件
- [ ] 实现 useGoal.ts composable

**验收**:
- [ ] 目标 CRUD 功能正常
- [ ] 树形结构正确展示
- [ ] 进度可视化工作

### Task 5.2: Task 模块视图 (2-3 天)

**子任务**:
- [ ] 创建 TaskListView.vue
- [ ] 创建 TaskDetailView.vue
- [ ] 创建 TaskFormDialog.vue
- [ ] 创建 TaskTable.vue 组件
- [ ] 创建 TaskCard.vue 组件
- [ ] 创建 TaskDependencyGraph.vue (ECharts)
- [ ] 创建 TaskStatistics.vue (ECharts)
- [ ] 实现 useTask.ts composable

**验收**:
- [ ] 任务 CRUD 功能正常
- [ ] 过滤和排序工作
- [ ] 统计图表显示

### Task 5.3: Goal-Task 关联 (1 天)

**子任务**:
- [ ] 在 GoalDetailView 中显示关联任务
- [ ] 实现目标下快速创建任务
- [ ] 实现任务完成更新目标进度

**验收**:
- [ ] 关联正确显示
- [ ] 进度自动更新

### Task 5.4: 拖拽排序支持 (1 天)

**子任务**:
- [ ] 集成 vuedraggable
- [ ] 实现目标列表拖拽排序
- [ ] 实现任务列表拖拽排序
- [ ] 持久化排序顺序

**验收**:
- [ ] 拖拽流畅
- [ ] 排序持久化

---

## 🔗 依赖关系

### 前置依赖

- ✅ STORY-001 (包提取) - 已完成
- ⏳ STORY-002 (主进程 DI)
- ⏳ STORY-003 (渲染进程 DI)
- ⏳ STORY-004 (Preload API)

### 后续影响

- 🔜 STORY-006 (Dashboard) - 需要 Goal/Task 数据
- 🔜 STORY-010 (桌面特性) - 快速创建任务

---

## ⚠️ 风险 & 缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| ECharts 集成问题 | 中 | 中 | 使用 vue-echarts 封装 |
| 拖拽性能问题 | 低 | 中 | 虚拟列表优化 |
| 树形结构渲染慢 | 低 | 中 | 懒加载子节点 |

---

## 🏗️ 技术实现方案 (架构师补充)

### 1. IPC 通道与服务映射

#### Goal 模块 (23 IPC 通道)

| IPC 通道 | Application Service | 描述 |
|----------|---------------------|------|
| `goal:create` | CreateGoalService | 创建目标 |
| `goal:list` | GetGoalsService | 获取目标列表 |
| `goal:get` | GetGoalByIdService | 获取单个目标 |
| `goal:update` | UpdateGoalService | 更新目标 |
| `goal:delete` | DeleteGoalService | 删除目标 |
| `goal:activate` | ActivateGoalService | 激活目标 |
| `goal:pause` | PauseGoalService | 暂停目标 |
| `goal:complete` | CompleteGoalService | 完成目标 |
| `goal:archive` | ArchiveGoalService | 归档目标 |
| `goal:search` | SearchGoalsService | 搜索目标 |
| `goal:keyResult:add` | AddKeyResultService | 添加关键结果 |
| `goal:keyResult:list` | GetKeyResultsService | 获取关键结果 |
| `goal:keyResult:update` | UpdateKeyResultService | 更新关键结果 |
| `goal:keyResult:delete` | DeleteKeyResultService | 删除关键结果 |
| `goal:progressBreakdown` | GetProgressBreakdownService | 进度分解 |
| `goalFolder:create` | CreateGoalFolderService | 创建文件夹 |
| `goalFolder:list` | GetGoalFoldersService | 获取文件夹列表 |

#### Task 模块 (35 IPC 通道)

| IPC 通道 | Application Service | 描述 |
|----------|---------------------|------|
| `taskTemplate:create` | CreateTaskTemplateService | 创建任务模板 |
| `taskTemplate:list` | GetTaskTemplatesService | 获取模板列表 |
| `taskTemplate:get` | GetTaskTemplateByIdService | 获取单个模板 |
| `taskTemplate:update` | UpdateTaskTemplateService | 更新模板 |
| `taskTemplate:delete` | DeleteTaskTemplateService | 删除模板 |
| `taskTemplate:activate` | ActivateTaskTemplateService | 激活模板 |
| `taskTemplate:pause` | PauseTaskTemplateService | 暂停模板 |
| `taskTemplate:generate` | GenerateInstancesService | 生成实例 |
| `taskTemplate:bindGoal` | BindToGoalService | 绑定目标 |
| `taskInstance:list` | GetTaskInstancesService | 获取实例列表 |
| `taskInstance:start` | StartTaskInstanceService | 开始任务 |
| `taskInstance:complete` | CompleteTaskInstanceService | 完成任务 |
| `taskInstance:skip` | SkipTaskInstanceService | 跳过任务 |
| `taskStatistics:get` | GetTaskStatisticsService | 获取统计 |
| `taskDependency:create` | CreateDependencyService | 创建依赖 |
| `taskDependency:chain` | GetDependencyChainService | 获取依赖链 |

### 2. 完整 useGoal Composable

```typescript
// apps/desktop/src/renderer/shared/composables/useGoal.ts
import { ref, computed, shallowRef } from 'vue';
import { GoalContainer } from '@dailyuse/infrastructure-client';
import {
  CreateGoalService,
  GetGoalsService,
  GetGoalByIdService,
  UpdateGoalService,
  DeleteGoalService,
  ActivateGoalService,
  PauseGoalService,
  CompleteGoalService,
  ArchiveGoalService,
  AddKeyResultService,
  UpdateKeyResultService,
  DeleteKeyResultService,
  GetProgressBreakdownService,
} from '@dailyuse/application-client';
import type {
  GoalClientDTO,
  CreateGoalRequest,
  UpdateGoalRequest,
  KeyResultClientDTO,
  AddKeyResultRequest,
  ProgressBreakdown,
} from '@dailyuse/contracts/goal';

export function useGoal() {
  const container = GoalContainer.getInstance();
  
  // 状态
  const goals = shallowRef<GoalClientDTO[]>([]);
  const currentGoal = ref<GoalClientDTO | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  
  // 服务实例缓存
  const services = {
    getAll: new GetGoalsService(container),
    getById: new GetGoalByIdService(container),
    create: new CreateGoalService(container),
    update: new UpdateGoalService(container),
    delete: new DeleteGoalService(container),
    activate: new ActivateGoalService(container),
    pause: new PauseGoalService(container),
    complete: new CompleteGoalService(container),
    archive: new ArchiveGoalService(container),
    addKeyResult: new AddKeyResultService(container),
    updateKeyResult: new UpdateKeyResultService(container),
    deleteKeyResult: new DeleteKeyResultService(container),
    progressBreakdown: new GetProgressBreakdownService(container),
  };
  
  // 获取目标列表
  async function fetchGoals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
  }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await services.getAll.execute(params);
      goals.value = response.data;
      return response;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error('获取目标失败');
      throw e;
    } finally {
      loading.value = false;
    }
  }
  
  // 获取单个目标
  async function fetchGoalById(uuid: string) {
    loading.value = true;
    try {
      currentGoal.value = await services.getById.execute(uuid, true);
      return currentGoal.value;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error('获取目标失败');
      throw e;
    } finally {
      loading.value = false;
    }
  }
  
  // 创建目标
  async function createGoal(request: CreateGoalRequest) {
    const goal = await services.create.execute(request);
    goals.value = [goal, ...goals.value];
    return goal;
  }
  
  // 更新目标
  async function updateGoal(uuid: string, request: UpdateGoalRequest) {
    const updated = await services.update.execute(uuid, request);
    goals.value = goals.value.map(g => g.uuid === uuid ? updated : g);
    if (currentGoal.value?.uuid === uuid) {
      currentGoal.value = updated;
    }
    return updated;
  }
  
  // 删除目标
  async function deleteGoal(uuid: string) {
    await services.delete.execute(uuid);
    goals.value = goals.value.filter(g => g.uuid !== uuid);
  }
  
  // 状态操作
  const activateGoal = (uuid: string) => services.activate.execute(uuid);
  const pauseGoal = (uuid: string) => services.pause.execute(uuid);
  const completeGoal = (uuid: string) => services.complete.execute(uuid);
  const archiveGoal = (uuid: string) => services.archive.execute(uuid);
  
  // KeyResult 操作
  async function addKeyResult(goalUuid: string, request: AddKeyResultRequest) {
    return services.addKeyResult.execute(goalUuid, request);
  }
  
  async function getProgressBreakdown(goalUuid: string): Promise<ProgressBreakdown> {
    return services.progressBreakdown.execute(goalUuid);
  }
  
  return {
    // 状态
    goals: computed(() => goals.value),
    currentGoal: computed(() => currentGoal.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    // 操作
    fetchGoals,
    fetchGoalById,
    createGoal,
    updateGoal,
    deleteGoal,
    activateGoal,
    pauseGoal,
    completeGoal,
    archiveGoal,
    addKeyResult,
    getProgressBreakdown,
  };
}
```

### 3. 复用 Web 端组件策略

```typescript
// 直接复用 @dailyuse/ui-vuetify 组件
import {
  GoalCard,
  GoalProgressBar,
  TaskCard,
  TaskStatusChip,
  PriorityBadge,
} from '@dailyuse/ui-vuetify';

// Desktop 特定组件 (需新建)
// - GoalTree.vue (桌面端可能需要更紧凑的布局)
// - TaskDependencyGraph.vue (使用 ECharts/vis.js)
```

### 4. 路由设计

```typescript
// apps/desktop/src/renderer/shared/router/index.ts
const routes = [
  // Goal 路由
  { path: '/goals', name: 'GoalList', component: () => import('@/views/goal/GoalListView.vue') },
  { path: '/goals/:uuid', name: 'GoalDetail', component: () => import('@/views/goal/GoalDetailView.vue') },
  
  // Task 路由
  { path: '/tasks', name: 'TaskList', component: () => import('@/views/task/TaskListView.vue') },
  { path: '/tasks/:uuid', name: 'TaskDetail', component: () => import('@/views/task/TaskDetailView.vue') },
  { path: '/tasks/today', name: 'TodayTasks', component: () => import('@/views/task/TodayTasksView.vue') },
];
```

### 5. 数据流图

```
┌─────────────────────────────────────────────────────────────┐
│                     Vue Component                            │
│                   (GoalListView.vue)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  const { goals, fetchGoals, createGoal } = useGoal();       │
│                                                              │
│  onMounted(() => fetchGoals());                             │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │ 调用 composable
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     useGoal.ts                               │
│                     (Composable)                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  const service = new GetGoalsService(container);            │
│  return service.execute(params);                            │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │ 调用 Application Service
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              GetGoalsService                                 │
│        (@dailyuse/application-client)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  const client = container.getApiClient();                   │
│  return client.getGoals(params);                            │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │ 调用 IPC Adapter
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  GoalIpcAdapter                              │
│        (@dailyuse/infrastructure-client)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  return this.ipcClient.invoke('goal:list', params);         │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │ IPC 调用
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               window.electronAPI.invoke                      │
│                    (Preload)                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ipcRenderer.invoke('goal:list', params)                    │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │ Electron IPC
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  IPC Handler                                 │
│                 (Main Process)                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ipcMain.handle('goal:list', async (_, params) => {         │
│    const repo = GoalContainer.getInstance().getRepository(); │
│    return repo.findAll(params);                             │
│  });                                                         │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │ SQLite 查询
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              SqliteGoalRepository                            │
│                   (SQLite)                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 参考资料

- Web 端实现: `apps/web/src/modules/goal/`, `apps/web/src/modules/task/`
- UI 组件: `packages/ui-vuetify/`
- 服务: `packages/application-client/src/goal/`, `packages/application-client/src/task/`
- Contracts: `packages/contracts/src/goal/`, `packages/contracts/src/task/`

---

## ✅ 完成定义 (DoD)

- [ ] 所有 UI 组件实现
- [ ] Composable 封装完成
- [ ] CRUD 功能测试通过
- [ ] TypeScript 编译通过
- [ ] 与 Web 端功能一致
- [ ] 代码已提交到分支
- [ ] PR 创建并通过 Review

---

**创建日期**: 2025-12-06  
**负责人**: Dev Agent  
**预计开始**: Phase 2 (Week 3)
