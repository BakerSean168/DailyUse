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
