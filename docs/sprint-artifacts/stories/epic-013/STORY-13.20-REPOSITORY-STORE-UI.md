# Story 13.20: Repository Store & 备份 UI

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.20 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P1 (High) |
| 复杂度 | Medium |
| 预估工时 | 4h |
| 状态 | Backlog |

## 目标

创建 Repository Store 和备份管理 UI。

## 任务列表

- [ ] 1. 创建 Repository Store
- [ ] 2. 创建备份管理页面
- [ ] 3. 创建导入导出组件
- [ ] 4. 添加单元测试

## 技术设计

### Repository Store

```typescript
export const useRepositoryStore = defineStore('repository', {
  state: () => ({
    storagePath: '',
    repositoryInfo: null as RepositoryInfo | null,
    backups: [] as BackupInfo[],
    backupSchedule: null as BackupSchedule | null,
    loading: false,
  }),

  actions: {
    async initialize() {
      await this.fetchStoragePath();
      await this.fetchRepositoryInfo();
      await this.fetchBackups();
    },

    async fetchStoragePath() {
      const client = this.getRepositoryClient();
      this.storagePath = await client.getStoragePath();
    },

    async changeStorageLocation() {
      const client = this.getRepositoryClient();
      const newPath = await client.selectStorageFolder();
      if (newPath) {
        await client.setStoragePath(newPath);
        this.storagePath = newPath;
      }
    },

    async createBackup(name?: string) {
      const client = this.getBackupClient();
      const backup = await client.createBackup(name);
      this.backups.unshift(backup);
      return backup;
    },

    async restoreBackup(uuid: string) {
      const client = this.getBackupClient();
      await client.restoreBackup(uuid);
      // 可能需要重新加载应用
    },
  },
});
```

## 验收标准

- [ ] Store 功能完整
- [ ] 备份管理 UI 完整
- [ ] 导入导出功能可用

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/repository/store/repository.store.ts` | 新建 |
| `renderer/modules/repository/pages/BackupPage.vue` | 新建 |
| `renderer/modules/repository/components/ExportDialog.vue` | 新建 |
| `renderer/modules/repository/components/ImportDialog.vue` | 新建 |

## 依赖关系

- **前置依赖**: Story 13.19
- **后续依赖**: 无
