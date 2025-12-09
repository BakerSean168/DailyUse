# STORY-014: 清理与测试验证

> **EPIC**: EPIC-010 Desktop 全面 DDD 模块化重构  
> **Sprint**: Sprint 4  
> **预估**: 8 小时  
> **优先级**: P1  
> **依赖**: STORY-001 ~ STORY-013

---

## 📋 概述

最后阶段，清理旧代码，验证所有模块工作正常：
- 删除旧的 IPC handlers 文件
- 更新 index.ts 导出
- 编写集成测试
- 验证端到端功能

---

## 🎯 目标

1. 清理所有废弃的旧代码
2. 确保新模块结构正确
3. 编写关键模块的集成测试
4. 验证应用整体功能

---

## ✅ 验收标准 (AC)

### AC-1: 旧代码清理
```gherkin
Given 所有新模块已实现
When 清理工作完成
Then apps/desktop/src/main/ipc/ 目录应只保留 index.ts
And 所有 IPC 注册应迁移到 modules/ 目录
```

### AC-2: 构建成功
```gherkin
Given 代码清理完成
When 运行 pnpm nx build desktop
Then 应构建成功无错误
And TypeScript 编译无类型错误
```

### AC-3: 集成测试
```gherkin
Given 新模块架构
When 运行集成测试
Then 所有关键 IPC 调用应返回正确结果
And 模块间通信应正常工作
```

### AC-4: E2E 验证
```gherkin
Given 应用启动
When 执行以下操作:
  - 创建 Goal
  - 创建 Task Template
  - 完成 Task Instance
  - 创建 Schedule
  - 设置 Reminder
  - 导出数据
Then 所有功能应正常工作
```

---

## 📁 任务清单

### Task 14.1: 删除旧 IPC Handlers

**需要删除的文件**:
```
apps/desktop/src/main/ipc/
├── account.ipc-handlers.ts      # 迁移到 modules/account/
├── ai.ipc-handlers.ts           # 迁移到 modules/ai/
├── auth.ipc-handlers.ts         # 合并到 modules/account/
├── dashboard.ipc-handlers.ts    # 迁移到 modules/dashboard/
├── goal.ipc-handlers.ts         # 迁移到 modules/goal/
├── goal-folder.ipc-handlers.ts  # 合并到 modules/goal/
├── notification.ipc-handlers.ts # 迁移到 modules/notification/
├── reminder.ipc-handlers.ts     # 迁移到 modules/reminder/
├── repository.ipc-handlers.ts   # 迁移到 modules/repository/
├── schedule.ipc-handlers.ts     # 迁移到 modules/schedule/
├── setting.ipc-handlers.ts      # 迁移到 modules/setting/
├── task.ipc-handlers.ts         # 迁移到 modules/task/
└── lazy-ipc-handler.ts          # 保留或移到 utils
```

### Task 14.2: 更新 IPC Index

**文件**: `apps/desktop/src/main/ipc/index.ts`

```typescript
/**
 * IPC Handlers Index
 * 
 * 所有 IPC handlers 已迁移到 modules/ 目录
 * 此文件保留作为向后兼容和参考
 */

// 注意: 所有模块现在通过 modules/index.ts 的 registerAllModules() 注册
// 请参阅 apps/desktop/src/main/modules/index.ts

export { registerAllModules, initializeAllModules, shutdownAllModules } from '../modules';
```

### Task 14.3: 编写集成测试

**文件**: `apps/desktop/src/main/modules/__tests__/integration.test.ts`

```typescript
/**
 * Module Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ipcMain } from 'electron';
import { registerAllModules, initializeAllModules, shutdownAllModules } from '../index';

// Mock Electron
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test'),
    whenReady: vi.fn(() => Promise.resolve()),
  },
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
  BrowserWindow: vi.fn(),
  Notification: vi.fn(),
}));

describe('Module Integration', () => {
  beforeAll(async () => {
    registerAllModules();
    await initializeAllModules();
  });

  afterAll(async () => {
    await shutdownAllModules();
  });

  describe('IPC Handler Registration', () => {
    it('should register all Goal IPC handlers', () => {
      const handleCalls = (ipcMain.handle as any).mock.calls;
      const goalHandlers = handleCalls.filter(([channel]: [string]) => 
        channel.startsWith('goal:')
      );
      
      expect(goalHandlers.length).toBeGreaterThan(0);
      expect(goalHandlers.some(([c]: [string]) => c === 'goal:create')).toBe(true);
      expect(goalHandlers.some(([c]: [string]) => c === 'goal:list')).toBe(true);
    });

    it('should register all Task IPC handlers', () => {
      const handleCalls = (ipcMain.handle as any).mock.calls;
      const taskHandlers = handleCalls.filter(([channel]: [string]) => 
        channel.startsWith('task-template:') || channel.startsWith('task-instance:')
      );
      
      expect(taskHandlers.length).toBeGreaterThan(0);
    });

    it('should register all Schedule IPC handlers', () => {
      const handleCalls = (ipcMain.handle as any).mock.calls;
      const scheduleHandlers = handleCalls.filter(([channel]: [string]) => 
        channel.startsWith('schedule-')
      );
      
      expect(scheduleHandlers.length).toBeGreaterThan(0);
    });

    it('should register all Reminder IPC handlers', () => {
      const handleCalls = (ipcMain.handle as any).mock.calls;
      const reminderHandlers = handleCalls.filter(([channel]: [string]) => 
        channel.startsWith('reminder:')
      );
      
      expect(reminderHandlers.length).toBeGreaterThan(0);
    });
  });
});
```

### Task 14.4: 编写模块单元测试

**文件**: `apps/desktop/src/main/modules/goal/__tests__/GoalDesktopApplicationService.test.ts`

```typescript
/**
 * Goal Desktop Application Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoalDesktopApplicationService } from '../application/GoalDesktopApplicationService';

// Mock dependencies
vi.mock('@dailyuse/infrastructure-server', () => ({
  GoalContainer: {
    getInstance: vi.fn(() => ({
      getGoalRepository: vi.fn(() => ({
        save: vi.fn(),
        findById: vi.fn(),
        findAll: vi.fn(() => []),
        delete: vi.fn(),
      })),
    })),
  },
}));

vi.mock('@dailyuse/application-server', () => ({
  createGoal: vi.fn(() => ({ goal: { uuid: 'test-uuid', title: 'Test Goal' } })),
  getGoal: vi.fn(() => ({ goal: { uuid: 'test-uuid', title: 'Test Goal' } })),
  listGoals: vi.fn(() => ({ goals: [], total: 0 })),
}));

describe('GoalDesktopApplicationService', () => {
  let service: GoalDesktopApplicationService;

  beforeEach(() => {
    service = new GoalDesktopApplicationService();
    vi.clearAllMocks();
  });

  describe('createGoal', () => {
    it('should create a goal with valid input', async () => {
      const result = await service.createGoal({
        title: 'Test Goal',
        description: 'Test Description',
      });

      expect(result).toBeDefined();
      expect(result.uuid).toBe('test-uuid');
    });
  });

  describe('listGoals', () => {
    it('should return paginated goals', async () => {
      const result = await service.listGoals({ page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.goals).toBeInstanceOf(Array);
      expect(result.total).toBeDefined();
    });
  });
});
```

### Task 14.5: 创建 E2E 测试清单

**文件**: `apps/desktop/e2e/E2E_TEST_CHECKLIST.md`

```markdown
# Desktop E2E Test Checklist

## 启动和初始化
- [ ] 应用能正常启动
- [ ] 所有模块初始化成功
- [ ] 数据库文件正确创建

## Goal 模块
- [ ] 创建 Goal
- [ ] 列出 Goals
- [ ] 更新 Goal
- [ ] 删除 Goal
- [ ] Goal 进度更新

## Task 模块
- [ ] 创建 Task Template
- [ ] 激活 Template
- [ ] 查看 Task Instances
- [ ] 完成 Task Instance
- [ ] 跳过 Task Instance

## Schedule 模块
- [ ] 创建 Schedule Task
- [ ] 创建 Schedule Event
- [ ] 查看日期范围内的日程
- [ ] 更新日程

## Reminder 模块
- [ ] 创建 Reminder Template
- [ ] 查看即将到来的提醒
- [ ] 收到系统通知
- [ ] Snooze 提醒

## Notification 模块
- [ ] 应用内通知显示
- [ ] 系统原生通知
- [ ] 标记已读
- [ ] 清空通知

## Dashboard 模块
- [ ] 获取 Overview
- [ ] 数据正确聚合

## Repository 模块
- [ ] 创建备份
- [ ] 恢复备份
- [ ] 导出 JSON
- [ ] 导入数据

## Setting 模块
- [ ] 读取设置
- [ ] 更新设置
- [ ] 重置设置

## AI 模块
- [ ] 创建对话
- [ ] 发送消息
- [ ] 查看配额
```

### Task 14.6: 运行最终验证

```bash
# 1. 构建项目
pnpm nx build desktop

# 2. 运行单元测试
pnpm nx test desktop

# 3. 运行类型检查
pnpm nx typecheck desktop

# 4. 运行 lint
pnpm nx lint desktop

# 5. 启动应用进行手动测试
pnpm nx serve desktop
```

---

## 📚 技术上下文

### 测试策略

1. **单元测试**: 每个 ApplicationService 的独立测试
2. **集成测试**: IPC handler 注册和模块间通信
3. **E2E 测试**: 完整用户流程验证

### 清理原则

- 确保新模块完全可用后再删除旧代码
- 保留必要的类型定义
- 更新所有导入路径

---

## 🔗 依赖关系

- **依赖**: STORY-001 ~ STORY-013 (所有模块必须完成)
- **被依赖**: 无（最后一个 Story）

---

## 📝 备注

- 建议在独立分支进行清理工作
- 清理前确保所有测试通过
- 保留 Git 历史以便回滚
- 更新相关文档
