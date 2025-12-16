# DailyUse 数据模型文档

> **更新时间**: 2025-12-16  
> **ORM**: Prisma 6.17.1  
> **主数据库**: PostgreSQL  
> **桌面数据库**: SQLite (better-sqlite3)

---

## 📋 概述

DailyUse 使用 Prisma ORM 管理数据模型，Schema 定义位于 `apps/api/prisma/schema.prisma`，共 **1620 行**，包含 **50+ 个模型**。

### 聚合根架构

项目采用 DDD (Domain-Driven Design) 模式，数据模型围绕 **10 个核心聚合根** 组织：

```
┌─────────────────────────────────────────────────────────────┐
│                    核心聚合根 (Aggregate Roots)              │
├─────────────────────────────────────────────────────────────┤
│  account        │ 用户账户、认证、会话                       │
│  goal           │ OKR 目标、关键结果、进度                   │
│  taskTemplate   │ 任务模板、实例、依赖                       │
│  reminderTemplate│ 提醒模板、实例、响应分析                  │
│  schedule       │ 日程、调度任务、执行记录                   │
│  repository     │ 知识仓库、资源、文件夹                     │
│  document       │ 文档、版本、双向链接                       │
│  aiConversation │ AI 对话、消息、生成任务                    │
│  notification   │ 通知、渠道、历史                           │
│  setting        │ 设置、分组、配置项                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ 核心模型详解

### 1. Account 模块 (用户账户)

```prisma
model account {
  uuid            String    @id
  username        String    @unique
  email           String    @unique
  emailVerified   Boolean   @default(false)
  phoneNumber     String?
  status          String    @default("ACTIVE")
  profile         String    // JSON: 用户资料
  preferences     String    // JSON: 偏好设置
  security        String    // JSON: 安全配置
  createdAt       DateTime  @default(now())
  updatedAt       DateTime
  
  // 关联
  authCredential  authCredential[]
  authSession     authSession[]
  userSetting     userSetting?
  // ... 其他模块关联
}

model authCredential {
  uuid        String    @id
  accountUuid String
  type        String    // PASSWORD, OAUTH, PASSKEY
  data        String    // 加密存储
  expiresAt   DateTime?
}

model authSession {
  uuid                  String    @id
  accountUuid           String
  status                String    @default("ACTIVE")
  accessToken           String    @unique
  refreshToken          String    @unique
  accessTokenExpiresAt  DateTime
  refreshTokenExpiresAt DateTime
  device                String
  ipAddress             String?
}
```

### 2. Goal 模块 (OKR 目标)

```prisma
model goal {
  uuid              String      @id
  accountUuid       String
  title             String
  description       String?
  status            String      @default("pending")
  importance        Int         @default(2)  // 0-4
  urgency           Int         @default(2)  // 0-4
  category          String?
  tags              String?     // JSON array
  startDate         DateTime?
  targetDate        DateTime?
  completedAt       DateTime?
  folderUuid        String?
  parentGoalUuid    String?     // 子目标支持
  sortOrder         Int         @default(0)
  
  // 关联
  keyResult         keyResult[]
  goalReview        goalReview[]
  focusSession      focusSession[]
}

model keyResult {
  uuid              String      @id
  goalUuid          String
  title             String
  valueType         String      // number, percentage, boolean
  aggregationMethod String      // sum, latest, average
  targetValue       Float
  currentValue      Float       @default(0)
  unit              String?
  weight            Float       @default(1)
  
  goalRecord        goalRecord[]  // 进度记录
}

model goalFolder {
  uuid              String      @id
  accountUuid       String
  name              String
  description       String?
  color             String?
  icon              String?
  parentFolderUuid  String?     // 嵌套文件夹
  isSystemFolder    Boolean     @default(false)
}
```

### 3. Task 模块 (任务管理)

```prisma
model taskTemplate {
  uuid            String      @id
  accountUuid     String
  title           String
  description     String?
  taskType        String      // ONE_TIME, RECURRING
  status          String
  importance      Int         // 0-4 重要性
  urgency         Int         // 0-4 紧急性
  tags            String      // JSON array
  
  // 一次性任务字段
  startDate       BigInt?     // Unix timestamp (ms)
  dueDate         BigInt?
  completedAt     BigInt?
  estimatedMinutes Int?
  actualMinutes   Int?
  
  // 循环任务字段
  recurrenceRuleType     String?   // daily, weekly, monthly
  recurrenceRuleInterval Int?
  recurrenceRuleDaysOfWeek String? // JSON array
  
  // Goal 关联
  goalUuid        String?
  keyResultUuid   String?
  
  // 依赖关系
  parentTaskUuid  String?     // 子任务
  isBlocked       Boolean     @default(false)
  
  taskInstance    taskInstance[]
}

model taskInstance {
  uuid            String      @id
  templateUuid    String
  accountUuid     String
  instanceDate    DateTime
  status          String      // PENDING, IN_PROGRESS, COMPLETED, SKIPPED
  actualStartTime DateTime?
  actualEndTime   DateTime?
}
```

### 4. Reminder 模块 (智能提醒)

```prisma
model reminderTemplate {
  uuid              String      @id
  accountUuid       String
  title             String
  type              String      // ONCE, DAILY, WEEKLY, CUSTOM
  selfEnabled       Boolean
  status            String
  groupUuid         String?
  importanceLevel   String
  nextTriggerAt     DateTime?
  
  // 触发配置
  trigger           String      // JSON: 触发条件
  recurrence        String?     // JSON: 重复规则
  activeTime        String      // JSON: 活跃时间段
  notificationConfig String     // JSON: 通知配置
  
  // 智能频率调整
  clickRate         Float?      // 点击率
  ignoreRate        Float?      // 忽略率
  avgResponseTime   Int?        // 平均响应时间
  effectivenessScore Float?     // 有效性评分
  isAutoAdjusted    Boolean     @default(false)
  
  reminderInstance  reminderInstance[]
  reminderResponse  reminderResponse[]
}

model reminderResponse {
  uuid         String   @id
  templateUuid String
  action       String   // clicked, ignored, snoozed, dismissed
  responseTime Int?     // 响应时间 (秒)
  timestamp    BigInt
}
```

### 5. Repository 模块 (知识仓库)

```prisma
model repository {
  uuid           String      @id
  accountUuid    String
  name           String
  type           String      // local, cloud
  path           String
  description    String?
  config         Json        @default("{}")  // RepositoryConfig
  stats          Json        @default("{}")  // RepositoryStats
  status         String      @default("ACTIVE")
  
  resource       resource[]
  folder         folder[]
}

model resource {
  uuid           String      @id
  repositoryUuid String
  folderUuid     String?
  name           String
  type           String      // markdown, image, video, audio, pdf, link
  path           String
  size           Int         @default(0)
  content        String?     @db.Text  // Markdown 内容
  metadata       Json        @default("{}")
  stats          Json        @default("{}")
  status         String      @default("ACTIVE")
}

model folder {
  uuid           String      @id
  repositoryUuid String
  parentUuid     String?
  name           String
  path           String      // Auto-generated: /parent/name
  order          Int         @default(0)
  isExpanded     Boolean     @default(true)
  metadata       Json        @default("{}")
  
  children       folder[]    @relation("FolderHierarchy")
}
```

### 6. AI 模块

```prisma
model aiConversation {
  uuid          String      @id
  accountUuid   String
  title         String
  status        String      // ACTIVE, CLOSED, ARCHIVED
  messageCount  Int         @default(0)
  lastMessageAt DateTime?
  
  messages      aiMessage[]
}

model aiMessage {
  uuid             String      @id
  conversationUuid String
  role             String      // USER, ASSISTANT, SYSTEM
  content          String      @db.Text
  tokenUsage       String?     // JSON: {promptTokens, completionTokens}
}

model aiGenerationTask {
  uuid         String      @id
  accountUuid  String
  taskType     String      // GOAL_KEY_RESULTS, TASK_TEMPLATES, KNOWLEDGE_DOC
  status       String      // PENDING, PROCESSING, COMPLETED, FAILED
  input        String      @db.Text  // JSON
  result       String?     @db.Text  // JSON
  error        String?
  processingMs Int?
}

model aiProviderConfig {
  uuid            String      @id
  accountUuid     String
  name            String
  providerType    String      // OPENAI, QINIU, ANTHROPIC
  baseUrl         String
  apiKeyEncrypted String      // AES-256-GCM 加密
  defaultModel    String?
  availableModels String      @default("[]")
  isActive        Boolean     @default(true)
  isDefault       Boolean     @default(false)
  priority        Int         @default(100)
}
```

### 7. Document 模块 (版本化文档)

```prisma
model document {
  uuid            String      @id
  accountUuid     String
  title           String
  content         String      @db.Text
  folderPath      String
  tags            String[]    // PostgreSQL array
  status          String      @default("DRAFT")
  currentVersion  Int         @default(0)
  
  versions        document_version[]
  sourceLinks     document_link[]   @relation("source_links")
  targetLinks     document_link[]   @relation("target_links")
}

model document_version {
  uuid              String      @id
  documentUuid      String
  versionNumber     Int
  title             String
  content           String      @db.Text
  changeType        String      // initial, major, minor, patch, restore
  changeDescription String?
  changedBy         String
  metadata          Json?       // {addedChars, deletedChars, modifiedSections}
}

model document_link {
  uuid               String      @id
  sourceDocumentUuid String
  targetDocumentUuid String?     // Nullable for broken links
  linkText           String      // [[链接文本]]
  linkPosition       Int
  isBroken           Boolean     @default(false)
}
```

---

## 🔄 同步系统 (Event Sourcing)

```prisma
// 同步事件表 - 不可变日志
model syncEvent {
  id              BigInt      @id @default(autoincrement())
  eventId         String      @unique @db.Uuid
  accountUuid     String
  deviceId        String      @db.Uuid
  entityType      String      // goal, task, reminder, etc.
  entityId        String      @db.Uuid
  operation       String      // create, update, delete
  payload         Json        // 变更内容
  baseVersion     BigInt
  newVersion      BigInt
  clientTimestamp BigInt
  serverTimestamp DateTime    @default(now())
}

// 实体版本 - 物化当前状态
model entityVersion {
  id             String      @id @db.Uuid
  accountUuid    String
  entityType     String
  entityId       String      @db.Uuid
  currentVersion BigInt      @default(1)
  currentData    Json
  isDeleted      Boolean     @default(false)
}

// 设备注册
model syncDevice {
  id              String      @id @db.Uuid
  accountUuid     String
  deviceId        String      @unique @db.Uuid
  deviceName      String
  platform        String      // windows, macos, linux, web
  lastSyncVersion BigInt      @default(0)
  lastSyncAt      DateTime?
  isActive        Boolean     @default(true)
}

// 同步冲突
model syncConflict {
  id                 String      @id @db.Uuid
  accountUuid        String
  entityType         String
  entityId           String      @db.Uuid
  localData          Json
  serverData         Json
  conflictingFields  String[]
  resolutionStrategy String?     // local, remote, merge, manual
  resolvedData       Json?
}
```

---

## 📊 统计实体

每个核心模块都有对应的统计聚合：

| 模型 | 描述 |
|------|------|
| `goalStatistic` | 目标统计 (总数、完成率、KR 进度) |
| `taskStatistic` | 任务统计 (模板数、实例数、完成率) |
| `reminderStatistic` | 提醒统计 (触发次数、响应率) |
| `scheduleStatistic` | 调度统计 (执行次数、成功率) |
| `repositoryStatistic` | 仓库统计 (资源数、文件大小) |

---

## 🔗 索引策略

所有模型都包含优化的数据库索引：

```prisma
// 常见索引模式
@@index([accountUuid])           // 用户隔离
@@index([status])                // 状态过滤
@@index([createdAt])             // 时间排序
@@index([deletedAt])             // 软删除
@@unique([accountUuid, name])    // 用户内唯一
```

---

## 🔄 迁移管理

```bash
# 创建迁移
pnpm prisma migrate dev --name <migration_name>

# 应用迁移 (生产)
pnpm prisma migrate deploy

# 重置数据库
pnpm prisma migrate reset

# 生成 Prisma Client
pnpm prisma generate
```

---

## 📚 相关文档

- [系统架构概览](architecture/system-overview.md)
- [API 架构文档](architecture/api-architecture.md)
- [DDD 类型架构](architecture/ddd-type-architecture.md)

---

*文档由 BMAD Analyst Agent 生成*
