# Theme Module 使用指南

## 🎯 架构设计

### 主题存储策略（混合方案）

```
┌─────────────────────────────────────────────────────────────┐
│                      主题混合策略                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  未登录用户                     已登录用户                    │
│  ┌──────────────┐              ┌──────────────┐             │
│  │ LocalStorage │              │ 服务器设置    │             │
│  │ (页面级别)   │              │ (账号级别)    │             │
│  └──────┬───────┘              └──────┬───────┘             │
│         │                             │                      │
│         └─────────────┬───────────────┘                      │
│                       ↓                                      │
│              ┌─────────────────┐                             │
│              │  Theme Service  │                             │
│              └────────┬────────┘                             │
│                       ↓                                      │
│              ┌─────────────────┐                             │
│              │ Vuetify Theme   │                             │
│              └─────────────────┘                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 特性

- ✅ **未登录用户**：使用 LocalStorage，页面级别持久化
- ✅ **已登录用户**：使用服务器设置，跨设备同步
- ✅ **自动切换**：登录时自动从 LocalStorage 切换到服务器设置
- ✅ **实时响应**：主题变化立即应用到 UI
- ✅ **系统主题**：支持 AUTO 模式跟随系统主题
- ✅ **乐观更新**：修改主题立即生效，异步保存

## 📦 模块结构

```
modules/theme/
├── domain/
│   └── ThemeConfig.ts                 # 主题配置领域模型
├── infrastructure/
│   └── LocalThemeStorage.ts           # LocalStorage 适配器
├── application/
│   ├── events/
│   │   └── ThemeEvents.ts             # 主题事件定义
│   └── services/
│       ├── ThemeApplicationService.ts  # 主题应用服务（核心）
│       └── VuetifyThemeService.ts      # Vuetify 主题服务
├── composables/
│   └── useTheme.ts                    # 主题 Composable
├── initialization/
│   ├── themeInitialization.ts         # 初始化逻辑
│   └── index.ts
└── index.ts                           # 模块导出
```

## 🚀 使用方式

### 1. 在 Vue 组件中使用

```vue
<template>
  <div>
    <h2>当前主题</h2>
    <p>模式: {{ mode }}</p>
    <p>主题色: {{ accentColor }}</p>
    <p>字体大小: {{ fontSize }}</p>

    <!-- 主题切换器 -->
    <v-btn-toggle v-model="mode" @update:modelValue="setMode">
      <v-btn value="LIGHT">浅色</v-btn>
      <v-btn value="DARK">深色</v-btn>
      <v-btn value="AUTO">自动</v-btn>
    </v-btn-toggle>

    <!-- 字体大小 -->
    <v-btn-toggle :model-value="fontSize" @update:modelValue="setFontSize">
      <v-btn value="SMALL">小</v-btn>
      <v-btn value="MEDIUM">中</v-btn>
      <v-btn value="LARGE">大</v-btn>
    </v-btn-toggle>

    <!-- 主题色选择器 -->
    <input type="color" :value="accentColor" @change="handleColorChange" />

    <!-- 紧凑模式 -->
    <v-switch :model-value="compactMode" @update:modelValue="toggleCompactMode" label="紧凑模式" />
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/modules/theme';

const {
  mode,
  accentColor,
  fontSize,
  compactMode,
  setMode,
  setFontSize,
  setAccentColor,
  toggleCompactMode,
} = useTheme();

const handleColorChange = (e: Event) => {
  const color = (e.target as HTMLInputElement).value;
  setAccentColor(color);
};
</script>
```

### 2. 直接使用服务

```typescript
import { ThemeApplicationService } from '@/modules/theme';

const themeService = ThemeApplicationService.getInstance();

// 更新主题
await themeService.updateTheme({
  mode: 'DARK',
  accentColor: '#FF5722',
  fontSize: 'LARGE',
});

// 获取当前主题
const currentTheme = themeService.getCurrentTheme();
console.log('当前主题:', currentTheme);
```

### 3. 监听系统主题变化

```typescript
// 系统主题变化事件
window.addEventListener('theme:system-changed', (e: CustomEvent) => {
  console.log('系统主题变化:', e.detail.theme);
});
```

## 🔄 生命周期

### 应用启动

```
1. APP_STARTUP 阶段（优先级 5）
   ├─ 检查用户登录状态
   ├─ 未登录：从 LocalStorage 加载
   ├─ 已登录：从用户设置加载
   └─ 应用主题到 Vuetify

2. 监听认证状态变化
   └─ 登录/登出时自动切换主题源
```

### 用户登录

```
1. 用户登录成功
2. 加载用户设置（Setting 模块）
3. Theme 模块监听到设置变化
4. 自动应用用户的主题设置
5. 后续修改保存到服务器
```

### 用户登出

```
1. 用户登出
2. Theme 模块切换到 LocalStorage
3. 加载本地主题（或使用默认主题）
4. 后续修改保存到 LocalStorage
```

## 📊 数据流

### 修改主题（已登录）

```
用户修改主题
    ↓
立即更新 UI（乐观更新）
    ↓
异步保存到服务器（Setting Store）
    ↓
成功：更新 updatedAt
失败：回滚到之前的主题
```

### 修改主题（未登录）

```
用户修改主题
    ↓
立即更新 UI
    ↓
保存到 LocalStorage
```

## 🎨 支持的主题属性

```typescript
interface ThemeConfig {
  mode: 'LIGHT' | 'DARK' | 'AUTO';  // 主题模式
  accentColor: string;               // 主题色（#RRGGBB）
  fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';  // 字体大小
  fontFamily: string | null;         // 字体家族
  compactMode: boolean;              // 紧凑模式
}
```

## 🔧 自定义主题

### 添加新的主题色

在 `vuetify/index.ts` 中添加：

```typescript
const vuetify = createVuetify({
  theme: {
    themes: {
      myCustomTheme: {
        dark: false,
        colors: {
          primary: '#your-color',
          // ...
        },
      },
    },
  },
});
```

### 添加新的字体大小

在 `ThemeConfig.ts` 中添加：

```typescript
export const FONT_SIZE_MAP: Record<FontSize, string> = {
  SMALL: '14px',
  MEDIUM: '16px',
  LARGE: '18px',
  XLARGE: '20px',  // 新增
};
```

## 💡 最佳实践

1. **使用 Composable**：在组件中优先使用 `useTheme()` 而不是直接调用服务
2. **避免频繁更新**：批量更新主题属性而不是逐个修改
3. **监听变化**：使用 computed 访问主题属性，自动响应变化
4. **错误处理**：主题加载失败时会自动使用默认主题，无需特殊处理

## 🐛 调试

所有主题操作都有详细的日志输出：

```
🎨 [ThemeApplicationService] 初始化主题服务...
✅ [ThemeApplicationService] 使用用户设置的主题
🎨 [VuetifyThemeService] 应用主题配置: { mode: 'DARK', ... }
  ↳ 主题模式: DARK
  ↳ 主题色: #1976D2
  ↳ 字体大小: MEDIUM (16px)
  ↳ 紧凑模式: 关闭
✅ [VuetifyThemeService] 主题配置已应用
```

## 📝 注意事项

1. **LocalStorage 限制**：存储空间有限（通常 5-10MB），主题数据很小无需担心
2. **跨域问题**：LocalStorage 受同源策略限制，子域名之间不共享
3. **系统主题**：AUTO 模式需要浏览器支持 `prefers-color-scheme` 媒体查询
4. **性能**：主题应用是同步操作，不会阻塞 UI，体验流畅
