# Notification 模块重构总结

## 📋 重构目标

将 notification 模块的代码结构调整为符合项目规范，参考 goal 模块的标准架构。

## ✅ 重构内容

### 1. 目录结构调整

**之前的结构（不规范）：**
```
notification/
├── api/                           ❌ 应该在 infrastructure/
├── components/                    ❌ 应该在 presentation/
├── composables/                   ❌ 应该在 presentation/
├── pages/                         ❌ 应该在 presentation/views/
├── utils/                         ❌ 应该整合到其他目录
├── application/
├── infrastructure/
├── initialization/
└── presentation/
```

**重构后的结构（符合规范）：**
```
notification/
├── application/
│   ├── events/
│   ├── handlers/
│   ├── initialization/
│   ├── services/
│   └── types.ts
├── infrastructure/
│   ├── api/                       ✅ API 客户端
│   │   └── notificationApiClient.ts
│   ├── browser/
│   ├── services/
│   ├── sse/
│   │   ├── SSEClient.ts
│   │   └── sseDebug.ts           ✅ 从 utils/ 移入
│   └── storage/
├── initialization/
│   ├── notificationInitialization.ts
│   └── sseInitialization.ts
└── presentation/
    ├── components/                ✅ 所有 Vue 组件
    │   ├── NotificationBell.vue
    │   ├── NotificationDrawer.vue
    │   └── ...
    ├── composables/               ✅ 所有 composables
    │   ├── useNotification.ts
    │   ├── useReminderStatistics.ts
    │   └── useWebSocket.ts
    ├── router/
    │   └── index.ts
    ├── stores/                    ✅ 预留（目前使用 composables）
    ├── views/                     ✅ 页面组件（原 pages/）
    │   ├── NotificationListPage.vue
    │   └── SSEMonitorPage.vue
    └── widgets/                   ✅ 预留
```

### 2. 文件移动记录

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `api/NotificationApiClient.ts` | `infrastructure/api/notificationApiClient.ts` | API 客户端统一放在 infrastructure/api/ |
| `components/*.vue` | `presentation/components/*.vue` | 所有组件移到 presentation/components/ |
| `components/index.ts` | `presentation/components/index.ts` | 组件导出文件 |
| `composables/*.ts` | `presentation/composables/*.ts` | 所有 composables 移到 presentation/composables/ |
| `pages/*.vue` | `presentation/views/*.vue` | 页面组件改名为 views |
| `utils/sseDebug.ts` | `infrastructure/sse/sseDebug.ts` | SSE 调试工具移到 SSE 目录 |

### 3. 导入路径更新

#### 3.1 外部引用更新

| 文件 | 原导入 | 新导入 |
|------|--------|--------|
| `reminder/presentation/widgets/ReminderStatsWidget.vue` | `@/modules/notification/composables/useReminderStatistics` | `@/modules/notification/presentation/composables/useReminderStatistics` |
| `main.ts` | `./modules/notification/utils/sseDebug` | `./modules/notification/infrastructure/sse/sseDebug` |

#### 3.2 模块内部更新

| 文件 | 原导入 | 新导入 |
|------|--------|--------|
| `presentation/composables/useNotification.ts` | `../api/NotificationApiClient` | `../../infrastructure/api/notificationApiClient` |
| `presentation/router/index.ts` | `../../pages/NotificationListPage.vue` | `../views/NotificationListPage.vue` |

### 4. 索引文件优化

**更新 `index.ts`**（参考 goal 模块结构）：

```typescript
/**
 * Notification 模块入口
 */

// ===== Application Layer =====
export { NotificationService } from './application/services/NotificationService';
export { InAppNotificationService } from './application/services/InAppNotificationService';
// ... 其他 application 导出

// ===== Infrastructure Layer =====
export { notificationApiClient } from './infrastructure/api/notificationApiClient';
export { DesktopNotificationService } from './infrastructure/services/DesktopNotificationService';
// ... 其他 infrastructure 导出

// ===== Presentation Layer =====
export { default as InAppNotification } from './presentation/components/InAppNotification.vue';
export { useNotification } from './presentation/composables/useNotification';
export { useReminderStatistics } from './presentation/composables/useReminderStatistics';
// ... 其他 presentation 导出

// ===== Initialization =====
export { registerNotificationInitializationTasks } from './initialization/notificationInitialization';
```

**新增 `presentation/composables/index.ts`**：

```typescript
export { useNotification } from './useNotification';
export { useReminderStatistics } from './useReminderStatistics';
export { useWebSocket } from './useWebSocket';
```

## 🎯 重构原则（参考 goal 模块）

### 1. **分层原则**
- ✅ **Application Layer**：业务逻辑、应用服务、事件处理
- ✅ **Infrastructure Layer**：API 客户端、外部服务、存储、SSE
- ✅ **Presentation Layer**：组件、composables、stores、views、路由

### 2. **命名规范**
- ✅ API 客户端：小驼峰命名（`notificationApiClient.ts`）
- ✅ 组件：大驼峰命名（`NotificationBell.vue`）
- ✅ Composables：`use` 前缀（`useNotification.ts`）
- ✅ Views：`*Page.vue` 或 `*View.vue` 后缀

### 3. **目录规范**
- ✅ `infrastructure/api/`：所有 API 客户端
- ✅ `presentation/components/`：所有可复用组件
- ✅ `presentation/composables/`：所有 composables
- ✅ `presentation/views/`：所有页面组件
- ✅ `presentation/stores/`：所有 Pinia stores（如果使用）
- ✅ `presentation/widgets/`：Dashboard widgets（如果有）

### 4. **导出规范**
- ✅ 按层次分组导出（Application → Infrastructure → Presentation）
- ✅ 使用注释分隔不同层次
- ✅ 导出类型和实现

## 🔍 验证结果

### 编译检查
```bash
✅ useNotification.ts - No errors found
✅ router/index.ts - No errors found
✅ index.ts - No errors found
✅ main.ts - No errors found
```

### 目录结构对比

**Goal 模块（标准）：**
```
goal/
├── application/
├── infrastructure/
│   └── api/
├── initialization/
└── presentation/
    ├── components/
    ├── composables/
    ├── router/
    ├── stores/
    ├── views/
    └── widgets/
```

**Notification 模块（重构后）：**
```
notification/
├── application/
├── infrastructure/
│   └── api/              ✅
├── initialization/
└── presentation/
    ├── components/       ✅
    ├── composables/      ✅
    ├── router/           ✅
    ├── stores/           ✅ (预留)
    ├── views/            ✅
    └── widgets/          ✅ (预留)
```

## 📊 重构统计

- **移动的目录**：5 个（api, components, composables, pages, utils）
- **移动的文件**：20+ 个
- **更新的导入**：4 处
- **新增的索引**：1 个（presentation/composables/index.ts）
- **删除的目录**：5 个（旧的空目录）

## 🎉 重构收益

1. ✅ **统一规范**：与其他模块（goal、task、reminder 等）保持一致的目录结构
2. ✅ **清晰分层**：application、infrastructure、presentation 职责明确
3. ✅ **易于维护**：相同类型的文件集中管理，便于查找和修改
4. ✅ **可扩展性**：预留了 stores 和 widgets 目录，支持未来扩展
5. ✅ **向后兼容**：所有导入路径已更新，不影响现有功能

## 📝 后续建议

1. **考虑添加 Store**：如果 notification 状态管理变复杂，可以从 composables 迁移到 Pinia store
2. **添加 Widgets**：可以为 Dashboard 创建通知相关的 widget
3. **统一测试**：在 `presentation/composables/__tests__/` 添加单元测试
4. **文档更新**：更新 README.md 中的导入示例，使用新的路径

## 🔗 相关文档

- `apps/web/src/modules/goal/` - Goal 模块（标准参考）
- `apps/web/src/modules/task/` - Task 模块（标准参考）
- `apps/web/src/modules/reminder/` - Reminder 模块（标准参考）
