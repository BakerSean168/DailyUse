---
tags:
  - schedule
  - quick-guide
  - event-driven
description: 统一调度事件系统快速实施指南
created: 2025-11-23T14:54:12
updated: 2025-11-23T14:54:12
---

# 统一调度事件系统 - 快速实施指南

## ✅ 已完成的工作

### 1. 核心事件定义 ✅
- **文件**：`packages/contracts/src/modules/common/schedule-lifecycle-events.ts`
- **内容**：
  - 通用的 `EntityScheduleLifecyclePayload` 接口
  - 5 种生命周期事件类型（created、paused、resumed、deleted、schedule_changed）
  - 辅助函数（buildScheduleEventType、createScheduleLifecycleEvent 等）

### 2. Task 模块事件扩展 ✅
- **文件**：`packages/contracts/src/modules/task/events.ts`
- **新增事件**：
  - `TaskTemplatePausedEvent`: 模板暂停事件
  - `TaskTemplateResumedEvent`: 模板恢复/激活事件
  - `TaskTemplateScheduleChangedEvent`: 调度配置变更事件

### 3. Task 模块事件发布 ✅
- **文件**：`apps/api/src/modules/task/application/services/TaskTemplateApplicationService.ts`
- **修改**：
  - 导入 `eventBus`
  - `pauseTaskTemplate()` 发布 `task.template.paused` 事件
  - `activateTaskTemplate()` 发布 `task.template.resumed` 事件

### 4. Schedule 模块事件监听 ✅
- **文件**：`apps/api/src/modules/schedule/application/services/ScheduleEventPublisher.ts`
- **新增监听器**：
  - `task.template.paused` → 删除调度任务
  - `task.template.resumed` → 重新创建调度任务
  - 更新 `reset()` 方法中的事件列表

### 5. Contracts 导出配置 ✅
- **文件**：`packages/contracts/src/index.ts`
- **修改**：添加 `schedule-lifecycle-events` 导出

## 🎯 使用方法

### 场景 1：Task 模板暂停/恢复

**前端调用**：
```typescript
// 暂停任务模板
await taskTemplateApiClient.pauseTaskTemplate(templateUuid);
// ✅ 自动触发：
//    1. 模板状态 → PAUSED
//    2. 未完成实例 → SKIPPED
//    3. 提醒调度 → 删除
```

```typescript
// 激活任务模板
await taskTemplateApiClient.activateTaskTemplate(templateUuid);
// ✅ 自动触发：
//    1. 模板状态 → ACTIVE
//    2. 生成未来 100 天实例
//    3. 提醒调度 → 重新创建
```

**后端日志示例**：
```
[TaskTemplateApplicationService] 开始暂停模板: 每日晨跑
✅ [TaskTemplateApplicationService] 模板状态已更新为 PAUSED
[TaskTemplateApplicationService] 找到 5 个未完成实例，标记为 SKIPPED
✅ [TaskTemplateApplicationService] 已处理 5 个实例
📤 [TaskTemplateApplicationService] 已发布 task.template.paused 事件
⏸️  [ScheduleEventPublisher] 处理任务模板暂停: abc-123-xyz
✅ [ScheduleEventPublisher] Triggered deletion for tasks related to TASK abc-123-xyz
✅ [TaskTemplateApplicationService] 模板 "每日晨跑" 已暂停
```

### 场景 2：扩展到其他模块（示例：Goal）

**步骤 1：定义事件**

在 `packages/contracts/src/modules/goal/events.ts` 中添加：
```typescript
export interface GoalPausedEvent extends IUnifiedEvent {
  eventType: 'goal.paused';
  payload: {
    goalUuid: string;
    accountUuid: string;
    pausedAt: number;
    reason?: string;
  };
}

export interface GoalResumedEvent extends IUnifiedEvent {
  eventType: 'goal.resumed';
  payload: {
    goalUuid: string;
    goalTitle: string;
    accountUuid: string;
    resumedAt: number;
    goalData?: GoalServerDTO;
  };
}
```

**步骤 2：发布事件**

在 `GoalApplicationService` 中：
```typescript
import { eventBus } from '@dailyuse/utils';

async pauseGoal(uuid: string) {
  goal.pause();
  await this.goalRepository.save(goal);
  
  // 🔥 发布暂停事件
  await eventBus.publish({
    eventType: 'goal.paused',
    payload: {
      goalUuid: goal.uuid,
      accountUuid: goal.accountUuid,
      pausedAt: Date.now(),
      reason: '用户手动暂停',
    },
    timestamp: Date.now(),
  });
}

async activateGoal(uuid: string) {
  goal.activate();
  await this.goalRepository.save(goal);
  
  // 🔥 发布恢复事件
  await eventBus.publish({
    eventType: 'goal.resumed',
    payload: {
      goalUuid: goal.uuid,
      goalTitle: goal.title,
      accountUuid: goal.accountUuid,
      resumedAt: Date.now(),
      goalData: goal.toServerDTO(),
    },
    timestamp: Date.now(),
  });
}
```

**步骤 3：添加监听器**

在 `ScheduleEventPublisher.initialize()` 中添加：
```typescript
// 监听 Goal 暂停事件
eventBus.on('goal.paused', async (event: DomainEvent) => {
  try {
    if (!event.accountUuid) {
      console.error('❌ Missing accountUuid in goal.paused event');
      return;
    }
    const { goalUuid } = event.payload;
    console.log(`⏸️  [ScheduleEventPublisher] 处理目标暂停: ${goalUuid}`);
    await this.deleteTasksBySource(event.accountUuid, SourceModule.GOAL, goalUuid);
  } catch (error) {
    console.error('❌ Error handling goal.paused:', error);
  }
});

// 监听 Goal 恢复事件
eventBus.on('goal.resumed', async (event: DomainEvent) => {
  try {
    if (!event.accountUuid) {
      console.error('❌ Missing accountUuid in goal.resumed event');
      return;
    }
    const { goalData } = event.payload;
    if (!goalData) {
      console.error('❌ Missing goalData in event payload');
      return;
    }
    console.log(`▶️  [ScheduleEventPublisher] 处理目标恢复: ${goalData.uuid}`);
    await this.handleGoalCreated(event.accountUuid, goalData);
  } catch (error) {
    console.error('❌ Error handling goal.resumed:', error);
  }
});
```

**步骤 4：更新 reset() 方法**

在 `reset()` 方法的事件列表中添加：
```typescript
const eventTypes = [
  // Goal 模块事件
  'goal.created',
  'goal.deleted',
  'goal.paused',        // ✨ 新增
  'goal.resumed',       // ✨ 新增
  'goal.schedule_time_changed',
  'goal.reminder_config_changed',
  // ... 其他事件
];
```

## 🧪 测试验证

### 手动测试

**1. 测试暂停功能**：
```bash
# 1. 创建一个测试任务模板（确保启用提醒）
# 2. 查看数据库中的 ScheduleTask
SELECT * FROM "ScheduleTask" WHERE "sourceEntityId" = '你的模板UUID';

# 3. 调用暂停接口
curl -X PATCH http://localhost:3000/api/task-templates/{uuid}/pause \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. 再次查看数据库，ScheduleTask 应该已删除
SELECT * FROM "ScheduleTask" WHERE "sourceEntityId" = '你的模板UUID';
# 预期：0 rows

# 5. 查看任务实例状态
SELECT status FROM "TaskInstance" WHERE "templateUuid" = '你的模板UUID' AND status = 'PENDING';
# 预期：所有 PENDING 实例已变为 SKIPPED
```

**2. 测试恢复功能**：
```bash
# 1. 调用激活接口
curl -X PATCH http://localhost:3000/api/task-templates/{uuid}/activate \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. 查看数据库，ScheduleTask 应该重新创建
SELECT * FROM "ScheduleTask" WHERE "sourceEntityId" = '你的模板UUID';
# 预期：至少 1 row

# 3. 查看任务实例
SELECT COUNT(*) FROM "TaskInstance" WHERE "templateUuid" = '你的模板UUID' AND status = 'PENDING';
# 预期：有新生成的实例（最多 100 个）
```

### 集成测试示例

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TaskTemplateApplicationService } from './TaskTemplateApplicationService';
import { ScheduleApplicationService } from '../../../schedule/application/services/ScheduleApplicationService';

describe('TaskTemplate Pause/Resume with Schedule Integration', () => {
  let taskService: TaskTemplateApplicationService;
  let scheduleService: ScheduleApplicationService;
  let templateUuid: string;
  let accountUuid: string;

  beforeEach(async () => {
    taskService = await TaskTemplateApplicationService.getInstance();
    scheduleService = await ScheduleApplicationService.getInstance();
    
    // 创建测试模板
    const template = await taskService.createTaskTemplate({
      accountUuid: 'test-account',
      title: '测试任务',
      taskType: 'RECURRING',
      timeConfig: { /* ... */ },
      recurrenceRule: { /* ... */ },
      reminderConfig: { enabled: true, /* ... */ },
    });
    templateUuid = template.uuid;
    accountUuid = template.accountUuid;
  });

  it('should delete schedule tasks when template is paused', async () => {
    // 验证初始状态有调度任务
    const beforePause = await scheduleService.getScheduleTasksBySource(
      'TASK',
      templateUuid,
      accountUuid
    );
    expect(beforePause.length).toBeGreaterThan(0);

    // 暂停模板
    await taskService.pauseTaskTemplate(templateUuid);

    // 等待事件处理（异步）
    await new Promise(resolve => setTimeout(resolve, 100));

    // 验证调度任务已删除
    const afterPause = await scheduleService.getScheduleTasksBySource(
      'TASK',
      templateUuid,
      accountUuid
    );
    expect(afterPause.length).toBe(0);
  });

  it('should recreate schedule tasks when template is resumed', async () => {
    // 先暂停
    await taskService.pauseTaskTemplate(templateUuid);
    await new Promise(resolve => setTimeout(resolve, 100));

    // 验证暂停后无调度任务
    const afterPause = await scheduleService.getScheduleTasksBySource(
      'TASK',
      templateUuid,
      accountUuid
    );
    expect(afterPause.length).toBe(0);

    // 激活模板
    await taskService.activateTaskTemplate(templateUuid);
    await new Promise(resolve => setTimeout(resolve, 100));

    // 验证调度任务已重新创建
    const afterResume = await scheduleService.getScheduleTasksBySource(
      'TASK',
      templateUuid,
      accountUuid
    );
    expect(afterResume.length).toBeGreaterThan(0);
  });
});
```

## 📋 检查清单

在完成实施后，请检查以下项目：

### 代码检查
- [ ] 事件定义已添加到 `contracts/modules/{module}/events.ts`
- [ ] 事件已导出到 `contracts/index.ts`
- [ ] ApplicationService 中正确发布事件
- [ ] ScheduleEventPublisher 中添加了监听器
- [ ] reset() 方法中包含新事件类型

### 功能测试
- [ ] 暂停功能正常（调度任务已删除）
- [ ] 恢复功能正常（调度任务重新创建）
- [ ] 日志输出清晰（包含 📤、⏸️、▶️ 等标识）
- [ ] 数据库状态正确（ScheduleTask 表）
- [ ] 错误处理正常（异常不影响主业务流程）

### 性能检查
- [ ] 事件发布不阻塞主流程（使用异步）
- [ ] 批量操作使用事务（避免部分成功）
- [ ] 无重复创建/删除调度任务
- [ ] 日志输出不过度（避免影响性能）

## 🐛 常见问题

### Q1: 事件发布了但没有触发监听器？
**A**: 检查 ScheduleEventPublisher 是否已初始化。在 `apps/api/src/main.ts` 中应该有：
```typescript
await ScheduleEventPublisher.initialize();
```

### Q2: 暂停后调度任务没有删除？
**A**: 检查：
1. 事件 payload 中是否包含正确的 `accountUuid`
2. `deleteTasksBySource()` 方法是否正确执行
3. 数据库中 ScheduleTask 的 `sourceModule` 和 `sourceEntityId` 字段是否正确

### Q3: 恢复时调度任务创建失败？
**A**: 检查：
1. 事件 payload 中是否包含完整的实体数据（`taskTemplateData`、`goalData` 等）
2. ScheduleStrategy 是否支持该实体类型
3. 实体是否满足调度创建条件（如启用提醒）

### Q4: 日志中显示事件发布失败？
**A**: 这通常不会影响主业务流程，但需要检查：
1. EventBus 是否正常初始化
2. 事件 payload 是否符合接口定义
3. 网络或数据库是否有问题

## 📚 相关文档

- [完整设计文档](./UNIFIED_SCHEDULE_EVENT_SYSTEM.md)
- [任务模板暂停/恢复功能增强](./TASK_TEMPLATE_PAUSE_RESUME_ENHANCEMENT.md)
- [事件总线使用指南](packages/utils/src/domain/eventBus.ts)

---

**快速链接**：
- 通用事件定义：`packages/contracts/src/modules/common/schedule-lifecycle-events.ts`
- Task 事件定义：`packages/contracts/src/modules/task/events.ts`
- Task 应用服务：`apps/api/src/modules/task/application/services/TaskTemplateApplicationService.ts`
- Schedule 事件发布器：`apps/api/src/modules/schedule/application/services/ScheduleEventPublisher.ts`

**版本**：v1.0  
**最后更新**：2025-11-16
