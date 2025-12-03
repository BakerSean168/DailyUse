<template>
  <v-card class="statistics-card" elevation="3">
    <v-card-title class="d-flex align-center justify-space-between pa-4 bg-gradient">
      <div class="d-flex align-center">
        <v-avatar color="info" size="48" class="mr-3" variant="tonal">
          <v-icon color="info" size="28">mdi-chart-box</v-icon>
        </v-avatar>
        <div>
          <h3 class="text-h5 font-weight-bold">调度统计</h3>
          <p class="text-caption text-medium-emphasis mb-0">Schedule Statistics Overview</p>
        </div>
      </div>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        size="small"
        :loading="isLoading"
        @click="$emit('refresh')"
      />
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-4">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="d-flex justify-center align-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="py-4">
        <v-alert type="error" variant="tonal">
          {{ error }}
          <template v-slot:append>
            <v-btn variant="text" color="error" @click="$emit('refresh')"> 重试 </v-btn>
          </template>
        </v-alert>
      </div>

      <!-- 统计内容 -->
      <div v-else-if="statistics" class="statistics-content">
        <!-- 总体统计 -->
        <div class="mb-6">
          <h4 class="text-subtitle-1 font-weight-bold mb-3">总体概览</h4>
          <v-row dense>
            <v-col cols="6" md="3">
              <v-card class="stat-card" variant="tonal" color="primary">
                <v-card-text class="text-center pa-4">
                  <div class="text-h4 font-weight-bold">{{ statistics.totalTasks }}</div>
                  <div class="text-caption">总任务数</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card class="stat-card" variant="tonal" color="success">
                <v-card-text class="text-center pa-4">
                  <div class="text-h4 font-weight-bold">{{ statistics.activeTasks }}</div>
                  <div class="text-caption">活跃任务</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card class="stat-card" variant="tonal" color="warning">
                <v-card-text class="text-center pa-4">
                  <div class="text-h4 font-weight-bold">{{ statistics.pausedTasks }}</div>
                  <div class="text-caption">暂停任务</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card class="stat-card" variant="tonal" color="error">
                <v-card-text class="text-center pa-4">
                  <div class="text-h4 font-weight-bold">{{ statistics.failedTasks }}</div>
                  <div class="text-caption">失败任务</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- 执行统计 -->
        <div class="mb-6">
          <h4 class="text-subtitle-1 font-weight-bold mb-3">执行情况</h4>
          <v-row dense>
            <v-col cols="4">
              <v-card class="stat-card" variant="outlined">
                <v-card-text class="text-center pa-4">
                  <div class="text-h5 font-weight-bold">{{ statistics.totalExecutions }}</div>
                  <div class="text-caption text-medium-emphasis">总执行次数</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="4">
              <v-card class="stat-card" variant="outlined">
                <v-card-text class="text-center pa-4">
                  <div class="text-h5 font-weight-bold text-success">
                    {{ statistics.successfulExecutions }}
                  </div>
                  <div class="text-caption text-medium-emphasis">成功次数</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="4">
              <v-card class="stat-card" variant="outlined">
                <v-card-text class="text-center pa-4">
                  <div class="text-h5 font-weight-bold text-error">
                    {{ statistics.failedExecutions }}
                  </div>
                  <div class="text-caption text-medium-emphasis">失败次数</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- 成功率 -->
          <v-card class="mt-3" variant="outlined">
            <v-card-text class="pa-4">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-subtitle-2">成功率</span>
                <span class="text-h6 font-weight-bold text-success">{{ successRate }}%</span>
              </div>
              <v-progress-linear :model-value="successRate" color="success" height="8" rounded />
            </v-card-text>
          </v-card>
        </div>

        <!-- 模块统计 -->
        <div v-if="moduleStatistics">
          <h4 class="text-subtitle-1 font-weight-bold mb-3">模块分布</h4>
          <v-row dense>
            <v-col
              v-for="(stats, moduleName) in moduleStatistics"
              :key="moduleName"
              cols="12"
              md="4"
            >
              <v-card class="module-stat-card" variant="outlined">
                <v-card-text class="pa-4">
                  <div class="d-flex align-center mb-3">
                    <v-icon :color="getModuleColor(moduleName as string)" size="32" class="mr-2">
                      {{ getModuleIcon(moduleName as string) }}
                    </v-icon>
                    <div>
                      <div class="text-subtitle-2 font-weight-bold">
                        {{ getModuleName(moduleName as string) }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ stats.totalTasks }} 个任务
                      </div>
                    </div>
                  </div>

                  <v-divider class="my-2" />

                  <div class="d-flex justify-space-between text-caption">
                    <span>活跃: {{ stats.activeTasks }}</span>
                    <span>执行: {{ stats.totalExecutions }}</span>
                    <span>成功率: {{ stats.successRateFormatted }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-12">
        <v-icon size="80" color="grey-lighten-1">mdi-chart-box-outline</v-icon>
        <p class="text-h6 text-medium-emphasis mt-4 mb-0">暂无统计数据</p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SourceModule } from '@dailyuse/contracts/schedule';
import type { ScheduleStatisticsClientDTO, ModuleStatisticsClientDTO } from '@dailyuse/contracts/schedule';

// Props
const props = defineProps<{
  statistics: ScheduleStatisticsClientDTO | null;
  moduleStatistics?: Record<
    SourceModule,
    ModuleStatisticsClientDTO
  > | null;
  isLoading?: boolean;
  error?: string | null;
}>();

// Emits
defineEmits<{
  refresh: [];
}>();

// 计算成功率
const successRate = computed(() => {
  if (!props.statistics || props.statistics.totalExecutions === 0) {
    return 0;
  }
  return Math.round(
    (props.statistics.successfulExecutions / props.statistics.totalExecutions) * 100,
  );
});

// 获取模块名称
function getModuleName(module: string): string {
  const nameMap: Record<string, string> = {
    reminder: '提醒模块',
    task: '任务模块',
    goal: '目标模块',
    notification: '通知模块',
  };
  return nameMap[module] || module;
}

// 获取模块图标
function getModuleIcon(module: string): string {
  const iconMap: Record<string, string> = {
    reminder: 'mdi-bell-ring',
    task: 'mdi-format-list-checks',
    goal: 'mdi-target',
    notification: 'mdi-bell-alert',
  };
  return iconMap[module] || 'mdi-help-circle';
}

// 获取模块颜色
function getModuleColor(module: string): string {
  const colorMap: Record<string, string> = {
    reminder: 'primary',
    task: 'success',
    goal: 'warning',
    notification: 'info',
  };
  return colorMap[module] || 'grey';
}
</script>

<style scoped>
.statistics-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.bg-gradient {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%);
}

.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.module-stat-card {
  transition: all 0.2s;
}

.module-stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.statistics-content {
  max-height: 600px;
  overflow-y: auto;
}
</style>

