# STORY-010: Repository 模块实现（Backup/Export/Import）

> **EPIC**: EPIC-010 Desktop 全面 DDD 模块化重构  
> **Sprint**: Sprint 3  
> **预估**: 8 小时  
> **优先级**: P1  
> **依赖**: STORY-001, STORY-002, STORY-003, STORY-004, STORY-005

---

## 📋 概述

Repository 模块负责数据管理：
- 本地备份创建和恢复
- 数据导出（JSON, CSV）
- 数据导入和校验
- 同步状态管理（预留）

---

## 🎯 目标

1. 实现完整的本地备份功能
2. 实现数据导出到 JSON/CSV
3. 实现数据导入和校验
4. 为未来云同步预留接口

---

## ✅ 验收标准 (AC)

### AC-1: 本地备份
```gherkin
Given Repository 备份功能
When 调用 repository:backup:create
Then 应创建包含所有数据的备份文件
And 备份文件应存储在用户数据目录
And 返回备份 ID 和路径
```

### AC-2: 备份恢复
```gherkin
Given 存在有效备份
When 调用 repository:backup:restore (backupId)
Then 应恢复所有数据到备份时的状态
And 当前数据应被备份后再恢复
```

### AC-3: 数据导出
```gherkin
Given 用户数据
When 调用 repository:export
  - format: 'json' | 'csv'
  - modules: ['goal', 'task', 'schedule', 'reminder'] (可选)
Then 应导出指定格式的数据文件
And 用户应能选择保存位置
```

### AC-4: 数据导入
```gherkin
Given 有效的导入文件
When 调用 repository:import
Then 应校验数据格式
And 导入数据到对应模块
And 处理冲突（合并/覆盖/跳过）
```

---

## 📁 任务清单

### Task 10.1: 创建 RepositoryDesktopApplicationService

**文件**: `apps/desktop/src/main/modules/repository/application/RepositoryDesktopApplicationService.ts`

```typescript
/**
 * Repository Desktop Application Service
 * 
 * 数据备份、导出、导入管理
 */

import { app, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '@dailyuse/utils';
import { GoalContainer, TaskContainer, ScheduleContainer, ReminderContainer } from '@dailyuse/infrastructure-server';

const logger = createLogger('RepositoryDesktopAppService');

export interface BackupInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  createdAt: number;
  modules: string[];
}

export interface ExportOptions {
  format: 'json' | 'csv';
  modules?: string[];
  savePath?: string;
}

export interface ImportOptions {
  conflictResolution: 'merge' | 'overwrite' | 'skip';
  validateOnly?: boolean;
}

export class RepositoryDesktopApplicationService {
  private readonly backupDir: string;
  private readonly maxBackups: number = 10;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.backupDir = path.join(userDataPath, 'backups');
    
    // 确保备份目录存在
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // ===== Sync (预留) =====

  async startSync(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Desktop offline mode - sync not available' };
  }

  async stopSync(): Promise<{ success: boolean }> {
    return { success: true };
  }

  async getSyncStatus(): Promise<{
    status: 'offline' | 'syncing' | 'synced' | 'error';
    lastSync: number | null;
    pendingChanges: number;
  }> {
    return {
      status: 'offline',
      lastSync: null,
      pendingChanges: 0,
    };
  }

  async forceSync(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Desktop offline mode' };
  }

  // ===== Backup =====

  async createBackup(options?: {
    name?: string;
    modules?: string[];
  }): Promise<{
    success: boolean;
    backup?: BackupInfo;
    error?: string;
  }> {
    try {
      const timestamp = Date.now();
      const backupId = `backup-${timestamp}`;
      const backupName = options?.name || `Backup ${new Date(timestamp).toLocaleString()}`;
      const backupPath = path.join(this.backupDir, `${backupId}.json`);

      const modules = options?.modules || ['goal', 'task', 'schedule', 'reminder', 'setting'];
      const data: Record<string, unknown> = {
        meta: {
          id: backupId,
          name: backupName,
          version: app.getVersion(),
          createdAt: timestamp,
          modules,
        },
      };

      // 收集各模块数据
      for (const module of modules) {
        data[module] = await this.collectModuleData(module);
      }

      // 写入备份文件
      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
      const stats = fs.statSync(backupPath);

      // 清理旧备份
      await this.cleanupOldBackups();

      const backup: BackupInfo = {
        id: backupId,
        name: backupName,
        path: backupPath,
        size: stats.size,
        createdAt: timestamp,
        modules,
      };

      logger.info('Backup created', { id: backupId, path: backupPath });
      return { success: true, backup };
    } catch (error) {
      logger.error('Failed to create backup', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async collectModuleData(module: string): Promise<unknown> {
    switch (module) {
      case 'goal': {
        const repo = GoalContainer.getInstance().getGoalRepository();
        const goals = await repo.findAll();
        return goals.map(g => g.toClientDTO());
      }
      case 'task': {
        const container = TaskContainer.getInstance();
        const templates = await container.getTemplateRepository().findAll();
        const instances = await container.getInstanceRepository().findAll();
        return {
          templates: templates.map(t => t.toClientDTO()),
          instances: instances.map(i => i.toClientDTO()),
        };
      }
      case 'schedule': {
        const container = ScheduleContainer.getInstance();
        const tasks = await container.getScheduleTaskRepository().findAll();
        const events = await container.getScheduleEventRepository().findAll();
        return {
          tasks: tasks.map(t => t.toClientDTO()),
          events: events.map(e => e.toClientDTO()),
        };
      }
      case 'reminder': {
        const container = ReminderContainer.getInstance();
        const templates = await container.getTemplateRepository().findAll();
        const groups = await container.getGroupRepository().findAll();
        return {
          templates: templates.map(t => t.toClientDTO()),
          groups: groups.map(g => g.toClientDTO()),
        };
      }
      default:
        return null;
    }
  }

  async restoreBackup(backupId: string): Promise<{
    success: boolean;
    error?: string;
    restoredModules?: string[];
  }> {
    try {
      const backupPath = path.join(this.backupDir, `${backupId}.json`);
      
      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'Backup not found' };
      }

      // 先创建当前数据的备份
      await this.createBackup({ name: 'Auto-backup before restore' });

      const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
      const modules = data.meta?.modules || [];

      for (const module of modules) {
        if (data[module]) {
          await this.restoreModuleData(module, data[module]);
        }
      }

      logger.info('Backup restored', { backupId, modules });
      return { success: true, restoredModules: modules };
    } catch (error) {
      logger.error('Failed to restore backup', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async restoreModuleData(module: string, data: unknown): Promise<void> {
    // TODO: 实现各模块的数据恢复
    logger.info(`Restoring module: ${module}`);
    // 需要调用各模块的批量导入方法
  }

  async listBackups(): Promise<{
    backups: BackupInfo[];
    total: number;
  }> {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const filePath = path.join(this.backupDir, f);
          const stats = fs.statSync(filePath);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          return {
            id: data.meta?.id || f.replace('.json', ''),
            name: data.meta?.name || f,
            path: filePath,
            size: stats.size,
            createdAt: data.meta?.createdAt || stats.mtimeMs,
            modules: data.meta?.modules || [],
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      return { backups: files, total: files.length };
    } catch (error) {
      logger.error('Failed to list backups', error);
      return { backups: [], total: 0 };
    }
  }

  async deleteBackup(backupId: string): Promise<{ success: boolean }> {
    try {
      const backupPath = path.join(this.backupDir, `${backupId}.json`);
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
        logger.info('Backup deleted', { backupId });
      }
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete backup', error);
      return { success: false };
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    const { backups } = await this.listBackups();
    
    // 保留最新的 maxBackups 个
    const toDelete = backups.slice(this.maxBackups);
    for (const backup of toDelete) {
      await this.deleteBackup(backup.id);
    }
  }

  // ===== Export =====

  async exportData(options: ExportOptions): Promise<{
    success: boolean;
    path?: string;
    error?: string;
  }> {
    try {
      const modules = options.modules || ['goal', 'task', 'schedule', 'reminder'];
      const data: Record<string, unknown> = {
        exportedAt: Date.now(),
        version: app.getVersion(),
      };

      for (const module of modules) {
        data[module] = await this.collectModuleData(module);
      }

      let content: string;
      let defaultExt: string;

      if (options.format === 'csv') {
        content = this.convertToCSV(data);
        defaultExt = 'csv';
      } else {
        content = JSON.stringify(data, null, 2);
        defaultExt = 'json';
      }

      // 让用户选择保存位置
      let savePath = options.savePath;
      if (!savePath) {
        const result = await dialog.showSaveDialog({
          title: 'Export Data',
          defaultPath: `dailyuse-export-${Date.now()}.${defaultExt}`,
          filters: [
            { name: options.format.toUpperCase(), extensions: [defaultExt] },
          ],
        });
        
        if (result.canceled || !result.filePath) {
          return { success: false, error: 'Export cancelled' };
        }
        savePath = result.filePath;
      }

      fs.writeFileSync(savePath, content);
      logger.info('Data exported', { path: savePath, format: options.format });
      return { success: true, path: savePath };
    } catch (error) {
      logger.error('Failed to export data', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private convertToCSV(data: Record<string, unknown>): string {
    // 简化的 CSV 转换，实际需要更复杂的处理
    const lines: string[] = [];
    
    for (const [module, moduleData] of Object.entries(data)) {
      if (Array.isArray(moduleData)) {
        if (moduleData.length > 0) {
          const headers = Object.keys(moduleData[0] as object);
          lines.push(`# ${module}`);
          lines.push(headers.join(','));
          
          for (const item of moduleData) {
            const values = headers.map(h => {
              const v = (item as Record<string, unknown>)[h];
              return typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : String(v ?? '');
            });
            lines.push(values.join(','));
          }
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }

  async getExportFormats(): Promise<{ formats: string[] }> {
    return { formats: ['json', 'csv'] };
  }

  // ===== Import =====

  async importData(data: string | Record<string, unknown>, options: ImportOptions): Promise<{
    success: boolean;
    imported?: { module: string; count: number }[];
    errors?: string[];
  }> {
    try {
      let parsedData: Record<string, unknown>;

      if (typeof data === 'string') {
        parsedData = JSON.parse(data);
      } else {
        parsedData = data;
      }

      if (options.validateOnly) {
        const validation = await this.validateImportData(parsedData);
        return {
          success: validation.valid,
          errors: validation.errors,
        };
      }

      // 执行导入
      const imported: { module: string; count: number }[] = [];
      const errors: string[] = [];

      for (const [module, moduleData] of Object.entries(parsedData)) {
        if (['exportedAt', 'version'].includes(module)) continue;

        try {
          const count = await this.importModuleData(module, moduleData, options.conflictResolution);
          imported.push({ module, count });
        } catch (error) {
          errors.push(`Failed to import ${module}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      logger.info('Data imported', { imported, errors });
      return { success: errors.length === 0, imported, errors };
    } catch (error) {
      logger.error('Failed to import data', error);
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  private async importModuleData(
    module: string, 
    data: unknown, 
    conflictResolution: 'merge' | 'overwrite' | 'skip'
  ): Promise<number> {
    // TODO: 实现各模块的数据导入
    logger.info(`Importing module: ${module}`, { conflictResolution });
    return 0;
  }

  async validateImportData(data: Record<string, unknown>): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // 基本结构验证
    if (!data || typeof data !== 'object') {
      errors.push('Invalid data format: expected object');
    }

    // 版本兼容性检查
    if (data.version) {
      const currentVersion = app.getVersion();
      // 可以添加版本兼容性检查逻辑
    }

    // 各模块数据验证
    for (const [module, moduleData] of Object.entries(data)) {
      if (['exportedAt', 'version'].includes(module)) continue;

      const moduleErrors = await this.validateModuleData(module, moduleData);
      errors.push(...moduleErrors.map(e => `[${module}] ${e}`));
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private async validateModuleData(module: string, data: unknown): Promise<string[]> {
    const errors: string[] = [];

    // TODO: 实现各模块的数据验证
    // 检查必要字段、数据类型等

    return errors;
  }
}
```

### Task 10.2: 创建 Repository IPC Handlers

**文件**: `apps/desktop/src/main/modules/repository/ipc/repository.ipc-handlers.ts`

```typescript
/**
 * Repository IPC Handlers
 */

import { ipcMain } from 'electron';
import { RepositoryDesktopApplicationService } from '../application/RepositoryDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('RepositoryIPC');

let appService: RepositoryDesktopApplicationService | null = null;

function getAppService(): RepositoryDesktopApplicationService {
  if (!appService) {
    appService = new RepositoryDesktopApplicationService();
  }
  return appService;
}

export function registerRepositoryIpcHandlers(): void {
  // ===== Sync =====

  ipcMain.handle('repository:sync:start', async () => {
    return getAppService().startSync();
  });

  ipcMain.handle('repository:sync:stop', async () => {
    return getAppService().stopSync();
  });

  ipcMain.handle('repository:sync:get-status', async () => {
    return getAppService().getSyncStatus();
  });

  ipcMain.handle('repository:sync:force', async () => {
    return getAppService().forceSync();
  });

  // ===== Backup =====

  ipcMain.handle('repository:backup:create', async (_, options) => {
    try {
      return await getAppService().createBackup(options);
    } catch (error) {
      logger.error('Failed to create backup', error);
      throw error;
    }
  });

  ipcMain.handle('repository:backup:restore', async (_, backupId) => {
    try {
      return await getAppService().restoreBackup(backupId);
    } catch (error) {
      logger.error('Failed to restore backup', error);
      throw error;
    }
  });

  ipcMain.handle('repository:backup:list', async () => {
    try {
      return await getAppService().listBackups();
    } catch (error) {
      logger.error('Failed to list backups', error);
      throw error;
    }
  });

  ipcMain.handle('repository:backup:delete', async (_, backupId) => {
    try {
      return await getAppService().deleteBackup(backupId);
    } catch (error) {
      logger.error('Failed to delete backup', error);
      throw error;
    }
  });

  // ===== Export =====

  ipcMain.handle('repository:export', async (_, options) => {
    try {
      return await getAppService().exportData(options);
    } catch (error) {
      logger.error('Failed to export data', error);
      throw error;
    }
  });

  ipcMain.handle('repository:get-export-formats', async () => {
    return getAppService().getExportFormats();
  });

  // ===== Import =====

  ipcMain.handle('repository:import', async (_, data, options) => {
    try {
      return await getAppService().importData(data, options);
    } catch (error) {
      logger.error('Failed to import data', error);
      throw error;
    }
  });

  ipcMain.handle('repository:validate-import', async (_, data, format) => {
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      return await getAppService().validateImportData(parsedData);
    } catch (error) {
      logger.error('Failed to validate import', error);
      return { valid: false, errors: [error instanceof Error ? error.message : 'Invalid format'] };
    }
  });

  logger.info('Repository IPC handlers registered');
}
```

### Task 10.3: 创建模块入口

**文件**: `apps/desktop/src/main/modules/repository/index.ts`

```typescript
/**
 * Repository Module - Desktop Main Process
 */

import { registerRepositoryIpcHandlers } from './ipc/repository.ipc-handlers';
import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('RepositoryModule');

export function registerRepositoryModule(): void {
  InitializationManager.getInstance().registerModule(
    'repository',
    InitializationPhase.FEATURE_MODULES,
    async () => {
      registerRepositoryIpcHandlers();
      logger.info('Repository module initialized');
    },
    ['goal', 'task', 'schedule', 'reminder'] // 依赖数据模块
  );
}

export { RepositoryDesktopApplicationService } from './application/RepositoryDesktopApplicationService';
```

---

## 📚 技术上下文

### 备份策略

- 默认保留最近 10 个备份
- 恢复前自动创建当前状态备份
- 备份文件为 JSON 格式，包含完整元数据

### 导出格式

- **JSON**: 完整结构，支持导入
- **CSV**: 扁平化格式，便于电子表格查看

### 导入冲突处理

- **merge**: 合并数据，保留两边
- **overwrite**: 导入数据覆盖现有数据
- **skip**: 跳过已存在的数据

---

## 🔗 依赖关系

- **依赖**: 
  - STORY-001 (基础设施)
  - STORY-002 ~ STORY-005 (各数据模块)
- **被依赖**: 无

---

## 📝 备注

- 备份文件可能较大，考虑添加压缩选项
- CSV 导出需要处理复杂嵌套结构
- 导入时需要处理引用完整性（如 Task -> Goal）
