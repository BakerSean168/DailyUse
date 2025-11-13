<script setup lang="ts">
/**
 * GoalStatsWidget - 目标统计 Widget
 * 
 * 功能：
 * - 显示进行中目标数量
 * - 显示已完成目标数量
 * - 显示目标完成率
 * - 支持三种尺寸 (small/medium/large)
 */

import { computed } from 'vue';
import type { DashboardContracts } from '@dailyuse/contracts';
import { useGoalStore } from '@/modules/goal/presentation/stores/goalStore';

// ===== Props =====
interface Props {
  size?: DashboardContracts.WidgetSize;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium' as DashboardContracts.WidgetSize,
});

// ===== Store =====
const goalStore = useGoalStore();

// ===== 计算属性 =====

/**
 * 目标统计信息
 */
const goalStatistics = computed(() => goalStore.getGoalStatistics);

/**
 * 统计数据
 */
const stats = computed(() => [
  {
    label: '进行中',
    value: goalStatistics.value.inProgress,
    icon: 'i-heroicons-arrow-trending-up',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    label: '已完成',
    value: goalStatistics.value.completed,
    icon: 'i-heroicons-trophy',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    label: '已归档',
    value: goalStatistics.value.archived,
    icon: 'i-heroicons-archive-box',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
]);

/**
 * 完成率
 */
const completionRate = computed(() => {
  const total = goalStatistics.value.total;
  const completed = goalStatistics.value.completed;
  return total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0;
});

/**
 * 完成率颜色
 */
const completionRateColor = computed(() => {
  const rate = completionRate.value;
  if (rate >= 80) return 'text-green-600';
  if (rate >= 50) return 'text-blue-600';
  if (rate >= 30) return 'text-orange-600';
  return 'text-gray-600';
});

/**
 * Widget 容器样式类
 */
const containerClasses = computed(() => [
  'goal-stats-widget',
  `widget-size-${props.size}`,
]);

/**
 * 是否为小尺寸
 */
const isSmallSize = computed(() => props.size === 'small');

/**
 * 是否为大尺寸
 */
const isLargeSize = computed(() => props.size === 'large');

/**
 * 总目标数
 */
const totalGoals = computed(() => goalStatistics.value.total);
</script>

<template>
  <div :class="containerClasses">
    <!-- Widget Header -->
    <div class="widget-header">
      <div class="widget-title">
        <div class="i-heroicons-trophy widget-icon" />
        <h3>目标统计</h3>
      </div>
      <div v-if="!isSmallSize" class="widget-completion-rate">
        <span :class="['completion-rate-value', completionRateColor]">
          {{ completionRate }}%
        </span>
        <span class="completion-rate-label">完成率</span>
      </div>
    </div>

    <!-- Content -->
    <div class="widget-content">
      <!-- Small Size: Compact Display -->
      <div v-if="isSmallSize" class="stats-compact">
        <div class="stat-item-compact">
          <span class="stat-label">总计</span>
          <span class="stat-value">{{ totalGoals }}</span>
        </div>
        <div class="stat-item-compact">
          <span class="stat-label">完成</span>
          <span class="stat-value text-green-600">{{ goalStatistics.completed }}</span>
        </div>
        <div class="stat-item-compact">
          <span class="stat-label">进行中</span>
          <span class="stat-value text-blue-600">{{ goalStatistics.inProgress }}</span>
        </div>
      </div>

      <!-- Medium/Large Size: Card Display -->
      <div v-else class="stats-grid" :class="{ 'stats-grid-large': isLargeSize }">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="stat-card"
        >
          <div class="stat-icon-wrapper" :class="stat.bgColor">
            <div :class="[stat.icon, stat.color, 'stat-icon']" />
          </div>
          <div class="stat-info">
            <p class="stat-label">{{ stat.label }}</p>
            <p class="stat-value">{{ stat.value }}</p>
          </div>
        </div>
      </div>

      <!-- Total Goals (Medium/Large) -->
      <div v-if="!isSmallSize" class="widget-footer">
        <div class="total-goals">
          <span class="total-label">总目标数</span>
          <span class="total-value">{{ totalGoals }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== Widget Container ===== */
.goal-stats-widget {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden;
  @apply transition-all duration-200 hover:shadow-md;
}

/* Size Variants */
.widget-size-small {
  @apply p-3;
  min-height: 120px;
}

.widget-size-medium {
  @apply p-4;
  min-height: 200px;
}

.widget-size-large {
  @apply p-6;
  min-height: 280px;
}

/* ===== Header ===== */
.widget-header {
  @apply flex items-center justify-between mb-4;
}

.widget-title {
  @apply flex items-center gap-2;
}

.widget-icon {
  @apply text-xl text-yellow-600;
}

.widget-title h3 {
  @apply text-base font-semibold text-gray-800;
}

.widget-completion-rate {
  @apply flex flex-col items-end;
}

.completion-rate-value {
  @apply text-lg font-bold;
}

.completion-rate-label {
  @apply text-xs text-gray-500;
}

/* ===== Content ===== */
.widget-content {
  @apply flex flex-col gap-4;
}

/* Small Size: Compact Display */
.stats-compact {
  @apply flex justify-between items-center gap-2;
}

.stat-item-compact {
  @apply flex flex-col items-center;
}

.stat-item-compact .stat-label {
  @apply text-xs text-gray-500;
}

.stat-item-compact .stat-value {
  @apply text-lg font-bold text-gray-800 mt-1;
}

/* Medium/Large Size: Card Grid */
.stats-grid {
  @apply grid gap-3;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.stats-grid-large {
  @apply gap-4;
  grid-template-columns: repeat(3, 1fr);
}

.stat-card {
  @apply flex items-center gap-3 p-3 rounded-lg border border-gray-100;
  @apply transition-colors duration-200 hover:bg-gray-50;
}

.stat-icon-wrapper {
  @apply flex items-center justify-center w-10 h-10 rounded-full;
}

.widget-size-large .stat-icon-wrapper {
  @apply w-12 h-12;
}

.stat-icon {
  @apply text-xl;
}

.widget-size-large .stat-icon {
  @apply text-2xl;
}

.stat-info {
  @apply flex flex-col;
}

.stat-card .stat-label {
  @apply text-xs text-gray-500 font-medium;
}

.widget-size-large .stat-card .stat-label {
  @apply text-sm;
}

.stat-card .stat-value {
  @apply text-lg font-bold text-gray-800 mt-0.5;
}

.widget-size-large .stat-card .stat-value {
  @apply text-2xl;
}

/* ===== Footer ===== */
.widget-footer {
  @apply pt-3 border-t border-gray-100;
}

.total-goals {
  @apply flex items-center justify-between;
}

.total-label {
  @apply text-sm text-gray-600 font-medium;
}

.total-value {
  @apply text-xl font-bold text-gray-800;
}

.widget-size-large .total-value {
  @apply text-2xl;
}

/* ===== Dark Mode (Optional) ===== */
@media (prefers-color-scheme: dark) {
  .goal-stats-widget {
    @apply bg-gray-800 border-gray-700;
  }

  .widget-title h3 {
    @apply text-gray-100;
  }

  .widget-icon {
    @apply text-yellow-400;
  }

  .stat-card {
    @apply border-gray-700 hover:bg-gray-700;
  }

  .stat-value,
  .total-value,
  .stat-item-compact .stat-value {
    @apply text-gray-100;
  }

  .stat-label,
  .total-label,
  .stat-item-compact .stat-label,
  .completion-rate-label {
    @apply text-gray-400;
  }
}
</style>
