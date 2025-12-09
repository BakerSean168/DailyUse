# STORY-002: Goal 模块完善

> **EPIC**: EPIC-010 Desktop 全面 DDD 模块化重构  
> **Sprint**: Sprint 1  
> **预估**: 8 小时  
> **优先级**: P0  
> **依赖**: STORY-001

---

## 📋 概述

Goal 模块已有部分 IPC 实现，需要：
1. 迁移到新的模块化目录结构
2. 创建 ApplicationService 包装层
3. 重构 IPC handlers 使用 ApplicationService
4. 完善 Goal Folder 和 Statistics 功能

---

## 🎯 目标

1. Goal 模块完全符合 DDD 模块化规范
2. 复用 `@dailyuse/application-server/goal` 的所有服务
3. 所有 IPC channels 返回真实数据

---

## ✅ 验收标准 (AC)

### AC-1: 目录结构
```gherkin
Given Goal 模块目录 modules/goal/
When 查看目录结构
Then 应包含:
  - application/GoalDesktopApplicationService.ts
  - ipc/goal.ipc-handlers.ts
  - ipc/goal-folder.ipc-handlers.ts
  - ipc/goal-statistics.ipc-handlers.ts
  - index.ts
```

### AC-2: ApplicationService 复用
```gherkin
Given GoalDesktopApplicationService
When 检查实现
Then 应复用 @dailyuse/application-server/goal 的:
  - createGoal
  - getGoal
  - listGoals
  - updateGoal
  - deleteGoal
  - activateGoal
  - archiveGoal
  - completeGoal
```

### AC-3: IPC Channels 功能完整
```gherkin
Given 所有 Goal IPC channels
When 调用每个 channel
Then 应返回真实数据（非 TODO 占位符）
And 错误应被正确处理和记录
```

### AC-4: 旧文件清理
```gherkin
Given 重构完成后
When 检查 ipc/ 目录
Then 旧的 goal.ipc-handlers.ts 应被删除
And 旧的 goal-folder.ipc-handlers.ts 应被删除
```

---

## 📁 任务清单

### Task 2.1: 创建 GoalDesktopApplicationService

**文件**: `apps/desktop/src/main/modules/goal/application/GoalDesktopApplicationService.ts`

```typescript
/**
 * Goal Desktop Application Service
 * 
 * 包装 @dailyuse/application-server/goal 的服务
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 */

import {
  GoalApplicationService,
  type CreateGoalParams,
  type UpdateGoalParams,
} from '@dailyuse/application-server';
import { GoalContainer } from '@dailyuse/infrastructure-server';
import type { GoalClientDTO, GoalFolderClientDTO } from '@dailyuse/contracts/goal';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalDesktopAppService');

export class GoalDesktopApplicationService {
  private appService: GoalApplicationService;

  constructor() {
    const container = GoalContainer.getInstance();
    this.appService = new GoalApplicationService(
      container.getGoalRepository()
    );
  }

  // ===== Goal CRUD =====

  async createGoal(params: CreateGoalParams): Promise<GoalClientDTO> {
    logger.debug('Creating goal', { title: params.title });
    return this.appService.createGoal(params);
  }

  async getGoal(uuid: string, includeChildren = true): Promise<GoalClientDTO | null> {
    return this.appService.getGoal(uuid, includeChildren);
  }

  async listGoals(params: {
    accountUuid?: string;
    status?: string;
    folderUuid?: string;
    page?: number;
    limit?: number;
  }): Promise<{ goals: GoalClientDTO[]; total: number }> {
    return this.appService.listGoals(params);
  }

  async updateGoal(uuid: string, params: UpdateGoalParams): Promise<GoalClientDTO> {
    return this.appService.updateGoal(uuid, params);
  }

  async deleteGoal(uuid: string): Promise<void> {
    return this.appService.deleteGoal(uuid);
  }

  // ===== Goal Status =====

  async activateGoal(uuid: string): Promise<GoalClientDTO> {
    return this.appService.activateGoal(uuid);
  }

  async archiveGoal(uuid: string): Promise<GoalClientDTO> {
    return this.appService.archiveGoal(uuid);
  }

  async completeGoal(uuid: string): Promise<GoalClientDTO> {
    return this.appService.completeGoal(uuid);
  }

  async pauseGoal(uuid: string): Promise<GoalClientDTO> {
    // TODO: 如果 application-server 没有此方法，需要扩展
    throw new Error('Not implemented');
  }

  // ===== Goal Folder =====

  async createFolder(params: {
    accountUuid: string;
    name: string;
    parentUuid?: string;
    color?: string;
  }): Promise<GoalFolderClientDTO> {
    const container = GoalContainer.getInstance();
    const folderRepo = container.getGoalFolderRepository();
    // TODO: 使用 GoalFolder 领域实体创建
    throw new Error('Not implemented - need GoalFolder domain entity');
  }

  async listFolders(accountUuid: string): Promise<GoalFolderClientDTO[]> {
    const container = GoalContainer.getInstance();
    const folderRepo = container.getGoalFolderRepository();
    return folderRepo.findByAccountUuid(accountUuid);
  }

  async updateFolder(uuid: string, params: {
    name?: string;
    color?: string;
    parentUuid?: string;
  }): Promise<GoalFolderClientDTO> {
    throw new Error('Not implemented');
  }

  async deleteFolder(uuid: string): Promise<void> {
    const container = GoalContainer.getInstance();
    const folderRepo = container.getGoalFolderRepository();
    await folderRepo.delete(uuid);
  }

  // ===== Statistics =====

  async getStatistics(accountUuid: string): Promise<{
    total: number;
    active: number;
    completed: number;
    archived: number;
  }> {
    const container = GoalContainer.getInstance();
    const statsRepo = container.getStatisticsRepository();
    return statsRepo.getAccountStatistics(accountUuid);
  }
}
```

### Task 2.2: 创建 Goal IPC Handlers

**文件**: `apps/desktop/src/main/modules/goal/ipc/goal.ipc-handlers.ts`

```typescript
/**
 * Goal IPC Handlers
 * 
 * 处理 Goal 模块的主要 IPC 通道
 */

import { ipcMain } from 'electron';
import { GoalDesktopApplicationService } from '../application/GoalDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalIPC');

let appService: GoalDesktopApplicationService | null = null;

function getAppService(): GoalDesktopApplicationService {
  if (!appService) {
    appService = new GoalDesktopApplicationService();
  }
  return appService;
}

export function registerGoalIpcHandlers(): void {
  // ===== Goal CRUD =====

  ipcMain.handle('goal:create', async (_, request) => {
    try {
      return await getAppService().createGoal(request);
    } catch (error) {
      logger.error('Failed to create goal', error);
      throw error;
    }
  });

  ipcMain.handle('goal:list', async (_, params) => {
    try {
      return await getAppService().listGoals(params || {});
    } catch (error) {
      logger.error('Failed to list goals', error);
      throw error;
    }
  });

  ipcMain.handle('goal:get', async (_, uuid, includeChildren = true) => {
    try {
      return await getAppService().getGoal(uuid, includeChildren);
    } catch (error) {
      logger.error('Failed to get goal', error);
      throw error;
    }
  });

  ipcMain.handle('goal:update', async (_, uuid, request) => {
    try {
      return await getAppService().updateGoal(uuid, request);
    } catch (error) {
      logger.error('Failed to update goal', error);
      throw error;
    }
  });

  ipcMain.handle('goal:delete', async (_, uuid) => {
    try {
      await getAppService().deleteGoal(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete goal', error);
      throw error;
    }
  });

  // ===== Goal Status =====

  ipcMain.handle('goal:activate', async (_, uuid) => {
    try {
      return await getAppService().activateGoal(uuid);
    } catch (error) {
      logger.error('Failed to activate goal', error);
      throw error;
    }
  });

  ipcMain.handle('goal:pause', async (_, uuid) => {
    try {
      return await getAppService().pauseGoal(uuid);
    } catch (error) {
      logger.error('Failed to pause goal', error);
      throw error;
    }
  });

  ipcMain.handle('goal:complete', async (_, uuid) => {
    try {
      return await getAppService().completeGoal(uuid);
    } catch (error) {
      logger.error('Failed to complete goal', error);
      throw error;
    }
  });

  ipcMain.handle('goal:archive', async (_, uuid) => {
    try {
      return await getAppService().archiveGoal(uuid);
    } catch (error) {
      logger.error('Failed to archive goal', error);
      throw error;
    }
  });

  logger.info('Goal IPC handlers registered');
}
```

### Task 2.3: 创建 Goal Folder IPC Handlers

**文件**: `apps/desktop/src/main/modules/goal/ipc/goal-folder.ipc-handlers.ts`

```typescript
/**
 * Goal Folder IPC Handlers
 */

import { ipcMain } from 'electron';
import { GoalDesktopApplicationService } from '../application/GoalDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalFolderIPC');

let appService: GoalDesktopApplicationService | null = null;

function getAppService(): GoalDesktopApplicationService {
  if (!appService) {
    appService = new GoalDesktopApplicationService();
  }
  return appService;
}

export function registerGoalFolderIpcHandlers(): void {
  ipcMain.handle('goal-folder:create', async (_, request) => {
    try {
      return await getAppService().createFolder(request);
    } catch (error) {
      logger.error('Failed to create goal folder', error);
      throw error;
    }
  });

  ipcMain.handle('goal-folder:list', async (_, accountUuid) => {
    try {
      return await getAppService().listFolders(accountUuid || 'default');
    } catch (error) {
      logger.error('Failed to list goal folders', error);
      throw error;
    }
  });

  ipcMain.handle('goal-folder:update', async (_, uuid, request) => {
    try {
      return await getAppService().updateFolder(uuid, request);
    } catch (error) {
      logger.error('Failed to update goal folder', error);
      throw error;
    }
  });

  ipcMain.handle('goal-folder:delete', async (_, uuid) => {
    try {
      await getAppService().deleteFolder(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete goal folder', error);
      throw error;
    }
  });

  logger.info('Goal Folder IPC handlers registered');
}
```

### Task 2.4: 创建 Goal Statistics IPC Handlers

**文件**: `apps/desktop/src/main/modules/goal/ipc/goal-statistics.ipc-handlers.ts`

```typescript
/**
 * Goal Statistics IPC Handlers
 */

import { ipcMain } from 'electron';
import { GoalDesktopApplicationService } from '../application/GoalDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalStatisticsIPC');

let appService: GoalDesktopApplicationService | null = null;

function getAppService(): GoalDesktopApplicationService {
  if (!appService) {
    appService = new GoalDesktopApplicationService();
  }
  return appService;
}

export function registerGoalStatisticsIpcHandlers(): void {
  ipcMain.handle('goal:statistics:get', async (_, accountUuid) => {
    try {
      return await getAppService().getStatistics(accountUuid || 'default');
    } catch (error) {
      logger.error('Failed to get goal statistics', error);
      throw error;
    }
  });

  logger.info('Goal Statistics IPC handlers registered');
}
```

### Task 2.5: 创建模块入口

**文件**: `apps/desktop/src/main/modules/goal/index.ts`

```typescript
/**
 * Goal Module - Desktop Main Process
 */

import { registerGoalIpcHandlers } from './ipc/goal.ipc-handlers';
import { registerGoalFolderIpcHandlers } from './ipc/goal-folder.ipc-handlers';
import { registerGoalStatisticsIpcHandlers } from './ipc/goal-statistics.ipc-handlers';
import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalModule');

export function registerGoalModule(): void {
  InitializationManager.getInstance().registerModule(
    'goal',
    InitializationPhase.CORE_SERVICES,
    async () => {
      registerGoalIpcHandlers();
      registerGoalFolderIpcHandlers();
      registerGoalStatisticsIpcHandlers();
      logger.info('Goal module initialized');
    }
  );
}

export { GoalDesktopApplicationService } from './application/GoalDesktopApplicationService';
```

### Task 2.6: 删除旧文件

```bash
# 确认新模块工作正常后删除
rm apps/desktop/src/main/ipc/goal.ipc-handlers.ts
rm apps/desktop/src/main/ipc/goal-folder.ipc-handlers.ts
```

---

## 📚 技术上下文

### @dailyuse/application-server/goal 可用服务

```typescript
// 来自 packages/application-server/src/goal/services/
export class GoalApplicationService {
  createGoal(params: CreateGoalParams): Promise<GoalClientDTO>
  getGoal(uuid: string, includeChildren?: boolean): Promise<GoalClientDTO | null>
  listGoals(params: ListGoalsParams): Promise<{ goals: GoalClientDTO[]; total: number }>
  updateGoal(uuid: string, params: UpdateGoalParams): Promise<GoalClientDTO>
  deleteGoal(uuid: string): Promise<void>
  activateGoal(uuid: string): Promise<GoalClientDTO>
  archiveGoal(uuid: string): Promise<GoalClientDTO>
  completeGoal(uuid: string): Promise<GoalClientDTO>
  searchGoals(query: string, params: SearchParams): Promise<GoalClientDTO[]>
}
```

### 现有 IPC Channels（需保持兼容）

```typescript
// 来自 apps/desktop/src/main/ipc/goal.ipc-handlers.ts
'goal:create'
'goal:list'
'goal:get'
'goal:update'
'goal:delete'
'goal:activate'
'goal:pause'
'goal:complete'
'goal:archive'

// 来自 goal-folder.ipc-handlers.ts
'goal-folder:create'
'goal-folder:list'
'goal-folder:update'
'goal-folder:delete'
```

---

## 🔗 依赖关系

- **依赖**: STORY-001 (基础设施准备)
- **被依赖**: STORY-007 (Dashboard 需要 Goal 数据)

---

## 📝 备注

- 现有 `goal.ipc-handlers.ts` 已有部分实现，需要对比并迁移
- `GoalApplicationService` 的某些方法可能需要在 `application-server` 包中扩展
- Key Results 相关功能也需要包含在 Goal 模块中
