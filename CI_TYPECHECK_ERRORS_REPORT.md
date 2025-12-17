# CI Typecheck 错误报告

> 生成时间: 2025-01-15
> 
> 本报告总结了 CI 流程中 `typecheck` 阶段的剩余错误，这些是**业务代码逻辑问题**，需要开发团队逐一修复。

## 已修复问题 ✅

### 1. CI 工作流程顺序
- **问题**: `typecheck` 在 `build:packages` 之前运行，导致 `@dailyuse/*` 包模块未找到
- **解决**: 修改 `.github/workflows/ci.yml`，添加 `build-packages` 作业并调整依赖顺序

### 2. assets 测试导入路径
- **文件**: `packages/assets/src/__tests__/images.test.ts`
- **问题**: 导入路径 `../src/images` 应为 `../images`
- **状态**: ✅ 已修复

### 3. application-client 测试语法错误
- **文件**: `packages/application-client/src/habit/services/HabitStatisticsService.test.ts`
- **问题**: `private` 方法定义在 `describe` 块内
- **状态**: ✅ 已修复

### 4. ui-vuetify 缺失导出
- **问题**: 从 `@dailyuse/ui-vue` 导入不存在的函数
- **文件**: `useFormValidation.ts`, `useLoading.ts`, `useMessage.ts`, `DuTextField.vue`
- **状态**: ✅ 已修复

### 5. IPC Client 重复导出
- **文件**: 
  - `auth.ipc-client.ts` 
  - `editor.ipc-client.ts`
  - `notification.ipc-client.ts`
  - `repository.ipc-client.ts`
- **问题**: 重复的 `export const xxxIPCClient = ...`
- **状态**: ✅ 已修复

---

## 待修复问题 ❌

### 1. application-client 包 (2 个文件)

#### 1.1 缺失 date-fns 依赖
```
src/planning/DailyPlanningService.ts(15,77): error TS2307: Cannot find module 'date-fns'
src/planning/__tests__/DailyPlanningService.test.ts(8,35): error TS2307: Cannot find module 'date-fns'
```
**建议**: 运行 `pnpm add date-fns -F @dailyuse/application-client`

#### 1.2 缺失导出
```
src/analytics/index.ts(17,16): error TS2304: Cannot find name 'ReviewReportService'
src/authentication/index.ts(8,10): error TS2724: has no exported member 'AuthenticationContainer'
src/planning/index.ts(14,16): error TS2304: Cannot find name 'DailyPlanningService'
```
**建议**: 确保这些服务/容器已正确定义并导出

#### 1.3 测试文件类型问题
- 自定义匹配器 `toBeBetween` 未在类型中声明
- 多处 `Object is possibly 'undefined'` 错误
**建议**: 添加 vitest 自定义匹配器类型声明，添加 null 检查

---

### 2. desktop 包 (约 100+ 错误)

#### 2.1 main 进程模块问题

**缺失依赖类型**:
```
src/main/modules/auto-update/auto-update-manager.ts: Cannot find module 'electron-updater'
```
**建议**: 运行 `pnpm add -D electron-updater -F desktop`

**模块导出问题**:
```
src/main/modules/shortcuts/index.ts: 'ShortcutConfig', 'ShortcutManagerConfig' 未导出
src/main/modules/tray/index.ts: 'TrayConfig' 未导出  
src/main/modules/window/index.ts: 'WindowState', 'WindowStateConfig' 未导出
```
**建议**: 在对应 manager 文件中导出这些类型

**类/方法访问性问题**:
```
src/main/desktop-features/index.ts: TrayManager.init is private
src/main/desktop-features/index.ts: ShortcutManager.init does not exist
src/main/desktop-features/index.ts: TrayManager.destroy does not exist
```
**建议**: 将这些方法改为 public 或添加缺失方法

**goal-focus.ipc-handlers.ts 返回类型问题**:
```
Type 'FocusSession' is missing properties from type 'Promise<unknown>'
```
**建议**: IPC handler 应返回 Promise，而非直接返回值

#### 2.2 renderer 进程 IPC Client 问题

多个 IPC Client 引用了 Channels 中不存在的常量:

| 文件 | 缺失的 Channel |
|------|----------------|
| editor.ipc-client.ts | EVENT_DOCUMENT_UPDATED, EVENT_AUTOSAVE_COMPLETED |
| notification.ipc-client.ts | STATISTICS_GET, SEND_BATCH, EVENT_ACTION, EVENT_CLOSED, EVENT_UNREAD_CHANGED |
| reminder.ipc-client.ts | LIST, GET, CREATE, UPDATE, DELETE, SNOOZE, ACKNOWLEDGE, DISMISS, LIST_BY_LINKED_ENTITY, STATISTICS_GET, EVENT_UPDATED, EVENT_DELETED |
| repository.ipc-client.ts | EVENT_BACKUP_PROGRESS, EVENT_RESTORE_PROGRESS, EVENT_EXPORT_PROGRESS, EVENT_IMPORT_PROGRESS |
| setting.ipc-client.ts | EVENT_THEME_CHANGED |

**建议**: 
1. 在 `shared/types/ipc-channels.ts` 中添加缺失的 channel 常量
2. 或者从 IPC Client 中移除这些未实现的方法

#### 2.3 renderer 进程 Store 问题

Store 使用了 DTO 中不存在的属性:

| Store 文件 | 问题 |
|------------|------|
| accountStore.ts | getCurrentAccount, getHistory, getStats 方法不存在 |
| aiStore.ts | ChatMessageDTO 缺少 response 属性 |
| editorStore.ts | DocumentDTO 缺少 format, folderId, tags, isArchived, isDraft; EditorIPCClient 缺少 saveDocument |
| reminderStore.ts | listGroups, pause, resume 方法不存在; snoozedUntil, dismissedAt 属性不存在 |
| repositoryStore.ts | getBackupDetails 方法不存在; BackupDTO 缺少 updatedAt |
| scheduleStore.ts | ScheduleClientDTO 缺少 allDay 属性 |
| settingStore.ts | setAll 方法不存在; AppSettingsDTO 与 AppSettings 类型不兼容 |
| taskStore.ts | TaskInstanceClientDTO/TaskTemplateClientDTO 缺少多个属性 |

**建议**: 
1. 更新 DTO 定义以包含缺失字段
2. 或更新 Store 以匹配实际 DTO 结构

#### 2.4 auto-update 模块路径问题
```
src/renderer/modules/auto-update/infrastructure/auto-update.ipc-client.ts: 
  Cannot find module '../../shared/infrastructure/ipc/base-ipc-client'
src/renderer/modules/auto-update/presentation/stores/autoUpdateStore.ts:
  Cannot find module '../infrastructure'
```
**建议**: 检查目录结构，修复相对路径

#### 2.5 缺失依赖类型
```
src/renderer/modules/task/presentation/components/cards/DraggableTaskCard.tsx:
  Cannot find module '@dnd-kit/sortable'
  Cannot find module '@dnd-kit/utilities'
```
**建议**: 运行 `pnpm add -D @dnd-kit/sortable @dnd-kit/utilities -F desktop`

#### 2.6 shared 模块问题
```
src/renderer/shared/infrastructure/index.ts: duplicate export 'getModuleContainer'
src/renderer/shared/infrastructure/module-registry.ts: 多个方法不存在
src/renderer/shared/testing/ipc-test-utils.ts: Mock 类型参数错误
src/renderer/shared/testing/store-test-utils.ts: Cannot find module '@testing-library/react'
```

---

## 修复优先级建议

### P0 - 立即修复 (阻塞 CI)
1. 添加缺失依赖: `date-fns`, `electron-updater`, `@dnd-kit/*`, `@testing-library/react`
2. 修复重复导出和导入路径问题

### P1 - 高优先级
1. 同步 IPC Channels 和 IPC Client 定义
2. 同步 DTO 定义和 Store 使用

### P2 - 中优先级
1. 添加测试自定义匹配器类型声明
2. 添加 null 检查消除 `possibly undefined` 警告

### P3 - 低优先级
1. 导出缺失的类型 (ShortcutConfig 等)
2. 调整类/方法访问性

---

## 快速修复命令

```bash
# 添加缺失依赖
pnpm add date-fns -F @dailyuse/application-client
pnpm add -D electron-updater @dnd-kit/sortable @dnd-kit/utilities @testing-library/react -F desktop

# 重新构建和检查
pnpm build:packages
pnpm typecheck
```
