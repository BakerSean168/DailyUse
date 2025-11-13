<script setup lang="ts">
/**
 * ReminderStatsWidget - 提醒统计 Widget
 * 
 * 功能：
 * - 显示今日提醒数量
 * - 显示未读提醒数量
 * - 优化 small 尺寸显示
 */

import { computed } from 'vue';
import type { DashboardContracts } from '@dailyuse/contracts';
import { useReminderStore } from '@/modules/reminder/presentation/stores/reminderStore';

// ===== Props =====
interface Props {
  size?: DashboardContracts.WidgetSize;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small' as DashboardContracts.WidgetSize,
});

// ===== Store =====
const reminderStore = useReminderStore();

// ===== 计算属性 =====

/**
 * 今日提醒数量（基于活跃的历史记录）
 */
const todayReminders = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return reminderStore.getAllReminderHistories.filter((history: any) => {
    if (!history.scheduledTime) return false;
    const scheduledTime = new Date(history.scheduledTime);
    return scheduledTime >= today && scheduledTime < tomorrow;
  }).length;
});

/**
 * 未读提醒数量（基于活跃的历史记录）
 */
const unreadReminders = computed(() => {
  return reminderStore.getActiveReminderHistories.length;
});

/**
 * Widget 容器样式类
 */
const containerClasses = computed(() => [
  'reminder-stats-widget',
  `widget-size-${props.size}`,
]);

/**
 * 是否为小尺寸
 */
const isSmallSize = computed(() => props.size === 'small');
</script>

<template>
  <div :class="containerClasses">
    <!-- Widget Header -->
    <div class="widget-header">
      <div class="widget-title">
        <div class="i-heroicons-bell widget-icon" />
        <h3>提醒统计</h3>
      </div>
    </div>

    <!-- Content -->
    <div class="widget-content">
      <!-- Compact Display (Optimized for Small) -->
      <div v-if="isSmallSize" class="stats-compact">
        <div class="stat-item">
          <div class="stat-icon-wrapper bg-blue-50">
            <div class="i-heroicons-calendar-days text-blue-600 stat-icon" />
          </div>
          <div class="stat-info">
            <p class="stat-label">今日提醒</p>
            <p class="stat-value">{{ todayReminders }}</p>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon-wrapper bg-orange-50">
            <div class="i-heroicons-bell-alert text-orange-600 stat-icon" />
          </div>
          <div class="stat-info">
            <p class="stat-label">未读提醒</p>
            <p class="stat-value">{{ unreadReminders }}</p>
          </div>
        </div>
      </div>

      <!-- Medium/Large Display -->
      <div v-else class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-blue-50">
            <div class="i-heroicons-calendar-days text-blue-600 stat-icon" />
          </div>
          <div class="stat-info">
            <p class="stat-label">今日提醒</p>
            <p class="stat-value">{{ todayReminders }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-orange-50">
            <div class="i-heroicons-bell-alert text-orange-600 stat-icon" />
          </div>
          <div class="stat-info">
            <p class="stat-label">未读提醒</p>
            <p class="stat-value">{{ unreadReminders }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== Widget Container ===== */
.reminder-stats-widget {
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
  min-height: 160px;
}

.widget-size-large {
  @apply p-6;
  min-height: 200px;
}

/* ===== Header ===== */
.widget-header {
  @apply flex items-center justify-between mb-3;
}

.widget-title {
  @apply flex items-center gap-2;
}

.widget-icon {
  @apply text-xl text-orange-600;
}

.widget-title h3 {
  @apply text-base font-semibold text-gray-800;
}

/* ===== Content ===== */
.widget-content {
  @apply flex flex-col gap-3;
}

/* Compact Display */
.stats-compact {
  @apply flex flex-col gap-2;
}

.stat-item {
  @apply flex items-center gap-3 p-2 rounded-lg border border-gray-100;
  @apply transition-colors duration-200 hover:bg-gray-50;
}

.stat-icon-wrapper {
  @apply flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0;
}

.widget-size-medium .stat-icon-wrapper,
.widget-size-large .stat-icon-wrapper {
  @apply w-10 h-10;
}

.stat-icon {
  @apply text-lg;
}

.widget-size-large .stat-icon {
  @apply text-xl;
}

.stat-info {
  @apply flex flex-col;
}

.stat-label {
  @apply text-xs text-gray-500 font-medium;
}

.widget-size-large .stat-label {
  @apply text-sm;
}

.stat-value {
  @apply text-lg font-bold text-gray-800 mt-0.5;
}

.widget-size-large .stat-value {
  @apply text-xl;
}

/* Grid Display */
.stats-grid {
  @apply grid grid-cols-2 gap-3;
}

.stat-card {
  @apply flex items-center gap-3 p-3 rounded-lg border border-gray-100;
  @apply transition-colors duration-200 hover:bg-gray-50;
}

/* ===== Dark Mode ===== */
@media (prefers-color-scheme: dark) {
  .reminder-stats-widget {
    @apply bg-gray-800 border-gray-700;
  }

  .widget-title h3 {
    @apply text-gray-100;
  }

  .widget-icon {
    @apply text-orange-400;
  }

  .stat-item,
  .stat-card {
    @apply border-gray-700 hover:bg-gray-700;
  }

  .stat-value {
    @apply text-gray-100;
  }

  .stat-label {
    @apply text-gray-400;
  }
}
</style>
