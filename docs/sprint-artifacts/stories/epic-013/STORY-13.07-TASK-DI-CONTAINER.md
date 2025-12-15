# Story 13.7: Task 模块 DI Container

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.7 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P0 (Critical) |
| 复杂度 | Medium |
| 预估工时 | 3h |
| 状态 | Backlog |

## 目标

为 Task 模块创建 DI 容器配置，注册所有 IPC Client 依赖。

## 背景

遵循 Story 13.2 中定义的 DI Container 模式，为 Task 模块创建专用的依赖注入配置。

## 任务列表

- [ ] 1. 创建 `renderer/modules/task/di/` 目录
- [ ] 2. 定义 Task 模块依赖 Token
  - [ ] `TaskTemplateIPCClient` Token
  - [ ] `TaskInstanceIPCClient` Token
  - [ ] `TaskStatisticsIPCClient` Token
- [ ] 3. 实现 `registerTaskModule()` 函数
- [ ] 4. 集成到 `RendererContainer`
- [ ] 5. 添加工厂函数支持延迟初始化
- [ ] 6. 添加单元测试

## 技术设计

### 目录结构

```
renderer/modules/task/di/
├── tokens.ts           # DI tokens
├── register.ts         # 注册函数
└── index.ts            # 导出
```

### Token 定义

```typescript
// renderer/modules/task/di/tokens.ts
export const TASK_TOKENS = {
  // IPC Clients
  TEMPLATE_IPC_CLIENT: Symbol('TaskTemplateIPCClient'),
  INSTANCE_IPC_CLIENT: Symbol('TaskInstanceIPCClient'),
  STATISTICS_IPC_CLIENT: Symbol('TaskStatisticsIPCClient'),
  
  // Use Cases (可选，用于复杂业务逻辑)
  CREATE_TASK_USE_CASE: Symbol('CreateTaskUseCase'),
  COMPLETE_TASK_USE_CASE: Symbol('CompleteTaskUseCase'),
} as const;
```

### 注册函数

```typescript
// renderer/modules/task/di/register.ts
import { Container } from '@/shared/infrastructure/di';
import { TASK_TOKENS } from './tokens';
import { 
  TaskTemplateIPCClient,
  TaskInstanceIPCClient,
  TaskStatisticsIPCClient,
} from '../infrastructure/ipc';

export function registerTaskModule(container: Container): void {
  // 注册 IPC Clients（单例）
  container.registerSingleton(
    TASK_TOKENS.TEMPLATE_IPC_CLIENT,
    () => new TaskTemplateIPCClient()
  );
  
  container.registerSingleton(
    TASK_TOKENS.INSTANCE_IPC_CLIENT,
    () => new TaskInstanceIPCClient()
  );
  
  container.registerSingleton(
    TASK_TOKENS.STATISTICS_IPC_CLIENT,
    () => new TaskStatisticsIPCClient()
  );
}
```

### 集成到 RendererContainer

```typescript
// renderer/shared/infrastructure/di/container.ts
import { registerTaskModule } from '@/modules/task/di';

export function createRendererContainer(): Container {
  const container = new Container();
  
  // 注册基础依赖
  registerCoreModule(container);
  
  // 注册业务模块
  registerTaskModule(container);
  // ... 其他模块
  
  return container;
}
```

## 验收标准

- [ ] Token 定义清晰，命名规范
- [ ] `registerTaskModule()` 正确注册所有依赖
- [ ] 支持单例模式
- [ ] 支持延迟初始化（工厂函数）
- [ ] 集成到 `RendererContainer` 无冲突
- [ ] 单元测试覆盖率 > 80%

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/task/di/tokens.ts` | 新建 | Token 定义 |
| `renderer/modules/task/di/register.ts` | 新建 | 注册函数 |
| `renderer/modules/task/di/index.ts` | 新建 | 导出 |
| `renderer/shared/infrastructure/di/container.ts` | 修改 | 集成 Task 模块 |

## 依赖关系

- **前置依赖**: Story 13.2 (DI Container), Story 13.6 (Task IPC Client)
- **后续依赖**: Story 13.8 (Task Store 重构)
