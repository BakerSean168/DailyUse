<script setup lang="ts">
/**
 * TaskStatsWidget - 任务统计 Widget
 * 
 * 功能：
 * - 显示待办任务数量
 * - 显示进行中任务数量
 * - 显示已完成任务数量
 * - 显示完成率
 * - 支持三种尺寸 (small/medium/large)
 */

import { computed } from 'vue';
import type { DashboardContracts } from '@dailyuse/contracts';
import { useTaskStatistics } from '@/modules/task/presentation/composables/useTaskStatistics';

// ===== Props =====
interface Props {
  size?: DashboardContracts.WidgetSize;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium' as DashboardContracts.WidgetSize,
});

// ===== Composables =====
const { instanceStatistics, completionRate, isLoading } = useTaskStatistics();

// ===== 计算属性 =====

/**
 * Widget 容器样式类
 */
const containerClasses = computed(() => [
  'task-stats-widget',
  `widget-size-${props.size}`,
  {
    'widget-loading': isLoading.value,
  },
]);

/**
 * 统计数据列表
 */
const stats = computed(() => [
  {
    label: '待办',
    value: instanceStatistics.value.pending,
    icon: 'i-heroicons-clock',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    label: '进行中',
    value: instanceStatistics.value.inProgress,
    icon: 'i-heroicons-arrow-path',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    label: '已完成',
    value: instanceStatistics.value.completed,
    icon: 'i-heroicons-check-circle',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
]);

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
 * 是否为小尺寸
 */
const isSmallSize = computed(() => props.size === 'small');

/**
 * 是否为大尺寸
 */
const isLargeSize = computed(() => props.size === 'large');
</script>

<template>
  <div :class="[
    'bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700',
    'overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]',
    'backdrop-blur-sm bg-opacity-90',
    {
      'p-4': size === 'small',
      'p-5': size === 'medium',
      'p-6': size === 'large',
    }
  ]" :style="{ minHeight: size === 'small' ? '140px' : size === 'medium' ? '220px' : '300px' }">
    <!-- Widget Header -->
    <div class="flex items-center justify-between mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <div class="i-heroicons-clipboard-document-check text-2xl text-blue-600 dark:text-blue-400" />
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">任务统计</h3>
      </div>
      <div v-if="!isSmallSize"
        class="flex flex-col items-end bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 px-3 py-2 rounded-lg">
        <span :class="['text-xl font-bold', completionRateColor]">
          {{ completionRate }}%
        </span>
        <span class="text-xs text-gray-600 dark:text-gray-400 mt-1">完成率</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-8">
      <div class="i-heroicons-arrow-path animate-spin text-2xl text-gray-400" />
      <p class="text-sm text-gray-500 mt-2">加载中...</p>
    </div>

    <!-- Content -->
    <div v-else class="flex flex-col gap-4">
      <!-- Small Size: Compact Display -->
      <div v-if="isSmallSize" class="flex justify-between items-center gap-2">
        <div class="flex flex-col items-center">
          <span class="text-xs text-gray-500">总计</span>
          <span class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">{{ instanceStatistics.total }}</span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-xs text-gray-500">完成</span>
          <span class="text-lg font-bold text-green-600 mt-1">{{ instanceStatistics.completed }}</span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-xs text-gray-500">进行中</span>
          <span class="text-lg font-bold text-orange-600 mt-1">{{ instanceStatistics.inProgress }}</span>
        </div>
      </div>

      <!-- Medium/Large Size: Card Display -->
      <div v-else class="grid" :class="isLargeSize ? 'grid-cols-3 gap-5' : 'gap-4'"
        :style="!isLargeSize ? { gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' } : {}">
        <div v-for="stat in stats" :key="stat.label"
          class="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
          <div :class="[
            'flex items-center justify-center rounded-full',
            isLargeSize ? 'w-12 h-12' : 'w-10 h-10',
            stat.bgColor
          ]">
            <div :class="[stat.icon, stat.color, isLargeSize ? 'text-2xl' : 'text-xl']" />
          </div>
          <div class="flex flex-col">
            <p :class="['font-medium text-gray-500', isLargeSize ? 'text-sm' : 'text-xs']">{{ stat.label }}</p>
            <p :class="['font-bold text-gray-800 dark:text-gray-100 mt-0.5', isLargeSize ? 'text-2xl' : 'text-lg']">{{
              stat.value }}</p>
          </div>
        </div>
      </div>

      <!-- Total Tasks (Medium/Large) -->
      <div v-if="!isSmallSize" class="pt-3 border-t border-gray-100">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 font-medium">总任务数</span>
          <span :class="['font-bold text-gray-800', isLargeSize ? 'text-2xl' : 'text-xl']">{{ instanceStatistics.total
            }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 保留一些无法用 Tailwind 表达的自定义样式 */
</style>
