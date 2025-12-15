# Story 13.4: IPC 通道类型定义

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.4 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P0 (Critical) |
| 复杂度 | Low |
| 预估工时 | 3h |
| 状态 | Backlog |

## 目标

建立完整的 IPC 通道类型定义，确保 Main Process 和 Renderer Process 之间的类型安全。

## 背景

当前问题：
1. IPC 通道名称散落在各处，没有统一管理
2. Main 和 Renderer 端的类型定义可能不一致
3. 缺少请求/响应的类型约束

## 任务列表

- [ ] 1. 创建 IPC 通道名称常量文件
  - [ ] 按模块分组定义所有通道名称
  - [ ] 使用 TypeScript const assertion
- [ ] 2. 定义所有 IPC 请求/响应类型
  - [ ] 复用 `@dailyuse/contracts` 中的 DTO 类型
  - [ ] 定义特定于 Desktop 的扩展类型
- [ ] 3. 更新 `electron.d.ts` 类型定义
  - [ ] 添加所有 IPC 通道的类型签名
  - [ ] 确保 `window.electronAPI` 类型完整
- [ ] 4. 创建类型验证工具
  - [ ] 运行时类型检查（开发模式）

## 技术设计

### IPC 通道命名规范

```
{module}:{entity}:{action}[-{sub-action}]

示例:
- task:template:create
- task:template:get
- task:instance:list
- goal:update
- schedule:list-by-date
- repository:backup:create
- editor:document:save
- focus:session:start
```

### 目录结构

```
apps/desktop/src/shared/types/
├── ipc-channels.ts      # 通道名称常量
├── ipc-payloads.ts      # 请求/响应类型
└── index.ts             # 导出

apps/desktop/src/
├── electron.d.ts        # 更新 electronAPI 类型
```

### IPC 通道常量

```typescript
// ipc-channels.ts
export const IPC_CHANNELS = {
  // Task 模块
  TASK: {
    TEMPLATE: {
      CREATE: 'task:template:create',
      GET: 'task:template:get',
      LIST: 'task:template:list',
      UPDATE: 'task:template:update',
      DELETE: 'task:template:delete',
      ARCHIVE: 'task:template:archive',
      RESTORE: 'task:template:restore',
    },
    INSTANCE: {
      CREATE: 'task:instance:create',
      GET: 'task:instance:get',
      LIST: 'task:instance:list',
      COMPLETE: 'task:instance:complete',
      SKIP: 'task:instance:skip',
    },
    STATISTICS: {
      GET: 'task:statistics:get',
      GET_DASHBOARD: 'task:statistics:get-dashboard',
    },
  },
  
  // Goal 模块
  GOAL: {
    CREATE: 'goal:create',
    GET: 'goal:get',
    LIST: 'goal:list',
    UPDATE: 'goal:update',
    DELETE: 'goal:delete',
    // 专注功能
    FOCUS: {
      START: 'goal:focus:start',
      PAUSE: 'goal:focus:pause',
      RESUME: 'goal:focus:resume',
      STOP: 'goal:focus:stop',
      GET_STATUS: 'goal:focus:get-status',
      GET_STATISTICS: 'goal:focus:get-statistics',
      GET_HISTORY: 'goal:focus:get-history',
    },
  },
  
  // Schedule 模块
  SCHEDULE: {
    CREATE: 'schedule:create',
    GET: 'schedule:get',
    LIST: 'schedule:list',
    LIST_BY_DATE: 'schedule:list-by-date',
    UPDATE: 'schedule:update',
    DELETE: 'schedule:delete',
    CHECK_CONFLICT: 'schedule:check-conflict',
  },
  
  // ... 其他模块
} as const;

export type IPCChannel = typeof IPC_CHANNELS;
```

### IPC Payload 类型

```typescript
// ipc-payloads.ts
import type {
  TaskTemplateClientDTO,
  GoalClientDTO,
  ScheduleClientDTO,
  // ...
} from '@dailyuse/contracts';

// Task 模块类型
export interface TaskTemplateCreatePayload {
  accountUuid: string;
  input: CreateTaskTemplateInput;
}

export interface TaskTemplateCreateResult {
  template: TaskTemplateClientDTO;
}

// 类型映射
export interface IPCPayloadMap {
  [IPC_CHANNELS.TASK.TEMPLATE.CREATE]: {
    payload: TaskTemplateCreatePayload;
    result: TaskTemplateCreateResult;
  };
  [IPC_CHANNELS.TASK.TEMPLATE.GET]: {
    payload: { uuid: string };
    result: TaskTemplateClientDTO | null;
  };
  // ... 所有通道的类型映射
}
```

### electron.d.ts 更新

```typescript
// electron.d.ts
import type { IPCPayloadMap, IPC_CHANNELS } from './shared/types';

type ChannelKey = keyof IPCPayloadMap;

interface ElectronAPI {
  invoke<K extends ChannelKey>(
    channel: K,
    payload: IPCPayloadMap[K]['payload']
  ): Promise<IPCPayloadMap[K]['result']>;
  
  on<K extends ChannelKey>(
    channel: K,
    callback: (event: unknown, data: IPCPayloadMap[K]['result']) => void
  ): void;
  
  off(channel: string, callback: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

## 验收标准

- [ ] 所有现有 IPC 通道都有对应的类型定义
- [ ] TypeScript 编译无类型错误
- [ ] Main 和 Renderer 端使用相同的类型
- [ ] IDE 自动补全正常工作
- [ ] 新增通道时类型检查能捕获错误

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `apps/desktop/src/shared/types/ipc-channels.ts` | 新建 | 通道名称常量 |
| `apps/desktop/src/shared/types/ipc-payloads.ts` | 新建 | 请求/响应类型 |
| `apps/desktop/src/shared/types/index.ts` | 新建 | 导出 |
| `apps/desktop/src/electron.d.ts` | 更新 | electronAPI 类型 |

## 依赖关系

- **前置依赖**: Story 13.1 (IPC Client 基础架构)
- **后续依赖**: 所有模块 IPC Client 实现

## 风险与注意事项

1. **类型同步**: Main 和 Renderer 必须使用相同的类型定义
2. **向后兼容**: 修改现有通道类型时需要注意兼容性
3. **性能**: 类型检查不应影响运行时性能
