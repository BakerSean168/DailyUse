# Dashboard Config 快速参考

## 📦 包导入指南

### Backend (API)

```typescript
// 从 domain-server 导入
import { DashboardConfig } from '@dailyuse/domain-server';
import type { IDashboardConfigRepository } from '@dailyuse/domain-server';

// 从 contracts 导入类型
import type { DashboardContracts } from '@dailyuse/contracts';
type WidgetConfigData = DashboardContracts.WidgetConfigData;
type WidgetConfigDTO = DashboardContracts.WidgetConfigDTO;
```

### Frontend (Web)

```typescript
// 从 contracts 导入类型
import type { DashboardContracts } from '@dailyuse/contracts';

type WidgetConfigData = DashboardContracts.WidgetConfigData;
type WidgetConfig = DashboardContracts.WidgetConfigDTO;
type WidgetSize = DashboardContracts.WidgetSize;
```

---

## 🔧 常用代码示例

### Backend - Repository

```typescript
import { DashboardConfig } from '@dailyuse/domain-server';

// 查找配置
const config = await repository.findByAccountUuid(accountUuid);

// 保存配置
const config = DashboardConfig.createDefault(accountUuid);
await repository.save(config);

// 从数据库 DTO 创建
const config = DashboardConfig.fromPersistence({
  id: data.id,
  accountUuid: data.accountUuid,
  widgetConfig: JSON.stringify(data.widgetConfig),
  createdAt: data.createdAt.getTime(),
  updatedAt: data.updatedAt.getTime(),
});

// 转换为持久化 DTO
const dto = config.toPersistence();
```

### Backend - Application Service

```typescript
import { DashboardConfig } from '@dailyuse/domain-server';

// 获取或创建配置
async getWidgetConfig(accountUuid: string) {
  let config = await this.repository.findByAccountUuid(accountUuid);

  if (!config) {
    config = DashboardConfig.createDefault(accountUuid);
    config = await this.repository.save(config);
  }

  return config.widgetConfig;
}

// 更新配置
async updateWidgetConfig(accountUuid: string, updates) {
  const config = await this.getOrCreateConfig(accountUuid);
  config.updateWidgetConfig(updates); // 聚合根方法
  await this.repository.save(config);
  return config.widgetConfig;
}

// 重置配置
async resetWidgetConfig(accountUuid: string) {
  const config = await this.getOrCreateConfig(accountUuid);
  config.resetToDefault(); // 聚合根方法
  await this.repository.save(config);
  return config.widgetConfig;
}
```

### Frontend - API Client

```typescript
import type { DashboardContracts } from '@dailyuse/contracts';

type WidgetConfigData = DashboardContracts.WidgetConfigData;

// 获取配置
const config: WidgetConfigData = await apiClient.get('/api/dashboard/widget-config');

// 更新配置
const updated: WidgetConfigData = await apiClient.put('/api/dashboard/widget-config', {
  configs: {
    'task-stats': { visible: false },
    'goal-stats': { order: 1 },
  },
});

// 重置配置
const defaults: WidgetConfigData = await apiClient.post('/api/dashboard/widget-config/reset');
```

### Frontend - Store

```typescript
import type { DashboardContracts } from '@dailyuse/contracts';

type WidgetConfig = DashboardContracts.WidgetConfigDTO;

const store = useDashboardConfigStore();

// 加载配置
await store.loadConfig();

// 更新配置
await store.updateConfig({
  'task-stats': { visible: false },
});

// 便捷方法
await store.showWidget('task-stats');
await store.hideWidget('reminder-stats');
await store.reorderWidgets({
  'task-stats': 3,
  'goal-stats': 1,
});
await store.resizeWidget('schedule-stats', DashboardContracts.WidgetSize.LARGE);
await store.resetConfig();

// 获取状态
const visible = store.visibleWidgets;
const config = store.getWidgetConfig('task-stats');
const isVisible = store.isWidgetVisible('goal-stats');
```

---

## 🎯 聚合根方法速查

### DashboardConfig (Server)

```typescript
// 工厂方法
DashboardConfig.fromDTO(dto)
DashboardConfig.fromPersistence(dto)
DashboardConfig.create(accountUuid, config?)
DashboardConfig.createDefault(accountUuid)

// 查询
config.getWidgetConfig(widgetId): WidgetConfigDTO | null
config.hasWidget(widgetId): boolean
config.getWidgetIds(): string[]
config.getVisibleWidgetIds(): string[]

// 业务操作
config.updateWidgetConfig(updates): void
config.replaceWidgetConfig(config): void
config.showWidget(widgetId): void
config.hideWidget(widgetId): void
config.reorderWidget(widgetId, order): void
config.resizeWidget(widgetId, size): void
config.resetToDefault(): void

// 验证
config.validate(): boolean
config.validateWidgetConfig(widgetId): boolean

// 转换
config.toDTO(): DashboardConfigServerDTO
config.toPersistence(): DashboardConfigPersistenceDTO
config.clone(): DashboardConfig
```

### DashboardConfig (Client)

```typescript
// 工厂方法
DashboardConfig.fromDTO(dto)
DashboardConfig.fromServerDTO(dto)
DashboardConfig.createDefault(accountUuid)

// 计算属性
config.getVisibleWidgetIds(): string[]
config.getWidgetCount(): number
config.getVisibleWidgetCount(): number
config.getWidgetConfig(widgetId): WidgetConfigDTO | null
config.isWidgetVisible(widgetId): boolean

// 业务操作（链式调用）
config.updateWidgetConfig(updates): DashboardConfig
config.showWidget(widgetId): DashboardConfig
config.hideWidget(widgetId): DashboardConfig
config.reorderWidget(widgetId, order): DashboardConfig
config.resizeWidget(widgetId, size): DashboardConfig
config.resetToDefault(): DashboardConfig

// 转换
config.toDTO(): DashboardConfigClientDTO
config.clone(): DashboardConfig
```

---

## 📋 默认配置

```typescript
const DEFAULT_WIDGET_CONFIG = {
  'task-stats': {
    visible: true,
    order: 1,
    size: DashboardContracts.WidgetSize.MEDIUM,
  },
  'goal-stats': {
    visible: true,
    order: 2,
    size: DashboardContracts.WidgetSize.MEDIUM,
  },
  'reminder-stats': {
    visible: true,
    order: 3,
    size: DashboardContracts.WidgetSize.SMALL,
  },
  'schedule-stats': {
    visible: true,
    order: 4,
    size: DashboardContracts.WidgetSize.SMALL,
  },
};
```

---

## 🔍 调试技巧

### 查看聚合根状态

```typescript
// Server
console.log('UUID:', config.uuid);
console.log('Account:', config.accountUuid);
console.log('Widget Config:', config.widgetConfig);
console.log('Visible Widgets:', config.getVisibleWidgetIds());
console.log('Valid:', config.validate());

// 转换为 JSON 查看
console.log(JSON.stringify(config.toDTO(), null, 2));
```

### 常见问题排查

**问题**: 配置不保存

```typescript
// 确保调用 save
const config = await repository.findByAccountUuid(accountUuid);
config.updateWidgetConfig(updates);
await repository.save(config); // ⚠️ 必须调用 save
```

**问题**: 类型错误

```typescript
// ❌ 错误：直接从 infrastructure 导入
import type { WidgetConfig } from '../infrastructure/types';

// ✅ 正确：从 contracts 导入
import type { DashboardContracts } from '@dailyuse/contracts';
type WidgetConfig = DashboardContracts.WidgetConfigDTO;
```

**问题**: 配置验证失败

```typescript
// 使用 validate 方法检查
if (!config.validate()) {
  console.error('Invalid config:', config.widgetConfig);
  // 检查每个 Widget
  for (const widgetId of config.getWidgetIds()) {
    if (!config.validateWidgetConfig(widgetId)) {
      console.error('Invalid widget:', widgetId, config.getWidgetConfig(widgetId));
    }
  }
}
```

---

## 📚 相关文档

- [完整重构报告](./DASHBOARD_CONFIG_DDD_REFACTOR_COMPLETE.md)
- [Progress Tracker](./DASHBOARD_PROGRESS_TRACKER.yaml)
- [Sprint 1 实现总结](./DASHBOARD_SPRINT1_IMPLEMENTATION_COMPLETE.md)

---

**最后更新**: 2025-11-12
