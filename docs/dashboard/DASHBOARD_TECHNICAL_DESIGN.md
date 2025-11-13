# Dashboard 完善 - 技术方案设计文档

**文档类型**: Technical Design Document (TDD)  
**负责人**: Tech Lead  
**日期**: 2025-11-12  
**版本**: 1.0  
**状态**: Ready for Implementation

---

## 🎯 技术方案概述

本文档详细描述 Dashboard 完善项目的技术实现方案，包括架构设计、接口定义、数据流、性能优化策略等。

---

## 🏗️ 系统架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Dashboard    │  │ Widget       │  │ Shared Components   │  │
│  │ View         │  │ Components   │  │ (Skeleton, etc.)     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
│         │                 │                                      │
│         └─────────────────┴────────────────┐                    │
│                                            │                    │
│  ┌────────────────────────────────────────▼─────────────────┐  │
│  │            Pinia Stores (State Management)               │  │
│  │  ┌───────────────────┐    ┌──────────────────────────┐  │  │
│  │  │ dashboardStats    │    │ dashboardLayout          │  │  │
│  │  │ Store             │    │ Store                    │  │  │
│  │  │ - stats           │    │ - layout config          │  │  │
│  │  │ - cache           │    │ - active widgets         │  │  │
│  │  │ - lastFetchTime   │    │ - edit mode              │  │  │
│  │  └───────────────────┘    └──────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                            │                    │
│  ┌────────────────────────────────────────▼─────────────────┐  │
│  │            API Client Layer                               │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  dashboardApi.ts                                    │ │  │
│  │  │  - fetchStatsSummary()                              │ │  │
│  │  │  - saveLayout()                                     │ │  │
│  │  │  - loadLayout()                                     │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                            │                    │
│  ┌────────────────────────────────────────▼─────────────────┐  │
│  │            Widget Registry                                │  │
│  │  - register(widgets)                                      │  │
│  │  - getWidget(id)                                          │  │
│  │  - getAllWidgets()                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                            │                    │
│  ┌────────────────────────────────────────▼─────────────────┐  │
│  │            Event Bus                                      │  │
│  │  - task:created, task:completed, task:deleted             │  │
│  │  - goal:created, goal:completed                           │  │
│  │  - reminder:created, reminder:triggered                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│                        Backend Layer                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Express.js Routes (/api/v1/*)                    │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  /stats/summary         (GET)                      │  │   │
│  │  │  /user/settings/dashboard-layout (GET/POST)        │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │              Controllers                                 │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  StatisticsAggregationController                 │   │   │
│  │  │  - getSummary(req, res)                          │   │   │
│  │  │  - generateETag()                                │   │   │
│  │  │  - handle 304 Not Modified                       │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  UserSettingsController                          │   │   │
│  │  │  - getDashboardLayout(req, res)                  │   │   │
│  │  │  - saveDashboardLayout(req, res)                 │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │              Application Services                        │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  StatisticsAggregationService                    │   │   │
│  │  │  - getAggregatedStatistics(accountUuid)          │   │   │
│  │  │  - generateETag(stats)                           │   │   │
│  │  └───────────────┬──────────────────────────────────┘   │   │
│  │                  │                                       │   │
│  │      ┌───────────┴───────────┬───────────────┐          │   │
│  │      │                       │               │          │   │
│  │  ┌───▼──────────────┐  ┌────▼─────────┐  ┌─▼────────┐  │   │
│  │  │ TaskStatistics   │  │ GoalStats    │  │ Reminder │  │   │
│  │  │ Service          │  │ Service      │  │ Stats    │  │   │
│  │  │ - getStatistics()│  │ - getStats() │  │ Service  │  │   │
│  │  └──────────────────┘  └──────────────┘  └──────────┘  │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │              Prisma ORM                                  │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  TaskRepository, GoalRepository,                 │   │   │
│  │  │  ReminderRepository, UserSettingsRepository      │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     Database (PostgreSQL)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  tasks   │  │  goals   │  │ reminders│  │ user_settings│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 接口设计

### 1. 统计聚合接口

#### **GET /api/v1/stats/summary**

**描述**: 获取所有模块的统计摘要数据

**认证**: 需要 Bearer Token

**请求头**:

```http
GET /api/v1/stats/summary HTTP/1.1
Host: localhost:3888
Authorization: Bearer eyJhbGc...
If-None-Match: "abc123def456"
```

**响应 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "tasks": {
      "total": 45,
      "active": 12,
      "completed": 30,
      "overdue": 3
    },
    "goals": {
      "total": 8,
      "active": 5,
      "completed": 3,
      "onTrack": 4
    },
    "reminders": {
      "total": 20,
      "pending": 8,
      "today": 3
    },
    "repositories": {
      "total": 15,
      "bookmarked": 5
    },
    "metadata": {
      "generatedAt": "2025-11-12T10:30:00Z",
      "cacheMaxAge": 300
    }
  }
}
```

**响应 (304 Not Modified)**:

```http
HTTP/1.1 304 Not Modified
ETag: "abc123def456"
Cache-Control: private, max-age=300
```

**响应头**:

```http
ETag: "abc123def456"
Cache-Control: private, max-age=300
Last-Modified: Tue, 12 Nov 2025 10:30:00 GMT
Content-Type: application/json
```

**错误响应 (401 Unauthorized)**:

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

---

### 2. 布局配置接口

#### **GET /api/v1/user/settings/dashboard-layout**

**描述**: 获取用户的 Dashboard 布局配置

**认证**: 需要 Bearer Token

**响应 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "layout": [
      {
        "i": "task-list",
        "x": 0,
        "y": 0,
        "w": 6,
        "h": 4,
        "minW": 4,
        "minH": 3,
        "maxW": 12,
        "maxH": 8
      },
      {
        "i": "goal-progress",
        "x": 6,
        "y": 0,
        "w": 6,
        "h": 4,
        "minW": 4,
        "minH": 3,
        "maxW": 12,
        "maxH": 8
      },
      {
        "i": "reminder-list",
        "x": 0,
        "y": 4,
        "w": 6,
        "h": 3,
        "minW": 4,
        "minH": 2,
        "maxW": 12,
        "maxH": 6
      }
    ],
    "breakpoints": {
      "lg": 1200,
      "md": 996,
      "sm": 768,
      "xs": 480
    },
    "cols": {
      "lg": 12,
      "md": 8,
      "sm": 6,
      "xs": 4
    }
  }
}
```

**响应 (404 Not Found)** - 用户首次使用，返回默认布局:

```json
{
  "success": true,
  "data": {
    "layout": [],
    "isDefault": true
  }
}
```

---

#### **POST /api/v1/user/settings/dashboard-layout**

**描述**: 保存用户的 Dashboard 布局配置

**认证**: 需要 Bearer Token

**请求体**:

```json
{
  "layout": [
    {
      "i": "task-list",
      "x": 0,
      "y": 0,
      "w": 6,
      "h": 4
    }
  ]
}
```

**响应 (200 OK)**:

```json
{
  "success": true,
  "message": "Dashboard layout saved successfully",
  "data": {
    "updatedAt": "2025-11-12T10:35:00Z"
  }
}
```

**错误响应 (400 Bad Request)**:

```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Invalid layout configuration",
  "details": {
    "field": "layout[0].w",
    "reason": "Width must be between 1 and 12"
  }
}
```

---

## 🗄️ 数据库设计

### Schema 扩展

```prisma
// apps/api/prisma/schema.prisma

// 扩展现有的 user_settings 表
model user_settings {
  setting_uuid      String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  account_uuid      String   @unique @db.Uuid

  // ... 现有字段 ...

  // 新增: Dashboard 布局配置
  dashboard_layout  Json?    // 存储布局 JSON

  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  account           account  @relation(fields: [account_uuid], references: [uuid], onDelete: Cascade)

  @@map("user_settings")
}
```

**dashboard_layout JSON 结构**:

```typescript
interface DashboardLayoutConfig {
  layout: GridLayoutItem[];
  breakpoints: {
    lg: number;
    md: number;
    sm: number;
    xs: number;
  };
  cols: {
    lg: number;
    md: number;
    sm: number;
    xs: number;
  };
  lastModified: string; // ISO 8601
}

interface GridLayoutItem {
  i: string; // widget ID
  x: number; // grid column position
  y: number; // grid row position
  w: number; // width (grid units)
  h: number; // height (grid units)
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean; // 是否可拖拽
}
```

---

## 📦 TypeScript 类型定义

### Contracts Package

```typescript
// packages/contracts/src/modules/dashboard/dashboard.contracts.ts

/**
 * 统计数据 DTOs
 */
export interface TaskStatistics {
  total: number;
  active: number;
  completed: number;
  overdue: number;
}

export interface GoalStatistics {
  total: number;
  active: number;
  completed: number;
  onTrack: number;
}

export interface ReminderStatistics {
  total: number;
  pending: number;
  today: number;
}

export interface RepositoryStatistics {
  total: number;
  bookmarked: number;
}

export interface AggregatedStatistics {
  tasks: TaskStatistics;
  goals: GoalStatistics;
  reminders: ReminderStatistics;
  repositories: RepositoryStatistics;
  metadata: {
    generatedAt: string;
    cacheMaxAge: number;
  };
}

/**
 * Widget 相关 DTOs
 */
export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  component: any; // Vue component
  icon: string; // Material Design Icon name
  category: WidgetCategory;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  maxSize: WidgetSize;
  configurable?: boolean;
  config?: Record<string, any>;
}

export interface WidgetSize {
  w: number; // width in grid units
  h: number; // height in grid units
}

export enum WidgetCategory {
  PRODUCTIVITY = 'productivity',
  ANALYTICS = 'analytics',
  COMMUNICATION = 'communication',
  UTILITIES = 'utilities',
}

export interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export interface DashboardLayoutConfig {
  layout: GridLayoutItem[];
  breakpoints: {
    lg: number;
    md: number;
    sm: number;
    xs: number;
  };
  cols: {
    lg: number;
    md: number;
    sm: number;
    xs: number;
  };
  lastModified: string;
}
```

---

## 🔄 数据流设计

### 1. 统计数据流

```
用户打开 Dashboard
  ↓
DashboardView.onMounted()
  ↓
dashboardStatsStore.fetchStats()
  ↓
检查缓存是否有效 (lastFetchTime + 5min > now)
  ├─ 有效 → 直接返回缓存数据
  └─ 无效 ↓
    dashboardApi.fetchStatsSummary()
      ├─ 添加 If-None-Match 头 (ETag)
      ↓
    后端 StatisticsAggregationController
      ├─ 检查客户端 ETag
      ├─ 如果匹配 → 返回 304 Not Modified
      └─ 如果不匹配 ↓
        StatisticsAggregationService.getAggregatedStatistics()
          ├─ 并行调用所有 StatisticsService
          │   ├─ TaskStatisticsService.getStatistics()
          │   ├─ GoalStatisticsService.getStatistics()
          │   └─ ReminderStatisticsService.getStatistics()
          ├─ 聚合结果
          ├─ 生成 ETag
          └─ 返回 200 + 数据 + ETag 头
      ↓
    前端接收数据
      ├─ 更新 dashboardStatsStore.stats
      ├─ 更新 lastFetchTime
      └─ 触发组件重新渲染
```

### 2. 实时更新数据流

```
用户在任意页面创建任务
  ↓
taskStore.createTask(task)
  ↓
调用 API 创建任务
  ↓
成功后 emit Event Bus 事件
  ↓
eventBus.emit('task:created', task)
  ↓
dashboardStatsStore 监听到事件
  ↓
incrementStat('tasks', 'total', 1)
incrementStat('tasks', 'active', 1)
  ↓
Vue 响应式更新 UI
  ↓
统计数字立即变化（无需等待服务器）
```

### 3. 布局保存数据流

```
用户拖拽 Widget
  ↓
vue-grid-layout 触发 @layout-updated 事件
  ↓
DashboardGrid 监听事件
  ↓
dashboardLayoutStore.saveLayout(newLayout)
  ↓
防抖 (1 秒后执行)
  ↓
dashboardApi.saveLayout(newLayout)
  ↓
POST /api/v1/user/settings/dashboard-layout
  ↓
UserSettingsController.saveDashboardLayout()
  ├─ 从 JWT 提取 accountUuid
  ├─ 验证 layout 格式
  ├─ Prisma 更新 user_settings.dashboard_layout
  └─ 返回 200 OK
  ↓
前端显示 Toast: "布局已保存"
```

---

## ⚡ 性能优化策略

### 1. 前端优化

#### **缓存策略**

```typescript
// apps/web/src/modules/dashboard/presentation/stores/dashboardStatsStore.ts

const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 分钟

export const useDashboardStatsStore = defineStore('dashboardStats', () => {
  const stats = ref<ModuleStats>(/* ... */);
  const lastFetchTime = ref<number>(0);

  const isCacheValid = computed(() => {
    return Date.now() - lastFetchTime.value < CACHE_EXPIRY_MS;
  });

  async function fetchStats(forceRefresh = false) {
    if (isCacheValid.value && !forceRefresh) {
      console.log('[Stats] Using cached data');
      return;
    }

    // 调用 API...
  }
});
```

#### **懒加载 Widgets**

```typescript
// apps/web/src/modules/dashboard/presentation/components/WidgetContainer.vue

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';

const widgetRef = ref<HTMLElement>();
const isVisible = ref(false);

useIntersectionObserver(
  widgetRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      isVisible.value = true;
    }
  },
  { threshold: 0.1 }
);
</script>

<template>
  <div ref="widgetRef">
    <component v-if="isVisible" :is="widget.component" />
    <SkeletonCard v-else />
  </div>
</template>
```

#### **虚拟滚动（如果需要）**

```typescript
// 如果任务列表很长，使用虚拟滚动
import { useVirtualList } from '@vueuse/core';

const { list, containerProps, wrapperProps } = useVirtualList(tasks, { itemHeight: 56 });
```

#### **防抖保存布局**

```typescript
// apps/web/src/modules/dashboard/presentation/stores/dashboardLayoutStore.ts

import { debounce } from 'lodash-es';

const debouncedSave = debounce(async (layout: GridLayoutItem[]) => {
  await dashboardApi.saveLayout({ layout });
}, 1000);

export const useDashboardLayoutStore = defineStore('dashboardLayout', () => {
  async function saveLayout(layout: GridLayoutItem[]) {
    debouncedSave(layout);
  }
});
```

---

### 2. 后端优化

#### **数据库查询优化**

```typescript
// apps/api/src/modules/task/application/services/TaskStatisticsService.ts

export class TaskStatisticsService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 使用单个原生 SQL 查询，而不是多次查询
   */
  async getStatistics(accountUuid: string): Promise<TaskStatistics> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'active' AND due_date < NOW() THEN 1 END) as overdue
      FROM tasks
      WHERE account_uuid = ${accountUuid}::uuid
    `;

    return {
      total: Number(result[0].total),
      active: Number(result[0].active),
      completed: Number(result[0].completed),
      overdue: Number(result[0].overdue),
    };
  }
}
```

#### **并行查询**

```typescript
// apps/api/src/modules/aggregation/application/services/StatisticsAggregationService.ts

async getAggregatedStatistics(accountUuid: string): Promise<AggregatedStatistics> {
  // 🚀 并行获取所有统计数据
  const [tasks, goals, reminders, repositories] = await Promise.all([
    this.taskStatsService.getStatistics(accountUuid),
    this.goalStatsService.getStatistics(accountUuid),
    this.reminderStatsService.getStatistics(accountUuid),
    this.repoStatsService.getStatistics(accountUuid),
  ]);

  return { tasks, goals, reminders, repositories, metadata: { /* ... */ } };
}
```

#### **响应压缩**

```typescript
// apps/api/src/app.ts

import compression from 'compression';

app.use(
  compression({
    filter: (req, res) => {
      // 只压缩 JSON 响应
      return /json/.test(res.getHeader('Content-Type') as string);
    },
    level: 6, // 压缩级别 (0-9)
  }),
);
```

#### **ETag 缓存**

```typescript
// apps/api/src/modules/aggregation/interface/http/controllers/StatisticsAggregationController.ts

import crypto from 'crypto';

export class StatisticsAggregationController {
  async getSummary(req: Request, res: Response) {
    const accountUuid = req.user!.accountUuid;

    const stats = await this.service.getAggregatedStatistics(accountUuid);

    // 生成 ETag
    const etag = `"${crypto.createHash('md5').update(JSON.stringify(stats)).digest('hex')}"`;

    // 检查客户端 ETag
    const clientETag = req.headers['if-none-match'];
    if (clientETag === etag) {
      return res.status(304).end();
    }

    // 设置缓存头
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('Last-Modified', new Date(stats.metadata.generatedAt).toUTCString());

    res.json({ success: true, data: stats });
  }
}
```

---

## 🧪 测试策略

### 1. 单元测试

#### **Store 测试示例**

```typescript
// apps/web/src/modules/dashboard/presentation/stores/__tests__/dashboardStatsStore.spec.ts

import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDashboardStatsStore } from '../dashboardStatsStore';
import * as dashboardApi from '../../../api/dashboardApi';

describe('dashboardStatsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should cache stats for 5 minutes', async () => {
    const store = useDashboardStatsStore();

    // Mock API
    vi.spyOn(dashboardApi, 'fetchStatsSummary').mockResolvedValueOnce({
      tasks: { total: 10, active: 5, completed: 5, overdue: 0 },
      // ...
    });

    // 第一次调用 - 应该请求 API
    await store.fetchStats();
    expect(dashboardApi.fetchStatsSummary).toHaveBeenCalledTimes(1);

    // 第二次调用 - 应该使用缓存
    await store.fetchStats();
    expect(dashboardApi.fetchStatsSummary).toHaveBeenCalledTimes(1);

    // 强制刷新 - 应该请求 API
    await store.fetchStats(true);
    expect(dashboardApi.fetchStatsSummary).toHaveBeenCalledTimes(2);
  });

  it('should increment stat on event', () => {
    const store = useDashboardStatsStore();

    store.stats.tasks.total = 10;
    store.incrementStat('tasks', 'total', 1);

    expect(store.stats.tasks.total).toBe(11);
  });
});
```

#### **Service 测试示例**

```typescript
// apps/api/src/modules/aggregation/application/services/__tests__/StatisticsAggregationService.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatisticsAggregationService } from '../StatisticsAggregationService';
import { TaskStatisticsService } from '@/modules/task/application/services/TaskStatisticsService';
import { GoalStatisticsService } from '@/modules/goal/application/services/GoalStatisticsService';

describe('StatisticsAggregationService', () => {
  let service: StatisticsAggregationService;
  let taskStatsService: TaskStatisticsService;
  let goalStatsService: GoalStatisticsService;

  beforeEach(() => {
    taskStatsService = {
      getStatistics: vi.fn().mockResolvedValue({
        total: 10,
        active: 5,
        completed: 5,
        overdue: 0,
      }),
    } as any;

    goalStatsService = {
      getStatistics: vi.fn().mockResolvedValue({
        total: 3,
        active: 2,
        completed: 1,
        onTrack: 2,
      }),
    } as any;

    service = new StatisticsAggregationService(
      taskStatsService,
      goalStatsService,
      // ...
    );
  });

  it('should aggregate statistics from all services', async () => {
    const result = await service.getAggregatedStatistics('account-uuid-1');

    expect(result.tasks.total).toBe(10);
    expect(result.goals.total).toBe(3);
    expect(taskStatsService.getStatistics).toHaveBeenCalledWith('account-uuid-1');
    expect(goalStatsService.getStatistics).toHaveBeenCalledWith('account-uuid-1');
  });

  it('should call services in parallel', async () => {
    const start = Date.now();
    await service.getAggregatedStatistics('account-uuid-1');
    const duration = Date.now() - start;

    // 并行调用应该很快（< 100ms）
    expect(duration).toBeLessThan(100);
  });
});
```

---

### 2. E2E 测试

```typescript
// apps/web/e2e/dashboard.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load dashboard with statistics', async ({ page }) => {
    await page.goto('/dashboard');

    // 等待骨架屏消失
    await expect(page.locator('.skeleton-card')).toHaveCount(0, { timeout: 3000 });

    // 验证统计卡片显示
    await expect(page.locator('[data-testid="stats-card-tasks"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-card-goals"]')).toBeVisible();

    // 验证统计数字存在
    const taskTotal = page.locator('[data-testid="task-total"]');
    await expect(taskTotal).toHaveText(/\d+/);
  });

  test('should create task from widget', async ({ page }) => {
    await page.goto('/dashboard');

    // 在任务 Widget 中输入
    const input = page.locator('[data-testid="task-quick-add-input"]');
    await input.fill('New task from dashboard');
    await input.press('Enter');

    // 验证成功提示
    await expect(page.locator('.v-snackbar')).toContainText('任务创建成功');

    // 验证统计数字增加
    const taskTotal = page.locator('[data-testid="task-total"]');
    const initialCount = parseInt((await taskTotal.textContent()) || '0');

    // 再创建一个任务
    await input.fill('Another task');
    await input.press('Enter');

    await expect(taskTotal).toHaveText((initialCount + 1).toString());
  });

  test('should drag widget to new position', async ({ page }) => {
    await page.goto('/dashboard');

    // 进入编辑模式
    await page.click('[data-testid="edit-button"]');

    // 获取 Widget 初始位置
    const widget = page.locator('[data-grid-id="task-list"]');
    const initialBox = await widget.boundingBox();

    // 拖拽到新位置
    await widget.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 200, initialBox!.y);
    await page.mouse.up();

    // 验证位置改变
    const newBox = await widget.boundingBox();
    expect(newBox!.x).toBeGreaterThan(initialBox!.x);

    // 保存布局
    await page.click('[data-testid="save-button"]');
    await expect(page.locator('.v-snackbar')).toContainText('布局已保存');

    // 刷新页面验证布局持久化
    await page.reload();
    const reloadedBox = await widget.boundingBox();
    expect(reloadedBox!.x).toBeCloseTo(newBox!.x, 0);
  });
});
```

---

## 🔒 安全考虑

### 1. 认证与授权

```typescript
// apps/api/src/shared/middleware/authMiddleware.ts

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { accountUuid: string };
    req.user = { accountUuid: payload.accountUuid };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 2. 输入验证

```typescript
// apps/api/src/modules/aggregation/interface/http/validators/layoutValidator.ts

import Joi from 'joi';

export const dashboardLayoutSchema = Joi.object({
  layout: Joi.array()
    .items(
      Joi.object({
        i: Joi.string().required(),
        x: Joi.number().integer().min(0).max(11).required(),
        y: Joi.number().integer().min(0).required(),
        w: Joi.number().integer().min(1).max(12).required(),
        h: Joi.number().integer().min(1).max(20).required(),
        minW: Joi.number().integer().min(1).optional(),
        minH: Joi.number().integer().min(1).optional(),
        maxW: Joi.number().integer().max(12).optional(),
        maxH: Joi.number().integer().max(20).optional(),
        static: Joi.boolean().optional(),
      }),
    )
    .required(),
});

export function validateDashboardLayout(req: Request, res: Response, next: NextFunction) {
  const { error } = dashboardLayoutSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: error.details[0].message,
    });
  }

  next();
}
```

### 3. 速率限制

```typescript
// apps/api/src/shared/middleware/rateLimiter.ts

import rateLimit from 'express-rate-limit';

export const statsRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

## 📊 监控与日志

### 1. 性能监控

```typescript
// apps/web/src/shared/utils/performanceMonitor.ts

export class PerformanceMonitor {
  static trackPageLoad(pageName: string) {
    if (!window.performance) return;

    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

    // 发送到分析平台
    analytics.track('page_load', {
      page: pageName,
      loadTime: pageLoadTime,
      domReady: perfData.domContentLoadedEventEnd - perfData.navigationStart,
      firstPaint: perfData.responseStart - perfData.navigationStart,
    });
  }

  static trackApiCall(endpoint: string, duration: number, status: number) {
    analytics.track('api_call', {
      endpoint,
      duration,
      status,
      timestamp: Date.now(),
    });
  }
}
```

### 2. 错误监控

```typescript
// apps/web/src/shared/utils/errorMonitor.ts

export class ErrorMonitor {
  static captureException(error: Error, context?: Record<string, any>) {
    console.error('[Error]', error, context);

    // 发送到错误追踪平台（如 Sentry）
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        extra: context,
      });
    }
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error') {
    console[level]('[Message]', message);

    if (window.Sentry) {
      window.Sentry.captureMessage(message, level);
    }
  }
}
```

---

## 🚀 部署策略

### 1. 数据库迁移

```bash
# 开发环境
cd apps/api
pnpm prisma migrate dev --name add_dashboard_layout

# 生产环境
pnpm prisma migrate deploy
```

### 2. 前端构建

```bash
# 构建前端
pnpm nx build web --prod

# 输出到 dist/apps/web/
# 部署到 CDN 或静态服务器
```

### 3. 后端部署

```bash
# 构建后端
pnpm nx build api --prod

# 启动服务
NODE_ENV=production node dist/apps/api/main.js
```

### 4. 环境变量

```bash
# apps/api/.env.production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=super-secret-key
REDIS_URL=redis://localhost:6379
NODE_ENV=production
```

---

## 📚 开发指南

### 如何添加新 Widget

1. **创建 Widget 组件**

```bash
# 在对应模块下创建 Widget
touch apps/web/src/modules/task/presentation/widgets/NewWidget.vue
```

2. **实现 Widget 组件**

```vue
<template>
  <div class="new-widget">
    <!-- Widget 内容 -->
  </div>
</template>

<script setup lang="ts">
// Widget 逻辑
</script>
```

3. **注册 Widget**

```typescript
// apps/web/src/modules/task/presentation/widgets/index.ts

export const taskWidgets: WidgetDefinition[] = [
  // ... 现有 widgets
  {
    id: 'new-widget',
    name: '新 Widget',
    description: 'Widget 描述',
    component: NewWidget,
    icon: 'mdi-new-icon',
    category: WidgetCategory.PRODUCTIVITY,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 8 },
  },
];
```

4. **更新 Widget Registry**

```typescript
// apps/web/src/modules/dashboard/infrastructure/widgetRegistry.ts

import { taskWidgets } from '@/modules/task/presentation/widgets';

widgetRegistry.register(taskWidgets);
```

---

## ✅ 技术方案评审清单

**架构设计**:

- [x] 前后端分离架构清晰
- [x] 模块化设计合理
- [x] 职责划分明确

**接口设计**:

- [x] RESTful API 规范
- [x] 响应格式统一
- [x] 错误处理完善

**数据库设计**:

- [x] Schema 扩展合理
- [x] JSON 字段使用恰当
- [x] 索引设计考虑

**性能优化**:

- [x] 缓存策略完善
- [x] 查询优化到位
- [x] 并行处理优化

**安全性**:

- [x] 认证授权完善
- [x] 输入验证完整
- [x] 速率限制到位

**测试**:

- [x] 单元测试规划
- [x] 集成测试规划
- [x] E2E 测试规划

**监控**:

- [x] 性能监控规划
- [x] 错误监控规划
- [x] 日志记录规划

---

**文档状态**: ✅ Approved by Tech Lead  
**下一责任人**: Dev Team (开始开发)  
**预计完成时间**: 2025-11-13

**批准签名**:

- Tech Lead: ✅ Approved
- Senior Developer: ✅ Approved
- DevOps: ✅ Infrastructure Ready
