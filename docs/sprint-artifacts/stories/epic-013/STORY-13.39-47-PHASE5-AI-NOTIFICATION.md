# Stories 13.39-13.47: Phase 5 AI & 通知模块

## Story 13.39: AI 模块 IPC Client

| 属性 | 值 |
|------|-----|
| Story ID | 13.39 |
| 优先级 | P1 (High) |
| 预估工时 | 6h |

### 目标
为 AI 模块创建 IPC Client，支持智能建议和自然语言处理。

### 任务列表
- [ ] AIAssistantIPCClient 实现
- [ ] 任务建议
- [ ] 日程建议
- [ ] 自然语言输入解析
- [ ] DI 配置

### 技术设计

```typescript
export class AIAssistantIPCClient extends BaseIPCClient {
  async getSuggestions(context: AIContext): Promise<AISuggestion[]> {
    return this.invoke(IPC_CHANNELS.AI.GET_SUGGESTIONS, context);
  }

  async parseNaturalLanguage(input: string): Promise<ParsedInput> {
    return this.invoke(IPC_CHANNELS.AI.PARSE_NL, { input });
  }

  async generateTaskFromText(text: string): Promise<TaskSuggestion> {
    return this.invoke(IPC_CHANNELS.AI.GENERATE_TASK, { text });
  }

  async getSmartSchedule(tasks: string[]): Promise<ScheduleSuggestion[]> {
    return this.invoke(IPC_CHANNELS.AI.SMART_SCHEDULE, { tasks });
  }
}
```

---

## Story 13.40: AI Store & 智能助手 UI

| 属性 | 值 |
|------|-----|
| Story ID | 13.40 |
| 优先级 | P1 (High) |
| 预估工时 | 5h |

### 目标
创建 AI Store 和智能助手 UI。

### 任务列表
- [ ] AI Store 实现
- [ ] 智能建议面板
- [ ] 命令输入框
- [ ] 建议卡片组件

---

## Story 13.41: AI 上下文感知

| 属性 | 值 |
|------|-----|
| Story ID | 13.41 |
| 优先级 | P2 (Medium) |
| 预估工时 | 4h |

### 目标
实现 AI 的上下文感知功能。

### 任务列表
- [ ] 用户习惯学习
- [ ] 时间上下文
- [ ] 任务关联分析
- [ ] 优先级建议

---

## Story 13.42: AI 快捷操作

| 属性 | 值 |
|------|-----|
| Story ID | 13.42 |
| 优先级 | P2 (Medium) |
| 预估工时 | 3h |

### 目标
实现 AI 驱动的快捷操作。

### 任务列表
- [ ] 快速创建任务
- [ ] 批量操作建议
- [ ] 智能搜索
- [ ] 语音输入（预留）

---

## Story 13.43: Notification 模块 IPC Client

| 属性 | 值 |
|------|-----|
| Story ID | 13.43 |
| 优先级 | P0 (Critical) |
| 预估工时 | 4h |

### 目标
为 Notification 模块创建 IPC Client。

### 任务列表
- [ ] NotificationIPCClient 实现
- [ ] 系统通知发送
- [ ] 通知历史
- [ ] 通知设置
- [ ] DI 配置

### 技术设计

```typescript
export class NotificationIPCClient extends BaseIPCClient {
  async send(notification: NotificationInput): Promise<void> {
    return this.invoke(IPC_CHANNELS.NOTIFICATION.SEND, notification);
  }

  async getHistory(filter?: NotificationFilter): Promise<NotificationDTO[]> {
    return this.invoke(IPC_CHANNELS.NOTIFICATION.HISTORY, filter);
  }

  async markAsRead(uuid: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.NOTIFICATION.MARK_READ, { uuid });
  }

  async clearAll(): Promise<void> {
    return this.invoke(IPC_CHANNELS.NOTIFICATION.CLEAR_ALL);
  }

  // 订阅新通知
  onNotification(callback: (notification: NotificationDTO) => void): () => void {
    const handler = (_: any, n: NotificationDTO) => callback(n);
    window.electronAPI.on(IPC_CHANNELS.NOTIFICATION.NEW, handler);
    return () => window.electronAPI.off(IPC_CHANNELS.NOTIFICATION.NEW, handler);
  }
}
```

---

## Story 13.44: Notification Store & 通知中心

| 属性 | 值 |
|------|-----|
| Story ID | 13.44 |
| 优先级 | P0 (Critical) |
| 预估工时 | 4h |

### 目标
创建 Notification Store 和通知中心 UI。

### 任务列表
- [ ] Store 实现
- [ ] 通知中心面板
- [ ] 通知列表组件
- [ ] 通知 Toast 组件

---

## Story 13.45: Notification 系统集成

| 属性 | 值 |
|------|-----|
| Story ID | 13.45 |
| 优先级 | P1 (High) |
| 预估工时 | 4h |

### 目标
深度集成系统通知功能。

### 任务列表
- [ ] macOS 通知中心集成
- [ ] Windows 通知中心集成
- [ ] Linux 通知集成
- [ ] 通知动作处理

---

## Story 13.46: Notification 勿扰模式

| 属性 | 值 |
|------|-----|
| Story ID | 13.46 |
| 优先级 | P2 (Medium) |
| 预估工时 | 3h |

### 目标
实现勿扰模式功能。

### 任务列表
- [ ] 勿扰模式开关
- [ ] 定时勿扰
- [ ] 专注时自动勿扰
- [ ] 重要通知例外

---

## Story 13.47: Notification 声音 & 徽章

| 属性 | 值 |
|------|-----|
| Story ID | 13.47 |
| 优先级 | P2 (Medium) |
| 预估工时 | 2h |

### 目标
实现通知声音和应用徽章。

### 任务列表
- [ ] 自定义通知声音
- [ ] 应用图标徽章数字
- [ ] 不同类型不同声音
- [ ] 声音设置
