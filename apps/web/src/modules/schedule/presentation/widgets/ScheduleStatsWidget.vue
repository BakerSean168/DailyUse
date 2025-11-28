<script setup lang="ts">
/**
 * ScheduleStatsWidget - 日程统计 Widget
 */
import { computed, ref } from 'vue';
import type { WidgetConfig } from '@dailyuse/contracts/dashboard';

interface Props {
  size?: WidgetSize;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small' as WidgetSize,
});

// TODO: 等 Schedule 模块实现后集成真实数据
const todaySchedules = ref(0);
const weekSchedules = ref(0);

const isSmallSize = computed(() => props.size === 'small');

const stats = computed(() => [
  { label: '今日日程', value: todaySchedules.value, icon: 'mdi-calendar-today', color: 'purple' },
  { label: '本周日程', value: weekSchedules.value, icon: 'mdi-calendar-week', color: 'indigo' },
]);
</script>

<template>
  <v-card class="schedule-stats-widget" elevation="2">
    <v-card-title class="d-flex align-center pa-4">
      <v-icon color="purple" size="large" class="mr-2">mdi-calendar</v-icon>
      <span class="text-h6">日程统计</span>
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-4">
      <div v-if="isSmallSize" class="d-flex flex-column ga-2">
        <div v-for="stat in stats" :key="stat.label" class="d-flex align-center">
          <v-icon :color="stat.color" size="small" class="mr-2">{{ stat.icon }}</v-icon>
          <span class="text-caption text-grey flex-grow-1">{{ stat.label }}</span>
          <span class="text-h6 font-weight-bold">{{ stat.value }}</span>
        </div>
      </div>
      <v-row v-else dense>
        <v-col v-for="stat in stats" :key="stat.label" cols="6">
          <v-card :color="stat.color" variant="tonal" hover>
            <v-card-text class="text-center pa-3">
              <v-icon :color="stat.color" size="large">{{ stat.icon }}</v-icon>
              <div class="text-caption text-grey mt-2">{{ stat.label }}</div>
              <div class="text-h5 font-weight-bold mt-1">{{ stat.value }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.schedule-stats-widget { height: 100%; }
</style>

