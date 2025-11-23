---
tags:
  - concepts
  - event-driven
  - architecture
  - messaging
description: 事件驱动架构设计模式与实践指南
created: 2025-11-23T15:00:00
updated: 2025-11-23T15:00:00
---

# 📡 事件驱动架构

事件驱动架构 (Event-Driven Architecture, EDA) 的设计模式、实现方式和最佳实践。

## 📚 目录

- [核心概念](#核心概念)
- [事件类型](#事件类型)
- [实现方式](#实现方式)
- [事件设计](#事件设计)
- [最佳实践](#最佳实践)

---

## 🎯 核心概念

### 什么是事件驱动架构？

事件驱动架构是一种软件架构模式，系统的行为由**事件**触发和驱动。

```
发布者 ──(发布事件)──> 事件总线 ──(分发)──> 订阅者1
                                        └──> 订阅者2
                                        └──> 订阅者3
```

### 核心组件

#### 1. 事件 (Event)

系统中发生的重要状态变化。

```typescript
interface DomainEvent<T = any> {
  type: string;              // 事件类型
  payload: T;                // 事件数据
  metadata: {
    timestamp: Date;         // 时间戳
    correlationId: string;   // 关联ID
    userId?: string;         // 触发用户
    source: string;          // 事件源
  };
}
```

#### 2. 发布者 (Publisher)

发布事件的组件。

```typescript
class GoalService {
  async completeGoal(uuid: string): Promise<void> {
    const goal = await this.repository.findById(uuid);
    goal.complete();
    await this.repository.save(goal);

    // 发布事件
    await this.eventBus.publish({
      type: 'goal.completed',
      payload: { goalUuid: uuid, completedAt: new Date() }
    });
  }
}
```

#### 3. 订阅者 (Subscriber)

监听并处理事件的组件。

```typescript
class NotificationListener {
  @OnEvent('goal.completed')
  async handleGoalCompleted(event: GoalCompletedEvent): Promise<void> {
    await this.notificationService.create({
      type: 'goal_completed',
      message: '🎉 目标完成！'
    });
  }
}
```

#### 4. 事件总线 (Event Bus)

事件的中介，负责分发事件。

```typescript
interface IEventBus {
  publish<T>(event: DomainEvent<T>): Promise<void>;
  subscribe<T>(eventType: string, handler: EventHandler<T>): void;
}
```

---

## 🏷 事件类型

### 1. 领域事件 (Domain Events)

业务领域内发生的重要事件。

```typescript
// Goal 领域事件
export interface GoalCreatedEvent {
  type: 'goal.created';
  payload: {
    goalUuid: string;
    userId: string;
    title: string;
    deadline: Date;
  };
}

export interface GoalCompletedEvent {
  type: 'goal.completed';
  payload: {
    goalUuid: string;
    userId: string;
    completedAt: Date;
  };
}

export interface GoalDeadlineApproachingEvent {
  type: 'goal.deadline.approaching';
  payload: {
    goalUuid: string;
    userId: string;
    daysRemaining: number;
  };
}
```

### 2. 集成事件 (Integration Events)

跨系统或跨模块的事件。

```typescript
// 跨模块事件
export interface TaskCompletedEvent {
  type: 'task.completed';
  payload: {
    taskUuid: string;
    goalUuid?: string;  // 关联的目标
    userId: string;
  };
}

// 订阅者在 Goal 模块
@OnEvent('task.completed')
async handleTaskCompleted(event: TaskCompletedEvent): Promise<void> {
  if (event.payload.goalUuid) {
    // 更新目标进度
    await this.goalProgressService.recalculate(event.payload.goalUuid);
  }
}
```

### 3. 系统事件 (System Events)

技术层面的事件。

```typescript
export interface UserLoggedInEvent {
  type: 'user.logged_in';
  payload: {
    userId: string;
    loginAt: Date;
    ipAddress: string;
  };
}

export interface CacheInvalidatedEvent {
  type: 'cache.invalidated';
  payload: {
    key: string;
    reason: string;
  };
}
```

---

## 🔧 实现方式

### 1. 内存事件总线 (NestJS EventEmitter)

**用途**: 单进程内模块间通信

```typescript
// 发布事件
@Injectable()
export class GoalService {
  constructor(private eventEmitter: EventEmitter2) {}

  async completeGoal(uuid: string): Promise<void> {
    // 业务逻辑
    const goal = await this.repository.findById(uuid);
    goal.complete();
    await this.repository.save(goal);

    // 发布事件
    this.eventEmitter.emit('goal.completed', {
      type: 'goal.completed',
      payload: { goalUuid: uuid, completedAt: new Date() },
      metadata: { timestamp: new Date(), correlationId: uuid() }
    });
  }
}

// 订阅事件
@Injectable()
export class GoalEventListener {
  @OnEvent('goal.completed')
  async handleGoalCompleted(event: GoalCompletedEvent): Promise<void> {
    console.log('Goal completed:', event.payload.goalUuid);
    // 处理逻辑
  }

  @OnEvent('goal.completed', { async: true })
  async handleGoalCompletedAsync(event: GoalCompletedEvent): Promise<void> {
    // 异步处理
    await this.notificationService.send(event);
  }
}
```

**优点**:
- ✅ 零延迟
- ✅ 无需外部依赖
- ✅ 实现简单

**缺点**:
- ❌ 仅单进程
- ❌ 重启丢失
- ❌ 不支持分布式

### 2. Redis Pub/Sub

**用途**: 跨进程通信、分布式场景

```typescript
// 发布事件
@Injectable()
export class RedisEventPublisher {
  constructor(@InjectRedis() private redis: Redis) {}

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const channel = event.type;
    const message = JSON.stringify(event);
    await this.redis.publish(channel, message);
  }
}

// 订阅事件
@Injectable()
export class RedisEventSubscriber implements OnModuleInit {
  constructor(@InjectRedis() private redis: Redis) {}

  async onModuleInit() {
    await this.redis.subscribe('goal.completed', (message) => {
      const event = JSON.parse(message) as GoalCompletedEvent;
      this.handleGoalCompleted(event);
    });
  }

  private async handleGoalCompleted(event: GoalCompletedEvent): Promise<void> {
    // 处理事件
  }
}
```

**优点**:
- ✅ 跨进程通信
- ✅ 支持分布式
- ✅ 高性能
- ✅ 简单可靠

**缺点**:
- ❌ 需要 Redis
- ❌ 消息无序保证
- ❌ 无持久化（默认）

### 3. Server-Sent Events (SSE)

**用途**: 服务器推送到客户端

```typescript
// 服务端
@Controller('events')
export class EventsController {
  constructor(private sseService: SseService) {}

  @Sse('stream')
  stream(@Request() req): Observable<MessageEvent> {
    const userId = req.user.uuid;
    return this.sseService.subscribe(userId);
  }
}

@Injectable()
export class SseService {
  private subjects = new Map<string, Subject<MessageEvent>>();

  subscribe(userId: string): Observable<MessageEvent> {
    if (!this.subjects.has(userId)) {
      this.subjects.set(userId, new Subject());
    }
    return this.subjects.get(userId).asObservable();
  }

  @OnEvent('notification.new')
  handleNewNotification(event: NotificationNewEvent): void {
    const subject = this.subjects.get(event.payload.userId);
    if (subject) {
      subject.next({
        data: JSON.stringify(event),
        type: event.type
      } as MessageEvent);
    }
  }
}

// 客户端
const eventSource = new EventSource('/api/events/stream');

eventSource.addEventListener('notification.new', (event) => {
  const data = JSON.parse(event.data);
  showNotification(data);
});

eventSource.onerror = () => {
  // 自动重连
};
```

**优点**:
- ✅ 标准 Web API
- ✅ 自动重连
- ✅ 实现简单
- ✅ 适合实时推送

**缺点**:
- ❌ 仅单向（服务器→客户端）
- ❌ 不支持 IE
- ❌ 连接数限制（6个/域名）

---

## 🎨 事件设计

### 事件命名规范 {#event-naming}

遵循统一格式：`{module}.{entity}.{action}`

**格式说明**:
- `module`: 模块名称（goal, task, reminder）
- `entity`: 实体名称（可选，如 deadline）
- `action`: 动作（过去式）

**示例**:
```typescript
// ✅ 好的命名
'goal.created'                    // 目标创建
'goal.completed'                  // 目标完成
'goal.deadline.approaching'       // 截止日期临近
'task.assigned'                   // 任务分配
'reminder.triggered'              // 提醒触发
'notification.sent'               // 通知已发送

// ❌ 不好的命名
'createGoal'                      // 不是过去式
'goal_completed'                  // 使用下划线
'goalCompleted'                   // 驼峰命名
'completed'                       // 缺少模块前缀
```

### 事件结构设计

#### 最小信息原则

事件应该只包含必要信息，避免冗余数据。

```typescript
// ✅ 好的事件 - 只传 ID
interface GoalCompletedEvent {
  type: 'goal.completed';
  payload: {
    goalUuid: string;          // 只传 ID
    userId: string;
    completedAt: Date;
  };
}

// ❌ 不好的事件 - 传递完整对象
interface GoalCompletedEvent {
  type: 'goal.completed';
  payload: {
    goal: {                    // 传递完整对象
      uuid: string;
      title: string;
      description: string;
      keyResults: KeyResult[];
      // ...更多字段
    };
  };
}
```

#### 元数据包含

所有事件都应包含标准元数据。

```typescript
interface DomainEvent<T> {
  type: string;
  payload: T;
  metadata: {
    timestamp: Date;           // 事件时间
    correlationId: string;     // 关联ID（追踪）
    causationId?: string;      // 因果ID（哪个事件触发）
    userId?: string;           // 触发用户
    source: string;            // 事件源（模块/服务）
    version: string;           // 事件版本
  };
}
```

#### 版本化

支持事件结构演进。

```typescript
// v1
interface GoalCompletedEventV1 {
  type: 'goal.completed';
  version: 'v1';
  payload: {
    goalUuid: string;
    completedAt: Date;
  };
}

// v2 - 添加新字段
interface GoalCompletedEventV2 {
  type: 'goal.completed';
  version: 'v2';
  payload: {
    goalUuid: string;
    completedAt: Date;
    progress: number;          // 新增字段
    achievementLevel: string;  // 新增字段
  };
}

// 处理器兼容两个版本
@OnEvent('goal.completed')
handleGoalCompleted(event: GoalCompletedEventV1 | GoalCompletedEventV2) {
  if (event.version === 'v2') {
    // 使用 v2 特性
  } else {
    // 向后兼容 v1
  }
}
```

---

## 💡 最佳实践

### 1. 幂等性

事件处理器应该是幂等的（多次执行结果相同）。

```typescript
// ✅ 幂等处理
@OnEvent('goal.completed')
async handleGoalCompleted(event: GoalCompletedEvent): Promise<void> {
  const notification = await this.repo.findByEventId(event.metadata.correlationId);
  
  // 检查是否已处理
  if (notification) {
    return; // 已处理，直接返回
  }

  // 创建通知
  await this.repo.create({
    eventId: event.metadata.correlationId,
    userId: event.payload.userId,
    message: '目标完成'
  });
}

// ❌ 非幂等处理
@OnEvent('goal.completed')
async handleGoalCompleted(event: GoalCompletedEvent): Promise<void> {
  // 每次都创建，重复执行会创建多个
  await this.repo.create({
    userId: event.payload.userId,
    message: '目标完成'
  });
}
```

### 2. 错误处理

事件处理失败应该有重试和补偿机制。

```typescript
@OnEvent('goal.completed')
async handleGoalCompleted(event: GoalCompletedEvent): Promise<void> {
  try {
    await this.notificationService.send(event);
  } catch (error) {
    // 记录失败
    await this.failedEventRepo.save({
      event,
      error: error.message,
      retryCount: 0
    });

    // 重新抛出，触发重试机制
    throw error;
  }
}

// 定时重试失败事件
@Cron('*/5 * * * *')  // 每5分钟
async retryFailedEvents(): Promise<void> {
  const failedEvents = await this.failedEventRepo.findPending();
  
  for (const failed of failedEvents) {
    if (failed.retryCount < 3) {
      try {
        await this.eventBus.publish(failed.event);
        await this.failedEventRepo.markAsSuccess(failed.id);
      } catch (error) {
        await this.failedEventRepo.incrementRetry(failed.id);
      }
    } else {
      // 超过重试次数，移入死信队列
      await this.deadLetterQueue.add(failed);
    }
  }
}
```

### 3. 事件追踪

使用 `correlationId` 追踪事件链。

```typescript
// 初始事件
const correlationId = uuid();
await this.eventBus.publish({
  type: 'goal.created',
  payload: { goalUuid: '...' },
  metadata: { correlationId }
});

// 后续事件继承 correlationId
@OnEvent('goal.created')
async handleGoalCreated(event: GoalCreatedEvent): Promise<void> {
  await this.eventBus.publish({
    type: 'notification.sent',
    payload: { message: '新目标创建' },
    metadata: {
      correlationId: event.metadata.correlationId,  // 继承
      causationId: event.metadata.correlationId     // 因果关系
    }
  });
}

// 日志查询：搜索 correlationId 查看完整事件链
// 2024-01-01 10:00:00 [goal.created] correlationId=abc123
// 2024-01-01 10:00:01 [notification.sent] correlationId=abc123 causationId=abc123
```

### 4. 事件日志

记录所有事件用于审计和调试。

```typescript
@Injectable()
export class EventLogger {
  @OnEvent('**')  // 监听所有事件
  async logEvent(event: DomainEvent): Promise<void> {
    await this.eventLogRepo.save({
      type: event.type,
      payload: event.payload,
      metadata: event.metadata,
      timestamp: new Date()
    });
  }
}
```

### 5. 避免循环依赖

事件不应该形成循环。

```typescript
// ❌ 循环依赖
// A 发布事件 → B 监听 → B 发布事件 → A 监听 → ...

// ✅ 单向事件流
// Goal → Notification
// Task → Reminder → Notification
```

---

## 📊 事件监控

### 关键指标

1. **事件发布量** - 每秒/分钟发布的事件数
2. **事件处理延迟** - 从发布到处理完成的时间
3. **失败率** - 事件处理失败的比例
4. **重试次数** - 事件重试的次数

### 监控实现

```typescript
@Injectable()
export class EventMetrics {
  constructor(private metrics: MetricsService) {}

  @OnEvent('**')
  async trackEvent(event: DomainEvent): Promise<void> {
    // 记录事件发布
    this.metrics.increment('events.published', {
      type: event.type,
      source: event.metadata.source
    });

    // 记录处理时间
    const startTime = Date.now();
    try {
      await this.processEvent(event);
      const duration = Date.now() - startTime;
      this.metrics.histogram('events.processing_time', duration, {
        type: event.type
      });
    } catch (error) {
      this.metrics.increment('events.failed', {
        type: event.type,
        error: error.name
      });
    }
  }
}
```

---

## 📚 相关文档

- [[../architecture/adr/003-event-driven-architecture|ADR-003: 事件驱动架构]]
- [[ddd-patterns|DDD 模式指南]]
- [[../architecture/integration-architecture|集成架构]]

## 📖 延伸阅读

- [Event-Driven Architecture (Martin Fowler)](https://martinfowler.com/articles/201701-event-driven.html)
- [Domain Events (Vaughn Vernon)](https://vaughnvernon.com/domain-events/)
- [NestJS Events](https://docs.nestjs.com/techniques/events)

---

**提示**: 事件驱动不是为了炫技，而是为了解耦。简单场景直接调用即可，复杂场景使用事件。