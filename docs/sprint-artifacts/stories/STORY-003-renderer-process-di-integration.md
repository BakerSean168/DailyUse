# STORY-003: 渲染进程 DI 初始化集成

## 📋 Story 概述

**Story ID**: STORY-003  
**Epic**: EPIC-002 (Desktop Application Development)  
**优先级**: P0 (阻塞其他 Story)  
**预估工时**: 2-3 天  
**状态**: 🔵 Ready for Dev  

---

## 🎯 用户故事

**作为** 桌面应用开发者  
**我希望** 渲染进程使用与 Web 端一致的依赖注入方式  
**以便于** 复用 `@dailyuse/application-client` 的所有服务，无需修改业务代码  

---

## 📋 验收标准

### 功能验收

- [ ] 渲染进程调用 `configureDesktopDependencies(electronApi)` 完成 DI 配置
- [ ] 所有 Container 可正常获取服务
- [ ] IPC 通信正常工作（渲染进程 → 主进程）
- [ ] Vue 组件可通过 Container 使用服务

### 技术验收

- [ ] `ElectronAPI` 类型定义完整
- [ ] `renderer/main.ts` 更新完成
- [ ] TypeScript 编译无错误
- [ ] 应用渲染进程正常启动

---

## 📐 技术设计

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │                  Vue Application                    │     │
│  │                                                     │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │     │
│  │  │ GoalView    │  │ TaskView    │  │ Other View │  │     │
│  │  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │     │
│  │         │                │               │         │     │
│  │  ┌──────┴────────────────┴───────────────┴──────┐  │     │
│  │  │              Composables / Hooks              │  │     │
│  │  │         useGoal(), useTask(), etc.            │  │     │
│  │  └──────────────────────┬────────────────────────┘  │     │
│  │                         │                           │     │
│  └─────────────────────────┼───────────────────────────┘     │
│                            │                                 │
│  ┌─────────────────────────▼───────────────────────────┐     │
│  │           @dailyuse/application-client               │     │
│  │                  (225 Services)                      │     │
│  └─────────────────────────┬───────────────────────────┘     │
│                            │                                 │
│  ┌─────────────────────────▼───────────────────────────┐     │
│  │          @dailyuse/infrastructure-client             │     │
│  │                                                       │     │
│  │  ┌───────────────────────────────────────────────┐   │     │
│  │  │          configureDesktopDependencies()       │   │     │
│  │  │                                               │   │     │
│  │  │  GoalContainer ← GoalIpcAdapter               │   │     │
│  │  │  TaskContainer ← TaskIpcAdapter               │   │     │
│  │  │  ... (11 modules)                             │   │     │
│  │  └───────────────────────────────────────────────┘   │     │
│  └─────────────────────────┬───────────────────────────┘     │
│                            │                                 │
│  ┌─────────────────────────▼───────────────────────────┐     │
│  │              window.electronAPI (Preload)            │     │
│  │                                                       │     │
│  │  goal: { getAll, create, update, delete, ... }       │     │
│  │  task: { getAll, create, update, delete, ... }       │     │
│  │  ...                                                  │     │
│  └─────────────────────────┬───────────────────────────┘     │
│                            │ IPC                             │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      Main Process                            │
│                   (IPC Handlers → Container → SQLite)        │
└─────────────────────────────────────────────────────────────┘
```

### 文件结构

```
apps/desktop/src/
├── renderer/
│   ├── main.ts                           # 更新：调用 configureDesktopDependencies
│   ├── types/
│   │   └── electron.d.ts                 # 新增：ElectronAPI 类型声明
│   └── shared/
│       └── composables/
│           ├── useGoal.ts                # 使用 Container 获取服务
│           ├── useTask.ts
│           └── ...
└── preload/
    └── main.ts                           # 暴露 electronAPI
```

---

## 📝 Task 分解

### Task 3.1: 创建 ElectronAPI 类型定义

**工时**: 0.5 天

**输入**:
- `@dailyuse/infrastructure-client` 的 `ElectronAPI` 接口定义
- Preload 脚本暴露的 API

**输出**:
- `apps/desktop/src/renderer/types/electron.d.ts`

**实现要点**:
```typescript
// electron.d.ts
import type { ElectronAPI } from '@dailyuse/infrastructure-client';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
```

**验收**:
- [ ] TypeScript 可识别 `window.electronAPI`
- [ ] 类型与 IPC 适配器期望一致

---

### Task 3.2: 更新渲染进程入口

**工时**: 0.5 天

**输入**:
- 现有 `apps/desktop/src/renderer/main.ts`
- `configureDesktopDependencies` 函数

**输出**:
- 更新后的 `renderer/main.ts`

**实现要点**:
```typescript
// renderer/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { configureDesktopDependencies } from '@dailyuse/infrastructure-client';

import App from './App.vue';
import router from './shared/router';
import vuetify from './plugins/vuetify';

// 1. 配置 DI (必须在 Vue app 创建之前)
if (window.electronAPI) {
  configureDesktopDependencies(window.electronAPI);
  console.log('✅ Desktop dependencies configured');
} else {
  console.error('❌ electronAPI not available');
}

// 2. 创建 Vue 应用
const pinia = createPinia();
const app = createApp(App);

app.use(router).use(vuetify).use(pinia);
app.mount('#app');
```

**验收**:
- [ ] 应用启动时打印配置成功日志
- [ ] 无运行时错误

---

### Task 3.3: 重构现有服务调用

**工时**: 1-2 天

**输入**:
- 现有使用直接 IPC 调用的代码
- `@dailyuse/application-client` 服务

**输出**:
- 统一使用 Container 的 Composables

**实现示例**:
```typescript
// useGoal.ts (重构后)
import { ref, computed } from 'vue';
import { GoalContainer } from '@dailyuse/infrastructure-client';
import {
  GetAllGoalsService,
  CreateGoalService,
  UpdateGoalService,
  DeleteGoalService,
} from '@dailyuse/application-client';

export function useGoal() {
  const container = GoalContainer.getInstance();
  
  // Services
  const getAllService = new GetAllGoalsService(container);
  const createService = new CreateGoalService(container);
  const updateService = new UpdateGoalService(container);
  const deleteService = new DeleteGoalService(container);
  
  // State
  const goals = ref([]);
  const loading = ref(false);
  const error = ref(null);
  
  // Actions
  async function fetchGoals() {
    loading.value = true;
    try {
      goals.value = await getAllService.execute();
    } catch (e) {
      error.value = e;
    } finally {
      loading.value = false;
    }
  }
  
  async function createGoal(data) {
    return createService.execute(data);
  }
  
  // ...
  
  return {
    goals: computed(() => goals.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    fetchGoals,
    createGoal,
    // ...
  };
}
```

**迁移清单**:
- [ ] useGoal.ts
- [ ] useTask.ts
- [ ] useSchedule.ts
- [ ] useReminder.ts
- [ ] useAuth.ts
- [ ] useAccount.ts
- [ ] useNotification.ts
- [ ] useDashboard.ts
- [ ] useRepository.ts
- [ ] useSetting.ts
- [ ] useAI.ts

**验收**:
- [ ] 所有 Composables 使用 Container
- [ ] 现有功能不受影响

---

## 🔗 依赖关系

### 前置依赖

- ✅ STORY-001 (包提取) - 已完成
- 🔄 STORY-002 (主进程 DI) - 可并行开发
- ⏳ STORY-004 (Preload API) - 需要 Preload 暴露 API

### 后续影响

- 🔜 所有 UI Story (Story 5-10) - 依赖本 Story

---

## ⚠️ 风险 & 缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| electronAPI 未定义 | 中 | 高 | 添加运行时检查和错误处理 |
| 类型不匹配 | 中 | 中 | 先完成 STORY-004 的类型定义 |
| 现有代码依赖破坏 | 低 | 中 | 保留兼容层，渐进式迁移 |

---

## 📚 参考资料

- 现有文件: `apps/desktop/src/renderer/main.ts`
- 包导出: `packages/infrastructure-client/src/index.ts`
- Composition Root: `packages/infrastructure-client/src/di/composition-roots/desktop.composition-root.ts`

---

## ✅ 完成定义 (DoD)

- [ ] 代码实现完成
- [ ] TypeScript 编译通过
- [ ] 渲染进程正常启动
- [ ] 至少一个模块的 IPC 通信验证通过
- [ ] 代码已提交到分支
- [ ] PR 创建并通过 Review

---

**创建日期**: 2025-12-06  
**负责人**: Dev Agent  
**预计开始**: Sprint 开始时 (可与 STORY-002 并行)  
