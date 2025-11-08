# Reminder → Schedule 集成测试报告

## 测试文件位置
`/home/sean/my_program/DailyUse/apps/api/src/modules/schedule/application/services/__tests__/ReminderToScheduleIntegration.spec.ts`

## 测试目的
验证从创建 Reminder 到自动触发 ScheduleTask 创建的完整流程，包括：
1. 创建 ReminderTemplate
2. 发布领域事件 (`reminder.template.created`)
3. ScheduleEventPublisher 监听事件
4. 使用 ScheduleTaskFactory 创建 ScheduleTask
5. 保存 ScheduleTask 到数据库
6. 验证错误处理机制

## 测试执行结果

###  ✅ 成功部分

1. **测试数据库初始化**
   - 测试数据库成功启动并同步 schema
   - 事件总线初始化成功

2. **事件监听器注册**
   - ScheduleEventPublisher 成功注册所有事件监听器
   - 包括 17 个事件订阅:
     - `goal.created`, `goal.deleted`, `goal.schedule_time_changed`, `goal.reminder_config_changed`
     - `task_template.schedule_time_changed`, `task_template.recurrence_changed`
     - `task.created`, `task.deleted`
     - `reminder.template.created`, `reminder.template.updated`, `reminder.template.enabled`, `reminder.template.paused`, `reminder.template.deleted`
     - `schedule.task.created`, `schedule.task.execution_succeeded`, `schedule.task.execution_failed`, `schedule.task.completed`

3. **测试用例结构**
   - 6 个测试用例均已执行
   - 测试日志输出正常

### ❌ 失败问题

#### 问题 1: 外键约束错误
**错误信息：**
```
Foreign key constraint violated on the constraint: `reminder_templates_account_uuid_fkey`
```

**影响范围：** 3 个测试用例失败
- 成功流程：Reminder 创建触发 Schedule 任务创建
- 详细日志验证
- 端到端流程验证

**根本原因：**
- Account 表创建时缺少必需的 `password` 字段
- 导致 account 记录未能正确插入数据库
- reminderTemplate 创建时无法找到对应的 account

**解决方案：**
需要在测试的 `beforeAll` 中添加 `password` 字段：
```typescript
await prisma.account.upsert({
  where: { uuid: testAccountUuid },
  create: {
    uuid: testAccountUuid,
    username: 'integration_test_user',
    email: 'integration_test@example.com',
    password: 'test_hashed_password',  // ← 缺少此字段
    profile: JSON.stringify({ displayName: 'Integration Test User', avatar: null }),
    preferences: JSON.stringify({}),
    subscription: null,
    storage: JSON.stringify({}),
    security: JSON.stringify({}),
    stats: JSON.stringify({}),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  update: {},
});
```

#### 问题 2: 错误类缺少 `operationId` 属性
**错误信息：**
```
expected undefined to be 'test-operation-001' // Object.is equality
```

**影响范围：** 3 个错误处理测试用例失败
- 错误处理：调度策略不存在
- 错误处理：调度任务创建失败
- 错误处理：调度任务保存失败

**根本原因：**
从 `@dailyuse/domain-server` 导入的错误类可能不包含 `operationId` 属性

**当前错误类定义问题：**
```typescript
const strategyNotFoundError = new ScheduleStrategyNotFoundError(
  'UNKNOWN_MODULE' as any,
  'test-operation-001',  // ← 第二个参数可能不是 operationId
  { sourceModule: 'UNKNOWN_MODULE' }
);
```

**解决方案：**
需要检查并修复 `ScheduleStrategyNotFoundError`, `ScheduleTaskCreationError` 的构造函数签名，确保：
1. 接受 `operationId` 参数
2. 正确暴露 `operationId` 属性
3. 支持 `context` 对象

## 测试覆盖的错误处理

### 1. ScheduleStrategyNotFoundError
- **场景：** 找不到对应的调度策略
- **测试内容：** 验证错误类的实例化和属性
- **状态：** ❌ 失败 (operationId undefined)

### 2. ScheduleTaskCreationError
- **场景：** 创建调度任务失败
- **测试内容：** 验证错误消息和上下文
- **状态：** ❌ 失败 (operationId undefined)

### 3. 数据库保存错误
- **场景：** 调度任务保存到数据库失败
- **测试内容：** 使用 ScheduleTaskCreationError 模拟保存场景
- **状态：** ❌ 失败 (operationId undefined)

## 日志输出验证

测试包含详细的日志输出，用于跟踪整个流程：

```typescript
2025-11-08T02:58:30.012Z [INFO] [ReminderToScheduleIntegrationTest] 📝 Step 1: 创建 ReminderTemplate
2025-11-08T02:58:30.302Z [INFO] [ReminderToScheduleIntegrationTest] 🧪 Test: 模拟调度策略不存在的错误
2025-11-08T02:58:30.534Z [INFO] [ReminderToScheduleIntegrationTest] 🧪 Test: 模拟调度任务创建失败的错误
2025-11-08T02:58:30.744Z [INFO] [ReminderToScheduleIntegrationTest] 🧪 Test: 模拟调度任务保存失败的错误
2025-11-08T02:58:30.960Z [INFO] [ReminderToScheduleIntegrationTest] 🧪 Test: 验证详细日志输出
2025-11-08T02:58:31.176Z [INFO] [ReminderToScheduleIntegrationTest] 🧪 Test: 端到端流程验证
```

## 下一步行动

### 高优先级修复
1. ✅ **修复 Account 创建** - 添加缺失的 `password` 字段
2. 🔧 **修复错误类定义** - 确保 `operationId` 属性正确暴露

### 中优先级优化
3. 添加更多错误场景的测试
4. 增加事件发布过程的详细验证
5. 添加 metadata 序列化的专项测试

### 低优先级增强
6. 添加性能基准测试
7. 添加并发创建 Reminder 的测试
8. 添加事件总线失败重试的测试

## 测试环境

- **数据库：** PostgreSQL (localhost:5433/dailyuse_test)
- **测试框架：** Vitest 3.2.4
- **测试时长：** ~5.73s (包含数据库初始化)
- **测试文件数：** 1
- **测试用例数：** 6 (6 failed)

## 结论

测试框架和基础设施已经就绪，事件监听机制正常工作。主要问题集中在：
1. 测试数据准备不完整（缺少 password 字段）
2. 错误类定义与测试期望不匹配

这些都是可以快速修复的问题。修复后，测试应该能够正常通过并提供完整的集成流程验证。
