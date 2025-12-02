# 路由加载性能优化指南

> 本文档详细介绍 DailyUse Web 应用中实现的路由加载性能优化方案，适合前端开发新手阅读。

## 📋 目录

1. [问题背景](#问题背景)
2. [优化方案概览](#优化方案概览)
3. [核心优化一：路由骨架屏](#核心优化一路由骨架屏)
4. [核心优化二：Hover 预加载](#核心优化二hover-预加载)
5. [核心优化三：Service Worker 缓存](#核心优化三service-worker-缓存)
6. [文件结构](#文件结构)
7. [工作流程图解](#工作流程图解)
8. [如何测试优化效果](#如何测试优化效果)
9. [常见问题](#常见问题)

---

## 问题背景

### 优化前的用户体验问题

在 SPA（单页应用）中，当用户点击导航按钮切换页面时，会遇到以下问题：

```
用户点击导航 → [白屏等待 1-3 秒] → 页面突然出现
```

**为什么会这样？**

Vue Router 使用**懒加载**（Lazy Loading）来分割代码：

```typescript
// 路由配置中的懒加载写法
component: () => import('../views/TaskManagementView.vue')
```

这意味着：
- 页面组件的 JavaScript 代码**不会**在首屏加载
- 只有当用户访问该路由时，才会**下载**对应的 JS 文件（chunk）
- 下载和解析期间，用户会看到**白屏或卡顿**

### 用户心理影响

研究表明：
- 超过 **100ms** 的延迟，用户开始感知到"不流畅"
- 超过 **1 秒**的无反馈延迟，用户会焦虑：*"按钮按下去了吗？是不是卡住了？"*

---

## 优化方案概览

我们实现了三层优化策略：

| 优化层级 | 技术方案 | 解决的问题 |
|---------|---------|-----------|
| **即时反馈** | 路由骨架屏 | 点击后立即显示加载状态 |
| **提前加载** | Hover 预加载 | 鼠标悬停时就开始加载 |
| **缓存复用** | Service Worker | 二次访问秒开 |

**优化后的用户体验：**

```
用户点击导航 → 立即显示骨架屏 → 内容渐入 ✨
```

---

## 核心优化一：路由骨架屏

### 什么是骨架屏？

骨架屏（Skeleton Screen）是一种**占位符 UI**，在内容加载完成前显示页面的大致结构。

```
┌────────────────────────────────────┐
│  ████  ████████████                │  ← 模拟标题
│                                    │
│  ┌──────────┐  ┌──────────┐       │
│  │ ████     │  │ ████     │       │  ← 模拟卡片
│  │ ██████   │  │ ██████   │       │
│  │ ████     │  │ ████     │       │
│  └──────────┘  └──────────┘       │
└────────────────────────────────────┘
```

### 实现原理

#### 1. 创建加载状态 Store

**文件：** `src/shared/stores/routeLoadingStore.ts`

```typescript
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useRouteLoadingStore = defineStore('routeLoading', () => {
  // 是否正在加载路由
  const isLoading = ref(false);
  
  // 开始加载
  const startLoading = (path: string) => {
    isLoading.value = true;
  };

  // 结束加载
  const finishLoading = () => {
    isLoading.value = false;
  };

  return { isLoading, startLoading, finishLoading };
});
```

**为什么用 Pinia Store？**
- 路由守卫和组件需要共享加载状态
- Store 是 Vue 中跨组件共享状态的标准方式

#### 2. 在路由守卫中控制加载状态

**文件：** `src/shared/router/guards.ts`

```typescript
// 路由跳转前：显示骨架屏
router.beforeEach(async (to, from, next) => {
  // 只在主应用内导航时显示骨架屏
  if (from.path !== to.path) {
    const { useRouteLoadingStore } = await import('../stores/routeLoadingStore');
    const routeLoadingStore = useRouteLoadingStore();
    routeLoadingStore.startLoading(to.path);  // ← 立即显示骨架屏
  }
  // ... 其他守卫逻辑
  next();
});

// 路由跳转后：隐藏骨架屏
router.afterEach(async (to) => {
  const { useRouteLoadingStore } = await import('../stores/routeLoadingStore');
  const routeLoadingStore = useRouteLoadingStore();
  setTimeout(() => {
    routeLoadingStore.finishLoading();  // ← 隐藏骨架屏
  }, 50);  // 微小延迟避免闪烁
});
```

**关键点：**
- `beforeEach` 在路由组件加载**之前**触发 → 立即显示骨架屏
- `afterEach` 在路由组件加载**之后**触发 → 隐藏骨架屏

#### 3. 在布局组件中显示骨架屏

**文件：** `src/modules/app/MainLayout.vue`

```vue
<template>
  <v-app>
    <div class="app-layout">
      <div class="sidebar">
        <sidebar />
      </div>
      <div class="content">
        <v-main class="main-content">
          <!-- 骨架屏覆盖层 -->
          <PageSkeleton v-if="isRouteLoading" class="page-skeleton-overlay" />
          
          <!-- 路由视图 -->
          <router-view v-slot="{ Component, route }">
            <div class="route-wrapper" :key="route.path">
              <component :is="Component" />
            </div>
          </router-view>
        </v-main>
      </div>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import PageSkeleton from '@/shared/components/PageSkeleton.vue';
import { useRouteLoadingStore } from '@/shared/stores/routeLoadingStore';

const routeLoadingStore = useRouteLoadingStore();
const { isLoading } = storeToRefs(routeLoadingStore);
const isRouteLoading = computed(() => isLoading.value);
</script>

<style scoped>
/* 骨架屏作为覆盖层 */
.page-skeleton-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
}
</style>
```

**为什么用覆盖层而不是条件渲染？**

```vue
<!-- ❌ 不推荐：条件渲染 -->
<PageSkeleton v-if="isLoading" />
<router-view v-else />

<!-- ✅ 推荐：覆盖层 -->
<PageSkeleton v-if="isLoading" class="overlay" />
<router-view />  <!-- 始终渲染 -->
```

原因：
- 覆盖层方式下，路由组件在后台**同时加载**
- 避免了条件切换时的 DOM 重建开销

---

## 核心优化二：Hover 预加载

### 什么是 Hover 预加载？

当用户将鼠标悬停在导航链接上时，提前加载目标页面的 JS 代码。

```
鼠标悬停 → 150ms 后开始预加载 → 用户点击时已加载完成 → 秒切！
```

### 实现原理

**文件：** `src/shared/services/RoutePrefetchService.ts`

```typescript
// 已预加载的路由集合（避免重复加载）
const prefetchedRoutes = new Set<string>();

// 悬停定时器
let hoverTimer: ReturnType<typeof setTimeout> | null = null;

// 路由到模块的映射
const routeModuleMap: Record<string, () => Promise<any>> = {
  '/': () => import('@/modules/dashboard/presentation/views/DashboardView.vue'),
  '/tasks': () => import('@/modules/task/presentation/views/TaskManagementView.vue'),
  '/goals': () => import('@/modules/goal/presentation/views/GoalListView.vue'),
  // ... 其他路由
};

/**
 * 预加载指定路由的模块
 */
const prefetchRoute = async (path: string): Promise<void> => {
  // 已经预加载过，跳过
  if (prefetchedRoutes.has(path)) {
    return;
  }

  const loader = routeModuleMap[path];
  
  if (loader) {
    console.log(`🔮 [Prefetch] 预加载路由: ${path}`);
    prefetchedRoutes.add(path);
    
    // 在浏览器空闲时加载
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        loader();  // 执行 import()，触发下载
      }, { timeout: 2000 });
    } else {
      setTimeout(() => loader(), 100);
    }
  }
};

/**
 * 鼠标进入导航项时调用
 */
export const handleNavMouseEnter = (path: string): void => {
  // 清除之前的定时器
  if (hoverTimer) clearTimeout(hoverTimer);

  // 150ms 延迟，避免快速划过触发
  hoverTimer = setTimeout(() => {
    prefetchRoute(path);
  }, 150);
};

/**
 * 鼠标离开导航项时调用
 */
export const handleNavMouseLeave = (): void => {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
};
```

### 在导航组件中使用

**文件：** `src/modules/app/components/Sidebar.vue`

```vue
<template>
  <button
    v-for="item in navigationItems"
    :key="item.name"
    @click="navigateTo(item.path)"
    @mouseenter="handleMouseEnter(item.path)"  <!-- 鼠标进入 -->
    @mouseleave="handleMouseLeave"              <!-- 鼠标离开 -->
  >
    <v-icon :icon="item.icon" />
  </button>
</template>

<script setup lang="ts">
import { handleNavMouseEnter, handleNavMouseLeave } from '@/shared/services/RoutePrefetchService';

const handleMouseEnter = (path: string) => {
  if (!isActiveRoute(path)) {  // 不预加载当前页面
    handleNavMouseEnter(path);
  }
};

const handleMouseLeave = () => {
  handleNavMouseLeave();
};
</script>
```

### 为什么要 150ms 延迟？

```
用户快速划过多个导航项 → 不触发预加载（节省带宽）
用户在某项上停留 150ms → 开始预加载（用户可能要点击）
```

### 为什么用 requestIdleCallback？

```javascript
// requestIdleCallback 在浏览器空闲时执行
// 不会阻塞用户交互和渲染
requestIdleCallback(() => {
  loader();
}, { timeout: 2000 });  // 最多等 2 秒
```

---

## 核心优化三：Service Worker 缓存

### 什么是 Service Worker？

Service Worker 是运行在浏览器后台的**独立脚本**，可以：
- 拦截网络请求
- 缓存静态资源
- 实现离线访问

### 缓存策略

| 资源类型 | 策略 | 说明 |
|---------|------|------|
| JS/CSS | Cache First | 优先使用缓存，后台更新 |
| 字体/图片 | Cache First | 静态资源长期缓存 |
| HTML | Network First | 确保获取最新版本 |
| API 请求 | 不缓存 | 保证数据实时性 |

### 实现原理

**文件：** `public/sw.js`（必须放在 public 目录）

```javascript
const STATIC_CACHE_NAME = 'dailyuse-static-v1';

// 静态资源匹配模式
const STATIC_PATTERNS = [/\.js$/, /\.css$/, /\.woff2?$/, /\.png$/];

// 不缓存的模式
const NO_CACHE_PATTERNS = [/\/api\//, /\/sse\//];

/**
 * Cache First 策略
 */
async function cacheFirst(request) {
  // 1. 先查缓存
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // 2. 缓存命中，后台更新
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(STATIC_CACHE_NAME)
          .then(cache => cache.put(request, response));
      }
    });
    return cachedResponse;  // 立即返回缓存
  }
  
  // 3. 缓存未命中，从网络获取并缓存
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

// 拦截所有请求
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // 跳过不缓存的请求
  if (NO_CACHE_PATTERNS.some(p => p.test(url))) return;
  
  // 静态资源使用 Cache First
  if (STATIC_PATTERNS.some(p => p.test(url))) {
    event.respondWith(cacheFirst(event.request));
  }
});
```

### 注册 Service Worker

**文件：** `src/shared/services/ServiceWorkerService.ts`

```typescript
export const registerServiceWorker = async () => {
  // 仅生产环境启用
  if (import.meta.env.DEV) {
    console.log('🔧 [SW] 开发环境跳过注册');
    return null;
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  console.log('✅ [SW] 注册成功');
  return registration;
};
```

**在 main.ts 中调用：**

```typescript
// 生产环境注册 Service Worker
if (import.meta.env.PROD) {
  import('./shared/services/ServiceWorkerService').then(({ registerServiceWorker }) => {
    registerServiceWorker();
  });
}
```

---

## 文件结构

```
src/
├── shared/
│   ├── components/
│   │   └── PageSkeleton.vue          # 骨架屏组件
│   ├── stores/
│   │   └── routeLoadingStore.ts      # 加载状态 Store
│   ├── services/
│   │   ├── RoutePrefetchService.ts   # Hover 预加载服务
│   │   └── ServiceWorkerService.ts   # SW 注册服务
│   └── router/
│       └── guards.ts                  # 路由守卫（控制骨架屏）
├── modules/
│   └── app/
│       └── MainLayout.vue            # 主布局（显示骨架屏）
└── main.ts                           # 注册 Service Worker

public/
└── sw.js                             # Service Worker（纯 JS）
```

---

## 工作流程图解

### 首次访问

```
┌─────────────────────────────────────────────────────────────┐
│                       首次访问流程                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 用户访问 /tasks                                         │
│     ↓                                                       │
│  2. beforeEach 触发 → isLoading = true                     │
│     ↓                                                       │
│  3. 显示骨架屏（立即反馈）                                   │
│     ↓                                                       │
│  4. Vue Router 下载 TaskManagementView.vue 的 chunk        │
│     ↓                                                       │
│  5. Service Worker 缓存该 chunk                            │
│     ↓                                                       │
│  6. afterEach 触发 → isLoading = false                     │
│     ↓                                                       │
│  7. 骨架屏消失，显示真实内容                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 二次访问

```
┌─────────────────────────────────────────────────────────────┐
│                       二次访问流程                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 用户访问 /tasks                                         │
│     ↓                                                       │
│  2. Service Worker 拦截请求                                 │
│     ↓                                                       │
│  3. 缓存命中 → 直接返回（无网络延迟）                        │
│     ↓                                                       │
│  4. 页面秒开！⚡                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Hover 预加载

```
┌─────────────────────────────────────────────────────────────┐
│                     Hover 预加载流程                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 鼠标悬停在"任务"导航上                                   │
│     ↓                                                       │
│  2. 等待 150ms（确认不是快速划过）                           │
│     ↓                                                       │
│  3. requestIdleCallback 空闲时执行                          │
│     ↓                                                       │
│  4. 执行 import('./TaskManagementView.vue')                 │
│     ↓                                                       │
│  5. 浏览器下载并缓存 chunk                                  │
│     ↓                                                       │
│  6. 用户点击时，chunk 已在内存中 → 秒切！                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 如何测试优化效果

### 1. 测试骨架屏

1. 打开 Chrome DevTools → Network
2. 选择 **Slow 3G** 网络节流
3. 点击导航切换页面
4. 观察骨架屏是否立即显示

### 2. 测试 Hover 预加载

1. 打开 Chrome DevTools → Console
2. 悬停在导航图标上
3. 观察是否出现 `🔮 [Prefetch] 预加载路由: /xxx`

### 3. 测试 Service Worker

1. 构建生产版本：`pnpm nx build web`
2. 本地预览：`pnpm nx preview web`
3. 打开 DevTools → Application → Service Workers
4. 确认 SW 已注册
5. 刷新页面，观察 Network 中资源是否来自 `(ServiceWorker)`

---

## 常见问题

### Q: 为什么开发环境看不到 Service Worker？

**A:** 我们故意在开发环境禁用了 SW，因为：
- 缓存会导致代码修改后看不到变化
- HMR（热更新）与 SW 缓存冲突

### Q: 骨架屏一闪而过怎么办？

**A:** 这是正常的！说明页面加载很快。如果想看到完整效果，可以用 DevTools 模拟慢网络。

### Q: 预加载会不会浪费流量？

**A:** 不会太多，因为：
- 只预加载用户悬停的页面
- 已加载的页面不会重复加载
- 使用 `requestIdleCallback` 不阻塞主线程

### Q: 如何清除 Service Worker 缓存？

**A:** 两种方式：
1. DevTools → Application → Storage → Clear site data
2. 代码中调用 `clearAllCaches()` 函数

---

## 总结

| 优化 | 效果 | 实现复杂度 |
|-----|------|-----------|
| 路由骨架屏 | 即时反馈，消除白屏 | ⭐⭐ |
| Hover 预加载 | 预测用户行为，提前加载 | ⭐⭐ |
| Service Worker | 二次访问秒开 | ⭐⭐⭐ |

这三层优化组合使用，可以大幅提升用户体验，让 SPA 应用感觉更加流畅！

---

*文档编写：Amelia (Developer Agent)*
*最后更新：2025-12-02*
