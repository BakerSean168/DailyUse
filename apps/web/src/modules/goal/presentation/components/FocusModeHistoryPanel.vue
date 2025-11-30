<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center gap-2">
        <v-icon>mdi-history</v-icon>
        <span>专注周期历史</span>
      </div>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        size="small"
        :loading="isLoading"
        @click="handleRefresh"
      ></v-btn>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text>
      <!-- 数据表格 -->
      <v-data-table
        :headers="headers"
        :items="focusModeHistory"
        :loading="isLoading"
        :items-per-page="10"
        class="elevation-1"
      >
        <!-- 专注目标列 -->
        <template #item.focusedGoalUuids="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <v-chip
              v-for="goalUuid in item.focusedGoalUuids"
              :key="goalUuid"
              size="x-small"
              color="primary"
              variant="flat"
            >
              {{ getGoalTitle(goalUuid) }}
            </v-chip>
          </div>
        </template>

        <!-- 状态列 -->
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item)" size="small" variant="flat">
            <v-icon start size="16">{{ getStatusIcon(item) }}</v-icon>
            {{ getStatusText(item) }}
          </v-chip>
        </template>

        <!-- 开始时间列 -->
        <template #item.startTime="{ item }">
          {{ formatDate(item.startTime) }}
        </template>

        <!-- 结束时间列 -->
        <template #item.endTime="{ item }">
          {{ formatDate(item.endTime) }}
        </template>

        <!-- 持续时间列 -->
        <template #item.duration="{ item }">
          {{ calculateDuration(item) }}
        </template>

        <!-- 隐藏模式列 -->
        <template #item.hiddenGoalsMode="{ item }">
          <v-chip size="x-small" variant="tonal">
            {{ getHiddenModeLabel(item.hiddenGoalsMode) }}
          </v-chip>
        </template>

        <!-- 操作列 -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-btn
              v-if="item.isActive && !isExpiredItem(item)"
              icon="mdi-calendar-plus"
              variant="text"
              size="x-small"
              color="primary"
              @click="handleExtend(item)"
            ></v-btn>
            <v-btn
              v-if="item.isActive"
              icon="mdi-close-circle"
              variant="text"
              size="x-small"
              color="error"
              @click="handleDeactivate(item)"
            ></v-btn>
          </div>
        </template>

        <!-- 空状态 -->
        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-history</v-icon>
            <div class="text-h6 text-grey-darken-1 mt-2">暂无专注周期历史</div>
            <div class="text-body-2 text-grey mt-1">启用专注模式后，历史记录将显示在这里</div>
          </div>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { GoalClientDTO, KeyResultClientDTO, CreateGoalRequest, UpdateGoalRequest, FocusModeClientDTO, ActivateFocusModeRequest, ExtendFocusModeRequest, HiddenGoalsMode } from '@dailyuse/contracts/goal';
import { useFocusMode } from '../composables/useFocusMode';
import { useGoalStore } from '../../application/stores/goalStore';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('FocusModeHistoryPanel');

// ===== Composables =====
const {
  focusModeHistory,
  isLoading,
  fetchFocusModeHistory,
  deactivateFocusMode,
  extendFocusMode,
} = useFocusMode();

const goalStore = useGoalStore();

// ===== 响应式状态 =====
const headers = [
  { title: '专注目标', key: 'focusedGoalUuids', sortable: false },
  { title: '状态', key: 'status', sortable: false },
  { title: '开始时间', key: 'startTime', sortable: true },
  { title: '结束时间', key: 'endTime', sortable: true },
  { title: '持续时间', key: 'duration', sortable: false },
  { title: '隐藏模式', key: 'hiddenGoalsMode', sortable: false },
  { title: '操作', key: 'actions', sortable: false, align: 'center' as const },
];

// ===== 生命周期 =====
onMounted(async () => {
  try {
    await fetchFocusModeHistory();
  } catch (err) {
    logger.error('Failed to fetch focus mode history on mount', err);
  }
});

// ===== 工具方法 =====

/**
 * 获取状态颜色
 */
const getStatusColor = (item: FocusModeClientDTO): string => {
  if (item.isActive) {
    if (isExpiredItem(item)) return 'error';
    return 'success';
  }
  if (isExpiredItem(item)) return 'warning';
  return 'grey';
};

/**
 * 获取状态图标
 */
const getStatusIcon = (item: FocusModeClientDTO): string => {
  if (item.isActive) {
    if (isExpiredItem(item)) return 'mdi-alert-circle';
    return 'mdi-check-circle';
  }
  if (isExpiredItem(item)) return 'mdi-clock-alert';
  return 'mdi-close-circle';
};

/**
 * 获取状态文本
 */
const getStatusText = (item: FocusModeClientDTO): string => {
  if (item.isActive) {
    if (isExpiredItem(item)) return '已过期';
    return '进行中';
  }
  if (isExpiredItem(item)) return '已过期';
  return '已关闭';
};

/**
 * 判断专注周期是否过期
 */
const isExpiredItem = (item: FocusModeClientDTO): boolean => {
  return Date.now() > item.endTime;
};

/**
 * 格式化日期
 */
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 计算持续时间
 */
const calculateDuration = (item: FocusModeClientDTO): string => {
  const duration = item.endTime - item.startTime;
  const days = Math.floor(duration / (24 * 60 * 60 * 1000));
  return `${days} 天`;
};

/**
 * 获取隐藏模式标签
 */
const getHiddenModeLabel = (mode: HiddenGoalsMode): string => {
  const labels: Record<HiddenGoalsMode, string> = {
    hide: '隐藏',
    dim: '变暗',
    collapse: '折叠',
  };
  return labels[mode] || mode;
};

/**
 * 根据 UUID 获取目标标题
 */
const getGoalTitle = (uuid: string): string => {
  const goal = goalStore.getGoalByUuid(uuid);
  return goal?.title ?? uuid;
};

// ===== 事件处理 =====

/**
 * 刷新数据
 */
const handleRefresh = async () => {
  try {
    await fetchFocusModeHistory(true); // 强制刷新
    logger.info('Focus mode history refreshed');
  } catch (err) {
    logger.error('Failed to refresh focus mode history', err);
  }
};

/**
 * 延期专注周期
 */
const handleExtend = (item: FocusModeClientDTO) => {
  // TODO: 打开延期对话框
  // 当前简化版：直接延期 7 天
  const newEndTime = item.endTime + 7 * 24 * 60 * 60 * 1000;
  
  extendFocusMode(newEndTime, item.uuid)
    .then(() => {
      logger.info('Focus mode extended', { uuid: item.uuid });
      handleRefresh();
    })
    .catch((err) => {
      logger.error('Failed to extend focus mode', err);
    });
};

/**
 * 关闭专注周期
 */
const handleDeactivate = (item: FocusModeClientDTO) => {
  if (!confirm(`确定要关闭该专注周期吗？`)) {
    return;
  }

  deactivateFocusMode(item.uuid)
    .then(() => {
      logger.info('Focus mode deactivated', { uuid: item.uuid });
      handleRefresh();
    })
    .catch((err) => {
      logger.error('Failed to deactivate focus mode', err);
    });
};
</script>

<style scoped>
.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}
</style>

