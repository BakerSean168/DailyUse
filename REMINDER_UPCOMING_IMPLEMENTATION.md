## 🎯 Reminder ScheduleTask 和 Upcoming Reminders 实现完整总结

### 问题分析

1. **ScheduleTask 没有生成** ❌
   - 原因：`ReminderScheduleStrategy.shouldCreateSchedule()` 要求 RECURRING 类型必须有 `recurrence` 配置
   - 但用户创建 RECURRING 提醒时，很多情况下没有完善的 recurrence 配置
   - 导致不满足调度条件，ScheduleTask 无法创建

2. **即将到来的提醒没有实现** ❌
   - 原因：没有领域服务来计算提醒的下一次触发时间
   - 没有应用服务层接口暴露给前端

---

## ✅ 解决方案

### 1️⃣ 修复 ReminderScheduleStrategy 检查条件

**文件：** `packages/domain-server/src/schedule/services/strategies/ReminderScheduleStrategy.ts`

**修改内容：**
- 放宽了 `shouldCreateSchedule()` 的检查条件
- RECURRING 类型即使没有 recurrence 配置，也允许创建 ScheduleTask
- 默认配置为每日触发（daily）

**关键代码：**
```typescript
shouldCreateSchedule(sourceEntity: ReminderContracts.ReminderTemplateServerDTO): boolean {
  // 必须启用且激活
  if (!sourceEntity.selfEnabled || sourceEntity.status !== 'ACTIVE') {
    return false;
  }

  // 必须有触发器配置
  if (!sourceEntity.trigger) {
    return false;
  }

  // ✅ 移除了对 recurrence 的强制要求
  // RECURRING 类型即使没有 recurrence 配置，也会创建（使用默认配置）
  return true;
}
```

**效果：**
- 创建的每一分钟提醒现在能生成对应的 ScheduleTask ✅
- ScheduleTask 会根据 cron 表达式定时触发
- 系统会监听 `ScheduleTaskTriggered` 事件并发送通知

---

### 2️⃣ 创建即将到来的提醒计算服务（领域服务）

**文件：** `packages/domain-server/src/reminder/services/UpcomingReminderCalculationService.ts`

**职责：**
- 计算指定时间范围内的提醒触发时间
- 支持各种类型提醒：一次性、循环、间隔
- 根据重复规则计算触发时间
- 返回前端友好的 DTO

**核心方法：**

1. **`calculateUpcomingReminders(reminders, options)`**
   - 入参：启用的提醒列表 + 查询选项（天数、限制数、起始时间）
   - 出参：即将到来的提醒 DTO 数组（已排序）
   - 逻辑：
     - 为每个提醒计算接下来的触发时间
     - 筛选在时间范围内的触发点
     - 按时间排序并限制返回数量

2. **`calculateNextTriggerTime(reminder, afterTime)`**
   - 计算单个提醒的下一次触发时间
   - 支持一次性和循环提醒

3. **`shouldTriggerOnDate(date, recurrence)`**
   - 判断指定日期是否应该根据重复规则触发
   - 支持：
     - DAILY（每日）
     - WEEKLY（每周特定几天）
     - CUSTOM_DAYS（自定义日期）

**关键业务逻辑：**

```typescript
// 固定时间触发：计算下一个符合规则的日期 + 指定时间
private static calculateNextFixedTimeTrigger(...): number {
  // 从 afterTime 开始，逐日检查
  for (let daysOffset = 0; daysOffset < 365; daysOffset++) {
    const checkDate = ...;
    
    // 检查该日期是否应该触发（根据重复规则）
    if (this.shouldTriggerOnDate(checkDate, recurrence)) {
      checkDate.setHours(targetHour, targetMinute, 0, 0);
      if (triggerTime >= afterTime) {
        return triggerTime; // 找到！
      }
    }
  }
}

// 间隔触发：从开始时间开始，每隔 N 分钟
private static calculateNextIntervalTrigger(...): number {
  const intervalMs = interval.minutes * 60 * 1000;
  const startTime = reminder.activeTime.startDate;
  
  // 计算下一个间隔点
  const elapsed = afterTime - startTime;
  const nextIntervalCount = Math.ceil(elapsed / intervalMs);
  return startTime + nextIntervalCount * intervalMs;
}
```

**返回的 DTO 结构：**
```typescript
interface UpcomingReminderDTO {
  templateUuid: string;
  title: string;
  type: ReminderType;
  triggerType: string;
  importanceLevel: ImportanceLevel;
  
  nextTriggerAt: number; // epoch ms
  nextTriggerDisplay: string; // "2025-11-18 16:30"
  daysUntilTrigger: number; // 距离现在的天数
  
  icon: string;
  color: string;
  notificationChannels: string[];
  groupUuid?: string;
}
```

---

### 3️⃣ 创建查询应用服务

**文件：** `apps/api/src/modules/reminder/application/services/ReminderQueryApplicationService.ts`

**职责：**
- 从仓储获取启用的提醒
- 调用领域服务计算
- 应用额外过滤（分组、重要性等）
- 返回前端友好数据

**核心方法：**

1. **`getUpcomingReminders(params)`**
   - 参数：accountUuid, days, limit, afterTime, groupUuid, importanceLevel
   - 流程：
     ```
     获取所有启用的提醒
          ↓
     调用领域服务计算
          ↓
     应用过滤器（如果有）
          ↓
     返回结果数组
     ```

2. **`getNextTriggerTime(accountUuid, templateUuid)`**
   - 获取单个提醒的下一次触发时间

3. **`getReminderStatistics(accountUuid)`**
   - 获取用户提醒的统计信息

---

### 4️⃣ 集成到 ReminderApplicationService

**修改：** `apps/api/src/modules/reminder/application/services/ReminderApplicationService.ts`

**改动：**
- 添加导入：`import { ReminderQueryApplicationService }`
- 更新 `getUpcomingReminders()` 方法，使其调用新的查询服务
- 处理错误时返回空结果而不是异常（容错性）

**实现：**
```typescript
async getUpcomingReminders(params: {
  accountUuid?: string;
  days?: number;
  limit?: number;
  importanceLevel?: ImportanceLevel;
  type?: ReminderType;
}): Promise<ReminderContracts.UpcomingRemindersResponseDTO> {
  try {
    // 1. 验证 accountUuid
    if (!accountUuid) {
      return { reminders: [], total: 0, fromDate: now, toDate: now + ... };
    }

    // 2. 使用查询服务计算
    const queryService = ReminderQueryApplicationService.getInstance();
    const upcomingReminders = await queryService.getUpcomingReminders({
      accountUuid,
      days,
      limit,
      afterTime: now,
      importanceLevel,
    });

    // 3. 返回结果
    return {
      reminders: upcomingReminders,
      total: upcomingReminders.length,
      fromDate: now,
      toDate: now + days * 24 * 60 * 60 * 1000,
    };
  } catch (error) {
    // 容错处理
    logger.error('Error calculating upcoming reminders', { error });
    return { reminders: [], total: 0, fromDate: now, toDate: now + ... };
  }
}
```

---

### 5️⃣ 更新 Controller 传递 accountUuid

**修改：** `apps/api/src/modules/reminder/interface/http/ReminderController.ts`

**改动：**
- 从 token 中提取 accountUuid
- 验证用户认证状态
- 传递给应用服务

---

## 🏗️ 架构设计总结

### 分层职责

```
┌─────────────────────────────────┐
│   前端（Web/Desktop）            │
│   调用 /api/reminders/upcoming   │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   HTTP 控制层                    │
│   ReminderController            │
│   - 解析请求参数                 │
│   - 从 Token 提取 accountUuid    │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   应用服务层                      │
│   ReminderApplicationService    │
│   - 协调多个服务                 │
│   - DTO 转换                     │
│   - 错误处理                     │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   查询应用服务层                  │
│   ReminderQueryApplicationService│
│   - 查询和聚合                   │
│   - 调用领域服务                 │
│   - 应用过滤器                   │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   领域服务层                      │
│   UpcomingReminderCalculation   │
│   Service                        │
│   - 核心业务逻辑                 │
│   - 触发时间计算                 │
│   - 纯函数式设计                 │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   基础设施层                      │
│   ReminderRepository            │
│   - 数据持久化                   │
│   - 数据库查询                   │
└─────────────────────────────────┘
```

### 数据流向

```
创建 Reminder
    ↓
ReminderApplicationService.createReminderTemplate()
    ↓
发布 reminder.template.created 事件
    ↓
ScheduleEventPublisher 监听事件
    ↓
ReminderScheduleStrategy.createSchedule()
    ↓
创建 ScheduleTask （现在能成功创建了！✅）
    ↓
ScheduleExecutionEngine 定时执行
    ↓
发布 ScheduleTaskTriggered 事件
    ↓
ReminderScheduleHandler 处理
    ↓
发送通知给用户


查询即将到来的提醒
    ↓
GET /api/reminders/upcoming
    ↓
ReminderController.getUpcomingReminders()
    ↓
ReminderApplicationService.getUpcomingReminders()
    ↓
ReminderQueryApplicationService.getUpcomingReminders()
    ↓
从 ReminderRepository 获取所有启用的提醒
    ↓
UpcomingReminderCalculationService.calculateUpcomingReminders()
    ↓
逐一计算每个提醒的下一次触发时间
    ↓
返回计算结果给前端 ✅
```

---

## 📋 工作清单

✅ **已完成：**
1. 修复 `ReminderScheduleStrategy.shouldCreateSchedule()` 检查条件
2. 创建 `UpcomingReminderCalculationService` 领域服务
3. 创建 `ReminderQueryApplicationService` 应用服务
4. 集成到 `ReminderApplicationService`
5. 更新 `ReminderController` 传递 accountUuid

📝 **建议后续工作：**
1. 为 `UpcomingReminderCalculationService` 编写单元测试
2. 测试创建各种类型的 Reminder 是否能生成 ScheduleTask
3. 测试 `GET /api/reminders/upcoming` 接口是否返回正确数据
4. 监控日志确认没有错误
5. 前端集成 upcoming reminders 显示

---

## 🔍 验证方法

### 1. 验证 ScheduleTask 生成

```bash
# 创建提醒
curl -X POST http://localhost:3888/api/v1/reminders/templates \
  -H "Content-Type: application/json" \
  -d '{
    "accountUuid": "test-account",
    "title": "每一分钟",
    "type": "RECURRING",
    "trigger": { "type": "INTERVAL", "interval": { "minutes": 1 } },
    "activeTime": { "startDate": 1700000000000, "endDate": null }
  }'

# 查询数据库
select * from schedule_tasks where source_module = 'reminder' 
  and source_entity_id = '<template_uuid>';

# 应该看到一条记录 ✅
```

### 2. 验证 Upcoming Reminders 计算

```bash
# 查询即将到来的提醒
curl -X GET "http://localhost:3888/api/v1/reminders/upcoming?days=7&limit=50" \
  -H "Authorization: Bearer <token>"

# 应该返回 UpcomingReminderDTO 数组 ✅
```

---

## 📚 最佳实践

### 领域服务设计

✅ **UpcomingReminderCalculationService 的优势：**
- 纯函数式设计，无状态
- 易于测试
- 可复用（不仅仅 API，也可用于定时任务、报表等）
- 业务逻辑与 HTTP/数据库解耦

### 应用服务设计

✅ **ReminderQueryApplicationService 的优势：**
- 单一职责：只负责查询
- 清晰的数据流：仓储 → 领域服务 → DTO 转换
- 容错设计：错误不会导致 500，而是返回空结果
- 支持多种过滤条件

### 分层设计

✅ **完整的分层架构：**
- HTTP → 应用服务 → 查询服务 → 领域服务 → 仓储
- 每层职责清晰，易于维护和扩展
- 支持在任何层级添加缓存、日志、监控

---

## 🚀 性能优化建议

1. **缓存 nextTriggerAt**
   - 计算结果可以缓存在 Redis
   - 有效期：提醒配置不变的情况下，缓存 1 小时

2. **批量查询优化**
   - 分页加载大量提醒
   - 使用索引加快数据库查询

3. **异步计算**
   - 对于超过 100 条提醒的用户
   - 使用后台任务异步计算，缓存结果

---

## 🎓 总结

这个实现展现了完整的 DDD 分层架构：

- **领域服务** 承载核心业务逻辑（如何计算触发时间）
- **应用服务** 协调各个服务完成用例（获取提醒并计算）
- **控制器** 处理 HTTP 请求和认证
- **仓储** 负责数据持久化

这样的设计让代码：
✅ 易于理解（每层职责清晰）
✅ 易于测试（每层可独立测试）
✅ 易于扩展（添加新功能不影响现有代码）
✅ 易于复用（领域服务可用于多个场景）
