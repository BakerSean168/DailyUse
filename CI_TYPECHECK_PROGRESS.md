# CI Typecheck 修复进度报告

> 更新时间: 2025-01-XX
> 
> 本报告记录了 typecheck 错误修复的进展

## 📊 进度概览

| 指标 | 数值 |
|------|------|
| 初始错误数 | 111 |
| 当前错误数 | 35 |
| 已修复 | 76 |
| 修复率 | **69%** |

## ✅ 已修复问题

### 1. IPC Channels 补充 (修复 ~23 个错误)

在 `apps/desktop/src/shared/types/ipc-channels.ts` 中添加了缺失的 channel 常量：

**ReminderChannels:**
- LIST, GET, CREATE, UPDATE, DELETE
- SNOOZE, ACKNOWLEDGE, DISMISS
- LIST_BY_LINKED_ENTITY, STATISTICS_GET
- EVENT_UPDATED, EVENT_DELETED

**NotificationChannels:**
- STATISTICS_GET, SEND_BATCH
- EVENT_ACTION, EVENT_CLOSED, EVENT_UNREAD_CHANGED

**RepositoryChannels:**
- BACKUP_GET
- EVENT_BACKUP_PROGRESS, EVENT_RESTORE_PROGRESS
- EVENT_EXPORT_PROGRESS, EVENT_IMPORT_PROGRESS

**SettingChannels:**
- EVENT_THEME_CHANGED

**EditorChannels:**
- DOCUMENT_GET_BY_LINKED_ENTITY
- DOCUMENT_CREATE_FOR_LINKED_ENTITY
- DOCUMENT_SAVE
- EVENT_DOCUMENT_UPDATED

### 2. IPC Payloads 补充 (修复 ~6 个错误)

在 `apps/desktop/src/shared/types/ipc-payloads.ts` 中添加：

**ReminderPayloads:**
- ListRequest
- CreateRequest
- UpdateRequest

### 3. IPC Client 方法补充 (修复 ~8 个错误)

**EditorIPCClient:**
- getByLinkedEntity()
- createForLinkedEntity()
- saveDocument()

**NotificationIPCClient:**
- send()
- NotificationStatisticsDTO 类型
- NotificationPayloads namespace

**AccountIPCClient:**
- getCurrentAccount()
- getHistory()
- getStats()

### 4. Infrastructure 修复 (修复 ~5 个错误)

**module-registry.ts:**
- 修复 index.ts 导出不存在成员的问题
- 导出实际的函数而非不存在的类

**goal-focus.ipc-handlers.ts:**
- 将同步回调改为 async，解决 Promise 类型不匹配

## ❌ 剩余问题 (40 个错误)

### 根本原因

剩余错误的**根本原因**是类型定义不同步：

1. **Store 层** 使用来自 `@dailyuse/contracts` 的类型（如 `AccountServerDTO`）
2. **IPC Client 层** 使用本地定义的类型（如 `AccountDTO`）
3. 这两套类型定义**字段不完全匹配**

### 错误分类

#### Category 1: Store-DTO 类型不匹配 (25 个)

| Store 文件 | 问题 |
|------------|------|
| accountStore.ts | AccountDTO vs AccountServerDTO 等 |
| editorStore.ts | DocumentDTO 缺少 format/folderId/tags 等 |
| reminderStore.ts | ReminderDTO vs ReminderTemplateClientDTO |
| repositoryStore.ts | RepositoryDTO vs RepositoryClientDTO |
| scheduleStore.ts | ScheduleDTO vs ScheduleClientDTO |
| taskStore.ts | TaskInstanceDTO vs TaskInstanceClientDTO |
| settingStore.ts | AppSettingsDTO vs AppSettings |

#### Category 2: 缺失 IPC Client 方法 (8 个)

| 方法 | 使用位置 |
|------|----------|
| listGroups | reminderStore.ts |
| pause, resume | reminderStore.ts |
| getBackupDetails | repositoryStore.ts |
| setAll | settingStore.ts |

#### Category 3: API 签名不匹配 (7 个)

| 文件 | 问题 |
|------|------|
| aiStore.ts | 参数数量不匹配、response 属性缺失 |
| editorStore.ts | 参数数量不匹配、accountUuid 不存在 |
| reminderStore.ts | 参数数量不匹配、snoozedUntil/dismissedAt 不存在 |
| taskStore.ts | completedAt/skippedAt 不存在 |

## 🔧 建议的修复方案

### 方案 A: 快速修复 (类型断言)

在 Store 层使用类型断言绕过检查：
```typescript
const account = await accountClient.getCurrentAccount() as unknown as AccountServerDTO | null;
```
**优点**: 快速，可立即通过 CI
**缺点**: 不是真正的类型安全

### 方案 B: 统一类型定义 (推荐)

1. 决定哪套类型是权威来源
2. 更新 IPC Client 返回正确的类型
3. 或更新 Store 使用正确的类型

**优点**: 长期维护性好
**缺点**: 需要更多工作量

### 方案 C: 映射层

创建映射函数转换类型：
```typescript
function mapAccountDTO(dto: AccountDTO): AccountServerDTO {
  return { ...dto, /* add missing fields */ } as AccountServerDTO;
}
```

**优点**: 清晰的边界，可以添加验证逻辑
**缺点**: 增加一层间接

## 📋 下一步行动

1. **短期 (让 CI 通过)**:
   - 添加缺失的 IPC Client 方法 (listGroups, pause, resume, getBackupDetails, setAll)
   - 对类型不匹配使用类型断言 `as unknown as TargetType`

2. **中期 (代码质量)**:
   - 统一 DTO 类型定义
   - 确保 `@dailyuse/contracts` 和 desktop 本地类型同步

3. **长期 (架构改进)**:
   - 考虑使用 Zod schema 自动生成类型
   - 建立 DTO 类型的单一来源
