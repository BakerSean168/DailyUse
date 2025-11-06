# Setting Module Phase 2 & 3 集成清单

**目的**: 快速集成已创建的新功能到现有设置模块  
**日期**: 2025-11-06  
**优先级**: High

---

## 📋 文件清单

### ✅ 已创建的文件

1. **前端 Composables**
   - `apps/web/src/modules/setting/presentation/composables/useSettingPreview.ts` (180 行)
   - `apps/web/src/modules/setting/presentation/composables/useSettingImportExport.ts` (220 行)

2. **后端服务**
   - `apps/api/src/modules/setting/application/services/SettingCloudSyncService.ts` (250 行)

3. **前端组件**
   - `apps/web/src/modules/setting/presentation/components/SettingAdvancedActions.vue` (250 行)

4. **文档**
   - `SETTING_PHASE2_PHASE3_IMPLEMENTATION.md` - 完整实现方案
   - `SETTING_INTEGRATION_CHECKLIST.md` - 本文件

---

## 🔧 Phase 2 集成步骤

### Step 1: 更新 AppearanceSettings 组件

**文件**: `apps/web/src/modules/setting/presentation/components/AppearanceSettings.vue`

```vue
<script setup lang="ts">
import { useSettingPreview } from '../composables/useSettingPreview';

// 导入 composable
const { 
  applyThemePreview, 
  applyFontSizePreview,
  applyAccentColorPreview,
  resetPreview 
} = useSettingPreview();

// 在 watch 中应用预览
watch(() => form.value.theme, (newTheme) => {
  applyThemePreview(newTheme);
}, { immediate: true });

watch(() => form.value.fontSize, (newSize) => {
  applyFontSizePreview(newSize);
}, { immediate: true });

watch(() => form.value.accentColor, (newColor) => {
  applyAccentColorPreview(newColor);
}, { immediate: true });
</script>
```

**集成步骤**:
- [ ] 1. 在 AppearanceSettings 组件中导入 useSettingPreview
- [ ] 2. 在 setup 中初始化 composable
- [ ] 3. 为每个设置项添加 watch 监听
- [ ] 4. 在保存时调用 API，在失败时调用 resetPreview()
- [ ] 5. 测试主题切换、字体大小、颜色变化

### Step 2: 添加 CSS 动画

**文件**: `apps/web/src/styles/settings-animations.css` (新建)

```css
/* 主题切换过渡 */
html {
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}

html.dark-theme {
  background-color: #1e1e1e;
  color: #ffffff;
}

html.light-theme {
  background-color: #ffffff;
  color: #000000;
}

/* 字体大小过渡 */
body {
  transition: font-size 0.2s ease-in-out;
}

body.font-small {
  font-size: 12px;
}

body.font-medium {
  font-size: 14px;
}

body.font-large {
  font-size: 16px;
}

/* 颜色过渡 */
:root {
  transition: --accent-color 0.3s ease-in-out;
}
```

**集成步骤**:
- [ ] 1. 创建 `apps/web/src/styles/settings-animations.css`
- [ ] 2. 在 main.ts 中导入此文件
- [ ] 3. 测试所有过渡效果

### Step 3: 本地缓存支持

**文件**: `apps/web/src/modules/setting/domain/UserSettingStore.ts`

```typescript
// 在 store 中添加缓存
const cacheSettings = (settings: UserSettingClientDTO) => {
  localStorage.setItem(
    'dailyuse_settings_cache',
    JSON.stringify({
      timestamp: Date.now(),
      data: settings
    })
  );
};

// 加载缓存
const getCachedSettings = () => {
  const cached = localStorage.getItem('dailyuse_settings_cache');
  if (cached) {
    try {
      const { data } = JSON.parse(cached);
      return data;
    } catch (e) {
      console.warn('Failed to parse cached settings');
    }
  }
  return null;
};
```

**集成步骤**:
- [ ] 1. 在用户登出时保存缓存
- [ ] 2. 在应用启动时尝试从缓存恢复
- [ ] 3. 当网络不可用时使用缓存
- [ ] 4. 测试缓存的读写

---

## 🚀 Phase 3 集成步骤

### Step 1: 集成 SettingAdvancedActions 组件

**文件**: `apps/web/src/modules/setting/presentation/pages/SettingPage.vue`

```vue
<template>
  <div class="setting-page">
    <!-- 现有设置组件 -->
    <AppearanceSettings />
    <LocaleSettings />
    <!-- ... 其他组件 ... -->
    
    <!-- 新增高级操作组件 -->
    <SettingAdvancedActions 
      :settings="currentSettings"
      @update="handleSettingsUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import SettingAdvancedActions from '../components/SettingAdvancedActions.vue';

const handleSettingsUpdate = async (updatedSettings: UserSettingClientDTO) => {
  // 调用 API 保存更新后的设置
  await settingApiClient.updateSettings(updatedSettings);
  // 刷新当前设置
  await refreshSettings();
};
</script>
```

**集成步骤**:
- [ ] 1. 将 SettingAdvancedActions 导入到 SettingPage
- [ ] 2. 传递当前的设置数据给组件
- [ ] 3. 处理设置更新事件
- [ ] 4. 测试导出、导入、备份功能

### Step 2: 实现 API 端点

**文件**: `apps/api/src/modules/setting/application/controllers/SettingController.ts`

```typescript
// 添加以下路由处理
@Post('/sync/save-version')
@UseGuards(AuthGuard('jwt'))
async saveSettingVersion(@Body() dto: SaveVersionDTO) {
  // TODO: 实现版本保存逻辑
}

@Get('/sync/history')
@UseGuards(AuthGuard('jwt'))
async getSettingHistory(@Query('limit') limit: number = 10) {
  // TODO: 实现历史查询逻辑
}

@Post('/sync/restore')
@UseGuards(AuthGuard('jwt'))
async restoreSettingVersion(@Body() dto: RestoreVersionDTO) {
  // TODO: 实现版本恢复逻辑
}

@Post('/sync/resolve-conflict')
@UseGuards(AuthGuard('jwt'))
async resolveConflict(@Body() dto: ResolveConflictDTO) {
  // TODO: 实现冲突解决逻辑
}
```

**集成步骤**:
- [ ] 1. 在 SettingController 中添加 sync 相关的路由
- [ ] 2. 注入 SettingCloudSyncService
- [ ] 3. 实现各个处理器方法
- [ ] 4. 编写集成测试

### Step 3: 创建前端 API 客户端

**文件**: `apps/web/src/modules/setting/domain/clients/SettingSyncApiClient.ts` (新建)

```typescript
export class SettingSyncApiClient {
  async saveVersion(
    snapshot: UserSettingClientDTO,
    deviceId: string,
    deviceName: string
  ) {
    return this.client.post('/api/v1/settings/sync/save-version', {
      deviceId,
      deviceName,
      snapshot
    });
  }

  async getHistory(limit?: number) {
    return this.client.get('/api/v1/settings/sync/history', {
      params: { limit }
    });
  }

  async restoreVersion(versionUuid: string) {
    return this.client.post('/api/v1/settings/sync/restore', {
      versionUuid
    });
  }

  async resolveConflict(
    local: UserSettingClientDTO,
    remote: UserSettingClientDTO,
    strategy: 'local' | 'remote' | 'merge'
  ) {
    return this.client.post('/api/v1/settings/sync/resolve-conflict', {
      local,
      remote,
      strategy
    });
  }
}
```

**集成步骤**:
- [ ] 1. 创建新的 API 客户端文件
- [ ] 2. 实现所有同步相关方法
- [ ] 3. 在 SettingAdvancedActions 中使用

---

## 🧪 测试计划

### Phase 2 测试用例

```typescript
describe('useSettingPreview', () => {
  it('应该应用主题预览', () => {
    // 测试主题应用
  });

  it('应该应用字体大小预览', () => {
    // 测试字体大小应用
  });

  it('应该正确重置预览', () => {
    // 测试预览重置
  });
});

describe('SettingAdvancedActions', () => {
  it('应该导出 JSON 文件', () => {
    // 测试 JSON 导出
  });

  it('应该导入 JSON 文件', () => {
    // 测试 JSON 导入
  });

  it('应该创建本地备份', () => {
    // 测试备份创建
  });

  it('应该恢复本地备份', () => {
    // 测试备份恢复
  });
});
```

**测试步骤**:
- [ ] 1. 编写 useSettingPreview 单元测试
- [ ] 2. 编写 useSettingImportExport 单元测试
- [ ] 3. 编写 SettingAdvancedActions 组件测试
- [ ] 4. 编写 SettingCloudSyncService 单元测试
- [ ] 5. 编写 E2E 测试

### Phase 3 测试用例

```typescript
describe('SettingCloudSyncService', () => {
  it('应该保存设置版本', () => {
    // 测试版本保存
  });

  it('应该获取版本历史', () => {
    // 测试历史查询
  });

  it('应该解决版本冲突', () => {
    // 测试冲突解决
  });

  it('应该恢复历史版本', () => {
    // 测试版本恢复
  });
});

describe('Setting Sync API', () => {
  it('POST /api/v1/settings/sync/save-version 应该成功保存', () => {
    // 测试 API
  });

  it('GET /api/v1/settings/sync/history 应该返回历史列表', () => {
    // 测试 API
  });
});
```

---

## 📊 验收标准

### Phase 2 验收

- [x] useSettingPreview composable 已创建
- [x] useSettingImportExport composable 已创建
- [x] SettingAdvancedActions 组件已创建
- [ ] AppearanceSettings 已集成 preview
- [ ] CSS 动画已实现
- [ ] 本地缓存已实现
- [ ] Phase 2 所有功能已测试

### Phase 3 验收

- [x] SettingCloudSyncService 已创建
- [x] SettingAdvancedActions 组件已创建
- [ ] API 端点已实现
- [ ] API 客户端已实现
- [ ] 版本历史功能已实现
- [ ] 冲突解决功能已实现
- [ ] Phase 3 所有功能已测试

---

## 🔄 集成顺序

### 推荐实现顺序

```
1. Phase 2 UI 集成
   ├─ AppearanceSettings 导入 useSettingPreview
   ├─ 添加 CSS 动画
   └─ 本地缓存实现

2. Phase 2 测试
   ├─ 单元测试
   ├─ 组件测试
   └─ E2E 测试

3. Phase 3 后端实现
   ├─ SettingController 添加端点
   ├─ SettingCloudSyncService 集成
   └─ 数据库迁移

4. Phase 3 前端实现
   ├─ SettingSyncApiClient 创建
   ├─ SettingAdvancedActions 集成
   └─ 版本历史 UI 实现

5. Phase 3 测试
   ├─ API 单元测试
   ├─ 端点集成测试
   ├─ E2E 测试
   └─ 多设备同步测试
```

---

## 📝 更新检查清单

### 代码审查

- [ ] 所有代码遵循项目编码标准
- [ ] TypeScript 类型完整
- [ ] 注释清晰完整
- [ ] 无 eslint 错误

### 文档更新

- [ ] API 文档已更新
- [ ] 类型定义已导出
- [ ] README 已更新
- [ ] 变更日志已记录

### 性能检查

- [ ] 预览操作 < 100ms
- [ ] 导出操作 < 500ms
- [ ] 同步操作 < 2s
- [ ] 内存使用未增加

### 安全检查

- [ ] 输入验证已实现
- [ ] XSS 防护已实现
- [ ] 文件上传验证已实现
- [ ] 权限控制已实现

---

## 📞 支持信息

**文件位置**:
- 前端源码: `/apps/web/src/modules/setting/`
- 后端源码: `/apps/api/src/modules/setting/`
- 文档: `/docs/` 和项目根目录

**关键文件**:
- useSettingPreview.ts: 实时预览逻辑
- useSettingImportExport.ts: 导入/导出逻辑
- SettingCloudSyncService.ts: 云同步逻辑
- SettingAdvancedActions.vue: UI 组件

**相关文档**:
- SETTING_PHASE2_PHASE3_IMPLEMENTATION.md - 完整方案
- epic-7-api-endpoints.md - API 端点参考

---

**版本**: 1.0.0  
**最后更新**: 2025-11-06  
**作者**: AI Assistant

