# 设置模块重构说明

## 重构概览

将扁平的设置结构重构为嵌套的分组结构，提供更优雅的 API 和更好的类型安全。

---

## Store API 变化

### ✅ 新的 Computed Getters（推荐使用）

```typescript
// 旧方式（已弃用）
const theme = settingStore.settings?.appearanceTheme;
const language = settingStore.settings?.localeLanguage;

// 新方式（推荐）✨
const appearance = settingStore.appearance; // { theme, accentColor, fontSize, ... }
const locale = settingStore.locale;         // { language, timezone, dateFormat, ... }
const workflow = settingStore.workflow;     // { autoSave, defaultGoalView, ... }
const shortcuts = settingStore.shortcuts;   // { enabled, custom }
const privacy = settingStore.privacy;       // { profileVisibility, ... }
```

### ✅ 新的更新方法（推荐使用）

```typescript
// 旧方式（已弃用）
await settingStore.updateSettings({
  appearanceTheme: 'DARK',
  appearanceFontSize: 'LARGE',
});

// 新方式（推荐）✨
await settingStore.updateAppearance({
  theme: 'DARK',
  fontSize: 'LARGE',
});
```

---

## 完整 API 列表

### 1. State (状态)

```typescript
settingStore.settings    // 完整的设置对象
settingStore.defaults    // 默认设置
settingStore.loading     // 加载状态
settingStore.error       // 错误信息
```

### 2. Computed Getters (计算属性)

```typescript
settingStore.isLoaded        // 是否已加载
settingStore.appearance      // 外观设置 { theme, accentColor, fontSize, fontFamily, compactMode }
settingStore.locale          // 区域设置 { language, timezone, dateFormat, timeFormat, weekStartsOn, currency }
settingStore.workflow        // 工作流设置 { defaultTaskView, defaultGoalView, defaultScheduleView, autoSave, autoSaveInterval, confirmBeforeDelete }
settingStore.shortcuts       // 快捷键设置 { enabled, custom }
settingStore.privacy         // 隐私设置 { profileVisibility, showOnlineStatus, allowSearchByEmail, allowSearchByPhone, shareUsageData }
settingStore.experimental    // 实验性功能 { enabled, features }
```

### 3. Core Actions (核心操作)

```typescript
// 加载设置
await settingStore.loadSettings();

// 加载默认值
await settingStore.loadDefaults();

// 通用更新（需要完整 uuid）
await settingStore.updateSettings({
  uuid: settings.uuid,
  appearance: { theme: 'DARK' },
});

// 防抖更新
await settingStore.updateSettingsDebounced({
  uuid: settings.uuid,
  appearance: { accentColor: '#FF0000' },
}, 500);

// 重置为默认
await settingStore.resetToDefaults();
```

### 4. Convenient Update Methods (便捷更新方法) ⭐ 推荐

```typescript
// 更新外观设置
await settingStore.updateAppearance({
  theme: 'DARK',
  fontSize: 'LARGE',
  compactMode: true,
});

// 更新区域设置
await settingStore.updateLocale({
  language: 'en-US',
  timezone: 'America/New_York',
});

// 更新工作流设置
await settingStore.updateWorkflow({
  autoSave: false,
  defaultGoalView: 'KANBAN',
});

// 更新快捷键设置
await settingStore.updateShortcuts({
  enabled: true,
  custom: { 'ctrl+k': 'search' },
});

// 更新隐私设置
await settingStore.updatePrivacy({
  profileVisibility: 'PRIVATE',
  showOnlineStatus: false,
});
```

### 5. Debounced Update Methods (防抖更新方法)

适用于频繁变化的输入（如滑块、颜色选择器）

```typescript
// 防抖更新外观设置（默认 500ms）
await settingStore.updateAppearanceDebounced({
  accentColor: '#FF0000',
});

// 自定义延迟时间（300ms）
await settingStore.updateAppearanceDebounced({
  accentColor: '#FF0000',
}, 300);

// 防抖更新区域设置
await settingStore.updateLocaleDebounced({
  currency: 'USD',
}, 500);

// 防抖更新工作流设置
await settingStore.updateWorkflowDebounced({
  autoSaveInterval: 60000,
}, 300);
```

---

## 组件使用示例

### 示例 1: AppearanceSettings.vue（完整重构）

```vue
<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';

const settingStore = useUserSettingStore();

// 使用 Store 的 computed
const appearance = computed(() => settingStore.appearance);

// Local state（用于 v-model）
const theme = ref(appearance.value.theme);
const fontSize = ref(appearance.value.fontSize);
const accentColor = ref(appearance.value.accentColor);

// Watch store 变化同步到本地
watch(appearance, (newAppearance) => {
  theme.value = newAppearance.theme;
  fontSize.value = newAppearance.fontSize;
  accentColor.value = newAppearance.accentColor;
}, { deep: true });

// 更新处理器 - 简洁优雅 ✨
async function handleThemeChange(value: string) {
  await settingStore.updateAppearance({ theme: value as any });
}

async function handleFontSizeChange(value: string) {
  await settingStore.updateAppearance({ fontSize: value as any });
}

// 颜色选择器使用防抖
async function handleAccentColorChange() {
  await settingStore.updateAppearanceDebounced({ 
    accentColor: accentColor.value 
  }, 300);
}
</script>
```

### 示例 2: LocaleSettings.vue（简化版）

```vue
<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';

const settingStore = useUserSettingStore();
const locale = computed(() => settingStore.locale);

const language = ref(locale.value.language);
const timezone = ref(locale.value.timezone);

watch(locale, (newLocale) => {
  language.value = newLocale.language;
  timezone.value = newLocale.timezone;
}, { deep: true });

// 一行代码完成更新 ✨
async function handleLanguageChange(value: string) {
  await settingStore.updateLocale({ language: value });
}

async function handleTimezoneChange(value: string) {
  await settingStore.updateLocale({ timezone: value });
}
</script>
```

### 示例 3: WorkflowSettings.vue（防抖示例）

```vue
<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';

const settingStore = useUserSettingStore();
const workflow = computed(() => settingStore.workflow);

const autoSave = ref(workflow.value.autoSave);
const autoSaveInterval = ref(workflow.value.autoSaveInterval / 1000); // 转换为秒

watch(workflow, (newWorkflow) => {
  autoSave.value = newWorkflow.autoSave;
  autoSaveInterval.value = newWorkflow.autoSaveInterval / 1000;
}, { deep: true });

// 开关立即更新
async function handleAutoSaveChange(value: boolean) {
  await settingStore.updateWorkflow({ autoSave: value });
}

// 滑块防抖更新（减少 API 调用）✨
async function handleIntervalChange(value: number) {
  await settingStore.updateWorkflowDebounced({
    autoSaveInterval: value * 1000,
  }, 300);
}
</script>
```

---

## 迁移指南

### 步骤 1: 更新 computed 引用

```typescript
// Before ❌
const theme = computed(() => settingStore.settings?.appearanceTheme);

// After ✅
const appearance = computed(() => settingStore.appearance);
const theme = ref(appearance.value.theme);
```

### 步骤 2: 更新 watch

```typescript
// Before ❌
watch(() => settingStore.settings, (newSettings) => {
  if (newSettings) {
    theme.value = newSettings.appearanceTheme;
  }
}, { deep: true });

// After ✅
watch(appearance, (newAppearance) => {
  theme.value = newAppearance.theme;
}, { deep: true });
```

### 步骤 3: 更新处理器

```typescript
// Before ❌
async function handleThemeChange(value: string) {
  await settingStore.updateSettings({
    appearanceTheme: value,
  });
}

// After ✅
async function handleThemeChange(value: string) {
  await settingStore.updateAppearance({
    theme: value as any,
  });
}
```

### 步骤 4: 使用防抖（可选）

```typescript
// 对于频繁变化的输入（滑块、颜色选择器等）
async function handleColorChange() {
  await settingStore.updateAppearanceDebounced({
    accentColor: color.value,
  }, 300); // 300ms 防抖
}
```

---

## 优势总结

### ✅ 类型安全

- 所有方法都有完整的 TypeScript 类型定义
- 自动补全和类型检查

### ✅ 代码简洁

- 更新方法从 1 行变为 1 行（但更清晰）
- 无需记住扁平字段名（`appearanceTheme` → `appearance.theme`）

### ✅ 逻辑分组

- 相关设置分组在一起（appearance, locale, workflow 等）
- 更容易理解和维护

### ✅ 性能优化

- 防抖方法减少不必要的 API 调用
- Computed 自动缓存和依赖追踪

### ✅ 易于扩展

- 添加新设置只需在对应分组添加字段
- 不影响其他组件

---

## 注意事项

1. **UUID 要求**: 所有更新方法内部会自动获取 `settings.uuid`，无需手动传入
2. **类型转换**: 某些枚举类型可能需要 `as any` 断言（临时方案）
3. **防抖延迟**: 默认 500ms，可根据需要调整（推荐滑块用 300ms）
4. **错误处理**: 所有方法都会自动处理错误并更新 `error` state

---

**更新时间**: 2025-10-31  
**版本**: 2.0  
**作者**: GitHub Copilot
