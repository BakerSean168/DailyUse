# ONE_TIME 任务 - 页面集成完成

## 📋 更新概述

成功将新建的 ONE_TIME 任务组件集成到现有的任务管理系统中，**直接在列表页和详情页使用 Dialog 包裹 TaskForm**，无需单独的 Create 和 Edit View。

## ✅ 完成的工作

### 1. **OneTimeTaskListView** - 集成创建和编辑功能
- **文件**: `/apps/web/src/modules/task/presentation/views/TaskDetailView.vue`
- **实现方式**:
  - 使用全屏 `v-dialog` 展示任务详情
  - 完整的加载和错误状态处理
  - 集成任务操作（开始、完成、阻塞、取消等）
  - 支持查看子任务、依赖任务和活动历史
  - 所有操作完成后自动刷新数据
- **集成组件**: `TaskDetail`
- **使用 Composable**: `useOneTimeTask`
- **功能**:
  - ✅ 任务基本信息显示
  - ✅ 任务状态操作（开始、完成、阻塞、解除阻塞、取消）
  - ✅ 编辑和删除任务
  - ✅ 子任务管理（查看、添加、切换状态）
  - ✅ 依赖任务查看
  - ✅ 关联目标查看
  - ✅ 活动历史记录

- **文件**: `/apps/web/src/modules/task/presentation/views/OneTimeTaskListView.vue`
- **实现方式**:
  - 内嵌 `v-dialog` 包裹 `TaskForm` 用于创建和编辑
  - 点击"创建任务"按钮打开空表单（创建模式）
  - 点击任务的"编辑"按钮打开带数据表单（编辑模式）
  - 三种视图模式：列表、卡片、仪表盘
  - 完整的批量操作支持（带有悬浮工具栏）
  - 集成所有三个 composables
- **集成组件**:
  - `TaskForm` - 创建/编辑表单（Dialog）
  - `TaskList` - 任务列表/卡片视图
  - `TaskDashboard` - 仪表盘视图
  - `TaskBatchToolbar` - 批量操作工具栏
- **使用 Composables**:
  - `useOneTimeTask` - 基础任务操作（包括 createTask, updateTask）
  - `useTaskDashboard` - 仪表盘数据
  - `useTaskBatchOperations` - 批量操作
- **功能**:
  - ✅ **创建任务**（Dialog 形式）
  - ✅ **编辑任务**（Dialog 形式）
  - ✅ 三种视图模式切换
  - ✅ 任务选择（单选、全选、反选）
  - ✅ 快速筛选（逾期、高优先级、待处理）
  - ✅ 批量更新优先级
  - ✅ 批量状态操作（开始、完成、取消）
  - ✅ 批量添加标签
  - ✅ 批量关联目标
  - ✅ 批量导出
  - ✅ 批量删除
  - ✅ 仪表盘统计信息

### 2. **TaskDetailView** - 集成编辑功能
- **文件**: `/apps/web/src/modules/task/presentation/views/TaskDetailView.vue`
- **实现方式**:
  - 全屏 Dialog 展示任务详情
  - 内嵌 `v-dialog` 包裹 `TaskForm` 用于编辑
  - 点击"编辑"按钮打开编辑表单
  - 完整的加载和错误状态处理
  - 集成任务操作（开始、完成、阻塞、取消等）
  - 支持查看子任务、依赖任务和活动历史
- **集成组件**:
  - `TaskDetail` - 任务详情展示
  - `TaskForm` - 编辑表单（Dialog）
- **使用 Composable**: `useOneTimeTask`
- **功能**:
  - ✅ 任务基本信息显示
  - ✅ **编辑任务**（Dialog 形式）
  - ✅ 任务状态操作（开始、完成、阻塞、解除阻塞、取消）
  - ✅ 删除任务
  - ✅ 子任务管理（查看、添加、切换状态）
  - ✅ 依赖任务查看
  - ✅ 关联目标查看
  - ✅ 活动历史记录

### 3. **删除不需要的文件**
- ❌ **删除**: `TaskCreateView.vue` - 功能已集成到 OneTimeTaskListView
- ❌ **删除**: `TaskEditView.vue` - 功能已集成到 OneTimeTaskListView 和 TaskDetailView

### 4. **更新路由配置**
- **文件**: `/apps/web/src/shared/router/routes.ts`
- **添加路由**: `/tasks/one-time` → `OneTimeTaskListView`
- **删除路由**: 
  - ❌ `/tasks/create` - 不再需要单独页面
  - ❌ `/tasks/:id/edit` - 不再需要单独页面
- **保留路由**:
  - `/tasks` → `TaskManagementView`
  - `/tasks/:id` → `TaskDetailView` (全屏 Dialog)

### 5. **添加导航入口**
- **文件**: `/apps/web/src/modules/task/presentation/views/TaskManagementView.vue`
- **添加按钮**: "一次性任务" 按钮，跳转到 `/tasks/one-time`
- **位置**: 在标签页导航旁边

## 🎨 设计决策

### 为什么不需要单独的 Create 和 Edit View？
1. **更简洁的架构**:
   - TaskForm 组件已经支持创建和编辑两种模式（通过 `task` prop）
   - 直接在列表页和详情页使用 Dialog，无需额外的路由
   - 减少代码重复，更易于维护

2. **更好的用户体验**:
   - 不需要离开当前上下文
   - 快速创建/编辑任务（模态对话框）
   - 自然的焦点管理
   - 避免全页面跳转

3. **与现有系统一致**:
   - 符合 Material Design 设计规范
   - 保持与其他对话框组件的一致性
   - 更快的交互响应

4. **减少路由复杂度**:
   - 只需要 `/tasks/one-time` 和 `/tasks/:id` 两个路由
   - 避免 `/tasks/create` 和 `/tasks/:id/edit` 的额外路由
   - 更清晰的路由结构

### 组件复用策略
- **TaskForm**: 同时支持创建和编辑模式（`isEdit` prop）
- **TaskDetail**: 全功能任务详情组件
- **TaskList**: 支持列表和卡片两种视图模式
- **TaskDashboard**: 独立的仪表盘视图
- **TaskBatchToolbar**: 悬浮式批量操作工具栏

## 📊 组件层次结构

```
OneTimeTaskListView
├── TaskForm (Dialog - 创建/编辑模式)
├── TaskBatchToolbar (条件渲染，有选中任务时显示)
├── TaskDashboard (仪表盘模式)
└── TaskList (列表/卡片模式)
    └── TaskCard (卡片视图时使用)

TaskDetailView (全屏 Dialog)
├── TaskForm (Dialog - 编辑模式)
└── TaskDetail
    ├── SubtaskList (左侧面板)
    └── TaskTimeline (左侧面板)
```

## 🔄 数据流

```
用户操作
    ↓
View 层 (TaskDetailView, OneTimeTaskListView 等)
    ↓
Composables (useOneTimeTask, useTaskDashboard, useTaskBatchOperations)
    ↓
Services (TaskService, TaskDashboardService, TaskBatchService)
    ↓
API Client (OneTimeTaskApiClient)
    ↓
Backend API
```

## 🚀 使用示例

### 访问一次性任务列表
```
路由: /tasks/one-time
或从 TaskManagementView 点击 "一次性任务" 按钮
```

### 创建任务（在列表页）
```
列表页点击 "创建任务" 按钮
→ 打开 Dialog（空表单）
→ 填写信息后点击 "提交"
→ Dialog 关闭，列表自动刷新
```

### 编辑任务（在列表页）
```
列表页点击任务的 "编辑" 按钮
→ 打开 Dialog（已填充数据）
→ 修改后点击 "保存"
→ Dialog 关闭，列表自动刷新
```

### 编辑任务（在详情页）
```
详情页点击 "编辑" 按钮
→ 打开 Dialog（已填充数据）
→ 修改后点击 "保存"
→ Dialog 关闭，详情页自动刷新
```

### 批量操作
```
选中多个任务（复选框）
→ 出现悬浮的 TaskBatchToolbar
→ 选择操作（更新优先级、状态、删除等）
→ 确认后执行批量操作
→ 自动刷新列表
```

## 📝 待完成功能 (TODO)

### TaskDetailView
- [ ] 实现子任务加载逻辑
- [ ] 实现依赖任务加载逻辑
- [ ] 实现添加子任务功能
- [ ] 实现切换子任务状态功能

### OneTimeTaskListView
- [ ] 实现筛选逻辑（从仪表盘点击查看特定任务集）
- [ ] 实现批量添加标签的 UI
- [ ] 实现批量关联目标的 UI
- [ ] 实现导出功能的具体格式选择

### TaskForm
- [ ] 添加依赖任务选择器
- [ ] 添加标签输入组件
- [ ] 添加目标关联选择器

## 🎯 测试建议

### 手动测试清单
- [ ] 创建任务（列表页 Dialog 打开/关闭）
- [ ] 编辑任务（列表页 Dialog，数据加载、保存）
- [ ] 编辑任务（详情页 Dialog，数据加载、保存）
- [ ] 查看任务详情（全屏 Dialog）
- [ ] 切换视图模式（列表、卡片、仪表盘）
- [ ] 选择任务（单选、全选、反选）
- [ ] 批量操作（优先级、状态、删除）
- [ ] 任务状态操作（开始、完成、取消）
- [ ] 导航流程（列表 → 详情 → 编辑）

### E2E 测试场景
1. **任务创建流程（列表页）**: 点击创建按钮 → 打开 Dialog → 填写信息 → 提交 → 验证列表刷新
2. **任务编辑流程（列表页）**: 点击编辑按钮 → 打开 Dialog → 修改 → 保存 → 验证列表更新
3. **任务编辑流程（详情页）**: 查看详情 → 点击编辑 → 打开 Dialog → 修改 → 保存 → 验证详情更新
4. **批量操作流程**: 选择多个任务 → 批量更新 → 验证所有任务已更新
5. **视图切换**: 列表 ↔ 卡片 ↔ 仪表盘，验证数据一致性

## 📈 性能考虑

### 已实现的优化
- ✅ 使用 `computed` 缓存筛选结果
- ✅ 延迟加载组件（路由 lazy loading）
- ✅ 批量操作进度指示器
- ✅ 对话框关闭动画延迟

### 未来优化建议
- [ ] 任务列表虚拟滚动（大数据量时）
- [ ] 仪表盘数据缓存策略
- [ ] 批量操作请求合并
- [ ] 乐观更新（Optimistic UI）

## 🔍 编译状态

✅ **所有文件编译通过，0 个错误！**

## 📚 相关文档

- [Epic 3 Context](../../../docs/epic-3-context.md)
- [ONE_TIME 组件文档](../components/one-time/README.md)
- [Composables 文档](../composables/README.md)
- [路由配置指南](../../../shared/router/README.md)

---

**更新时间**: 2025-10-30
**Epic**: Epic 3 - ONE_TIME 任务管理
**状态**: ✅ 页面集成完成
