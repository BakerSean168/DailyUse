# EPIC-018: Goal 模块 Package 集成示范

## 📋 Epic 概述

### 目标
将 Desktop Renderer 的 Goal 模块重构为完全使用 packages 的标准架构，作为其他模块重构的示范。

### 背景
在 EPIC-017 清理过程中发现，Desktop Renderer 中存在以下架构问题：
1. **Store 直接使用 Container** - 违反 Clean Architecture
2. **本地类型定义** - 应统一使用 `@dailyuse/contracts`
3. **缺少 Hooks 层** - Store 直接调用基础设施

Goal 模块将作为**标准化重构的示范**，建立可复制的模式。

### 当前状态对比

| 组件 | goalStore | focusStore | 问题 |
|------|-----------|------------|------|
| 数据调用 | ✅ ApplicationService | ❌ goalContainer.focusClient | focusStore 违规 |
| 类型来源 | ✅ contracts + domain-client | ❌ 本地类型定义 | focusStore 违规 |
| Hooks | ✅ useGoal 存在 | ❌ 无 useFocus Hook | 缺少抽象层 |

---

## 🎯 架构目标

### 目标架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                           │
│  ┌──────────────────┐    ┌──────────────────────────┐          │
│  │  Components      │◄───│  Hooks / Composables     │          │
│  │  (React/Vue)     │    │  useGoal, useFocus       │          │
│  └──────────────────┘    │  useGoalFolder, etc.     │          │
│          ▲               └────────────┬─────────────┘          │
│          │                            │                         │
│  ┌───────┴──────────┐                 │                         │
│  │  Stores (Zustand)│◄────────────────┘                         │
│  │  仅状态管理       │                                          │
│  │  无副作用调用     │                                          │
│  └──────────────────┘                                           │
└───────────────────────────────────────────────────────────────-─┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Local ApplicationService (Thin Wrapper)                  │  │
│  │  - GoalApplicationService                                 │  │
│  │  - FocusApplicationService (新增)                         │  │
│  └───────────────────────────┬──────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────▼──────────────────────────────┐  │
│  │  @dailyuse/application-client                             │  │
│  │  - Goal Use Cases (createGoal, searchGoals, etc.)         │  │
│  │  - Focus Use Cases (startFocus, pauseFocus, etc.) [新增]  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  @dailyuse/infrastructure-client                          │  │
│  │  - GoalContainer (已存在)                                 │  │
│  │  - GoalIpcAdapter (已存在)                                │  │
│  │  - GoalFocusIpcAdapter (新增到 packages)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────▼──────────────────────────────┐  │
│  │  @dailyuse/contracts                                      │  │
│  │  - GoalClientDTO, FocusSessionClientDTO, etc.             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 核心原则回顾

| 原则 | 说明 | 适用范围 |
|------|------|---------|
| **统一类型** | 所有 DTO 来自 `@dailyuse/contracts` | 全模块 |
| **Store 纯净** | Store 只管状态，不调用外部服务 | focusStore |
| **Hooks 封装** | 副作用操作封装在 Hooks 中 | 新建 useFocus |
| **单一 Container 来源** | Container 仅在 Application 层使用 | focusStore |

---

## 📊 当前代码分析

### 问题 1: focusStore 直接使用 Container

**位置**: [focusStore.ts](apps/desktop/src/renderer/modules/goal/presentation/stores/focusStore.ts#L11)

```typescript
// ❌ 错误: Store 直接导入 Container
import { goalContainer } from '../../infrastructure/di';

// ❌ 错误: Store 中调用基础设施
startFocus: async (goalUuid, duration) => {
  const focusClient = goalContainer.focusClient;  // 违规！
  const session = await focusClient.start({...});
  ...
}
```

**问题**:
- Store（Presentation）直接依赖 Infrastructure 层
- 违反依赖倒置原则
- 无法独立测试

### 问题 2: 本地类型定义

**位置**: [goal-focus.ipc-client.ts](apps/desktop/src/renderer/modules/goal/infrastructure/ipc/goal-focus.ipc-client.ts#L12-L54)

```typescript
// ❌ 错误: 本地定义类型
export interface FocusSessionDTO {
  uuid: string;
  goalUuid: string;
  ...
}

export interface FocusStatusDTO { ... }
export interface FocusHistoryDTO { ... }
export interface FocusStatisticsDTO { ... }
export interface PomodoroConfigDTO { ... }
```

**contracts 中已有类型**:
- `FocusSessionClientDTO` ✅
- `FocusSessionStatus` ✅
- `FocusModeClientDTO` ✅

**缺失需要添加**:
- `FocusStatusDTO` → contracts
- `FocusHistoryDTO` → contracts
- `FocusStatisticsDTO` → contracts
- `PomodoroConfigDTO` → contracts

### 问题 3: Focus 功能缺少 Hooks 层

**现有 Hooks**: `useGoal.ts`, `useGoalFolder.ts`, `useGoalReview.ts`, `useKeyResult.ts`

**缺失**: `useFocus.ts` - Focus 功能没有对应的 Hook

### 良好示范: goalStore

```typescript
// ✅ 正确: 通过 ApplicationService 调用
import { goalApplicationService } from '../../application/services';

fetchGoals: async () => {
  const goals = await goalApplicationService.getGoals();  // ✅
  set({ goals });
}
```

---

## 📋 Story 拆解

### Story 1: 迁移 Focus 类型到 Contracts

**优先级**: P0  
**估时**: 1 SP  
**依赖**: 无

**任务**:
- [ ] 1.1 在 `@dailyuse/contracts/goal` 添加 `FocusStatusDTO`
- [ ] 1.2 在 `@dailyuse/contracts/goal` 添加 `FocusHistoryDTO`
- [ ] 1.3 在 `@dailyuse/contracts/goal` 添加 `FocusStatisticsDTO`
- [ ] 1.4 在 `@dailyuse/contracts/goal` 添加 `PomodoroConfigDTO`
- [ ] 1.5 更新 contracts 导出

**文件变更**:
```
packages/contracts/src/modules/goal/
├── dto/
│   └── focus.dto.ts  (新增)
└── index.ts          (更新导出)
```

**验收标准**:
- [ ] 所有 Focus 相关类型从 contracts 导出
- [ ] typecheck 通过

---

### Story 2: 提取 Focus IPC Adapter 到 Packages

**优先级**: P0  
**估时**: 2 SP  
**依赖**: Story 1

**任务**:
- [ ] 2.1 创建 `GoalFocusIpcAdapter` 在 `@dailyuse/infrastructure-client`
- [ ] 2.2 更新 `GoalContainer` 添加 `focusAdapter`
- [ ] 2.3 创建 `createGoalFocusIpcAdapter` 工厂函数
- [ ] 2.4 更新 packages 导出
- [ ] 2.5 删除本地 `goal-focus.ipc-client.ts`

**文件变更**:
```
packages/infrastructure-client/src/goal/
├── adapters/
│   └── ipc/
│       └── goal-focus-ipc.adapter.ts  (新增)
├── ports/
│   └── goal-focus-api-client.port.ts  (新增)
├── goal.container.ts                   (更新)
└── index.ts                            (更新导出)

apps/desktop/src/renderer/modules/goal/infrastructure/ipc/
├── goal-focus.ipc-client.ts            (删除)
└── index.ts                            (更新)
```

**验收标准**:
- [ ] `GoalFocusIpcAdapter` 在 packages 中工作
- [ ] Desktop 可以正常使用 Focus 功能
- [ ] typecheck 通过

---

### Story 3: 创建 Focus Use Cases (Application Layer)

**优先级**: P0  
**估时**: 2 SP  
**依赖**: Story 2

**任务**:
- [ ] 3.1 创建 `startFocusSession` Use Case
- [ ] 3.2 创建 `pauseFocusSession` Use Case
- [ ] 3.3 创建 `resumeFocusSession` Use Case
- [ ] 3.4 创建 `stopFocusSession` Use Case
- [ ] 3.5 创建 `getFocusStatus` Use Case
- [ ] 3.6 创建 `getFocusHistory` Use Case
- [ ] 3.7 更新 `application-client` 导出

**文件变更**:
```
packages/application-client/src/goal/
├── services/
│   └── focus/
│       ├── start-focus-session.ts
│       ├── pause-focus-session.ts
│       ├── resume-focus-session.ts
│       ├── stop-focus-session.ts
│       ├── get-focus-status.ts
│       ├── get-focus-history.ts
│       └── index.ts
└── index.ts
```

**验收标准**:
- [ ] 所有 Focus Use Cases 可从 `@dailyuse/application-client` 导入
- [ ] Use Cases 内部使用 Container 获取依赖
- [ ] typecheck 通过

---

### Story 4: 创建 FocusApplicationService (Local Wrapper)

**优先级**: P1  
**估时**: 1 SP  
**依赖**: Story 3

**任务**:
- [ ] 4.1 创建 `FocusApplicationService` 类
- [ ] 4.2 导出 `focusApplicationService` 单例
- [ ] 4.3 更新模块导出

**文件变更**:
```
apps/desktop/src/renderer/modules/goal/application/services/
├── FocusApplicationService.ts  (新增)
└── index.ts                    (更新)
```

**代码示例**:
```typescript
// FocusApplicationService.ts
import {
  startFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  stopFocusSession,
  getFocusStatus,
  getFocusHistory,
} from '@dailyuse/application-client';
import type {
  FocusSessionClientDTO,
  FocusStatusDTO,
  FocusHistoryDTO,
} from '@dailyuse/contracts/goal';

export class FocusApplicationService {
  async startSession(goalUuid: string, duration: number): Promise<FocusSessionClientDTO> {
    return startFocusSession({ goalUuid, duration });
  }

  async pauseSession(): Promise<FocusSessionClientDTO> {
    return pauseFocusSession();
  }

  async resumeSession(): Promise<FocusSessionClientDTO> {
    return resumeFocusSession();
  }

  async stopSession(notes?: string): Promise<FocusSessionClientDTO | null> {
    return stopFocusSession({ notes });
  }

  async getStatus(): Promise<FocusStatusDTO> {
    return getFocusStatus();
  }

  async getHistory(goalUuid?: string): Promise<FocusHistoryDTO> {
    return getFocusHistory({ goalUuid });
  }
}

export const focusApplicationService = new FocusApplicationService();
```

**验收标准**:
- [ ] `focusApplicationService` 可用
- [ ] 不直接依赖 Container
- [ ] typecheck 通过

---

### Story 5: 创建 useFocus Hook

**优先级**: P1  
**估时**: 2 SP  
**依赖**: Story 4

**任务**:
- [ ] 5.1 创建 `useFocus.ts` Hook
- [ ] 5.2 实现所有 Focus 操作方法
- [ ] 5.3 集成 Store 状态管理
- [ ] 5.4 更新 hooks 导出

**文件变更**:
```
apps/desktop/src/renderer/modules/goal/presentation/hooks/
├── useFocus.ts  (新增)
└── index.ts     (更新)
```

**代码示例**:
```typescript
// useFocus.ts
import { useCallback } from 'react';
import { useFocusStore } from '../stores/focusStore';
import { focusApplicationService } from '../../application/services';
import type { FocusSessionClientDTO } from '@dailyuse/contracts/goal';

export interface UseFocusReturn {
  // State from Store
  currentSession: FocusSessionClientDTO | null;
  isActive: boolean;
  isPaused: boolean;
  remainingTime: number | null;
  loading: boolean;
  error: string | null;

  // Actions (封装服务调用 + Store 更新)
  startFocus: (goalUuid: string, duration?: number) => Promise<FocusSessionClientDTO>;
  pauseFocus: () => Promise<void>;
  resumeFocus: () => Promise<void>;
  stopFocus: (notes?: string) => Promise<FocusSessionClientDTO | null>;
  refreshStatus: () => Promise<void>;

  // Utilities
  clearError: () => void;
}

export function useFocus(): UseFocusReturn {
  // ===== Store State =====
  const currentSession = useFocusStore((s) => s.currentSession);
  const isActive = useFocusStore((s) => s.isActive);
  const isPaused = useFocusStore((s) => s.isPaused);
  const remainingTime = useFocusStore((s) => s.remainingTime);
  const loading = useFocusStore((s) => s.isLoading);
  const error = useFocusStore((s) => s.error);
  const defaultDuration = useFocusStore((s) => s.defaultDuration);

  // ===== Store Actions =====
  const setCurrentSession = useFocusStore((s) => s.setCurrentSession);
  const setLoading = useFocusStore((s) => s.setLoading);
  const setError = useFocusStore((s) => s.setError);
  const setRemainingTime = useFocusStore((s) => s.setRemainingTime);

  // ===== Actions =====

  const startFocus = useCallback(async (goalUuid: string, duration?: number) => {
    setLoading(true);
    setError(null);

    try {
      const session = await focusApplicationService.startSession(
        goalUuid,
        duration ?? defaultDuration
      );
      setCurrentSession(session);
      setRemainingTime(session.duration * 60);
      return session;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to start focus';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [defaultDuration, setCurrentSession, setLoading, setError, setRemainingTime]);

  const pauseFocus = useCallback(async () => {
    setLoading(true);
    try {
      const session = await focusApplicationService.pauseSession();
      setCurrentSession(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to pause focus');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [setCurrentSession, setLoading, setError]);

  // ... 其他方法类似

  return {
    currentSession,
    isActive,
    isPaused,
    remainingTime,
    loading,
    error,
    startFocus,
    pauseFocus,
    resumeFocus,
    stopFocus,
    refreshStatus,
    clearError: () => setError(null),
  };
}
```

**验收标准**:
- [ ] `useFocus` Hook 可用
- [ ] 所有 Focus 操作通过 Hook 调用
- [ ] Hook 内部调用 ApplicationService，更新 Store
- [ ] typecheck 通过

---

### Story 6: 重构 focusStore (移除 Container 依赖)

**优先级**: P1  
**估时**: 2 SP  
**依赖**: Story 5

**任务**:
- [ ] 6.1 移除 `goalContainer` 导入
- [ ] 6.2 移除本地类型导入，使用 contracts
- [ ] 6.3 移除所有 IPC 调用逻辑
- [ ] 6.4 Store 仅保留状态管理和 Selectors
- [ ] 6.5 验证与 useFocus Hook 协作正常

**变更前后对比**:

**Before (违规)**:
```typescript
import { goalContainer } from '../../infrastructure/di';
import type { FocusSessionDTO } from '../../infrastructure/ipc/goal-focus.ipc-client';

startFocus: async (goalUuid, duration) => {
  const focusClient = goalContainer.focusClient;
  const session = await focusClient.start({...});
  set({ currentSession: session });
}
```

**After (正确)**:
```typescript
import type { FocusSessionClientDTO } from '@dailyuse/contracts/goal';

// Store 只有状态管理，无副作用
setCurrentSession: (session: FocusSessionClientDTO | null) => {
  set({ currentSession: session, isActive: session !== null });
}

// 组件使用 Hook
function FocusPanel() {
  const { startFocus, currentSession } = useFocus();
  const handleStart = () => startFocus(goalUuid);
}
```

**验收标准**:
- [ ] focusStore 无 Container 导入
- [ ] focusStore 无 IPC 调用
- [ ] 类型全部来自 contracts
- [ ] typecheck 通过
- [ ] Focus 功能正常工作

---

### Story 7: 更新组件使用 useFocus Hook

**优先级**: P2  
**估时**: 1 SP  
**依赖**: Story 6

**任务**:
- [ ] 7.1 找出所有直接使用 focusStore 的组件
- [ ] 7.2 更新组件使用 useFocus Hook
- [ ] 7.3 验证 UI 功能正常

**验收标准**:
- [ ] 所有 Focus 相关组件使用 useFocus Hook
- [ ] Focus 功能端到端正常工作

---

### Story 8: 删除冗余代码和清理

**优先级**: P2  
**估时**: 0.5 SP  
**依赖**: Story 7

**任务**:
- [ ] 8.1 删除本地 `goal-focus.ipc-client.ts` (如 Story 2 未完全删除)
- [ ] 8.2 清理未使用的导出
- [ ] 8.3 更新模块 README
- [ ] 8.4 最终 typecheck 验证

**验收标准**:
- [ ] 无冗余代码
- [ ] 无 lint 警告
- [ ] typecheck 通过
- [ ] 所有测试通过

---

## 📅 实施计划

### Phase 1: 基础设施准备 (Day 1)
- Story 1: 迁移 Focus 类型到 Contracts
- Story 2: 提取 Focus IPC Adapter 到 Packages

### Phase 2: Application 层 (Day 1-2)
- Story 3: 创建 Focus Use Cases
- Story 4: 创建 FocusApplicationService

### Phase 3: Presentation 层重构 (Day 2-3)
- Story 5: 创建 useFocus Hook
- Story 6: 重构 focusStore

### Phase 4: 完善和清理 (Day 3)
- Story 7: 更新组件
- Story 8: 删除冗余代码

---

## ✅ 验收标准

### 功能验收
- [ ] Focus 功能（开始/暂停/恢复/停止）正常工作
- [ ] Focus 历史记录正常显示
- [ ] Focus 统计正常显示

### 架构验收
- [ ] **类型**: 所有类型来自 `@dailyuse/contracts`
- [ ] **Store**: focusStore 无 Container 依赖，无 IPC 调用
- [ ] **Hook**: useFocus 封装所有 Focus 操作
- [ ] **ApplicationService**: focusApplicationService 使用 packages Use Cases
- [ ] **Packages**: GoalFocusIpcAdapter 在 infrastructure-client 中

### 代码质量
- [ ] typecheck 通过
- [ ] 无 lint 错误
- [ ] 单元测试覆盖 Hook 和 ApplicationService

---

## 🔄 可复制模式

完成此 EPIC 后，其他模块可按以下模式重构：

### 检查清单

1. **识别 Store 中的 Container 调用**
   ```bash
   grep -r "Container\." apps/desktop/src/renderer/modules/*/presentation/stores/
   ```

2. **识别本地类型定义**
   ```bash
   grep -r "interface.*DTO" apps/desktop/src/renderer/modules/*/infrastructure/
   ```

3. **检查缺失的 Hooks**
   - 每个 Store 应有对应的 Hook
   - Hook 封装副作用，Store 仅管状态

### 重构步骤模板

```
1. 迁移类型到 contracts
2. 提取 IPC Adapter 到 packages/infrastructure-client
3. 创建 Use Cases 到 packages/application-client
4. 创建本地 ApplicationService (thin wrapper)
5. 创建 Hook (useXxx)
6. 重构 Store (移除 Container 依赖)
7. 更新组件使用 Hook
8. 删除冗余代码
```

---

## 📚 相关文档

- [EPIC-017: Renderer Infrastructure 统一](./EPIC-017-renderer-infrastructure-unification.md) - 架构原则定义
- [EPIC-016: Schedule 模块优化](./EPIC-016-schedule-module-optimization.md) - 调度器设计
- [packages-index.md](../packages-index.md) - Packages 结构概述

---

## 📝 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-01-07 | 1.0 | 初始版本 |
