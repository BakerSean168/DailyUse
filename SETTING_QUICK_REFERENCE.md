# Setting Module Phase 2 & Phase 3 快速参考

**概览**: Setting 模块现已包含 Phase 1 (核心 API)、Phase 2 (UI 增强)、Phase 3 (高级功能)

---

## 🎯 核心功能矩阵

| 功能 | Phase | 文件 | 行数 | 状态 |
|------|-------|------|------|------|
| 核心 CRUD API | 1 | SettingApplicationService.ts | 156 | ✅ 完成 |
| 基础 UI 组件 | 1 | 8x Setting*.vue | 800 | ✅ 完成 |
| 实时预览 | 2 | useSettingPreview.ts | 180 | ✅ 创建 |
| 导入/导出 | 2/3 | useSettingImportExport.ts | 220 | ✅ 创建 |
| 云同步服务 | 3 | SettingCloudSyncService.ts | 250 | ✅ 创建 |
| 高级操作 UI | 2/3 | SettingAdvancedActions.vue | 250 | ✅ 创建 |

**新增代码总量**: 1,150+ 行

---

## 📦 新增文件清单

### 前端 Composables

#### `useSettingPreview.ts`
**位置**: `apps/web/src/modules/setting/presentation/composables/`

**功能**: 实时预览设置变化
```typescript
// 导出的函数
- applyThemePreview(theme: string)
- applyFontSizePreview(size: string)
- applyAccentColorPreview(color: string)
- applyCompactModePreview(compact: boolean)
- applyFontFamilyPreview(family: string)
- resetPreview()
- applyAllPreview(settings: UserSettingClientDTO)
```

**使用示例**:
```typescript
const { applyThemePreview } = useSettingPreview();
watch(() => settings.theme, (newTheme) => {
  applyThemePreview(newTheme);
});
```

#### `useSettingImportExport.ts`
**位置**: `apps/web/src/modules/setting/presentation/composables/`

**功能**: 导入/导出和备份/恢复
```typescript
// 导出的函数
- exportSettings(settings, filename?)
- importSettings(file)
- exportAsCSV(settings, filename?)
- createLocalBackup(settings, key?)
- restoreFromLocalBackup(key?)
- getLocalBackups()
```

**使用示例**:
```typescript
const { exportSettings, importSettings } = useSettingImportExport();

// 导出
await exportSettings(settings, 'my-settings.json');

// 导入
const imported = await importSettings(fileInput.files[0]);
```

### 前端组件

#### `SettingAdvancedActions.vue`
**位置**: `apps/web/src/modules/setting/presentation/components/`

**功能**: 导出/导入/备份/云同步 UI
```vue
<SettingAdvancedActions 
  :settings="currentSettings"
  @update="handleUpdate"
/>
```

**包含功能**:
- 导出为 JSON/CSV
- 导入 JSON 文件
- 创建/恢复本地备份
- 云同步控制
- 版本历史查看

### 后端服务

#### `SettingCloudSyncService.ts`
**位置**: `apps/api/src/modules/setting/application/services/`

**功能**: 云同步、版本管理、冲突解决
```typescript
// 导出的方法
- saveSettingVersion(accountUuid, deviceId, deviceName, snapshot)
- getSettingHistory(accountUuid, limit?)
- restoreSettingVersion(accountUuid, versionUuid)
- resolveConflict(accountUuid, local, remote, strategy)
- getSyncStatus(accountUuid)
- cleanupOldVersions(accountUuid, keepCount?)
```

**冲突解决策略**:
- `'local'` - 使用本地版本
- `'remote'` - 使用远程版本
- `'merge'` - 深度合并

---

## 🔌 集成点

### Phase 2 集成

**需要修改的文件**:
1. `AppearanceSettings.vue` - 导入 useSettingPreview
2. `main.ts` - 导入 CSS 动画文件
3. `userSettingStore.ts` - 添加缓存逻辑

**示例集成**:
```typescript
// 在 AppearanceSettings.vue 中
import { useSettingPreview } from '../composables/useSettingPreview';

const { applyThemePreview } = useSettingPreview();

watch(() => form.theme, (newTheme) => {
  applyThemePreview(newTheme);
});
```

### Phase 3 集成

**需要实现的**:
1. 在 `SettingController` 中添加 sync 路由
2. 创建 `SettingSyncApiClient` API 客户端
3. 在 `SettingPage.vue` 中导入 `SettingAdvancedActions`

**示例集成**:
```typescript
// 在 SettingController.ts 中
@Post('/sync/save-version')
async saveSettingVersion(@Body() dto: SaveVersionDTO) {
  return this.syncService.saveSettingVersion(
    accountUuid,
    dto.deviceId,
    dto.deviceName,
    dto.snapshot
  );
}
```

---

## 📡 API 端点

### 现有端点 (Phase 1)

```
GET    /api/v1/settings/me              - 获取当前用户设置
PUT    /api/v1/settings/me              - 更新设置
POST   /api/v1/settings/reset           - 重置为默认值
GET    /api/v1/settings/defaults        - 获取默认设置
```

### 新增端点 (Phase 3)

```
POST   /api/v1/settings/sync/save-version      - 保存版本快照
GET    /api/v1/settings/sync/history           - 获取版本历史
POST   /api/v1/settings/sync/restore           - 恢复历史版本
POST   /api/v1/settings/sync/resolve-conflict  - 解决冲突
GET    /api/v1/settings/sync/status            - 获取同步状态
DELETE /api/v1/settings/sync/cleanup           - 清理旧版本
```

---

## �� 测试快速命令

### 运行现有测试
```bash
# 所有 Setting 模块测试
nx test setting

# 单独测试 API
nx test api:setting

# 单独测试 Web
nx test web:setting
```

### 测试新增功能
```bash
# 测试 composables
nx test web:setting --include='**/*.composable.spec.ts'

# 测试组件
nx test web:setting --include='**/SettingAdvancedActions.spec.ts'

# 测试后端服务
nx test api:setting --include='**/SettingCloudSyncService.spec.ts'
```

---

## 📊 性能目标

| 操作 | 目标 | 实现方式 |
|------|------|--------|
| 实时预览 | < 100ms | DOM 直接操作 |
| JSON 导出 | < 500ms | 流式序列化 |
| 云同步 | < 2s | 异步批处理 |
| 版本查询 | < 100ms | 内存缓存 |
| 主题切换 | < 300ms | CSS 过渡 |

---

## 🔐 安全特性

✅ **实现的安全措施**:
- 文件上传验证 (JSON 格式检查)
- XSS 防护 (DOM 文本内容)
- 类型检查 (TypeScript)
- 权限验证 (JWT authMiddleware)

⏳ **待实现的安全措施**:
- 备份加密 (可选)
- 端到端加密 (可选)
- 审计日志
- 数据脱敏

---

## 🚀 使用示例

### 实时预览示例

```typescript
<script setup lang="ts">
import { useSettingPreview } from './composables/useSettingPreview';
import { watch, ref } from 'vue';

const settings = ref({ theme: 'AUTO', fontSize: 'MEDIUM' });
const { applyThemePreview, applyFontSizePreview, resetPreview } = useSettingPreview();

// 监听主题变化
watch(() => settings.theme, (newTheme) => {
  applyThemePreview(newTheme);
});

// 保存时调用 API
const save = async () => {
  try {
    await api.updateSettings(settings.value);
  } catch (error) {
    resetPreview(); // 失败时重置
  }
};
</script>
```

### 导入/导出示例

```typescript
<script setup lang="ts">
import { useSettingImportExport } from './composables/useSettingImportExport';

const { 
  exportSettings, 
  importSettings,
  createLocalBackup,
  restoreFromLocalBackup 
} = useSettingImportExport();

// 导出设置
const handleExport = () => {
  exportSettings(settings, 'my-settings.json');
};

// 导入设置
const handleImport = async (event) => {
  const file = event.target.files[0];
  const imported = await importSettings(file);
  // 使用导入的设置
};

// 创建备份
const handleBackup = () => {
  createLocalBackup(settings, 'backup_1');
};

// 恢复备份
const handleRestore = () => {
  const restored = restoreFromLocalBackup('backup_1');
};
</script>
```

### 云同步示例

```typescript
// 后端
const syncService = new SettingCloudSyncService();

// 保存版本
const version = await syncService.saveSettingVersion(
  accountUuid,
  'device-id-1',
  'My Phone',
  settings
);

// 获取历史
const history = await syncService.getSettingHistory(accountUuid, 10);

// 解决冲突
const resolved = await syncService.resolveConflict(
  accountUuid,
  localVersion,
  remoteVersion,
  'merge'
);

// 恢复版本
const restored = await syncService.restoreSettingVersion(
  accountUuid,
  versionUuid
);
```

---

## 📋 检查清单

### Phase 2 部署前

- [ ] useSettingPreview 已集成到 AppearanceSettings
- [ ] CSS 动画已添加
- [ ] 本地缓存已实现
- [ ] 所有预览功能已测试
- [ ] 性能指标符合要求

### Phase 3 部署前

- [ ] SettingController 中添加了 sync 路由
- [ ] SettingCloudSyncService 已集成
- [ ] SettingSyncApiClient 已实现
- [ ] SettingAdvancedActions 已集成
- [ ] 所有同步功能已测试
- [ ] 多设备冲突解决已测试

---

## 🔗 相关资源

**文档**:
- `SETTING_PHASE2_PHASE3_IMPLEMENTATION.md` - 完整方案
- `SETTING_INTEGRATION_CHECKLIST.md` - 集成清单
- `epic-7-api-endpoints.md` - API 端点文档

**代码**:
- `apps/web/src/modules/setting/presentation/composables/`
- `apps/web/src/modules/setting/presentation/components/`
- `apps/api/src/modules/setting/application/services/`

**测试**:
- `apps/web/src/modules/setting/**/*.spec.ts`
- `apps/api/src/modules/setting/**/*.spec.ts`

---

## 📞 常见问题

**Q: 如何启用实时预览?**
A: 在组件中导入 useSettingPreview，然后 watch 设置项并调用相应的应用函数。

**Q: 导出的文件格式是什么?**
A: JSON 格式，包含版本号、导出时间、设置数据。

**Q: 如何处理多设备冲突?**
A: 使用 resolveConflict 方法，支持 'local'、'remote'、'merge' 三种策略。

**Q: 本地备份存储在哪里?**
A: 浏览器的 localStorage，不同备份用不同的 key 存储。

**Q: 云同步需要后端数据库吗?**
A: 是的，需要存储版本历史。当前实现使用内存存储，可扩展到数据库。

---

**最后更新**: 2025-11-06  
**版本**: 1.0.0  
**维护者**: AI Assistant

