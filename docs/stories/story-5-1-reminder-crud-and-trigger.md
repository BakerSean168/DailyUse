# Story 5-1: Reminder CRUD + Trigger Mechanism

**Story ID**: STORY-5.1  
**Epic**: Epic 5 - Reminder Module  
**优先级**: P0  
**Story Points**: 5  
**状态**: 🔄 In Progress

---

## 📋 Story 概述

**目标**: 实现 Reminder 模块的核心 CRUD 功能和自动触发机制。

**用户故事**:
> 作为一个用户，我希望能够创建、查看、更新和删除提醒，并且系统能够在设定的时间自动触发提醒通知，以便我不会错过重要事项。

---

## 🎯 验收标准

### Scenario 1: 创建一次性提醒
```gherkin
Given 已登录用户
When 创建提醒"明天 9:00 开会"
And 设置提醒时间为明天 09:00
And 设置提醒类型为"一次性"
Then 提醒创建成功
And 提醒状态为"待触发"
```

### Scenario 2: 创建重复提醒
```gherkin
Given 已登录用户
When 创建提醒"每天晨会"
And 设置提醒时间为每天 09:00
And 设置重复规则为"每天"
Then 提醒创建成功
And 生成下一次触发时间
```

### Scenario 3: 系统自动触发提醒
```gherkin
Given 已有提醒"9:00 开会"，触发时间为 09:00
When 系统时间到达 09:00
Then 系统自动发送通知
And 记录触发历史
And 提醒状态更新为"已触发"（一次性）或生成下次触发时间（重复）
```

### Scenario 4: 查看提醒列表
```gherkin
Given 用户有多个提醒
When 访问提醒列表页面
Then 显示所有提醒
And 可按状态筛选（待触发/已触发/已关闭）
And 可按时间排序
```

---

## 🏗️ 技术实现方案

### Backend 架构

#### 1. Domain Layer (领域层)

**Reminder 聚合根**:
```typescript
class Reminder {
  - uuid: string
  - accountUuid: string
  - title: ReminderTitle (值对象)
  - content: string
  - reminderTime: number (Unix timestamp)
  - recurrenceRule: RecurrenceRule | null (值对象)
  - status: ReminderStatus (枚举)
  - channels: ReminderChannel[] (枚举数组)
  - relatedEntity: RelatedEntity | null (值对象)
  - nextTriggerTime: number | null
  - createdAt: Date
  - updatedAt: Date
  
  + create(): Reminder
  + updateTitle(title: string): void
  + updateReminderTime(time: number): void
  + trigger(): void
  + close(): void
  + calculateNextTriggerTime(): number | null
}
```

**值对象**:
- `ReminderTitle`: 标题（1-200字符）
- `RecurrenceRule`: 重复规则（频率、间隔、结束条件）
- `RelatedEntity`: 关联对象（类型、UUID）

**枚举**:
- `ReminderStatus`: PENDING, TRIGGERED, CLOSED
- `ReminderChannel`: PUSH, EMAIL, IN_APP
- `RecurrenceFrequency`: DAILY, WEEKLY, MONTHLY, YEARLY

#### 2. Application Layer (应用层)

**ReminderApplicationService**:
```typescript
- createReminder(params): Reminder
- getReminder(uuid): Reminder
- getReminders AccountReminders(accountUuid, filter): Reminder[]
- updateReminder(uuid, params): Reminder
- deleteReminder(uuid): void
- triggerDueReminders(): TriggerResult
```

#### 3. Infrastructure Layer (基础设施层)

**Prisma Schema**:
```prisma
model Reminder {
  id              Int       @id @default(autoincrement())
  uuid            String    @unique @default(uuid())
  accountUuid     String
  title           String
  content         String?
  reminderTime    BigInt
  recurrenceRule  Json?
  status          String    @default("PENDING")
  channels        String[]
  relatedEntity   Json?
  nextTriggerTime BigInt?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  account Account @relation(fields: [accountUuid], references: [uuid])
  
  @@index([accountUuid])
  @@index([status])
  @@index([nextTriggerTime])
}
```

**Cron Job** (定时任务):
```typescript
// 每分钟扫描一次待触发的提醒
cron.schedule('* * * * *', async () => {
  await reminderApplicationService.triggerDueReminders();
});
```

#### 4. HTTP Layer (HTTP 接口层)

**REST API**:
- `POST /api/v1/reminders` - 创建提醒
- `GET /api/v1/reminders` - 获取提醒列表
- `GET /api/v1/reminders/:uuid` - 获取提醒详情
- `PATCH /api/v1/reminders/:uuid` - 更新提醒
- `DELETE /api/v1/reminders/:uuid` - 删除提醒
- `POST /api/v1/reminders/:uuid/trigger` - 手动触发（测试用）

---

### Frontend 架构

#### 1. Components (组件)

**ReminderList.vue**:
- 提醒列表展示
- 状态筛选
- 时间排序

**CreateReminderDialog.vue**:
- 创建/编辑提醒对话框
- 标题、内容输入
- 时间选择器
- 重复规则设置
- 渠道选择

**ReminderCard.vue**:
- 单个提醒卡片
- 显示标题、时间、状态
- 快捷操作按钮

#### 2. Composables (状态管理)

**useReminder.ts**:
```typescript
export function useReminder() {
  const reminders = ref<Map<string, ReminderDTO>>(new Map());
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  
  async function createReminder(data): ReminderDTO
  async function getReminders(filter?): ReminderDTO[]
  async function updateReminder(uuid, data): ReminderDTO
  async function deleteReminder(uuid): boolean
  
  return {
    reminders,
    isLoading,
    error,
    createReminder,
    getReminders,
    updateReminder,
    deleteReminder
  };
}
```

#### 3. API Client

**reminderApiClient.ts**:
```typescript
export const reminderApiClient = {
  createReminder(data: CreateReminderRequest): Promise<ReminderDTO>
  getReminders(filter?: ReminderFilter): Promise<ReminderDTO[]>
  getReminder(uuid: string): Promise<ReminderDTO>
  updateReminder(uuid: string, data: UpdateReminderRequest): Promise<ReminderDTO>
  deleteReminder(uuid: string): Promise<void>
};
```

---

## 📊 实现清单

### Backend 实现

- [ ] Prisma Schema 定义
- [ ] Domain Layer
  - [ ] Reminder 聚合根
  - [ ] ReminderTitle 值对象
  - [ ] RecurrenceRule 值对象
  - [ ] RelatedEntity 值对象
  - [ ] ReminderStatus 枚举
  - [ ] ReminderChannel 枚举
- [ ] Application Layer
  - [ ] ReminderApplicationService
  - [ ] Cron Job (触发机制)
- [ ] Infrastructure Layer
  - [ ] PrismaReminderRepository
  - [ ] ReminderMapper
- [ ] HTTP Layer
  - [ ] ReminderController
  - [ ] reminderRoutes (Swagger 文档)

### Frontend 实现

- [ ] Contracts
  - [ ] ReminderContracts (DTO 定义)
- [ ] API Client
  - [ ] reminderApiClient.ts
- [ ] Components
  - [ ] ReminderList.vue
  - [ ] CreateReminderDialog.vue
  - [ ] ReminderCard.vue
- [ ] Composables
  - [ ] useReminder.ts
- [ ] Views
  - [ ] ReminderView.vue
- [ ] Router
  - [ ] /reminder 路由配置

### 测试

- [ ] Backend 单元测试
- [ ] Backend 集成测试
- [ ] Frontend 组件测试
- [ ] E2E 测试

---

## 🔄 重复规则设计

### RecurrenceRule 值对象

```typescript
interface RecurrenceRule {
  frequency: RecurrenceFrequency;  // DAILY, WEEKLY, MONTHLY, YEARLY
  interval: number;  // 间隔（如每 2 天、每 3 周）
  endType: 'never' | 'until' | 'count';  // 结束条件类型
  endDate?: number;  // 结束日期 (Unix timestamp)
  count?: number;  // 重复次数
  byWeekday?: number[];  // 星期几（0-6，0=周日）
  byMonthday?: number[];  // 每月的哪几天（1-31）
}
```

### 计算下次触发时间算法

```typescript
function calculateNextTriggerTime(
  currentTime: number,
  recurrenceRule: RecurrenceRule
): number | null {
  if (!recurrenceRule) return null;
  
  // 根据 frequency 和 interval 计算
  // 处理 byWeekday、byMonthday 约束
  // 检查 endType 是否已结束
  
  return nextTime;
}
```

---

## 📝 API 文档示例

### POST /api/v1/reminders

**Request**:
```json
{
  "title": "每天晨会",
  "content": "9:00 开发团队晨会",
  "reminderTime": 1730275200000,
  "recurrenceRule": {
    "frequency": "DAILY",
    "interval": 1,
    "endType": "never"
  },
  "channels": ["PUSH", "IN_APP"],
  "relatedEntity": {
    "type": "TASK",
    "uuid": "task-uuid"
  }
}
```

**Response**:
```json
{
  "code": 0,
  "message": "Reminder created successfully",
  "data": {
    "uuid": "reminder-uuid",
    "accountUuid": "account-uuid",
    "title": "每天晨会",
    "content": "9:00 开发团队晨会",
    "reminderTime": 1730275200000,
    "recurrenceRule": { ... },
    "status": "PENDING",
    "channels": ["PUSH", "IN_APP"],
    "relatedEntity": { ... },
    "nextTriggerTime": 1730275200000,
    "createdAt": "2025-10-30T09:00:00.000Z",
    "updatedAt": "2025-10-30T09:00:00.000Z"
  }
}
```

---

## ⏱️ 预估工作量

| 任务 | 预估时间 |
|------|----------|
| Prisma Schema + Domain Layer | 2h |
| Application Layer + Cron Job | 2h |
| Infrastructure Layer | 1.5h |
| HTTP Layer + Swagger | 1.5h |
| Frontend Contracts + API Client | 1h |
| Frontend Components | 3h |
| Frontend Composable + View | 1.5h |
| 测试 | 2.5h |
| **总计** | **15h (约 2 天)** |

---

## 🚀 实施步骤

1. **Backend First**: 先实现后端 CRUD + Cron Job
2. **Contracts**: 定义前后端共享的 DTO
3. **Frontend**: 实现前端组件和状态管理
4. **Integration**: 前后端集成测试
5. **E2E**: 端到端测试关键路径

---

**Story 状态**: 🔄 In Progress  
**开始时间**: 2025-10-30  
**预计完成**: 2025-10-31

