# Story 13.17: Reminder 模块 IPC Client & DI

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.17 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P1 (High) |
| 复杂度 | Medium |
| 预估工时 | 4h |
| 状态 | Backlog |

## 目标

为 Reminder 模块创建 IPC Client 和 DI 配置，支持提醒创建、触发和系统通知集成。

## 背景

Reminder 模块负责管理用户设置的提醒，在桌面端需要与系统通知深度集成。

## 任务列表

- [ ] 1. 创建 IPC Client
  - [ ] `ReminderIPCClient` - 提醒管理
  - [ ] `ReminderNotificationIPCClient` - 通知集成
- [ ] 2. 创建 DI 配置
- [ ] 3. 添加系统通知监听
- [ ] 4. 添加单元测试

## 技术设计

### ReminderIPCClient

```typescript
// renderer/modules/reminder/infrastructure/ipc/reminder.ipc-client.ts
import { BaseIPCClient } from '@/shared/infrastructure/ipc';
import { IPC_CHANNELS } from '@/shared/types/ipc-channels';

export interface ReminderClientDTO {
  uuid: string;
  title: string;
  description?: string;
  triggerTime: string;
  repeatPattern?: RepeatPattern;
  isEnabled: boolean;
  isTriggered: boolean;
  linkedTaskUuid?: string;
  linkedScheduleUuid?: string;
  createdAt: string;
}

export class ReminderIPCClient extends BaseIPCClient {
  async create(input: CreateReminderInput): Promise<ReminderClientDTO> {
    return this.invoke(IPC_CHANNELS.REMINDER.CREATE, input);
  }

  async get(uuid: string): Promise<ReminderClientDTO | null> {
    return this.invoke(IPC_CHANNELS.REMINDER.GET, { uuid });
  }

  async list(filter?: ListRemindersFilter): Promise<ReminderClientDTO[]> {
    return this.invoke(IPC_CHANNELS.REMINDER.LIST, filter);
  }

  async update(uuid: string, input: UpdateReminderInput): Promise<ReminderClientDTO> {
    return this.invoke(IPC_CHANNELS.REMINDER.UPDATE, { uuid, ...input });
  }

  async delete(uuid: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.REMINDER.DELETE, { uuid });
  }

  async snooze(uuid: string, duration: number): Promise<ReminderClientDTO> {
    return this.invoke(IPC_CHANNELS.REMINDER.SNOOZE, { uuid, duration });
  }

  async dismiss(uuid: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.REMINDER.DISMISS, { uuid });
  }

  async getUpcoming(limit?: number): Promise<ReminderClientDTO[]> {
    return this.invoke(IPC_CHANNELS.REMINDER.GET_UPCOMING, { limit });
  }

  // 订阅提醒触发事件
  onTrigger(callback: (reminder: ReminderClientDTO) => void): () => void {
    const handler = (_: any, reminder: ReminderClientDTO) => callback(reminder);
    window.electronAPI.on(IPC_CHANNELS.REMINDER.TRIGGERED, handler);
    return () => window.electronAPI.off(IPC_CHANNELS.REMINDER.TRIGGERED, handler);
  }
}
```

### DI 配置

```typescript
// renderer/modules/reminder/di/tokens.ts
export const REMINDER_TOKENS = {
  REMINDER_IPC_CLIENT: Symbol('ReminderIPCClient'),
} as const;

// renderer/modules/reminder/di/register.ts
export function registerReminderModule(container: Container): void {
  container.registerSingleton(
    REMINDER_TOKENS.REMINDER_IPC_CLIENT,
    () => new ReminderIPCClient()
  );
}
```

### IPC Channels

```typescript
REMINDER: {
  CREATE: 'reminder:create',
  GET: 'reminder:get',
  LIST: 'reminder:list',
  UPDATE: 'reminder:update',
  DELETE: 'reminder:delete',
  SNOOZE: 'reminder:snooze',
  DISMISS: 'reminder:dismiss',
  GET_UPCOMING: 'reminder:getUpcoming',
  TRIGGERED: 'reminder:triggered',  // 从主进程推送
}
```

## 验收标准

- [ ] IPC Client 完整实现
- [ ] DI 配置正确
- [ ] 提醒触发事件监听正常
- [ ] 单元测试覆盖率 > 80%

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/reminder/infrastructure/ipc/reminder.ipc-client.ts` | 新建 | IPC Client |
| `renderer/modules/reminder/di/tokens.ts` | 新建 | Token |
| `renderer/modules/reminder/di/register.ts` | 新建 | 注册函数 |

## 依赖关系

- **前置依赖**: Stories 13.1, 13.4
- **后续依赖**: Story 13.18 (Reminder Store)
