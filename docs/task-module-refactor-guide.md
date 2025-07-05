# Task 模块架构重构指南

## 重构概览

我们已经将 Task 模块从渲染进程重构为主进程架构，遵循 Electron 应用的最佳实践：

- **主进程**：包含所有业务逻辑、领域模型和数据访问
- **渲染进程**：只负责 UI 展示和用户交互
- **IPC 通信**：通过标准化的 DTO 进行数据传输

## 架构结构

### 主进程 (`electron/modules/Task/`)

```
electron/modules/Task/
├── domain/                    # 领域层（从渲染进程迁移）
│   ├── entities/             # 领域实体
│   ├── repositories/         # 仓储接口
│   ├── services/            # 领域服务
│   └── valueObjects/        # 值对象
├── application/              # 应用层
│   └── mainTaskApplicationService.ts  # 主要应用服务
├── infrastructure/           # 基础设施层（从渲染进程迁移）
├── validation/              # 验证层（从渲染进程迁移）
├── ipc/                     # IPC 处理器
│   └── taskIpcHandler.ts    # IPC 请求处理器
└── main.ts                  # 模块初始化
```

### 渲染进程 (`src/modules/Task/`)

```
src/modules/Task/
├── services/                 # 服务层（新增）
│   └── taskServiceClient.ts  # IPC 客户端服务
├── presentation/            # 表现层
│   ├── components/          # Vue 组件
│   ├── composables/         # 组合式函数
│   ├── stores/             # 状态管理
│   └── views/              # 视图组件
└── types/                   # 类型定义（已废弃，使用共享类型）
```

### 共享类型 (`src/shared/types/`)

```
src/shared/types/
└── taskDto.ts              # Task 模块的 DTO 类型定义
```

## IPC 通信协议

### 命名规范

所有 Task 相关的 IPC 通道都以 `task:` 为前缀：

```
task:meta-templates:*    # 元模板相关
task:templates:*         # 任务模板相关  
task:instances:*         # 任务实例相关
task:stats:*            # 统计分析相关
```

### 支持的 IPC 操作

#### 元模板 (Meta Templates)
- `task:meta-templates:get-all` - 获取所有元模板
- `task:meta-templates:get-by-id` - 根据ID获取元模板
- `task:meta-templates:get-by-category` - 根据分类获取元模板

#### 任务模板 (Task Templates)
- `task:templates:get-by-id` - 获取任务模板
- `task:templates:get-all` - 获取所有任务模板
- `task:templates:get-by-key-result` - 根据关键结果获取任务模板
- `task:templates:create` - 创建任务模板
- `task:templates:update` - 更新任务模板
- `task:templates:delete` - 删除任务模板
- `task:templates:activate` - 激活任务模板
- `task:templates:pause` - 暂停任务模板
- `task:templates:resume` - 恢复任务模板
- `task:templates:archive` - 归档任务模板

#### 任务实例 (Task Instances)
- `task:instances:get-by-id` - 获取任务实例
- `task:instances:get-all` - 获取所有任务实例
- `task:instances:get-today` - 获取今日任务
- `task:instances:create` - 创建任务实例
- `task:instances:complete` - 完成任务
- `task:instances:undo-complete` - 撤销完成任务
- `task:instances:start` - 开始任务
- `task:instances:cancel` - 取消任务
- `task:instances:reschedule` - 重新安排时间
- `task:instances:delete` - 删除任务实例

#### 提醒相关
- `task:instances:trigger-reminder` - 触发提醒
- `task:instances:snooze-reminder` - 推迟提醒
- `task:instances:dismiss-reminder` - 忽略提醒
- `task:instances:disable-reminders` - 禁用提醒
- `task:instances:enable-reminders` - 启用提醒

#### 统计分析
- `task:stats:get-for-goal` - 获取目标相关统计
- `task:stats:get-completion-timeline` - 获取完成时间线

## 使用示例

### 在渲染进程中使用

```typescript
import { TaskServiceClient } from '@/modules/Task/services/taskServiceClient';

const taskClient = new TaskServiceClient();

// 获取所有任务模板
const templates = await taskClient.getAllTaskTemplates();

// 完成任务
const result = await taskClient.completeTask('task-id');
if (result.success) {
  console.log('Task completed successfully');
} else {
  console.error('Failed to complete task:', result.message);
}
```

### 在组合式函数中使用

```typescript
// 替换原有的 TaskApplicationService
// const taskApplicationService = new TaskApplicationService();
const taskServiceClient = new TaskServiceClient();

// 使用新的客户端方法
const templates = await taskServiceClient.getAllTaskTemplates();
```

## 待完成的工作

### 1. 类型兼容性问题

当前渲染进程中的组件期望使用领域对象（如 `TaskTemplate`），但现在返回的是 DTO。需要：

1. **创建适配器层**：将 DTO 转换为渲染进程所需的格式
2. **更新组件逻辑**：直接使用 DTO 而不是领域对象
3. **修复类型错误**：确保所有接口保持一致

### 2. 缺失的服务方法

以下方法需要在主进程服务中实现：

- `createTaskTemplateFromMeta()` - 从元模板创建任务模板
- `createTaskInstance()` - 创建任务实例
- `rescheduleTask()` - 重新安排任务时间
- `deleteTaskInstance()` - 删除任务实例
- 所有提醒相关的方法

### 3. 状态管理调整

渲染进程中的状态管理（Pinia stores）需要更新以配合新的服务架构：

- 移除直接的领域对象依赖
- 使用 DTO 进行状态管理
- 调整状态更新逻辑

### 4. 数据持久化

确保主进程中的数据访问层正确配置：

- 数据库连接
- 仓储实现
- 事务处理

## 迁移步骤

### 第一阶段：基础架构（已完成）
- ✅ 创建主进程模块结构
- ✅ 移动领域层到主进程
- ✅ 实现 IPC 处理器
- ✅ 创建渲染进程客户端

### 第二阶段：服务实现（进行中）
- 🔄 修复类型兼容性问题
- ⏳ 实现缺失的服务方法
- ⏳ 测试 IPC 通信

### 第三阶段：组件适配（待开始）
- ⏳ 更新组件以使用新的服务客户端
- ⏳ 修复状态管理问题
- ⏳ 更新表单验证逻辑

### 第四阶段：测试和优化（待开始）
- ⏳ 端到端测试
- ⏳ 性能优化
- ⏳ 错误处理改进

## 注意事项

1. **向后兼容性**：确保现有的组件能够平滑过渡
2. **错误处理**：IPC 调用需要适当的错误处理机制
3. **类型安全**：保持 TypeScript 类型安全
4. **性能**：IPC 通信可能引入轻微的性能开销
5. **调试**：需要同时调试主进程和渲染进程

## 优势

重构后的架构带来以下优势：

1. **安全性**：业务逻辑在主进程中，更安全
2. **可维护性**：清晰的职责分离
3. **可测试性**：更容易进行单元测试
4. **性能**：更好的资源管理
5. **扩展性**：便于添加新功能

## 总结

这次重构将 Task 模块从单进程架构转换为符合 Electron 最佳实践的多进程架构。虽然需要一些适配工作，但长期来看将提供更好的架构和用户体验。
