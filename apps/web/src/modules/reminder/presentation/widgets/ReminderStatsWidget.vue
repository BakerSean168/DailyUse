<script setup lang="ts">
/**
 * ReminderStatsWidget - 提醒统计 Widget
 */
import { computed } from 'vue';
import type { WidgetConfig } from '@dailyuse/contracts/dashboard';
import { useReminderStatistics } from '@/modules/notification/presentation/composables/useReminderStatistics';

interface Props {
  size?: WidgetSize;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small' as WidgetSize,
});

// ✅ 通过 composable 获取数据
const { todayReminders, unreadReminders } = useReminderStatistics();

const isSmallSize = computed(() => props.size === 'small');

const stats = computed(() => [
  { label: '今日提醒', value: todayReminders.value, icon: 'mdi-bell-ring', color: 'orange' },
  { label: '未读提醒', value: unreadReminders.value, icon: 'mdi-bell-badge', color: 'red' },
]);
</script>

<template>
  <v-card class="reminder-stats-widget" elevation="2">
    <v-card-title class="d-flex align-center pa-4">
      <v-icon color="orange" size="large" class="mr-2">mdi-bell</v-icon>
      <span class="text-h6">提醒统计</span>
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
.reminder-stats-widget {
  height: 100%;
}
</style>

