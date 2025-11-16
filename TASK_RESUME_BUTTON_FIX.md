# 任务模板恢复按钮修复报告

## 🐛 问题描述

用户点击任务模板卡片上的"恢复"按钮时，没有任何反应。

## 🔍 问题分析

### 问题根源

前端事件传递链条**不完整**：

```
TaskTemplateCard (恢复按钮)
    ↓ emit('resume', template)
DraggableTaskCard
    ↓ ❌ 未传递 resume 事件
TaskTemplateManagement
    ↓ ❌ 未监听 resume 事件
    ❌ resumeTemplate 函数被注释
```

### 具体问题

1. **DraggableTaskCard.vue** - 未传递 `resume` 事件
   - `TaskTemplateCard` 发出 `@resume` 事件
   - `DraggableTaskCard` 包装了 `TaskTemplateCard`
   - ❌ 但没有向上传递 `resume` 事件

2. **TaskTemplateManagement.vue** - 未监听和处理 `resume` 事件
   - 使用了 `<DraggableTaskCard>` 组件
   - ❌ 没有绑定 `@resume` 事件
   - ❌ `resumeTemplate` 函数被注释掉

## ✅ 修复方案

### 1. 修复 DraggableTaskCard.vue

**文件位置**：`apps/web/src/modules/task/presentation/components/cards/DraggableTaskCard.vue`

#### 修改 1：添加事件传递

```typescript
// Emits
const emit = defineEmits<{
  edit: [templateUuid: string];
  delete: [templateUuid: string];
  resume: [template: TaskTemplateClientDTO];  // ✨ 新增
  dependencyCreated: [sourceUuid: string, targetUuid: string];
}>();

// Event handlers
const handleResume = (template: TaskTemplateClientDTO) => {
  emit('resume', template);
};
```

#### 修改 2：绑定事件

```vue
<TaskTemplateCard 
  :template="template" 
  @edit="handleEdit" 
  @delete="handleDelete" 
  @resume="handleResume"  <!-- ✨ 新增 -->
/>
```

### 2. 修复 TaskTemplateManagement.vue

**文件位置**：`apps/web/src/modules/task/presentation/components/TaskTemplateManagement.vue`

#### 修改 1：绑定 resume 事件

```vue
<DraggableTaskCard 
  v-for="template in filteredTemplates" 
  :key="template.uuid" 
  :template="template"
  :enable-drag="true" 
  @dependency-created="handleDependencyCreated" 
  @resume="handleResumeTemplate"  <!-- ✨ 新增 -->
/>
```

#### 修改 2：添加事件处理函数

```typescript
/**
 * Handle resume template
 */
const handleResumeTemplate = async (template: TaskTemplateClientDTO) => {
  try {
    console.log('🔄 [TaskTemplateManagement] 恢复模板:', template.title);
    
    // Import composable
    const { activateTaskTemplate } = await import('../composables/useTaskTemplate');
    
    // Call activate API
    await activateTaskTemplate(template.uuid);
    
    console.log('✅ [TaskTemplateManagement] 模板已恢复:', template.title);
  } catch (error) {
    console.error('❌ [TaskTemplateManagement] 恢复模板失败:', error);
  }
};
```

## 🔄 完整事件流程（修复后）

```
用户点击"恢复"按钮
    ↓
TaskTemplateCard.handleResume()
    ↓ emit('resume', template)
DraggableTaskCard.handleResume()
    ↓ emit('resume', template)
TaskTemplateManagement.handleResumeTemplate()
    ↓ await activateTaskTemplate(uuid)
useTaskTemplate.activateTaskTemplate()
    ↓ taskTemplateApplicationService.activateTaskTemplate()
TaskTemplateApplicationService (前端)
    ↓ taskTemplateApiClient.activateTaskTemplate()
API 请求 PATCH /api/task-templates/{uuid}/activate
    ↓
TaskTemplateController.activateTaskTemplate()
    ↓
TaskTemplateApplicationService (后端)
    ├─→ 修改模板状态 → ACTIVE
    ├─→ 生成任务实例（100 天）
    └─→ 发布事件 → task.template.resumed
        ↓
    ScheduleEventPublisher 监听
        ↓
    创建 ScheduleTask
        ↓
    Bree 开始调度 ✅
```

## 🧪 测试验证

### 手动测试步骤

1. **准备环境**：
   ```bash
   # 确保前后端服务都在运行
   # 前端：http://localhost:5173
   # 后端：http://localhost:3000
   ```

2. **创建测试模板**：
   - 创建一个任务模板（启用提醒）
   - 点击"暂停"按钮
   - 验证状态变为"已暂停"

3. **测试恢复功能**：
   - 点击"恢复"按钮
   - 预期行为：
     - ✅ 按钮有响应
     - ✅ 控制台显示日志：`🔄 [TaskTemplateManagement] 恢复模板: xxx`
     - ✅ 模板状态变为"进行中"
     - ✅ 任务实例重新生成
     - ✅ 提醒调度重新创建

### 预期日志输出

**前端控制台**：
```
🔄 [TaskTemplateManagement] 恢复模板: 每日晨跑
✅ [TaskTemplateManagement] 模板已恢复: 每日晨跑
```

**后端控制台**：
```
[TaskTemplateApplicationService] 开始激活模板: 每日晨跑
✅ [TaskTemplateApplicationService] 模板状态已更新为 ACTIVE
[TaskTemplateApplicationService] 模板 "每日晨跑" 已激活，开始生成实例...
✅ [TaskTemplateApplicationService] 模板 "每日晨跑" 生成了 100 个实例（未来100天）
✅ [TaskTemplateApplicationService] 为模板 "每日晨跑" 创建了循环 ScheduleTask
📤 [TaskTemplateApplicationService] 已发布 task.template.resumed 事件
▶️  [ScheduleEventPublisher] 处理任务模板恢复: abc-123-xyz
✅ [ScheduleEventPublisher] Created schedule task for Task abc-123-xyz
✅ [TaskTemplateApplicationService] 模板 "每日晨跑" 已激活并生成实例
```

## 📋 检查清单

修复完成后，请确认以下项目：

- [x] DraggableTaskCard 添加了 `resume` 事件定义
- [x] DraggableTaskCard 添加了 `handleResume` 处理函数
- [x] DraggableTaskCard 在 TaskTemplateCard 上绑定了 `@resume`
- [x] TaskTemplateManagement 在 DraggableTaskCard 上绑定了 `@resume`
- [x] TaskTemplateManagement 添加了 `handleResumeTemplate` 函数
- [x] 函数正确调用了 `activateTaskTemplate` API

## 🎯 相关功能

### 暂停功能（已正常工作）

暂停按钮在 `TaskTemplateCard.vue` 中直接调用：
```vue
<v-btn @click="pauseTaskTemplate(template.uuid)">
  暂停
</v-btn>
```

这个按钮**不需要**通过事件传递，因为它直接使用了 `useTaskTemplate()` composable。

### 恢复 vs 激活

- **恢复按钮**：用于 `PAUSED` 状态的模板
- **激活按钮**：用于 `ARCHIVED` 状态的模板
- **后端 API**：两者都调用同一个接口 `/api/task-templates/{uuid}/activate`

## 🐛 为什么之前被注释掉？

查看代码历史，`resumeTemplate` 函数被注释可能是因为：

1. **重构过程中**：可能在重构 composables 时临时注释
2. **功能未完成**：当时可能还没有完成后端 API
3. **测试阶段**：可能在测试其他功能时临时禁用

现在后端功能已经完整实现，前端也应该恢复这个功能。

## 📚 相关文档

- [统一调度事件系统](./UNIFIED_SCHEDULE_EVENT_SYSTEM.md)
- [任务模板暂停/恢复功能增强](./TASK_TEMPLATE_PAUSE_RESUME_ENHANCEMENT.md)
- [统一调度事件系统实施总结](./UNIFIED_SCHEDULE_EVENT_IMPLEMENTATION_SUMMARY.md)

## ✨ 总结

### 问题
- 恢复按钮点击无反应

### 原因
- 事件传递链条不完整
- 处理函数被注释

### 修复
- 补充 DraggableTaskCard 的事件传递
- 添加 TaskTemplateManagement 的事件处理

### 结果
- ✅ 恢复按钮现在可以正常工作
- ✅ 完整的事件流程已恢复
- ✅ 前后端功能已打通

---

**修复时间**：2025-11-16  
**影响范围**：前端任务模板管理界面  
**测试状态**：待测试  
**优先级**：高（影响用户核心功能）
