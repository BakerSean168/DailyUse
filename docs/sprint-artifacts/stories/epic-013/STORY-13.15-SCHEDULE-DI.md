# Story 13.15: Schedule DI Container

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.15 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P1 (High) |
| 复杂度 | Low |
| 预估工时 | 2h |
| 状态 | Backlog |

## 目标

为 Schedule 模块创建 DI 容器配置。

## 任务列表

- [ ] 1. 创建 `renderer/modules/schedule/di/` 目录
- [ ] 2. 定义 Token
- [ ] 3. 实现 `registerScheduleModule()`
- [ ] 4. 集成到 RendererContainer

## 技术设计

### Token 定义

```typescript
// renderer/modules/schedule/di/tokens.ts
export const SCHEDULE_TOKENS = {
  SCHEDULE_IPC_CLIENT: Symbol('ScheduleIPCClient'),
  TIME_BLOCK_IPC_CLIENT: Symbol('TimeBlockIPCClient'),
  RECURRENCE_IPC_CLIENT: Symbol('RecurrenceIPCClient'),
} as const;
```

### 注册函数

```typescript
// renderer/modules/schedule/di/register.ts
import { Container } from '@/shared/infrastructure/di';
import { SCHEDULE_TOKENS } from './tokens';
import { 
  ScheduleIPCClient,
  TimeBlockIPCClient,
  RecurrenceIPCClient,
} from '../infrastructure/ipc';

export function registerScheduleModule(container: Container): void {
  container.registerSingleton(
    SCHEDULE_TOKENS.SCHEDULE_IPC_CLIENT,
    () => new ScheduleIPCClient()
  );
  
  container.registerSingleton(
    SCHEDULE_TOKENS.TIME_BLOCK_IPC_CLIENT,
    () => new TimeBlockIPCClient()
  );
  
  container.registerSingleton(
    SCHEDULE_TOKENS.RECURRENCE_IPC_CLIENT,
    () => new RecurrenceIPCClient()
  );
}
```

## 验收标准

- [ ] Token 定义完整
- [ ] 注册函数正确
- [ ] 集成到 RendererContainer

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/schedule/di/tokens.ts` | 新建 | Token 定义 |
| `renderer/modules/schedule/di/register.ts` | 新建 | 注册函数 |
| `renderer/modules/schedule/di/index.ts` | 新建 | 导出 |

## 依赖关系

- **前置依赖**: Story 13.14 (Schedule IPC Client)
- **后续依赖**: Story 13.16 (Schedule Store)
