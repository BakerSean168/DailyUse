# STORY-007: Dashboard 模块实现

## 📋 Story 概述

**Story ID**: STORY-007  
**Epic**: EPIC-002 (Desktop Application Development)  
**优先级**: P2 (增强体验)  
**预估工时**: 3-5 天  
**状态**: 🔵 Ready for Dev  
**前置依赖**: STORY-005, STORY-006

---

## 🎯 用户故事

**作为** DailyUse 桌面用户  
**我希望** 看到一个汇总的仪表盘，展示我的任务、目标和日程概况  
**以便于** 快速了解今日待办和整体进度  

---

## 📋 验收标准

### 功能验收

- [ ] 今日任务概览（待办/进行中/已完成数量）
- [ ] 目标进度概览（活跃目标进度）
- [ ] 今日日程列表
- [ ] 即将到期的提醒
- [ ] 任务完成趋势图（最近 7 天/30 天）
- [ ] 目标完成率饼图
- [ ] 快速操作入口（新建任务/目标/日程）

### 技术验收

- [ ] 使用 `@dailyuse/application-client` Dashboard 服务
- [ ] ECharts 图表正确渲染
- [ ] 数据定时刷新
- [ ] 响应式布局

---

## 📐 技术设计

### 文件结构

```
apps/desktop/src/renderer/views/dashboard/
├── DashboardView.vue              # 主视图
├── components/
│   ├── StatCard.vue               # 统计卡片
│   ├── TodayTasks.vue             # 今日任务
│   ├── TodaySchedule.vue          # 今日日程
│   ├── UpcomingReminders.vue      # 即将提醒
│   ├── GoalProgressList.vue       # 目标进度
│   ├── TaskTrendChart.vue         # 任务趋势图 (ECharts)
│   ├── GoalCompletionChart.vue    # 目标完成率 (ECharts)
│   └── QuickActions.vue           # 快速操作
```

### Dashboard 布局

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dashboard                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ 待办    │ │ 进行中  │ │ 已完成  │ │ 目标    │               │
│  │   12    │ │    5    │ │    8    │ │  75%    │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                  │
│  ┌───────────────────────────┐ ┌───────────────────────────┐   │
│  │      今日任务              │ │      今日日程              │   │
│  │  □ 完成产品文档           │ │  09:00 团队站会            │   │
│  │  □ 代码审查               │ │  14:00 产品评审            │   │
│  │  ☑ 修复 Bug #123         │ │  16:00 1:1 会议            │   │
│  └───────────────────────────┘ └───────────────────────────┘   │
│                                                                  │
│  ┌───────────────────────────┐ ┌───────────────────────────┐   │
│  │    任务完成趋势 (7天)     │ │    目标完成率              │   │
│  │        📈 ECharts        │ │        🥧 ECharts         │   │
│  └───────────────────────────┘ └───────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  快速操作: [+ 新任务] [+ 新目标] [+ 新日程] [+ 新提醒]  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Composable 设计

```typescript
// useDashboard.ts
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { DashboardContainer } from '@dailyuse/infrastructure-client';
import { GetDashboardStatisticsService } from '@dailyuse/application-client';
import type { DashboardStatistics } from '@dailyuse/contracts/dashboard';

export function useDashboard() {
  const container = DashboardContainer.getInstance();
  const getStatsService = new GetDashboardStatisticsService(container);
  
  // State
  const statistics = ref<DashboardStatistics | null>(null);
  const loading = ref(false);
  const lastUpdated = ref<Date | null>(null);
  
  // 定时刷新
  let refreshInterval: ReturnType<typeof setInterval> | null = null;
  
  async function fetchStatistics() {
    loading.value = true;
    try {
      statistics.value = await getStatsService.execute();
      lastUpdated.value = new Date();
    } finally {
      loading.value = false;
    }
  }
  
  function startAutoRefresh(intervalMs = 60000) {
    refreshInterval = setInterval(fetchStatistics, intervalMs);
  }
  
  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }
  
  onMounted(() => {
    fetchStatistics();
    startAutoRefresh();
  });
  
  onUnmounted(() => {
    stopAutoRefresh();
  });
  
  // Computed
  const todayTasks = computed(() => statistics.value?.todayTasks ?? []);
  const todaySchedule = computed(() => statistics.value?.todaySchedule ?? []);
  const taskStats = computed(() => statistics.value?.taskStats ?? { pending: 0, inProgress: 0, completed: 0 });
  const goalProgress = computed(() => statistics.value?.goalProgress ?? 0);
  
  return {
    statistics: computed(() => statistics.value),
    loading: computed(() => loading.value),
    lastUpdated: computed(() => lastUpdated.value),
    todayTasks,
    todaySchedule,
    taskStats,
    goalProgress,
    
    fetchStatistics,
    startAutoRefresh,
    stopAutoRefresh,
  };
}
```

### ECharts 图表示例

```vue
<!-- TaskTrendChart.vue -->
<template>
  <v-card>
    <v-card-title>任务完成趋势</v-card-title>
    <v-card-text>
      <v-chart :option="chartOption" autoresize style="height: 200px" />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

interface Props {
  data: { date: string; completed: number; created: number }[];
}

const props = defineProps<Props>();

const chartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: props.data.map(d => d.date),
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '完成',
      type: 'line',
      data: props.data.map(d => d.completed),
      smooth: true,
      areaStyle: {},
    },
    {
      name: '创建',
      type: 'line',
      data: props.data.map(d => d.created),
      smooth: true,
    },
  ],
}));
</script>
```

---

## 📝 Task 分解

### Task 7.1: Dashboard 主视图 (1 天)

**子任务**:
- [ ] 创建 DashboardView.vue
- [ ] 实现 useDashboard.ts composable
- [ ] 实现 StatCard.vue 组件
- [ ] 实现快速操作按钮

### Task 7.2: 任务/日程/目标卡片 (1-2 天)

**子任务**:
- [ ] 创建 TodayTasks.vue
- [ ] 创建 TodaySchedule.vue
- [ ] 创建 UpcomingReminders.vue
- [ ] 创建 GoalProgressList.vue

### Task 7.3: 统计图表 (1-2 天)

**子任务**:
- [ ] 集成 vue-echarts
- [ ] 创建 TaskTrendChart.vue
- [ ] 创建 GoalCompletionChart.vue

### Task 7.4: 数据刷新机制 (0.5 天)

**子任务**:
- [ ] 实现定时刷新
- [ ] 添加手动刷新按钮
- [ ] 显示最后更新时间

---

## 🔗 依赖关系

### 前置依赖

- ⏳ STORY-005 (Goal & Task)
- ⏳ STORY-006 (Schedule & Reminder)

### 后续影响

- 无直接后续依赖

---

## ⚠️ 风险 & 缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 图表渲染慢 | 低 | 中 | 数据聚合在服务端 |
| 刷新频繁 | 中 | 低 | 节流控制 |

---

## ✅ 完成定义 (DoD)

- [ ] 所有卡片组件实现
- [ ] 图表正确显示
- [ ] 自动刷新工作
- [ ] 代码已提交并通过 Review

---

**创建日期**: 2025-12-06  
**负责人**: Dev Agent  
**预计开始**: Phase 3 (Week 6)
