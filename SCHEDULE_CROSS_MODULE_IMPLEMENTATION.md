# Schedule 模块跨模块调度实现总结

## 🎯 架构设计

### 核心思路：策略工厂模式 + 领域服务

```
业务模块 (Goal/Task/Reminder)
    ↓ 发布轻量级领域事件 (goal.created)
ScheduleEventPublisher (监听器)
    ↓ 接收事件
ScheduleTaskFactory (领域服务)
    ↓ 查询完整实体数据
ScheduleStrategyFactory (策略工厂)
    ↓ 选择合适的策略
GoalScheduleStrategy (具体策略)
    ↓ 翻译业务规则 → cron + 调度配置
ScheduleTask 聚合根
    ↓ 创建调度任务
PrismaScheduleTaskRepository
    ↓ 持久化
```

## ✅ 已实现的组件

### 1. **IScheduleStrategy 接口**
文件: `packages/domain-server/src/schedule/services/strategies/IScheduleStrategy.ts`

定义：
- `supports(sourceModule)` - 判断是否支持该源模块
- `shouldCreateSchedule(sourceEntity)` - 判断是否需要创建调度
- `createSchedule(input)` - 生成调度配置
- `updateSchedule(existing, input)` - 更新调度配置

### 2. **GoalScheduleStrategy 实现**
文件: `packages/domain-server/src/schedule/services/strategies/GoalScheduleStrategy.ts`

功能：
- ✅ 从 Goal 的 `ReminderTrigger` 提取提醒配置
- ✅ 判断 Goal 是否需要调度（reminderConfig.enabled && 有活跃触发器）
- ✅ 生成 cron 表达式（简化版：每天 9:00 检查）
- ✅ 计算任务优先级（基于 importance + urgency）
- ✅ 生成任务标签（goal-reminder, importance:*, urgency:*等）
- ✅ 生成任务元数据（包含 goalUuid, triggers 等信息）

优势：
- **业务解耦**：Goal 模块不知道 cron 语法
- **单一职责**：策略只负责转换逻辑
- **易于扩展**：添加新触发器类型只需修改策略

### 3. **ScheduleStrategyFactory 工厂**
文件: `packages/domain-server/src/schedule/services/strategies/ScheduleStrategyFactory.ts`

功能：
- ✅ 管理所有策略实例
- ✅ 根据 SourceModule 选择合适的策略
- ✅ 支持自定义策略注册（用于测试）
- ✅ 单例模式

### 4. **ScheduleTaskFactory 领域服务**
文件: `packages/domain-server/src/schedule/services/ScheduleTaskFactory.ts`

功能：
- ✅ `createFromSourceEntity()` - 使用策略创建调度任务
- ✅ `createBatch()` - 批量创建调度任务
- ✅ `updateFromSourceEntity()` - 更新现有调度任务
- ✅ `supportsSourceModule()` - 判断是否支持源模块

职责：
- 协调策略工厂和聚合根创建
- 处理错误和异常情况
- 提供统一的任务创建接口

### 5. **ScheduleEventPublisher 更新**
文件: `apps/api/src/modules/schedule/application/services/ScheduleEventPublisher.ts`

新增功能：
- ✅ 使用 `ScheduleTaskFactory` 创建任务
- ✅ `handleGoalCreated()` - 完整的 Goal 创建处理流程
- ✅ `handleGoalDeleted()` - Goal 删除处理（TODO: 实现删除方法）
- ✅ 错误处理（区分正常情况和异常）

## 🔄 完整流程示例

### Goal 创建调度任务流程

```typescript
// 1. Goal 模块创建目标
const goal = Goal.create({
  title: "学习 DDD",
  reminderConfig: GoalReminderConfig.create({
    enabled: true,
    triggers: [
      { type: 'TIME_PROGRESS_PERCENTAGE', value: 50, enabled: true },
      { type: 'REMAINING_DAYS', value: 7, enabled: true }
    ]
  }),
  importance: 'important',
  urgency: 'high',
  ...
});

// 2. Goal 聚合根发布 goal.created 事件
eventBus.publish({
  eventType: 'goal.created',
  accountUuid: '...',
  aggregateId: goal.uuid,
  payload: { goal: goal.toServerDTO() }
});

// 3. ScheduleEventPublisher 监听到事件
eventBus.on('goal.created', async (event) => {
  // 4. 调用 handleGoalCreated
  const goal = event.payload.goal;
  
  // 5. 使用 ScheduleTaskFactory 创建任务
  const scheduleTask = taskFactory.createFromSourceEntity({
    accountUuid: event.accountUuid,
    sourceModule: 'GOAL',
    sourceEntityId: goal.uuid,
    sourceEntity: goal
  });
  
  // 6. Factory 内部使用策略
  // - ScheduleStrategyFactory.getStrategy('GOAL')
  // - GoalScheduleStrategy.shouldCreateSchedule(goal) -> true
  // - GoalScheduleStrategy.createSchedule(...) -> 生成配置
  
  // 7. 创建 ScheduleTask 聚合根
  // - cronExpression: '0 0 9 * * *' (每天 9:00)
  // - priority: 'HIGH' (important + high urgency)
  // - tags: ['goal-reminder', 'importance:important', 'urgency:high']
  // - metadata: { goalUuid, goalTitle, triggerTypes: [...] }
  
  // 8. 保存到数据库
  await scheduleService.createScheduleTask({
    accountUuid,
    name: 'Goal Reminder: 学习 DDD',
    sourceModule: 'GOAL',
    sourceEntityId: goal.uuid,
    schedule: { cronExpression: '0 0 9 * * *', ... },
    payload: { goalUuid, goalTitle, ... },
    tags: ['goal-reminder', ...]
  });
});
```

## 📦 模块导出

已更新 `packages/domain-server/src/schedule/services/index.ts`：
```typescript
export * from './ScheduleTaskFactory';
export * from './strategies/IScheduleStrategy';
export * from './strategies/GoalScheduleStrategy';
export * from './strategies/ScheduleStrategyFactory';
```

## 🚀 架构优势

### 1. **业务模块零耦合**
- Goal 模块只关心 ReminderTrigger（业务概念）
- 不知道 cron、调度、执行等实现细节
- 通过事件松耦合

### 2. **Schedule 模块拥有调度知识**
- 策略工厂是 Anti-Corruption Layer
- 负责翻译外部业务概念 → 内部调度概念
- 封装 cron 生成、优先级计算等复杂逻辑

### 3. **高度可测试**
- 每个策略可以单独测试
- Factory 可以注入 mock 策略
- EventPublisher 可以独立测试

### 4. **易于扩展**
- 添加新的触发器类型：修改 GoalScheduleStrategy
- 支持 Task 模块：添加 TaskScheduleStrategy
- 支持 Reminder 模块：添加 ReminderScheduleStrategy
- 支持新的源模块：实现 IScheduleStrategy 接口

### 5. **符合 DDD 原则**
- Schedule 是独立的限界上下文
- 策略工厂是防腐层（Anti-Corruption Layer）
- 领域服务协调聚合根创建
- 事件驱动的跨上下文集成

## ⏳ 待实现功能

### 1. Task 调度策略
```typescript
export class TaskScheduleStrategy implements IScheduleStrategy {
  // 从 Task 的重复配置创建调度
  // 支持每日、每周、每月重复
}
```

### 2. Reminder 调度策略
```typescript
export class ReminderScheduleStrategy implements IScheduleStrategy {
  // 从 Reminder 的时间配置创建调度
  // 一次性提醒 or 重复提醒
}
```

### 3. 更精细的 Cron 生成
```typescript
// 当前：每天 9:00 统一检查
// 改进：根据触发器类型生成具体时间点
// - TIME_PROGRESS_PERCENTAGE: 计算具体日期
// - REMAINING_DAYS: 目标日期前 N 天
```

### 4. 调度任务删除
```typescript
// ScheduleApplicationService 中添加
async deleteScheduleTasksBySource(
  sourceModule: SourceModule,
  sourceEntityId: string,
  accountUuid: string
): Promise<void>
```

### 5. 调度任务更新
```typescript
// 监听 goal.updated 事件
// 使用 ScheduleTaskFactory.updateFromSourceEntity()
// 更新现有调度任务
```

## 🎓 关键设计决策

### Q: 为什么不让 Goal 模块生成 cron？
**A**: 违反单一职责，Goal 模块不应该知道调度实现细节。

### Q: 为什么不在事件 payload 中传递 cron？
**A**: 事件应该轻量，只传递业务数据。调度配置是 Schedule 模块的职责。

### Q: 为什么需要查询完整实体数据？
**A**: 事件可能只包含部分数据，策略需要完整信息才能生成正确的调度配置。（当前简化实现直接从事件获取）

### Q: 策略工厂 vs 直接在 EventPublisher 中处理？
**A**: 策略模式更易测试、扩展和维护。EventPublisher 只负责监听和调用，不包含业务逻辑。

## ✨ 总结

这是一个基于 **策略模式 + 工厂模式 + 领域服务** 的优雅设计：

1. **业务模块保持纯粹**：只关心自己的业务概念
2. **Schedule 模块拥有调度知识**：通过策略封装转换逻辑
3. **松耦合通过事件**：跨模块集成无直接依赖
4. **高度可扩展**：添加新模块只需实现策略接口
5. **符合 DDD 最佳实践**：限界上下文、防腐层、领域服务

相比直接在业务模块生成 cron 的方案，这个设计：
- ✅ 职责更清晰
- ✅ 耦合度更低
- ✅ 扩展性更强
- ✅ 更易维护和测试
