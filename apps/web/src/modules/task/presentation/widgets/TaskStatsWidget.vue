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
 * 统计数据列表
 */
const stats = computed(() => [
  {
    label: '待办',
    value: instanceStatistics.value.pending,
    icon: 'mdi-clock-outline',
    color: 'blue',
  },
  {
    label: '进行中',
    value: instanceStatistics.value.inProgress,
    icon: 'mdi-progress-clock',
    color: 'orange',
  },
  {
    label: '已完成',
    value: instanceStatistics.value.completed,
    icon: 'mdi-check-circle',
    color: 'green',
  },
]);

/**
 * 完成率颜色
 */
const completionRateColor = computed(() => {
  const rate = completionRate.value;
  if (rate >= 80) return 'success';
  if (rate >= 50) return 'primary';
  if (rate >= 30) return 'warning';
  return 'grey';
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
  <v-card class="task-stats-widget" elevation="2">
    <!-- Header -->
    <v-card-title class="d-flex align-center justify-space-between pa-4">
      <div class="d-flex align-center">
        <v-icon color="primary" size="large" class="mr-2">mdi-clipboard-check</v-icon>
        <span class="text-h6">任务统计</span>
      </div>
      <v-chip v-if="!isSmallSize" :color="completionRateColor" size="small">
        {{ completionRate }}%
      </v-chip>
    </v-card-title>

    <v-divider />

    <!-- Loading State -->
    <v-card-text v-if="isLoading" class="d-flex flex-column align-center justify-center" style="min-height: 150px;">
      <v-progress-circular indeterminate color="primary" />
      <p class="text-caption text-grey mt-2">加载中...</p>
    </v-card-text>

    <!-- Content -->
    <v-card-text v-else class="pa-4">
      <!-- Small Size: Compact Display -->
      <div v-if="isSmallSize" class="d-flex justify-space-around align-center">
        <div class="text-center">
          <div class="text-caption text-grey">总计</div>
          <div class="text-h6 font-weight-bold mt-1">{{ instanceStatistics.total }}</div>
        </div>
        <div class="text-center">
          <div class="text-caption text-grey">完成</div>
          <div class="text-h6 font-weight-bold text-success mt-1">{{ instanceStatistics.completed }}</div>
        </div>
        <div class="text-center">
          <div class="text-caption text-grey">进行中</div>
          <div class="text-h6 font-weight-bold text-warning mt-1">{{ instanceStatistics.inProgress }}</div>
        </div>
      </div>

      <!-- Medium/Large Size: Card Grid -->
      <v-row v-else dense>
        <v-col v-for="stat in stats" :key="stat.label" :cols="isLargeSize ? 4 : 12" :sm="isLargeSize ? 4 : 6" :md="4">
          <v-card class="stat-card" :color="stat.color" variant="tonal" hover>
            <v-card-text class="d-flex align-center pa-3">
              <v-icon :color="stat.color" size="large" class="mr-3">{{ stat.icon }}</v-icon>
              <div>
                <div class="text-caption text-grey">{{ stat.label }}</div>
                <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Total Tasks (Medium/Large) -->
      <v-divider v-if="!isSmallSize" class="my-3" />
      <div v-if="!isSmallSize" class="d-flex align-center justify-space-between">
        <span class="text-body-2 text-grey">总任务数</span>
        <span class="text-h6 font-weight-bold">{{ instanceStatistics.total }}</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.task-stats-widget {
  height: 100%;
}

.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}
</style>
