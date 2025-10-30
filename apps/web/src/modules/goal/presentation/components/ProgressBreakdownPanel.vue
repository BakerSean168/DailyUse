<template>
  <v-card class="progress-breakdown-panel" elevation="2">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon left color="primary">mdi-chart-pie</v-icon>
        <span>进度分解详情</span>
      </div>
      <v-btn icon size="small" @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-divider />

    <!-- 加载状态 -->
    <v-card-text v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="text-caption mt-2">加载中...</p>
    </v-card-text>

    <!-- 错误状态 -->
    <v-card-text v-else-if="error" class="text-center py-8">
      <v-icon color="error" size="48">mdi-alert-circle</v-icon>
      <p class="text-error mt-2">{{ error }}</p>
      <v-btn color="primary" variant="outlined" size="small" @click="loadBreakdown">
        重试
      </v-btn>
    </v-card-text>

    <!-- 内容区域 -->
    <v-card-text v-else-if="breakdown" class="pa-4">
      <!-- 总进度卡片 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-subtitle-2 text-medium-emphasis">目标总进度</span>
            <v-chip :color="getProgressColor(breakdown.totalProgress)" size="small">
              {{ breakdown.totalProgress.toFixed(2) }}%
            </v-chip>
          </div>
          <v-progress-linear
            :model-value="breakdown.totalProgress"
            :color="getProgressColor(breakdown.totalProgress)"
            height="12"
            rounded
          />
          <div class="d-flex align-center justify-between mt-2">
            <span class="text-caption text-medium-emphasis">计算模式：加权平均</span>
            <span class="text-caption text-medium-emphasis">
              最后更新：{{ formatTime(breakdown.lastUpdateTime) }}
            </span>
          </div>
        </v-card-text>
      </v-card>

      <!-- 关键结果贡献度列表 -->
      <div class="mb-3">
        <div class="text-subtitle-2 mb-2 d-flex align-center">
          <v-icon size="small" class="mr-1">mdi-chart-box-outline</v-icon>
          关键结果贡献度（{{ breakdown.krContributions.length }}项）
        </div>
      </div>

      <v-list lines="two" density="compact">
        <v-list-item
          v-for="(kr, index) in breakdown.krContributions"
          :key="kr.keyResultUuid"
          class="kr-contribution-item"
        >
          <template #prepend>
            <v-avatar :color="getProgressColor(kr.progress)" size="32" class="mr-2">
              <span class="text-caption font-weight-bold">{{ index + 1 }}</span>
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-medium">
            {{ kr.keyResultName }}
          </v-list-item-title>

          <v-list-item-subtitle class="mt-1">
            <div class="d-flex align-center justify-space-between">
              <span class="text-caption">
                进度：<strong>{{ kr.progress.toFixed(2) }}%</strong>
              </span>
              <span class="text-caption">
                权重：<strong>{{ kr.weight }}%</strong>
              </span>
              <span class="text-caption">
                贡献度：<strong class="text-primary">{{ kr.contribution.toFixed(2) }}%</strong>
              </span>
            </div>
            <v-progress-linear
              :model-value="kr.progress"
              :color="getProgressColor(kr.progress)"
              height="4"
              rounded
              class="mt-1"
            />
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <!-- 计算公式说明 -->
      <v-card variant="tonal" class="mt-4" color="blue-grey-lighten-5">
        <v-card-text class="pa-3">
          <div class="text-caption text-medium-emphasis mb-1">
            <v-icon size="small" class="mr-1">mdi-calculator</v-icon>
            计算公式
          </div>
          <div class="formula-text text-caption font-weight-medium">
            {{ getFormulaText() }}
          </div>
        </v-card-text>
      </v-card>
    </v-card-text>

    <v-divider v-if="breakdown" />

    <!-- 底部操作栏 -->
    <v-card-actions v-if="breakdown">
      <v-spacer />
      <v-btn variant="text" size="small" @click="$emit('close')">
        关闭
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { GoalContracts } from '@dailyuse/contracts';
import { useGoal } from '../composables/useGoal';
import dayjs from 'dayjs';

// Props
const props = defineProps<{
  goalUuid: string;
}>();

// Emits
const emit = defineEmits<{
  close: [];
}>();

// Composables
const { fetchProgressBreakdown } = useGoal();

// State
const loading = ref(false);
const error = ref<string | null>(null);
const breakdown = ref<GoalContracts.ProgressBreakdown | null>(null);

/**
 * 加载进度分解数据
 */
const loadBreakdown = async () => {
  try {
    loading.value = true;
    error.value = null;
    breakdown.value = await fetchProgressBreakdown(props.goalUuid);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败';
    console.error('加载进度分解失败:', err);
  } finally {
    loading.value = false;
  }
};

/**
 * 根据进度获取颜色
 */
const getProgressColor = (progress: number): string => {
  if (progress >= 90) return 'success';
  if (progress >= 70) return 'info';
  if (progress >= 50) return 'warning';
  if (progress >= 30) return 'orange';
  return 'error';
};

/**
 * 格式化时间
 */
const formatTime = (timestamp: number): string => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm');
};

/**
 * 生成计算公式文本
 */
const getFormulaText = (): string => {
  if (!breakdown.value) return '';

  const parts = breakdown.value.krContributions.map(
    (kr) => `${kr.progress.toFixed(2)}% × ${kr.weight}%`
  );

  const totalWeight = breakdown.value.krContributions.reduce((sum, kr) => sum + kr.weight, 0);

  return `总进度 = (${parts.join(' + ')}) / ${totalWeight}% = ${breakdown.value.totalProgress.toFixed(2)}%`;
};

// Lifecycle
onMounted(() => {
  loadBreakdown();
});
</script>

<style scoped>
.progress-breakdown-panel {
  max-width: 600px;
  margin: 0 auto;
}

.kr-contribution-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.kr-contribution-item:last-child {
  border-bottom: none;
}

.formula-text {
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.6;
  word-break: break-word;
}
</style>
