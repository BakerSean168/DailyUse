# Dashboard 完善 - User Stories & Sprint Planning

**文档类型**: Sprint Backlog  
**负责人**: Scrum Master (SM)  
**日期**: 2025-11-12  
**Sprint**: Sprint 1-4 (8周)  
**状态**: Ready for Planning

---

## 🎯 Epic Overview

**Epic**: Dashboard 完善 - 打造个性化工作台

**Epic Owner**: Product Owner  
**Target Release**: 2025-Q1  
**Story Points Total**: 130 SP

---

## 📦 Sprint 1: 基础架构 + 统计聚合（Week 1-2）

**Sprint Goal**: 搭建 Dashboard 基础架构，实现统计数据聚合和缓存

**Story Points**: 34 SP  
**Duration**: 2 weeks

---

### Story 1.1: 后端统计聚合服务 🔧

**As a** Developer  
**I want** 创建统计聚合服务  
**So that** 前端可以通过单个接口获取所有模块的统计数据

**Priority**: P0 (Must Have)  
**Story Points**: 8 SP  
**Acceptance Criteria**:

- [ ] 创建 `aggregation` 模块目录结构
- [ ] 实现 `TaskStatisticsService.getStatistics(accountUuid)`
- [ ] 实现 `GoalStatisticsService.getStatistics(accountUuid)`
- [ ] 实现 `ReminderStatisticsService.getStatistics(accountUuid)`
- [ ] 实现 `StatisticsAggregationService.getAggregatedStatistics(accountUuid)`
- [ ] 并行获取所有统计数据（Promise.all）
- [ ] 响应时间 < 500ms（单个用户）
- [ ] 单元测试覆盖率 > 80%

**Tasks**:

```
[后端] Task 1.1.1: 创建 aggregation 模块结构 (1 SP)
  - 创建目录 apps/api/src/modules/aggregation/
  - 添加 application/services/
  - 添加 interface/http/controllers/
  - 添加 types/

[后端] Task 1.1.2: 实现 TaskStatisticsService (2 SP)
  - 创建 TaskStatisticsService.ts
  - 实现 countByAccount() 方法（使用 Prisma count）
  - 实现 countByAccountAndStatus() 方法
  - 实现 countOverdueByAccount() 方法
  - 返回 TaskStatistics 接口
  - 编写单元测试

[后端] Task 1.1.3: 实现 GoalStatisticsService (2 SP)
  - 创建 GoalStatisticsService.ts
  - 实现 countByAccount() 方法
  - 实现 countByStatus() 方法
  - 实现 calculateAverageProgress() 方法
  - 返回 GoalStatistics 接口
  - 编写单元测试

[后端] Task 1.1.4: 实现 ReminderStatisticsService (1 SP)
  - 创建 ReminderStatisticsService.ts
  - 实现 countPending() 方法
  - 实现 countTodayReminders() 方法
  - 返回 ReminderStatistics 接口

[后端] Task 1.1.5: 实现 StatisticsAggregationService (2 SP)
  - 创建 StatisticsAggregationService.ts
  - 并行调用所有 Statistics Services
  - 聚合结果为 AggregatedStatistics
  - 添加 metadata (generatedAt, cacheMaxAge)
  - 实现 generateETag() 方法
  - 编写集成测试
```

**Definition of Done**:

- [x] 代码已提交并通过 Code Review
- [x] 单元测试通过（>80% 覆盖率）
- [x] 集成测试通过
- [x] API 文档已更新（Swagger）
- [x] 无 ESLint/TypeScript 错误

---

### Story 1.2: 统计聚合 HTTP 接口 🌐

**As a** Frontend Developer  
**I want** 一个 HTTP 接口来获取统计数据  
**So that** 我可以在 Dashboard 显示统计信息

**Priority**: P0 (Must Have)  
**Story Points**: 5 SP  
**Acceptance Criteria**:

- [ ] 创建 `GET /api/v1/stats/summary` 接口
- [ ] 需要认证（authMiddleware）
- [ ] 支持 ETag 缓存（304 Not Modified）
- [ ] 支持 Cache-Control 头
- [ ] 支持 Last-Modified 头
- [ ] 错误处理完善（500, 401, 403）
- [ ] Swagger 文档完整

**Tasks**:

```
[后端] Task 1.2.1: 创建 StatisticsAggregationController (2 SP)
  - 创建 StatisticsAggregationController.ts
  - 实现 getSummary(req, res) 方法
  - 从 JWT 中提取 accountUuid
  - 调用 StatisticsAggregationService
  - 生成 ETag
  - 检查客户端 ETag（If-None-Match）
  - 返回 304 或 200
  - 设置缓存头

[后端] Task 1.2.2: 创建 aggregation 路由 (1 SP)
  - 创建 aggregationRoutes.ts
  - 注册 GET /stats/summary
  - 添加 authMiddleware
  - 添加 Swagger 注释

[后端] Task 1.2.3: 集成到主应用 (1 SP)
  - 在 apps/api/src/app.ts 中注册路由
  - 测试路由可访问
  - 测试认证中间件工作

[后端] Task 1.2.4: 编写 API 测试 (1 SP)
  - 测试成功响应（200）
  - 测试 ETag 缓存（304）
  - 测试未认证（401）
  - 测试错误处理（500）
```

**Definition of Done**:

- [x] Postman/Thunder Client 测试通过
- [x] Swagger 文档可访问
- [x] E2E 测试通过
- [x] 性能测试通过（< 500ms）

---

### Story 1.3: 前端统计缓存 Store 📦

**As a** User  
**I want** Dashboard 快速加载统计数据  
**So that** 我不需要等待很久就能看到信息

**Priority**: P0 (Must Have)  
**Story Points**: 8 SP  
**Acceptance Criteria**:

- [ ] 创建 `dashboardStatsStore.ts` (Pinia)
- [ ] 实现内存缓存（5 分钟有效期）
- [ ] 实现 `fetchStats(forceRefresh)` 方法
- [ ] 支持增量更新 `incrementStat(module, field, delta)`
- [ ] 集成 Event Bus 监听各模块事件
- [ ] 支持协商缓存（ETag）
- [ ] 错误处理和降级

**Tasks**:

```
[前端] Task 1.3.1: 创建 dashboardStatsStore (3 SP)
  - 创建 apps/web/src/modules/dashboard/presentation/stores/dashboardStatsStore.ts
  - 定义 ModuleStats 接口
  - 定义 state: stats, lastFetchTime, isLoading, error
  - 实现 computed: isCacheValid, totalItems
  - 实现 action: fetchStats(forceRefresh)
  - 实现 action: incrementStat(module, field, delta)
  - 实现 action: clearCache(), reset()

[前端] Task 1.3.2: 实现 API 客户端 (2 SP)
  - 创建 apps/web/src/modules/dashboard/api/dashboardApi.ts
  - 实现 fetchStatsSummary() 方法
  - 添加 Authorization 头
  - 添加 If-None-Match 头（ETag）
  - 处理 304 响应
  - 处理错误

[前端] Task 1.3.3: 集成 Event Bus (2 SP)
  - 监听 'task:created' 事件 → incrementStat('tasks', 'total')
  - 监听 'task:completed' 事件 → incrementStat('tasks', 'completed')
  - 监听 'task:deleted' 事件 → incrementStat('tasks', 'total', -1)
  - 监听 'goal:created', 'goal:completed' 事件
  - 监听 'reminder:created', 'reminder:triggered' 事件
  - 编写单元测试

[前端] Task 1.3.4: 编写 Store 测试 (1 SP)
  - 测试缓存有效期
  - 测试增量更新
  - 测试 Event Bus 集成
  - Mock API 调用
```

**Definition of Done**:

- [x] Vitest 单元测试通过
- [x] 缓存逻辑正确（时间戳验证）
- [x] Event Bus 事件正确触发
- [x] 无内存泄漏（监听器正确移除）

---

### Story 1.4: Contracts 定义 📋

**As a** Developer  
**I want** 共享的 TypeScript 类型定义  
**So that** 前后端类型一致，减少错误

**Priority**: P0 (Must Have)  
**Story Points**: 3 SP  
**Acceptance Criteria**:

- [ ] 创建 `dashboard.contracts.ts`
- [ ] 定义所有统计相关的 DTO
- [ ] 定义 Widget 相关的接口
- [ ] 前后端导入无错误

**Tasks**:

```
[前端] Task 1.4.1: 创建 dashboard.contracts.ts (2 SP)
  - 创建 packages/contracts/src/modules/dashboard/dashboard.contracts.ts
  - 定义 TaskStatistics 接口
  - 定义 GoalStatistics 接口
  - 定义 ReminderStatistics 接口
  - 定义 RepositoryStatistics 接口
  - 定义 AggregatedStatistics 接口
  - 定义 WidgetDefinition 接口
  - 定义 WidgetConfig 接口

[前端] Task 1.4.2: 更新前后端导入 (1 SP)
  - 后端导入 contracts
  - 前端导入 contracts
  - 验证类型检查通过
```

**Definition of Done**:

- [x] TypeScript 编译无错误
- [x] 前后端都能正确导入
- [x] JSDoc 注释完整

---

### Story 1.5: 骨架屏组件库 🎨

**As a** User  
**I want** 看到页面结构的轮廓  
**So that** 我知道数据正在加载，体验更好

**Priority**: P1 (Should Have)  
**Story Points**: 5 SP  
**Acceptance Criteria**:

- [ ] 创建 `SkeletonCard.vue` 通用组件
- [ ] 创建 `SkeletonText.vue` 组件
- [ ] 创建 `SkeletonAvatar.vue` 组件
- [ ] 支持自定义行数、宽度
- [ ] 支持动画开关
- [ ] 响应式适配

**Tasks**:

```
[前端] Task 1.5.1: 创建 SkeletonCard 组件 (2 SP)
  - 创建 apps/web/src/shared/components/skeleton/SkeletonCard.vue
  - 支持 props: rows, animated, showHeader, showFooter
  - 实现渐变动画（CSS）
  - 编写 Storybook stories

[前端] Task 1.5.2: 创建 SkeletonText 组件 (1 SP)
  - 创建 SkeletonText.vue
  - 支持自定义宽度、高度
  - 复用动画样式

[前端] Task 1.5.3: 创建 SkeletonAvatar 组件 (1 SP)
  - 创建 SkeletonAvatar.vue
  - 支持圆形、方形
  - 支持不同尺寸

[前端] Task 1.5.4: 创建 DashboardSkeleton 组件 (1 SP)
  - 创建 DashboardSkeleton.vue
  - 组合多个 SkeletonCard
  - 模拟真实 Dashboard 布局
```

**Definition of Done**:

- [x] 组件在 Storybook 中可预览
- [x] 动画流畅（60fps）
- [x] 响应式适配良好

---

### Story 1.6: Dashboard 基础页面 📄

**As a** User  
**I want** 一个 Dashboard 页面  
**So that** 我可以看到统计信息

**Priority**: P0 (Must Have)  
**Story Points**: 5 SP  
**Acceptance Criteria**:

- [ ] 创建 `DashboardView.vue`
- [ ] 集成 `dashboardStatsStore`
- [ ] 显示统计卡片（任务、目标、提醒数量）
- [ ] 首次加载显示骨架屏
- [ ] 加载完成后淡入动画
- [ ] 错误状态显示友好提示

**Tasks**:

```
[前端] Task 1.6.1: 创建 DashboardView.vue (2 SP)
  - 创建 apps/web/src/modules/dashboard/presentation/views/DashboardView.vue
  - 使用 v-if/v-else 切换骨架屏和内容
  - 调用 dashboardStatsStore.fetchStats()
  - 显示 loading/error 状态

[前端] Task 1.6.2: 创建统计卡片组件 (2 SP)
  - 创建 StatsCard.vue
  - 接收 props: title, value, icon, color
  - 使用 Vuetify v-card
  - 添加 Hover 动画

[前端] Task 1.6.3: 集成路由 (1 SP)
  - 在 router/index.ts 中添加 /dashboard 路由
  - 设置为默认首页
  - 测试路由跳转
```

**Definition of Done**:

- [x] 页面可正常访问
- [x] 数据正确显示
- [x] 骨架屏正常工作
- [x] 响应式适配良好

---

## 📦 Sprint 2: Task & Goal Widgets（Week 3-4）

**Sprint Goal**: 实现任务和目标小组件，支持快速操作

**Story Points**: 32 SP  
**Duration**: 2 weeks

---

### Story 2.1: Task Widget 组件 ✅

**As a** User  
**I want** 在 Dashboard 看到今日任务列表  
**So that** 我可以快速查看和完成任务

**Priority**: P0 (Must Have)  
**Story Points**: 8 SP  
**Acceptance Criteria**:

- [ ] 显示今日待办任务（默认 10 条）
- [ ] 支持勾选完成任务
- [ ] 支持快速创建任务
- [ ] 点击任务跳转到详情页
- [ ] 支持排序（按优先级、截止日期）
- [ ] 空状态友好提示
- [ ] 配套骨架屏

**Tasks**:

```
[前端] Task 2.1.1: 创建 TaskWidget.vue (3 SP)
  - 创建 apps/web/src/modules/task/presentation/widgets/TaskWidget.vue
  - 获取任务列表（调用 taskStore）
  - 显示任务列表（v-for）
  - 实现勾选完成（调用 completeTask）
  - 实现点击跳转
  - 处理 loading/error 状态

[前端] Task 2.1.2: 创建 TaskQuickAdd 组件 (2 SP)
  - 创建内嵌的快速创建表单
  - 输入框 + 创建按钮
  - 按 Enter 键提交
  - 成功后清空输入框
  - 失败显示错误提示

[前端] Task 2.1.3: 创建 TaskWidgetSkeleton (1 SP)
  - 创建 TaskWidgetSkeleton.vue
  - 模拟任务列表布局
  - 复用 SkeletonCard 组件

[前端] Task 2.1.4: 创建 Widget 注册信息 (1 SP)
  - 创建 apps/web/src/modules/task/presentation/widgets/index.ts
  - 导出 taskWidgets: WidgetDefinition[]
  - 定义 id, name, component, icon, category
  - 定义 defaultSize, minSize, maxSize

[前端] Task 2.1.5: 编写 Widget 测试 (1 SP)
  - 测试任务列表渲染
  - 测试完成任务
  - 测试快速创建
  - Mock API 调用
```

**Definition of Done**:

- [x] 组件功能完整
- [x] 单元测试通过
- [x] 响应式适配
- [x] 无性能问题

---

### Story 2.2: Goal Widget 组件 🎯

**As a** User  
**I want** 在 Dashboard 看到我的目标进展  
**So that** 我可以快速了解目标完成情况

**Priority**: P0 (Must Have)  
**Story Points**: 8 SP  
**Acceptance Criteria**:

- [ ] 显示进行中的目标（默认 3 个）
- [ ] 显示目标标题和描述
- [ ] 显示进度百分比（环形图）
- [ ] 显示关键结果数量
- [ ] 点击展开查看 KRs
- [ ] 点击目标跳转到详情页
- [ ] 配套骨架屏

**Tasks**:

```
[前端] Task 2.2.1: 创建 GoalWidget.vue (3 SP)
  - 创建 apps/web/src/modules/goal/presentation/widgets/GoalWidget.vue
  - 获取进行中的目标（调用 goalStore）
  - 显示目标列表
  - 使用 Vuetify v-progress-circular 显示进度
  - 实现展开/收起 KRs
  - 实现点击跳转

[前端] Task 2.2.2: 创建 GoalProgressCard 组件 (2 SP)
  - 创建单个目标卡片组件
  - 显示目标信息
  - 显示进度环形图
  - 显示 KRs 列表（可折叠）

[前端] Task 2.2.3: 创建 GoalWidgetSkeleton (1 SP)
  - 创建 GoalWidgetSkeleton.vue
  - 模拟目标卡片布局

[前端] Task 2.2.4: 创建 Widget 注册信息 (1 SP)
  - 创建 apps/web/src/modules/goal/presentation/widgets/index.ts
  - 导出 goalWidgets

[前端] Task 2.2.5: 编写 Widget 测试 (1 SP)
  - 测试目标列表渲染
  - 测试进度计算
  - 测试展开/收起
```

**Definition of Done**:

- [x] 组件功能完整
- [x] 进度计算准确
- [x] 动画流畅

---

### Story 2.3: Reminder Widget 组件 🔔

**As a** User  
**I want** 在 Dashboard 看到今日提醒  
**So that** 我不会错过重要事项

**Priority**: P1 (Should Have)  
**Story Points**: 5 SP  
**Acceptance Criteria**:

- [ ] 显示今日/本周提醒
- [ ] 按时间排序
- [ ] 显示提醒时间和内容
- [ ] 支持标记完成
- [ ] 支持推迟
- [ ] 配套骨架屏

**Tasks**:

```
[前端] Task 2.3.1: 创建 ReminderWidget.vue (2 SP)
  - 创建 apps/web/src/modules/reminder/presentation/widgets/ReminderWidget.vue
  - 获取今日提醒（调用 reminderStore）
  - 显示提醒列表
  - 实现标记完成
  - 实现推迟功能

[前端] Task 2.3.2: 创建 ReminderWidgetSkeleton (1 SP)
  - 创建 ReminderWidgetSkeleton.vue

[前端] Task 2.3.3: 创建 Widget 注册信息 (1 SP)
  - 创建 index.ts

[前端] Task 2.3.4: 编写测试 (1 SP)
  - 测试提醒列表渲染
  - 测试完成功能
```

**Definition of Done**:

- [x] 组件功能完整
- [x] 时间排序正确

---

### Story 2.4: Widget Registry 系统 🔌

**As a** Developer  
**I want** 一个 Widget 注册系统  
**So that** 可以动态加载和管理 Widgets

**Priority**: P0 (Must Have)  
**Story Points**: 5 SP  
**Acceptance Criteria**:

- [ ] 创建 `WidgetRegistry` 类
- [ ] 支持注册 Widget
- [ ] 支持按 ID 获取 Widget
- [ ] 支持按类别筛选 Widget
- [ ] 支持获取所有 Widgets

**Tasks**:

```
[前端] Task 2.4.1: 创建 WidgetRegistry (3 SP)
  - 创建 apps/web/src/modules/dashboard/infrastructure/widgetRegistry.ts
  - 实现 register(widgets) 方法
  - 实现 getWidget(id) 方法
  - 实现 getAllWidgets() 方法
  - 实现 getWidgetsByCategory(category) 方法
  - 使用 Map 存储 Widgets

[前端] Task 2.4.2: 注册所有 Widgets (1 SP)
  - 导入 taskWidgets, goalWidgets, reminderWidgets
  - 调用 widgetRegistry.register()
  - 导出 widgetRegistry 单例

[前端] Task 2.4.3: 编写测试 (1 SP)
  - 测试注册功能
  - 测试查询功能
  - 测试筛选功能
```

**Definition of Done**:

- [x] Registry 正常工作
- [x] 所有 Widgets 注册成功
- [x] 单元测试通过

---

### Story 2.5: Dashboard 集成 Widgets 🎨

**As a** User  
**I want** 在 Dashboard 看到所有小组件  
**So that** 我可以一次性了解所有信息

**Priority**: P0 (Must Have)  
**Story Points**: 6 SP  
**Acceptance Criteria**:

- [ ] Dashboard 显示统计卡片
- [ ] Dashboard 显示 Task Widget
- [ ] Dashboard 显示 Goal Widget
- [ ] Dashboard 显示 Reminder Widget
- [ ] 固定布局（2列网格）
- [ ] 响应式适配

**Tasks**:

```
[前端] Task 2.5.1: 创建 DashboardGrid 组件 (2 SP)
  - 创建 DashboardGrid.vue
  - 使用 CSS Grid 布局
  - 定义断点（desktop/tablet/mobile）
  - 动态渲染 Widgets

[前端] Task 2.5.2: 创建 WidgetContainer 组件 (2 SP)
  - 创建 WidgetContainer.vue
  - 接收 props: widget (WidgetDefinition)
  - 使用 <component :is="widget.component">
  - 添加卡片包装（标题、边框、阴影）
  - 添加 loading 状态

[前端] Task 2.5.3: 更新 DashboardView (2 SP)
  - 引入 DashboardGrid
  - 定义默认 Widget 列表
  - 传递 Widgets 给 Grid
  - 处理 Widget 加载错误
```

**Definition of Done**:

- [x] 所有 Widgets 正常显示
- [x] 布局正确
- [x] 无性能问题

---

## 📦 Sprint 3: 自定义布局（Week 5-6）

**Sprint Goal**: 用户可以自定义 Dashboard 布局

**Story Points**: 34 SP  
**Duration**: 2 weeks

---

### Story 3.1: 拖拽布局功能 🎮

**As a** User  
**I want** 拖动调整 Widgets 位置和大小  
**So that** 我可以定制我的工作台

**Priority**: P0 (Must Have)  
**Story Points**: 13 SP  
**Acceptance Criteria**:

- [ ] 可以拖动 Widget 调整位置
- [ ] 可以拖动边缘调整大小
- [ ] 自动吸附到网格
- [ ] 拖拽时显示占位符
- [ ] 防止 Widget 重叠
- [ ] 拖拽流畅（60fps）

**Tasks**:

```
[前端] Task 3.1.1: 集成 vue-grid-layout (3 SP)
  - 安装 vue-grid-layout 库
  - 创建 DashboardGridLayout.vue
  - 配置 grid-layout 属性（cols, rowHeight, margin）
  - 配置 grid-item 属性（x, y, w, h）
  - 设置响应式断点

[前端] Task 3.1.2: 实现拖拽逻辑 (4 SP)
  - 监听 @layout-updated 事件
  - 更新 dashboardLayoutStore
  - 实现防碰撞逻辑
  - 实现最小/最大尺寸限制
  - 添加拖拽时的视觉反馈

[前端] Task 3.1.3: 优化性能 (3 SP)
  - 使用 will-change CSS 属性
  - 使用 transform 而非 left/top
  - 节流更新频率
  - 使用 requestAnimationFrame

[前端] Task 3.1.4: 编写测试 (2 SP)
  - 测试拖拽位置更新
  - 测试大小调整
  - 测试碰撞检测

[前端] Task 3.1.5: 响应式适配 (1 SP)
  - 定义断点：xl(12列), lg(8列), md(6列), sm(4列)
  - 测试各个断点下的布局
```

**Definition of Done**:

- [x] 拖拽流畅无卡顿
- [x] 布局正确保存
- [x] 响应式适配良好

---

### Story 3.2: 组件选择器 🛠️

**As a** User  
**I want** 选择显示哪些 Widgets  
**So that** 我只看到我需要的信息

**Priority**: P0 (Must Have)  
**Story Points**: 8 SP  
**Acceptance Criteria**:

- [ ] 点击"添加组件"按钮打开选择器
- [ ] 按类别分组显示 Widgets
- [ ] 显示 Widget 名称、描述、图标
- [ ] 选择后添加到 Dashboard
- [ ] 支持搜索 Widgets
- [ ] 已添加的 Widget 显示禁用状态

**Tasks**:

```
[前端] Task 3.2.1: 创建 WidgetSelector 组件 (4 SP)
  - 创建 WidgetSelector.vue
  - 使用 v-dialog 弹窗
  - 从 widgetRegistry 获取所有 Widgets
  - 按 category 分组显示
  - 实现点击添加功能
  - 更新 dashboardLayoutStore

[前端] Task 3.2.2: 实现搜索功能 (2 SP)
  - 添加搜索输入框
  - 实现模糊搜索（name + description）
  - 高亮搜索结果

[前端] Task 3.2.3: 实现禁用状态 (1 SP)
  - 检查 Widget 是否已添加
  - 已添加则显示为禁用
  - 显示"已添加"标签

[前端] Task 3.2.4: 编写测试 (1 SP)
  - 测试组件渲染
  - 测试搜索功能
  - 测试添加功能
```

**Definition of Done**:

- [x] 选择器正常工作
- [x] 搜索功能准确
- [x] UI 友好

---

### Story 3.3: 布局持久化 💾

**As a** User  
**I want** 我的布局配置被保存  
**So that** 下次打开应用时还是我定制的样子

**Priority**: P0 (Must Have)  
**Story Points**: 8 SP  
**Acceptance Criteria**:

- [ ] 布局配置保存到服务器
- [ ] 登录后自动加载布局
- [ ] 支持重置为默认布局
- [ ] 跨设备同步
- [ ] 保存失败有提示

**Tasks**:

```
[后端] Task 3.3.1: 扩展 user_settings 表 (2 SP)
  - 修改 schema.prisma
  - 添加 dashboard_layout Json? 字段
  - 运行 Prisma migrate

[后端] Task 3.3.2: 创建布局保存接口 (2 SP)
  - 创建 POST /api/v1/user/settings/dashboard-layout
  - 接收 layout JSON
  - 保存到 user_settings.dashboard_layout
  - 返回成功响应

[后端] Task 3.3.3: 创建布局获取接口 (1 SP)
  - 创建 GET /api/v1/user/settings/dashboard-layout
  - 查询 user_settings
  - 返回 dashboard_layout

[前端] Task 3.3.4: 创建 dashboardLayoutStore (2 SP)
  - 创建 dashboardLayoutStore.ts
  - 实现 loadLayout() 方法
  - 实现 saveLayout(layout) 方法
  - 实现 resetLayout() 方法
  - 集成 API 调用

[前端] Task 3.3.5: 集成到 Dashboard (1 SP)
  - 在 DashboardView onMounted 时调用 loadLayout()
  - 监听 layout-updated 事件调用 saveLayout()
  - 添加"重置布局"按钮
```

**Definition of Done**:

- [x] 布局保存成功
- [x] 刷新页面布局不变
- [x] 跨设备布局一致

---

### Story 3.4: 移除 Widget 功能 ❌

**As a** User  
**I want** 移除不需要的 Widgets  
**So that** Dashboard 更简洁

**Priority**: P1 (Should Have)  
**Story Points**: 3 SP  
**Acceptance Criteria**:

- [ ] 每个 Widget 右上角有删除图标
- [ ] 点击删除图标弹出确认对话框
- [ ] 确认后移除 Widget
- [ ] 移除后自动保存布局

**Tasks**:

```
[前端] Task 3.4.1: 添加删除按钮 (1 SP)
  - 在 WidgetContainer 添加删除图标
  - Hover 时显示
  - 使用 Vuetify v-icon

[前端] Task 3.4.2: 实现删除逻辑 (1 SP)
  - 点击弹出 v-dialog 确认
  - 确认后从 layout 中移除
  - 调用 saveLayout()

[前端] Task 3.4.3: 编写测试 (1 SP)
  - 测试删除功能
  - 测试确认对话框
```

**Definition of Done**:

- [x] 删除功能正常
- [x] 有确认提示
- [x] 布局正确保存

---

### Story 3.5: 编辑模式切换 🔧

**As a** User  
**I want** 编辑和查看模式分离  
**So that** 正常使用时不会误操作

**Priority**: P1 (Should Have)  
**Story Points**: 2 SP  
**Acceptance Criteria**:

- [ ] 右上角有"编辑"/"完成"切换按钮
- [ ] 编辑模式下才能拖拽和删除
- [ ] 查看模式下不显示删除图标
- [ ] 切换时有视觉反馈

**Tasks**:

```
[前端] Task 3.5.1: 添加编辑模式状态 (1 SP)
  - 在 DashboardView 添加 isEditMode: ref(false)
  - 添加"编辑"/"完成"按钮
  - 传递 isEditMode 给子组件

[前端] Task 3.5.2: 条件渲染控制 (1 SP)
  - 根据 isEditMode 显示/隐藏删除图标
  - 根据 isEditMode 启用/禁用拖拽
  - 添加编辑模式边框高亮
```

**Definition of Done**:

- [x] 模式切换正常
- [x] 视觉反馈清晰

---

## 📦 Sprint 4: 优化与测试（Week 7-8）

**Sprint Goal**: 性能优化、测试完善、文档编写

**Story Points**: 30 SP  
**Duration**: 2 weeks

---

### Story 4.1: 性能优化 ⚡

**As a** User  
**I want** Dashboard 快速响应  
**So that** 使用体验流畅

**Priority**: P0 (Must Have)  
**Story Points**: 8 SP  
**Acceptance Criteria**:

- [ ] 首屏加载 < 2秒
- [ ] 拖拽帧率 > 55fps
- [ ] 内存占用 < 100MB
- [ ] 滚动流畅无卡顿

**Tasks**:

```
[前端] Task 4.1.1: 实现懒加载 (3 SP)
  - 使用 Intersection Observer
  - 视口外的 Widget 延迟加载
  - 滚动到视口时才加载内容

[前端] Task 4.1.2: 优化渲染 (2 SP)
  - 使用 v-show 代替 v-if（频繁切换）
  - 使用 computed 缓存计算结果
  - 使用 memo 避免不必要的重渲染

[前端] Task 4.1.3: 优化网络请求 (2 SP)
  - 合并多个小请求
  - 使用 HTTP/2 多路复用
  - 启用 gzip 压缩

[前端] Task 4.1.4: 性能监控 (1 SP)
  - 添加性能埋点
  - 监控首屏加载时间
  - 监控 API 响应时间
```

**Definition of Done**:

- [x] Lighthouse 性能分数 > 90
- [x] Core Web Vitals 达标
- [x] 无内存泄漏

---

### Story 4.2: 单元测试 🧪

**As a** Developer  
**I want** 完善的单元测试  
**So that** 代码质量有保障

**Priority**: P0 (Must Have)  
**Story Points**: 8 SP  
**Acceptance Criteria**:

- [ ] 前端测试覆盖率 > 80%
- [ ] 后端测试覆盖率 > 80%
- [ ] 所有 Store 有完整测试
- [ ] 所有 Service 有完整测试

**Tasks**:

```
[前端] Task 4.2.1: Store 测试 (3 SP)
  - 测试 dashboardStatsStore
  - 测试 dashboardLayoutStore
  - Mock API 调用
  - 测试边界情况

[前端] Task 4.2.2: Component 测试 (3 SP)
  - 测试所有 Widget 组件
  - 测试 DashboardView
  - 测试 WidgetSelector
  - 使用 Vue Test Utils

[后端] Task 4.2.3: Service 测试 (2 SP)
  - 测试 StatisticsAggregationService
  - 测试各个 StatisticsService
  - Mock Prisma 调用
  - 测试错误处理
```

**Definition of Done**:

- [x] 测试覆盖率达标
- [x] 所有测试通过
- [x] CI/CD 集成

---

### Story 4.3: E2E 测试 🎭

**As a** QA  
**I want** 端到端测试  
**So that** 核心流程无回归

**Priority**: P1 (Should Have)  
**Story Points**: 5 SP  
**Acceptance Criteria**:

- [ ] 测试 Dashboard 加载
- [ ] 测试 Widget 交互
- [ ] 测试布局保存
- [ ] 测试拖拽功能

**Tasks**:

```
[测试] Task 4.3.1: 编写 Dashboard E2E 测试 (3 SP)
  - 使用 Playwright
  - 测试首屏加载
  - 测试统计数据显示
  - 测试 Widget 渲染

[测试] Task 4.3.2: 编写交互测试 (2 SP)
  - 测试快速创建任务
  - 测试完成任务
  - 测试拖拽 Widget
  - 测试添加/删除 Widget
```

**Definition of Done**:

- [x] 所有 E2E 测试通过
- [x] 测试稳定（无flaky）

---

### Story 4.4: 文档编写 📚

**As a** New Developer  
**I want** 完善的文档  
**So that** 我可以快速上手

**Priority**: P1 (Should Have)  
**Story Points**: 5 SP  
**Acceptance Criteria**:

- [ ] README.md 更新
- [ ] API 文档完整
- [ ] 组件文档完整
- [ ] 开发指南清晰

**Tasks**:

```
[文档] Task 4.4.1: 编写 README (2 SP)
  - 更新项目介绍
  - 添加 Dashboard 功能说明
  - 添加截图

[文档] Task 4.4.2: 编写 API 文档 (1 SP)
  - 更新 Swagger 注释
  - 添加请求/响应示例

[文档] Task 4.4.3: 编写组件文档 (1 SP)
  - 为每个 Widget 编写 README
  - 添加使用示例
  - 添加 Props 说明

[文档] Task 4.4.4: 编写开发指南 (1 SP)
  - 如何添加新 Widget
  - 如何修改布局
  - 常见问题解答
```

**Definition of Done**:

- [x] 文档完整无遗漏
- [x] 示例代码可运行

---

### Story 4.5: Bug 修复与打磨 🐛

**As a** User  
**I want** 稳定无 Bug 的体验  
**So that** 我可以放心使用

**Priority**: P0 (Must Have)  
**Story Points**: 4 SP  
**Acceptance Criteria**:

- [ ] 修复所有 P0/P1 Bug
- [ ] 优化用户体验细节
- [ ] 完善错误提示
- [ ] 完善 Loading 状态

**Tasks**:

```
[开发] Task 4.5.1: Bug 修复 (2 SP)
  - 修复已知 Bug
  - 测试边界情况
  - 修复兼容性问题

[开发] Task 4.5.2: UX 打磨 (2 SP)
  - 优化动画时长
  - 优化颜色对比度
  - 优化错误提示文案
  - 添加 Empty State 插图
```

**Definition of Done**:

- [x] 无 P0/P1 Bug
- [x] UX 评审通过

---

## 📊 Sprint 总览

| Sprint   | 目标                | Story Points | 工作周     |
| -------- | ------------------- | ------------ | ---------- |
| Sprint 1 | 基础架构 + 统计聚合 | 34 SP        | Week 1-2   |
| Sprint 2 | Task & Goal Widgets | 32 SP        | Week 3-4   |
| Sprint 3 | 自定义布局          | 34 SP        | Week 5-6   |
| Sprint 4 | 优化与测试          | 30 SP        | Week 7-8   |
| **总计** | **8 周**            | **130 SP**   | **2 个月** |

---

## 🎯 Definition of Ready (DoR)

**Story 被认为 Ready 的标准**:

- [ ] Story 有清晰的用户故事格式
- [ ] 验收标准（AC）明确且可测试
- [ ] 已拆分为可在 1-2 天内完成的 Tasks
- [ ] 技术依赖已识别
- [ ] Story Points 已评估
- [ ] 无阻塞问题（Blocker）

---

## ✅ Definition of Done (DoD)

**Story 被认为 Done 的标准**:

- [ ] 代码已提交到主分支
- [ ] 代码通过 Code Review
- [ ] 单元测试通过（覆盖率 > 80%）
- [ ] E2E 测试通过（核心流程）
- [ ] 无 ESLint/TypeScript 错误
- [ ] 文档已更新（如适用）
- [ ] 在 Dev/Staging 环境测试通过
- [ ] PO 验收通过

---

## 📅 Sprint Ceremonies

### Daily Standup（15 分钟）

- 每天早上 10:00
- 每个人回答：
  1. 昨天完成了什么？
  2. 今天计划做什么？
  3. 有什么阻塞？

### Sprint Planning（2 小时）

- Sprint 开始的第一天
- 议程：
  1. PO 讲解 Sprint Goal
  2. 团队拆分 Stories 为 Tasks
  3. 团队评估 Story Points
  4. 团队认领 Tasks

### Sprint Review（1 小时）

- Sprint 结束前的倒数第二天
- 议程：
  1. Demo 完成的功能
  2. PO 验收
  3. 收集反馈

### Sprint Retrospective（1 小时）

- Sprint 结束的最后一天
- 议程：
  1. What went well?
  2. What could be improved?
  3. Action items for next Sprint

---

## 🚀 Next Steps

**立即行动**:

1. [ ] SM 召开 Sprint 1 Planning 会议
2. [ ] 团队评估 Story Points
3. [ ] 开发者认领 Tasks
4. [ ] 创建 Jira/GitHub Issues
5. [ ] 开始 Sprint 1 开发

**会议安排**:

- **Sprint 1 Planning**: 2025-11-13 14:00-16:00
- **Daily Standups**: 每天 10:00-10:15
- **Sprint 1 Review**: 2025-11-26 15:00-16:00
- **Sprint 1 Retro**: 2025-11-26 16:00-17:00

---

**文档状态**: ✅ Ready for Planning  
**下一责任人**: Tech Lead (评审技术方案)  
**预计完成时间**: 2025-11-13
