# @dailyuse/assets 包文档

> **生成时间**: 2025-10-28  
> **包版本**: 0.0.1  
> **文档类型**: 静态资源包文档

---

## 📋 包概述

**@dailyuse/assets** 是 DailyUse 项目的**静态资源管理包**，集中管理项目中使用的所有图像、音频等静态资源。通过 TypeScript 导出，提供类型安全的资源引用。

### 核心职责

- 🖼️ **图像资源**: Logos、头像、图标
- 🔊 **音频资源**: 通知提示音、提醒声音
- 📦 **类型安全**: TypeScript 导出路径
- 🔄 **集中管理**: 统一的资源入口

---

## ��️ 资源架构

```
@dailyuse/assets/
├── src/
│   ├── images/               # 图像资源
│   │   ├── logos/           # 应用 Logo
│   │   │   ├── DailyUse.svg
│   │   │   ├── DailyUse.ico
│   │   │   ├── DailyUse-16.png
│   │   │   ├── DailyUse-24.png
│   │   │   ├── DailyUse-32.png
│   │   │   ├── DailyUse-48.png
│   │   │   ├── DailyUse-128.png
│   │   │   ├── DailyUse-256.png
│   │   │   └── DailyUse-256.ico
│   │   └── avatars/         # 默认头像
│   │       └── profile1.png
│   ├── audio/               # 音频资源
│   │   └── notifications/   # 通知音效
│   │       ├── default.wav
│   │       ├── notification.wav
│   │       ├── reminder.wav
│   │       ├── alert.wav
│   │       ├── success.wav
│   │       └── error.wav
│   ├── index.ts            # 主导出入口
│   └── vite-env.d.ts       # Vite 类型声明
├── package.json
└── tsconfig.json
```

---

## 📦 包配置

### package.json

```json
{
  "name": "@dailyuse/assets",
  "version": "0.0.1",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./images": "./src/images/index.ts",
    "./audio": "./src/audio/index.ts"
  }
}
```

### 导出路径

| 导出路径 | 内容 | 用途 |
|---------|------|------|
| `@dailyuse/assets` | 所有资源 | 默认导入 |
| `@dailyuse/assets/images` | 图像资源 | 仅导入图像 |
| `@dailyuse/assets/audio` | 音频资源 | 仅导入音频 |

---

## 🎯 资源详解

### 1. 图像资源 🖼️

#### Logos - 应用 Logo

提供多种尺寸和格式的应用 Logo，适用于不同场景。

**可用尺寸**:
- **SVG**: 矢量格式，适用于任意尺寸
- **ICO**: Windows 图标格式 (16x16, 256x256)
- **PNG**: 多种尺寸 (16, 24, 32, 48, 128, 256)

**使用示例**:

```typescript
// 导入所有 Logo
import { logos } from '@dailyuse/assets/images';

// Web 应用中使用
<img :src="logos.svg" alt="DailyUse" />
<link rel="icon" :href="logos.ico" />

// Electron 应用图标
{
  icon: logos.png256, // 256x256 PNG
  tray: logos.png16,  // 16x16 托盘图标
}

// PWA 配置
{
  icons: [
    { src: logos.png16, sizes: "16x16", type: "image/png" },
    { src: logos.png32, sizes: "32x32", type: "image/png" },
    { src: logos.png48, sizes: "48x48", type: "image/png" },
    { src: logos.png128, sizes: "128x128", type: "image/png" },
    { src: logos.png256, sizes: "256x256", type: "image/png" },
  ]
}
```

**Logo 导出结构**:

```typescript
// src/images/logos/index.ts
export const logos = {
  svg: '/src/images/logos/DailyUse.svg',
  ico: '/src/images/logos/DailyUse.ico',
  png16: '/src/images/logos/DailyUse-16.png',
  png24: '/src/images/logos/DailyUse-24.png',
  png32: '/src/images/logos/DailyUse-32.png',
  png48: '/src/images/logos/DailyUse-48.png',
  png128: '/src/images/logos/DailyUse-128.png',
  png256: '/src/images/logos/DailyUse-256.png',
  ico256: '/src/images/logos/DailyUse-256.ico',
};
```

---

#### Avatars - 默认头像

提供默认用户头像资源。

**使用示例**:

```typescript
import { avatars } from '@dailyuse/assets/images';

// 在组件中使用
<v-avatar>
  <v-img :src="avatars.profile1" />
</v-avatar>

// 作为用户默认头像
const getDefaultAvatar = () => avatars.profile1;
```

---

### 2. 音频资源 🔊

#### Notifications - 通知音效

提供多种通知音效，用于不同类型的提示。

**可用音效**:

| 音效文件 | 用途 | 场景 |
|---------|------|------|
| **default.wav** | 默认通知音 | 普通通知 |
| **notification.wav** | 通知提示音 | 系统通知 |
| **reminder.wav** | 提醒音 | 任务提醒、日程提醒 |
| **alert.wav** | 警告音 | 重要提醒 |
| **success.wav** | 成功音 | 操作成功 |
| **error.wav** | 错误音 | 操作失败 |

**使用示例**:

```typescript
import { notificationSounds } from '@dailyuse/assets/audio';

// 播放通知音
const playNotification = (type: 'default' | 'success' | 'error' | 'reminder' | 'alert') => {
  const audio = new Audio(notificationSounds[type]);
  audio.volume = 0.5;
  audio.play();
};

// 在通知服务中使用
class NotificationService {
  notify(message: string, type: 'info' | 'success' | 'error') {
    // 显示通知
    showToast(message);
    
    // 播放音效
    if (type === 'success') {
      new Audio(notificationSounds.success).play();
    } else if (type === 'error') {
      new Audio(notificationSounds.error).play();
    } else {
      new Audio(notificationSounds.notification).play();
    }
  }
}

// 提醒服务
class ReminderService {
  async triggerReminder(reminder: Reminder) {
    // 播放提醒音
    const audio = new Audio(notificationSounds.reminder);
    audio.play();
    
    // 显示提醒
    showNotification(reminder.title, reminder.description);
  }
}
```

**音效导出结构**:

```typescript
// src/audio/notifications/index.ts
export const notificationSounds = {
  default: '/src/audio/notifications/default.wav',
  notification: '/src/audio/notifications/notification.wav',
  reminder: '/src/audio/notifications/reminder.wav',
  alert: '/src/audio/notifications/alert.wav',
  success: '/src/audio/notifications/success.wav',
  error: '/src/audio/notifications/error.wav',
};
```

---

## 🚀 使用指南

### 安装

资源包通常作为 monorepo 内部依赖，无需单独安装。

```bash
# 在其他包中引用
pnpm add @dailyuse/assets --workspace
```

### 导入资源

```typescript
// 方式 1: 导入所有资源
import * as assets from '@dailyuse/assets';
const logo = assets.logos.svg;
const sound = assets.notificationSounds.success;

// 方式 2: 按分类导入
import { logos, avatars } from '@dailyuse/assets/images';
import { notificationSounds } from '@dailyuse/assets/audio';

// 方式 3: 导入特定资源
import { logos } from '@dailyuse/assets';
```

---

## 💡 在不同场景中使用

### Web 应用 (Vue 3)

```vue
<template>
  <div>
    <!-- Logo -->
    <img :src="logos.svg" alt="DailyUse Logo" />
    
    <!-- 头像 -->
    <v-avatar>
      <v-img :src="user.avatarUrl || avatars.profile1" />
    </v-avatar>
    
    <!-- 播放音效 -->
    <v-btn @click="playSuccessSound">Success</v-btn>
  </div>
</template>

<script setup lang="ts">
import { logos, avatars } from '@dailyuse/assets/images';
import { notificationSounds } from '@dailyuse/assets/audio';

const playSuccessSound = () => {
  new Audio(notificationSounds.success).play();
};
</script>
```

---

### Electron 应用

```typescript
// main.ts (主进程)
import { logos } from '@dailyuse/assets/images';
import { app, BrowserWindow, Tray } from 'electron';

// 创建窗口
const mainWindow = new BrowserWindow({
  icon: logos.png256, // 窗口图标
  width: 1200,
  height: 800,
});

// 创建托盘
const tray = new Tray(logos.png16);
tray.setToolTip('DailyUse');
```

---

### 桌面通知

```typescript
import { notificationSounds } from '@dailyuse/assets/audio';

// 使用 Electron Notification API
const notification = new Notification({
  title: 'Task Reminder',
  body: 'Complete your daily goal',
  silent: true, // 不使用系统音效
});

// 播放自定义音效
const audio = new Audio(notificationSounds.reminder);
audio.play();

notification.show();
```

---

### PWA 配置

```typescript
// vite.config.ts (PWA 插件配置)
import { VitePWA } from 'vite-plugin-pwa';
import { logos } from '@dailyuse/assets/images';

export default defineConfig({
  plugins: [
    VitePWA({
      manifest: {
        name: 'DailyUse',
        short_name: 'DailyUse',
        icons: [
          {
            src: logos.png16,
            sizes: '16x16',
            type: 'image/png',
          },
          {
            src: logos.png32,
            sizes: '32x32',
            type: 'image/png',
          },
          {
            src: logos.png128,
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: logos.png256,
            sizes: '256x256',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
```

---

## 📁 完整目录结构

```
packages/assets/
├── src/
│   ├── __tests__/            # 测试文件
│   │   └── images.test.ts
│   ├── images/
│   │   ├── logos/
│   │   │   ├── DailyUse.svg
│   │   │   ├── DailyUse.ico
│   │   │   ├── DailyUse-16.png
│   │   │   ├── DailyUse-24.png
│   │   │   ├── DailyUse-32.png
│   │   │   ├── DailyUse-48.png
│   │   │   ├── DailyUse-128.png
│   │   │   ├── DailyUse-256.png
│   │   │   ├── DailyUse-256.ico
│   │   │   └── index.ts
│   │   ├── avatars/
│   │   │   ├── profile1.png
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── audio/
│   │   ├── notifications/
│   │   │   ├── default.wav
│   │   │   ├── notification.wav
│   │   │   ├── reminder.wav
│   │   │   ├── alert.wav
│   │   │   ├── success.wav
│   │   │   ├── error.wav
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── index.ts              # 主导出
│   └── vite-env.d.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📊 统计信息

- **Logo 尺寸**: 9 种格式和尺寸
- **音效数量**: 6 种通知音效
- **默认头像**: 1 个
- **文件格式**: SVG, PNG, ICO, WAV
- **包大小**: ~500KB (未压缩)

---

## 🔗 相关文档

- [项目概览](./project-overview.md)
- [@dailyuse/ui 包文档](./packages-ui.md)
- [Web 应用架构](./architecture-web.md)
- [Electron 桌面应用文档](../apps/desktop/README.md)

---

## 📝 最佳实践

### 1. 资源引用

```typescript
✅ 推荐：使用类型安全的导入
import { logos, notificationSounds } from '@dailyuse/assets';
const icon = logos.png128;

❌ 避免：硬编码路径
const icon = '/packages/assets/src/images/logos/DailyUse-128.png';
```

### 2. 音效播放

```typescript
✅ 推荐：封装音效播放函数
const playSound = (soundPath: string, volume = 0.5) => {
  const audio = new Audio(soundPath);
  audio.volume = volume;
  audio.play().catch(console.error);
};

playSound(notificationSounds.success);

❌ 避免：直接 new Audio 到处使用
new Audio(notificationSounds.success).play();
```

### 3. 图像优化

```typescript
✅ 推荐：根据场景选择合适尺寸
// 托盘图标用小尺寸
tray.setIcon(logos.png16);

// 应用图标用大尺寸
window.setIcon(logos.png256);

// Web 使用 SVG
<img :src="logos.svg" />

❌ 避免：所有场景使用同一尺寸
tray.setIcon(logos.png256); // 太大，浪费资源
```

---

## 🎯 扩展指南

### 添加新的 Logo 尺寸

1. 将新 Logo 文件放入 `src/images/logos/`
2. 更新 `src/images/logos/index.ts`:

```typescript
export const logos = {
  // ...existing
  png512: '/src/images/logos/DailyUse-512.png',
};
```

### 添加新的音效

1. 将音频文件放入 `src/audio/notifications/`
2. 更新 `src/audio/notifications/index.ts`:

```typescript
export const notificationSounds = {
  // ...existing
  customSound: '/src/audio/notifications/custom.wav',
};
```

### 添加新的资源分类

1. 创建新目录，如 `src/fonts/`
2. 添加 `index.ts` 导出
3. 更新主 `src/index.ts`:

```typescript
export * from './fonts/index';
```

---

**文档维护**: BMAD v6 Analyst (Mary)  
**最后更新**: 2025-10-28 17:05:00
