# 路由架构重构说明

## 📋 概述

本次重构将各模块的路由定义从全局路由文件中分离，移动到各模块的 `presentation/router` 目录下，实现了更清晰的模块化架构。

## 🎯 重构目标

1. **模块自治**：每个模块管理自己的路由配置
2. **代码清晰**：主路由文件更简洁，只负责组装
3. **易于维护**：模块路由变更不影响其他模块
4. **符合DDD**：路由配置属于展示层，放在 presentation 层更合理

## 📁 新架构

### 目录结构

```
apps/web/src/modules/
├── task/
│   └── presentation/
│       └── router/
│           └── index.ts          # 导出 taskRoutes
├── goal/
│   └── presentation/
│       └── router/
│           └── index.ts          # 导出 goalRoutes
├── reminder/
│   └── presentation/
│       └── router/
│           └── index.ts          # 导出 reminderRoutes
├── schedule/
│   └── presentation/
│       └── router/
│           └── index.ts          # 导出 scheduleRoutes
├── repository/
│   └── presentation/
│       └── router/
│           └── index.ts          # 导出 repositoryRoutes
├── account/
│   └── presentation/
│       └── router/
│           └── index.ts          # 导出 accountRoutes
└── setting/
    └── presentation/
        └── router/
            └── index.ts          # 导出 settingRoutes
```

### 主路由文件简化

**Before（混乱）：**
```typescript
// routes.ts - 所有路由定义混在一起，文件冗长
export const appRoutes = [
  {
    path: '/',
    children: [
      { path: '/tasks', ... },      // 100+ 行
      { path: '/goals', ... },      // 100+ 行
      { path: '/reminders', ... },  // 50+ 行
      { path: '/schedule', ... },   // 50+ 行
      // ... 更多路由
    ]
  }
];
```

**After（清晰）：**
```typescript
// routes.ts - 只负责导入和组装
import { taskRoutes } from '@/modules/task/presentation/router';
import { goalRoutes } from '@/modules/goal/presentation/router';
import { reminderRoutes } from '@/modules/reminder/presentation/router';
import { scheduleRoutes } from '@/modules/schedule/presentation/router';
import { repositoryRoutes } from '@/modules/repository/presentation/router';
import { accountRoutes } from '@/modules/account/presentation/router';
import { settingRoutes } from '@/modules/setting/presentation/router';

export const appRoutes = [
  {
    path: '/',
    children: [
      { path: '', name: 'dashboard', ... },  // 仪表盘
      ...taskRoutes,                          // 任务模块路由
      ...goalRoutes,                          // 目标模块路由
      ...reminderRoutes,                      // 提醒模块路由
      ...scheduleRoutes,                      // 调度模块路由
      { path: '/repository', ... },          // 知识仓库
      ...repositoryRoutes,                    // 仓储管理路由
      ...accountRoutes,                       // 账户设置路由
      ...settingRoutes,                       // 应用设置路由
      { path: '/assets-demo', ... },         // 资源演示
    ]
  }
];
```

## 🔨 重构步骤

### 1. Schedule 模块（示例）

原位置：`apps/web/src/modules/schedule/router/index.ts`
新位置：`apps/web/src/modules/schedule/presentation/router/index.ts`

```bash
# 移动到 presentation 层
Move-Item router/index.ts presentation/router/index.ts
```

**修改导入路径：**
```typescript
// Before
component: () => import('../presentation/views/ScheduleDashboardView.vue')

// After
component: () => import('../views/ScheduleDashboardView.vue')
```

### 2. 其他模块

为每个模块创建 `presentation/router/index.ts`，导出路由配置：

```typescript
// task/presentation/router/index.ts
export const taskRoutes: RouteRecordRaw[] = [
  {
    path: '/tasks',
    name: 'tasks',
    meta: { ... },
    children: [
      // 子路由配置
    ],
  },
];
```

### 3. 更新主路由

在 `apps/web/src/shared/router/routes.ts` 中：

1. 导入各模块路由
2. 使用展开运算符组装
3. 删除重复的路由定义

## ✅ 验证

### 编译检查
```bash
pnpm nx build web
```

### 运行时测试
1. 启动应用：`pnpm nx dev web`
2. 访问各模块路由：
   - `/tasks` - 任务管理
   - `/goals` - 目标管理
   - `/reminders` - 提醒管理
   - `/schedule` - 调度管理
   - `/repositories` - 仓储管理
   - `/account` - 账户设置
   - `/settings` - 应用设置

### 导航测试
- 侧边栏导航正常
- 路由跳转正常
- 子路由正常工作

## 📊 重构效果

### 代码指标

| 指标 | Before | After | 改进 |
|------|--------|-------|------|
| routes.ts 行数 | ~400 行 | ~150 行 | ↓ 62.5% |
| 模块耦合度 | 高（集中定义） | 低（模块独立） | ✅ |
| 可维护性 | 中 | 高 | ✅ |
| 代码重用性 | 低 | 高 | ✅ |

### 模块化收益

1. **独立开发**：模块路由变更不影响其他模块
2. **清晰职责**：路由配置归属明确
3. **易于测试**：可单独测试模块路由
4. **便于扩展**：新增模块只需添加一行导入

## 🔄 迁移指南

### 新增模块路由

1. 在模块的 `presentation` 目录下创建 `router/index.ts`
2. 导出路由配置：
   ```typescript
   export const xxxRoutes: RouteRecordRaw[] = [...]
   ```
3. 在主路由文件中导入并使用：
   ```typescript
   import { xxxRoutes } from '@/modules/xxx/presentation/router';
   // ...
   children: [...xxxRoutes]
   ```

### 修改现有路由

直接修改对应模块的 `presentation/router/index.ts` 即可，无需改动主路由文件。

## 🎯 最佳实践

1. **路由命名规范**：
   - 模块路由变量：`{moduleName}Routes`
   - 路由名称：`{module}-{feature}-{action}`

2. **路径规范**：
   - 一级路径：`/{module-name}`
   - 子路径：相对路径

3. **Meta 信息**：
   - `title`：页面标题
   - `showInNav`：是否显示在导航中
   - `icon`：导航图标
   - `order`：导航排序
   - `requiresAuth`：是否需要认证

## 📝 注意事项

1. **导入路径**：使用 `@/modules` 别名
2. **组件导入**：模块内使用相对路径 `../views/`
3. **路由顺序**：通过 `meta.order` 控制导航顺序
4. **懒加载**：所有组件使用动态导入 `() => import(...)`

## 🔗 相关文档

- [Vue Router 官方文档](https://router.vuejs.org/)
- [DDD 分层架构](../docs/architecture-web.md)
- [模块化指南](../docs/module-guidelines.md)

## 📅 变更历史

- 2025-11-05: 完成路由架构重构
  - 移动 Schedule 模块路由到 presentation 层
  - 为其他 6 个模块创建独立路由配置
  - 简化主路由文件
  - 验证所有路由正常工作
