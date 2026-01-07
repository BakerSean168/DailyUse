# EPIC-017: Desktop Renderer Infrastructure 统一

## 概述

**目标**: 清理 Desktop Renderer 中的冗余 Infrastructure 代码，统一使用 `@dailyuse/infrastructure-client` 包提供的 IPC Adapter 和 Container。

**背景**: 在 Desktop 开发初期，Renderer 模块各自实现了本地 IPC Client。后来将这些实现提取到 `packages/infrastructure-client`，但本地代码未被删除，导致约 4000 行冗余代码。

**收益**:
- 减少约 4000 行重复代码
- 统一 DI 容器管理
- 一处修改，全端生效
- 提升可维护性

---

## 当前状态分析

### Packages 层已具备完整能力

| Package | 提供内容 | 状态 |
|---------|---------|------|
| `@dailyuse/infrastructure-client` | IPC Adapters + Containers | ✅ 11 个模块全覆盖 |
| `@dailyuse/application-client` | Use Cases | ✅ 使用 packages Container |
| `configureDesktopDependencies` | Composition Root | ✅ 配置所有 IPC Adapter |

### Renderer 当前复用情况

| 层 | 复用情况 | 问题 |
|----|---------|------|
| `ApplicationService` | ✅ 使用 `application-client` | 正确 |
| `infrastructure/ipc/` | ❌ 本地重复实现 | ~4000 行冗余 |
| `infrastructure/di/` | ❌ 本地 Container | 与 packages 冲突 |

### 冗余代码统计

| 模块 | 本地 IPC Client | 行数 |
|------|----------------|------|
| account | `account.ipc-client.ts` | 295 |
| ai | `ai.ipc-client.ts` | 318 |
| auth | `auth.ipc-client.ts` | 314 |
| dashboard | `dashboard.ipc-client.ts` | 284 |
| editor | `editor.ipc-client.ts` | 338 |
| goal | `goal.ipc-client.ts`, `goal-focus.ipc-client.ts` | 405 |
| notification | `notification.ipc-client.ts` | 325 |
| reminder | `reminder.ipc-client.ts` | 301 |
| repository | `repository.ipc-client.ts` | 340 |
| schedule | `schedule.ipc-client.ts` | 264 |
| setting | `setting.ipc-client.ts` | 291 |
| task | `task-*.ipc-client.ts` (3 files) | 523 |
| **总计** | **16 个文件** | **~3998 行** |

---

## 清理任务清单

### Phase 1: Schedule 模块（示范）

#### 1.1 删除本地 IPC Client

| 操作 | 文件路径 |
|------|---------|
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/schedule/infrastructure/ipc/schedule.ipc-client.ts` |
| 📝 更新 | `apps/desktop/src/renderer/modules/schedule/infrastructure/ipc/index.ts` |

#### 1.2 简化本地 Container

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 📝 更新 | `apps/desktop/src/renderer/modules/schedule/infrastructure/di/schedule.container.ts` | 改为导出 packages Container |
| 📝 更新 | `apps/desktop/src/renderer/modules/schedule/infrastructure/di/index.ts` | 更新导出 |
| 📝 更新 | `apps/desktop/src/renderer/modules/schedule/infrastructure/index.ts` | 更新导出 |

#### 1.3 更新 Module Registry

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 📝 更新 | `apps/desktop/src/renderer/shared/infrastructure/module-registry.ts` | Schedule 模块使用 packages Container |

---

### Phase 2: 其他核心模块

#### 2.1 Task 模块

| 操作 | 文件路径 |
|------|---------|
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/task/infrastructure/ipc/task-template.ipc-client.ts` |
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/task/infrastructure/ipc/task-instance.ipc-client.ts` |
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/task/infrastructure/ipc/task-statistics.ipc-client.ts` |
| 📝 更新 | `apps/desktop/src/renderer/modules/task/infrastructure/ipc/index.ts` |
| 📝 更新 | `apps/desktop/src/renderer/modules/task/infrastructure/di/task.container.ts` |

#### 2.2 Goal 模块

| 操作 | 文件路径 |
|------|---------|
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/goal/infrastructure/ipc/goal.ipc-client.ts` |
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/goal/infrastructure/ipc/goal-focus.ipc-client.ts` |
| 📝 更新 | `apps/desktop/src/renderer/modules/goal/infrastructure/ipc/index.ts` |
| 📝 更新 | `apps/desktop/src/renderer/modules/goal/infrastructure/di/goal.container.ts` |

#### 2.3 Reminder 模块

| 操作 | 文件路径 |
|------|---------|
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/reminder/infrastructure/ipc/reminder.ipc-client.ts` |
| 📝 更新 | `apps/desktop/src/renderer/modules/reminder/infrastructure/ipc/index.ts` |
| 📝 更新 | `apps/desktop/src/renderer/modules/reminder/infrastructure/di/reminder.container.ts` |

---

### Phase 3: 辅助模块

#### 3.1 Account 模块

| 操作 | 文件路径 |
|------|---------|
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/account/infrastructure/ipc/account.ipc-client.ts` |
| 📝 更新 | Container 和 index |

#### 3.2 Auth 模块

| 操作 | 文件路径 |
|------|---------|
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/auth/infrastructure/ipc/auth.ipc-client.ts` |
| 📝 更新 | Container 和 index |

#### 3.3 Notification 模块

| 操作 | 文件路径 |
|------|---------|
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/notification/infrastructure/ipc/notification.ipc-client.ts` |
| 📝 更新 | Container 和 index |

#### 3.4 Dashboard 模块

| 操作 | 文件路径 |
|------|---------|
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/dashboard/infrastructure/ipc/dashboard.ipc-client.ts` |
| 📝 更新 | Container 和 index |

#### 3.5 Repository 模块

| 操作 | 文件路径 |
|------|---------|
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/repository/infrastructure/ipc/repository.ipc-client.ts` |
| 📝 更新 | Container 和 index |

#### 3.6 Setting 模块

| 操作 | 文件路径 |
|------|---------|
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/setting/infrastructure/ipc/setting.ipc-client.ts` |
| 📝 更新 | Container 和 index |

#### 3.7 AI 模块

| 操作 | 文件路径 |
|------|---------|
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/ai/infrastructure/ipc/ai.ipc-client.ts` |
| 📝 更新 | Container 和 index |

#### 3.8 Editor 模块

| 操作 | 文件路径 |
|------|---------|
| 🗑️ 删除 | `apps/desktop/src/renderer/modules/editor/infrastructure/ipc/editor.ipc-client.ts` |
| 📝 更新 | Container 和 index |

---

## 目标架构

### Before（当前）

```
Renderer Module
├── application/
│   └── services/
│       └── XXXApplicationService.ts  ← 使用 @dailyuse/application-client ✅
├── infrastructure/
│   ├── di/
│   │   └── xxx.container.ts  ← 本地 Container（冗余）❌
│   └── ipc/
│       └── xxx.ipc-client.ts  ← 本地 IPC Client（冗余）❌
└── presentation/
```

### After（目标）

```
Renderer Module
├── application/
│   └── services/
│       └── XXXApplicationService.ts  ← 使用 @dailyuse/application-client ✅
├── infrastructure/
│   ├── di/
│   │   └── index.ts  ← 仅重导出 packages Container
│   └── index.ts
└── presentation/
```

### 数据流

```
UI Component
    ↓
ScheduleApplicationService (本地 Thin Wrapper)
    ↓
@dailyuse/application-client (Use Cases)
    ↓
@dailyuse/infrastructure-client ScheduleContainer (DI)
    ↓
ScheduleTaskIpcAdapter (packages 提供)
    ↓
Electron IPC → Main Process
```

---

## Story 拆分

### Story 1: Schedule 模块清理（示范）
- **估时**: 2 SP
- **优先级**: P0
- **依赖**: 无

**验收标准**:
- [x] 删除 `schedule.ipc-client.ts`
- [x] 更新 `schedule.container.ts` 为重导出
- [x] 更新 `module-registry.ts`
- [x] 验证 Desktop Schedule 功能正常

### Story 2: Task 模块清理
- **估时**: 2 SP
- **优先级**: P1
- **依赖**: Story 1

### Story 3: Goal 模块清理
- **估时**: 2 SP
- **优先级**: P1
- **依赖**: Story 1

### Story 4: Reminder 模块清理
- **估时**: 2 SP
- **优先级**: P1
- **依赖**: Story 1

### Story 5: 其他模块批量清理
- **估时**: 3 SP
- **优先级**: P2
- **依赖**: Stories 2-4
- **范围**: Account, Auth, Notification, Dashboard, Repository, Setting, AI, Editor

### Story 6: 清理验证与文档更新
- **估时**: 1 SP
- **优先级**: P2
- **依赖**: Story 5

---

## 风险与注意事项

### 低风险
1. **本地 IPC Client 未被直接使用**
   - `ApplicationService` 已通过 `application-client` Use Cases 使用 packages 层
   - 删除本地代码不会影响功能

2. **DI 配置已就绪**
   - `configureDesktopDependencies` 已在 `main.tsx` 调用
   - 所有模块的 IPC Adapter 已正确注册

### 需要注意
1. **Editor 模块**
   - packages 可能没有 Editor 模块的 IPC Adapter
   - 需要检查是否保留本地实现

2. **module-registry.ts 的 Container 类型**
   - 本地 Container 继承 `RendererContainer`
   - packages Container 继承 `ModuleContainerBase`
   - 可能需要调整类型定义

---

## 🚨 新发现的架构问题

在清理过程中发现 Stores 层存在架构违规，需要一并解决。

### 问题 1: Store 直接使用 Container

**现状**（错误）:
```typescript
// accountStore.ts
import { accountContainer } from '../../infrastructure/di';

fetchCurrentAccount: async () => {
  const accountClient = accountContainer.accountClient;  // ❌ 直接访问 Container
  const account = await accountClient.getCurrentAccount();
}
```

**问题**:
- Store（Presentation 层）直接依赖 Container（Infrastructure 层）
- 违反 Clean Architecture 的依赖规则
- 导致删除本地 Container 后 typecheck 失败

### 问题 2: 本地类型别名

**现状**（不推荐）:
```typescript
// accountStore.ts
type AccountDTO = AccountClientDTO;  // ❌ 多余的本地类型别名
type SubscriptionDTO = SubscriptionClientDTO;
```

**问题**:
- 增加维护成本
- 可能造成类型不一致

### 问题 3: 缺少 Hooks/Composables 层

**现状**: Store 直接调用 IPC Client

**期望**: Store → Hooks → ApplicationService → packages Use Cases

---

## 架构原则

### 原则 1: 统一类型定义

> **所有 DTO 类型必须来自 `@dailyuse/contracts`，禁止本地类型定义或别名。**

**正确做法**:
```typescript
import type { AccountClientDTO, SubscriptionClientDTO } from '@dailyuse/contracts/account';

// 直接使用，不创建别名
const currentAccount: AccountClientDTO | null = null;
```

### 原则 2: Store 通过 Hooks 调用服务

> **Store 不应直接调用 ApplicationService 或 Container。应通过 Hooks（React）/ Composables（Vue）间接访问。**

**正确的调用链**:
```
┌─────────────────────────────────────────────────────────────────┐
│  Presentation Layer                                              │
│  ┌─────────────┐    ┌──────────────────┐                        │
│  │   Store     │◄───│   Hooks/         │                        │
│  │ (状态管理)  │    │   Composables    │                        │
│  └─────────────┘    └────────┬─────────┘                        │
└──────────────────────────────┼──────────────────────────────────┘
                               ↓
┌──────────────────────────────┼──────────────────────────────────┐
│  Application Layer           ↓                                   │
│  ┌──────────────────────────────────────┐                        │
│  │   ApplicationService (本地 Wrapper)  │                        │
│  └───────────────────┬──────────────────┘                        │
│                      ↓                                           │
│  ┌──────────────────────────────────────┐                        │
│  │   @dailyuse/application-client       │                        │
│  │   (Use Cases)                        │                        │
│  └───────────────────┬──────────────────┘                        │
└──────────────────────┼──────────────────────────────────────────┘
                       ↓
┌──────────────────────┼──────────────────────────────────────────┐
│  Infrastructure Layer↓                                           │
│  ┌──────────────────────────────────────┐                        │
│  │   @dailyuse/infrastructure-client    │                        │
│  │   Container → IPC Adapter            │                        │
│  └──────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

**重构示例**:

```typescript
// ✅ 正确: hooks/useAccountActions.ts
export function useAccountActions() {
  const { setCurrentAccount, setLoading, setError } = useAccountStore();

  async function fetchCurrentAccount() {
    try {
      setLoading(true);
      const account = await accountApplicationService.getCurrentAccount();
      setCurrentAccount(account);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch account');
    } finally {
      setLoading(false);
    }
  }

  return { fetchCurrentAccount };
}

// ✅ 正确: stores/accountStore.ts (仅状态管理)
export const useAccountStore = create<AccountState & AccountStateActions>()(
  immer((set) => ({
    currentAccount: null,
    isLoading: false,
    error: null,
    
    setCurrentAccount: (account) => set({ currentAccount: account }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
  }))
);

// ✅ 正确: 组件使用
function AccountPage() {
  const { currentAccount } = useAccountStore();
  const { fetchCurrentAccount } = useAccountActions();
  
  useEffect(() => {
    fetchCurrentAccount();
  }, []);
}
```

### 原则 3: Container 仅在 Application 层使用

> **Container 由 Composition Root 配置，仅由 ApplicationService/Use Cases 访问。Presentation 层禁止直接访问。**

**Composition Root**（已正确实现）:
```typescript
// main.tsx
import { configureDesktopDependencies } from '@dailyuse/infrastructure-client';
configureDesktopDependencies(window.electronAPI);
```

---

## 新增 Story

### Story 7: 迁移缺失类型到 Contracts

- **估时**: 2 SP
- **优先级**: P1
- **依赖**: 无

**任务**:
- [ ] 添加 `FocusSessionDTO` 到 `@dailyuse/contracts/goal`
- [ ] 添加 `AppSettingsDTO` 到 `@dailyuse/contracts/setting`
- [ ] 检查并迁移其他缺失类型

### Story 8: 创建 Hooks/Composables 层

- **估时**: 5 SP
- **优先级**: P1
- **依赖**: Story 7

**任务**:
- [ ] 创建 `modules/*/presentation/hooks/` 目录结构
- [ ] 为每个模块创建 `useXxxActions.ts`
- [ ] 迁移 Store 中的 IPC 调用逻辑到 Hooks

### Story 9: 重构 Stores（移除 Container 依赖）

- **估时**: 5 SP
- **优先级**: P1
- **依赖**: Story 8

**任务**:
- [ ] 移除 Store 中的 Container 导入
- [ ] 移除本地类型别名
- [ ] Store 仅保留状态管理逻辑
- [ ] 验证所有模块 typecheck 通过

### Story 10: 提取 Editor 模块到 Packages

- **估时**: 3 SP
- **优先级**: P2
- **依赖**: 无

**任务**:
- [ ] 添加 Editor IPC Adapter 到 `@dailyuse/infrastructure-client`
- [ ] 添加 Editor Container 到 `@dailyuse/infrastructure-client`
- [ ] 添加 Editor Use Cases 到 `@dailyuse/application-client`
- [ ] 添加 Editor DTOs 到 `@dailyuse/contracts`
- [ ] 删除 Desktop 本地 Editor IPC Client

---

## 相关文档

- [EPIC-016: Schedule 模块优化](./EPIC-016-schedule-module-optimization.md)
- [STORY-003: Renderer Process DI Integration](./stories/STORY-003-renderer-process-di-integration.md)

---

## 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-01-07 | 1.0 | 初始版本 |
| 2026-01-07 | 1.1 | 添加架构问题发现、架构原则、新增 Story 7-10 |
