# Story 13.19: Repository 模块 IPC Client

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.19 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P1 (High) |
| 复杂度 | High |
| 预估工时 | 6h |
| 状态 | Backlog |

## 目标

为 Repository 模块创建 IPC Client，支持本地文件存储和同步功能。

## 背景

Repository 模块在桌面端负责管理本地数据存储，包括文件系统访问、数据导入导出等功能。

## 任务列表

- [ ] 1. 实现 `RepositoryIPCClient`
  - [ ] getStoragePath() - 获取存储路径
  - [ ] setStoragePath(path) - 设置存储路径
  - [ ] getRepositoryInfo() - 获取仓库信息
- [ ] 2. 实现 `DataExportIPCClient`
  - [ ] exportAll(format) - 导出所有数据
  - [ ] exportModule(module, format) - 导出模块数据
  - [ ] getExportHistory() - 导出历史
- [ ] 3. 实现 `DataImportIPCClient`
  - [ ] importFromFile(path) - 从文件导入
  - [ ] validateImportData(path) - 验证导入数据
  - [ ] getImportPreview(path) - 预览导入内容
- [ ] 4. 实现 `BackupIPCClient`
  - [ ] createBackup() - 创建备份
  - [ ] listBackups() - 列出备份
  - [ ] restoreBackup(uuid) - 恢复备份
  - [ ] deleteBackup(uuid) - 删除备份
- [ ] 5. DI 配置
- [ ] 6. 单元测试

## 技术设计

### RepositoryIPCClient

```typescript
export class RepositoryIPCClient extends BaseIPCClient {
  async getStoragePath(): Promise<string> {
    return this.invoke(IPC_CHANNELS.REPOSITORY.GET_STORAGE_PATH);
  }

  async setStoragePath(path: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.REPOSITORY.SET_STORAGE_PATH, { path });
  }

  async getRepositoryInfo(): Promise<RepositoryInfo> {
    return this.invoke(IPC_CHANNELS.REPOSITORY.GET_INFO);
  }

  async selectStorageFolder(): Promise<string | null> {
    return this.invoke(IPC_CHANNELS.REPOSITORY.SELECT_FOLDER);
  }
}
```

### DataExportIPCClient

```typescript
export class DataExportIPCClient extends BaseIPCClient {
  async exportAll(format: ExportFormat): Promise<ExportResult> {
    return this.invoke(IPC_CHANNELS.REPOSITORY.EXPORT.ALL, { format });
  }

  async exportModule(module: string, format: ExportFormat): Promise<ExportResult> {
    return this.invoke(IPC_CHANNELS.REPOSITORY.EXPORT.MODULE, { module, format });
  }

  async exportToFile(options: ExportOptions): Promise<string> {
    return this.invoke(IPC_CHANNELS.REPOSITORY.EXPORT.TO_FILE, options);
  }
}
```

### BackupIPCClient

```typescript
export class BackupIPCClient extends BaseIPCClient {
  async createBackup(name?: string): Promise<BackupInfo> {
    return this.invoke(IPC_CHANNELS.REPOSITORY.BACKUP.CREATE, { name });
  }

  async listBackups(): Promise<BackupInfo[]> {
    return this.invoke(IPC_CHANNELS.REPOSITORY.BACKUP.LIST);
  }

  async restoreBackup(uuid: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.REPOSITORY.BACKUP.RESTORE, { uuid });
  }

  async deleteBackup(uuid: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.REPOSITORY.BACKUP.DELETE, { uuid });
  }

  async getBackupSchedule(): Promise<BackupSchedule> {
    return this.invoke(IPC_CHANNELS.REPOSITORY.BACKUP.GET_SCHEDULE);
  }

  async setBackupSchedule(schedule: BackupSchedule): Promise<void> {
    return this.invoke(IPC_CHANNELS.REPOSITORY.BACKUP.SET_SCHEDULE, schedule);
  }
}
```

## 验收标准

- [ ] 所有 IPC Client 实现完整
- [ ] 文件对话框正常工作
- [ ] 导入导出功能正常
- [ ] 备份恢复功能正常
- [ ] 单元测试覆盖率 > 80%

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/repository/infrastructure/ipc/repository.ipc-client.ts` | 新建 |
| `renderer/modules/repository/infrastructure/ipc/data-export.ipc-client.ts` | 新建 |
| `renderer/modules/repository/infrastructure/ipc/data-import.ipc-client.ts` | 新建 |
| `renderer/modules/repository/infrastructure/ipc/backup.ipc-client.ts` | 新建 |
| `renderer/modules/repository/di/` | 新建 | DI 配置 |

## 依赖关系

- **前置依赖**: Stories 13.1, 13.4
- **后续依赖**: Story 13.20 (Repository Store)
