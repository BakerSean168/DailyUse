# Reminder Template Move & EffectiveEnabled 改进报告

## 问题描述
1. 移动分组功能使用通用的 `update` 方法，缺乏语义化
2. `effectiveEnabled` 计算逻辑不正确，没有考虑分组控制模式和分组启用状态
3. 缺少在关键状态变化时重新计算 `effectiveEnabled` 的机制

## 解决方案

### 1. 新增专用 moveToGroup 领域方法

**Domain Layer (ReminderTemplate)**
- 添加 `moveToGroup(targetGroupUuid: string | null)` 方法
- 发布 `reminder.template.moved` 领域事件
- 移除了通过 `update` 修改 `groupUuid` 的方式

**Application Layer**
- `ReminderApplicationService.moveTemplateToGroup()`: 
  - 验证目标分组存在性和账户一致性
  - 调用领域方法 `moveToGroup`
  - 重新计算 `effectiveEnabled`
  - 发布领域事件（触发 SSE 同步和 Schedule 任务更新）

**API Layer**
- 新增 `POST /api/reminders/templates/:uuid/move` 端点
- Request body: `{ targetGroupUuid: string | null }`
- `targetGroupUuid` 为 `null` 表示移出分组

**Frontend**
- 更新 `reminderApiClient.moveTemplateToGroup()` 调用新端点
- SSE 监听 `reminder:template:refresh` 事件，自动刷新 UI

### 2. 改进 effectiveEnabled 计算逻辑

**计算规则**（已在 ReminderTemplateControlService 中实现）：

```
如果模板未分组：
  effectiveEnabled = selfEnabled

如果模板分组且 group.controlMode = INDIVIDUAL：
  effectiveEnabled = selfEnabled

如果模板分组且 group.controlMode = GROUP：
  effectiveEnabled = selfEnabled AND group.enabled
```

**架构改进**：
- 从异步方法改为同步方法：
  - `isEffectivelyEnabled()` 现在直接返回 `boolean`（而非 `Promise<boolean>`）
  - 添加 `setEffectiveEnabled(value: boolean)` 用于外部更新缓存值
- 在聚合根内缓存计算结果 `_effectiveEnabled`，避免重复查询

### 3. 添加 effectiveEnabled 重新计算触发点

**触发场景**：

1. **模板 selfEnabled 变化时**（`enable()` / `pause()`）
   ```typescript
   template.enable();
   // 重新计算 effectiveEnabled
   const status = await controlService.calculateEffectiveStatus(template);
   template.setEffectiveEnabled(status.isEffectivelyEnabled);
   ```

2. **模板移动到新分组时**（`moveToGroup()`）
   ```typescript
   template.moveToGroup(targetGroupUuid);
   // 重新计算 effectiveEnabled
   const status = await controlService.calculateEffectiveStatus(template);
   template.setEffectiveEnabled(status.isEffectivelyEnabled);
   ```

3. **分组控制模式或启用状态变化时**
   - 分组层面的操作会触发 `ReminderGroupControlModeSwitched` 或 `ReminderGroupEnabled/Paused` 事件
   - 需要在应用层监听这些事件，批量更新该分组下所有模板的 `effectiveEnabled`
   - **TODO**: 实现分组事件监听器，批量更新模板状态

## 技术改进

### Domain Events
- 新增 `ReminderTemplateMovedEvent` 类型
- 包含 `oldGroupUuid` 和 `newGroupUuid` 信息

### SSE 同步
- `ReminderEventHandler` 监听 `reminder.template.moved` 事件
- 通过 SSE 推送给前端，自动刷新 UI

### 类型安全
- 更新 Contracts 接口，明确 `moveToGroup` 和 `setEffectiveEnabled` 方法签名
- `isEffectivelyEnabled()` 从 `Promise<boolean>` 改为同步 `boolean`

## 文件变更清单

### Backend
1. **packages/domain-server/src/reminder/aggregates/ReminderTemplate.ts**
   - ✅ 添加 `_effectiveEnabled` 字段
   - ✅ 添加 `moveToGroup()` 方法
   - ✅ 添加 `setEffectiveEnabled()` 方法
   - ✅ 改进 `enable()` / `pause()` 更新 effectiveEnabled
   - ✅ 改为同步的 `isEffectivelyEnabled()`

2. **packages/contracts/src/modules/reminder/aggregates/ReminderTemplateServer.ts**
   - ✅ 更新接口方法签名
   - ✅ 添加 `ReminderTemplateMovedEvent` 事件类型

3. **apps/api/src/modules/reminder/application/services/ReminderApplicationService.ts**
   - ✅ 添加 `moveTemplateToGroup()` 方法
   - ✅ 在 `toggleReminderTemplateStatus()` 中重新计算 effectiveEnabled

4. **apps/api/src/modules/reminder/interface/http/ReminderController.ts**
   - ✅ 添加 `moveTemplateToGroup()` 控制器方法

5. **apps/api/src/modules/reminder/interface/http/reminderRoutes.ts**
   - ✅ 添加 `POST /templates/:uuid/move` 路由

6. **apps/api/src/modules/reminder/application/event-handlers/ReminderEventHandler.ts**
   - ✅ 监听 `reminder.template.moved` 事件
   - ✅ 推送 SSE 事件

### Frontend
7. **apps/web/src/modules/reminder/infrastructure/api/reminderApiClient.ts**
   - ✅ 更新 `moveTemplateToGroup()` 调用新端点（POST /move）

## 待办事项

### 高优先级
1. **实现分组状态变化监听器**
   - 当 Group 的 `controlMode` 或 `enabled` 变化时
   - 批量更新该分组下所有模板的 `effectiveEnabled`
   - 发布 SSE 事件通知前端刷新

2. **测试完整流程**
   - 测试移动到分组功能
   - 测试 effectiveEnabled 计算逻辑
   - 测试 SSE 同步

### 中优先级
3. **添加单元测试**
   - `ReminderTemplate.moveToGroup()` 测试
   - `ReminderTemplateControlService.calculateEffectiveStatus()` 测试
   - 各种边界情况（分组不存在、账户不一致等）

4. **前端 UI 改进**
   - 移动到分组时显示 loading 状态
   - 显示 effectiveEnabled 与 selfEnabled 的差异
   - 分组控制模式提示

## 使用示例

### 移动模板到分组

**API 请求**:
```typescript
POST /api/reminders/templates/{uuid}/move
Content-Type: application/json

{
  "targetGroupUuid": "group-uuid-123"  // 或 null 移出分组
}
```

**前端调用**:
```typescript
await reminderApiClient.moveTemplateToGroup(templateUuid, targetGroupUuid);
// UI 自动通过 SSE 刷新
```

### 查询实际启用状态

```typescript
// 领域层（同步）
const isEnabled = template.isEffectivelyEnabled();

// 应用层（需要重新计算时）
const status = await controlService.calculateEffectiveStatus(template);
template.setEffectiveEnabled(status.isEffectivelyEnabled);
```

## 影响范围

- ✅ 不影响现有 update 端点（仍可用于更新其他字段）
- ✅ SSE 同步机制已扩展支持 moved 事件
- ✅ Schedule 模块通过事件监听自动更新任务状态
- ⚠️ 需要确保前端逻辑使用新的 `moveToGroup` 端点

## 总结

本次改进通过添加专用的 `moveToGroup` 方法和改进 `effectiveEnabled` 计算逻辑，使 Reminder 模块的状态管理更加清晰和可靠。核心改进包括：

1. 语义化的移动操作（`moveToGroup` vs 通用 `update`）
2. 正确的启用状态计算（考虑分组控制模式）
3. 自动的状态同步机制（通过领域事件和 SSE）
4. 性能优化（缓存 effectiveEnabled，减少数据库查询）

下一步需要实现分组状态变化的监听和批量更新逻辑，以确保整个系统的状态一致性。
