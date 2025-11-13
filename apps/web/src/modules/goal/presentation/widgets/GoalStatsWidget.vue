<script setup lang="ts">
/**
 * GoalStatsWidget - 目标统计 Widget
 */
import { computed } from 'vue';
import type { DashboardContracts } from '@dailyuse/contracts';
import { useGoalStore } from '@/modules/goal/presentation/stores/goalStore';

interface Props {
  size?: DashboardContracts.WidgetSize;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium' as DashboardContracts.WidgetSize,
});

const goalStore = useGoalStore();
const goalStatistics = computed(() => goalStore.getGoalStatistics);

const stats = computed(() => [
  { label: '进行中', value: goalStatistics.value.active, icon: 'mdi-trending-up', color: 'blue' },
  { label: '已完成', value: goalStatistics.value.completed, icon: 'mdi-trophy', color: 'green' },
  { label: '已归档', value: goalStatistics.value.archived, icon: 'mdi-archive', color: 'grey' },
]);

const completionRate = computed(() => {
  const total = goalStatistics.value.total;
  const completed = goalStatistics.value.completed;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
});

const completionRateColor = computed(() => {
  const rate = completionRate.value;
  if (rate >= 80) return 'success';
  if (rate >= 50) return 'primary';
  if (rate >= 30) return 'warning';
  return 'grey';
});

const isSmallSize = computed(() => props.size === 'small');
const isLargeSize = computed(() => props.size === 'large');
const totalGoals = computed(() => goalStatistics.value.total);
</script>

<template>
  <v-card class="goal-stats-widget" elevation="2">
    <v-card-title class="d-flex align-center justify-space-between pa-4">
      <div class="d-flex align-center">
        <v-icon color="yellow-darken-2" size="large" class="mr-2">mdi-trophy</v-icon>
        <span class="text-h6">目标统计</span>
      </div>
      <v-chip v-if="!isSmallSize" :color="completionRateColor" size="small">{{ completionRate }}%</v-chip>
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-4">
      <div v-if="isSmallSize" class="d-flex justify-space-around align-center">
        <div class="text-center">
          <div class="text-caption text-grey">总计</div>
          <div class="text-h6 font-weight-bold mt-1">{{ totalGoals }}</div>
        </div>
        <div class="text-center">
          <div class="text-caption text-grey">完成</div>
          <div class="text-h6 font-weight-bold text-success mt-1">{{ goalStatistics.completed }}</div>
        </div>
        <div class="text-center">
          <div class="text-caption text-grey">进行中</div>
          <div class="text-h6 font-weight-bold text-primary mt-1">{{ goalStatistics.active }}</div>
        </div>
      </div>
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
      <v-divider v-if="!isSmallSize" class="my-3" />
      <div v-if="!isSmallSize" class="d-flex align-center justify-space-between">
        <span class="text-body-2 text-grey">总目标数</span>
        <span class="text-h6 font-weight-bold">{{ totalGoals }}</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.goal-stats-widget {
  height: 100%;
}

.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}
</style>
