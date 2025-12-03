<template>
  <v-card v-if="hasActiveFocusMode" class="focus-mode-status-bar" elevation="2" rounded="lg">
    <v-card-text class="d-flex align-center justify-space-between py-2 px-4">
      <!-- 左侧：状态信息 -->
      <div class="d-flex align-center gap-3">
        <v-icon :color="statusColor" size="24">{{ statusIcon }}</v-icon>
        
        <div>
          <div class="text-subtitle-2 font-weight-bold">
            {{ statusText }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ detailText }}
          </div>
        </div>
      </div>

      <!-- 右侧：快捷操作按钮 -->
      <div class="d-flex align-center gap-2">
        <!-- 剩余天数指示器 -->
        <v-chip
          :color="remainingDaysColor"
          variant="flat"
          size="small"
          class="font-weight-medium"
        >
          <v-icon start size="16">mdi-clock-outline</v-icon>
          剩余 {{ remainingDays }} 天
        </v-chip>

        <!-- 延期按钮 -->
        <v-btn
          color="primary"
          variant="tonal"
          size="small"
          :loading="isLoading"
          @click="handleExtend"
        >
          <v-icon start>mdi-calendar-plus</v-icon>
          延期
        </v-btn>

        <!-- 关闭按钮 -->
        <v-btn
          color="error"
          variant="tonal"
          size="small"
          :loading="isLoading"
          @click="handleDeactivate"
        >
          <v-icon start>mdi-close-circle</v-icon>
          关闭
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useFocusMode } from '../composables/useFocusMode';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('FocusModeStatusBar');
const message = getGlobalMessage();

const {
  hasActiveFocusMode,
  activeFocusMode,
  isExpired,
  remainingDays,
  isLoading,
  fetchActiveFocusMode,
  deactivateFocusMode,
  extendFocusMode,
} = useFocusMode();

// ===== 计算属性 =====

/**
 * 状态图标
 */
const statusIcon = computed(() => {
  if (isExpired.value) return 'mdi-alert-circle';
  return 'mdi-bullseye-arrow';
});

/**
 * 状态颜色
 */
const statusColor = computed(() => {
  if (isExpired.value) return 'error';
  return 'success';
});

/**
 * 状态文本
 */
const statusText = computed(() => {
  if (isExpired.value) return '专注模式已过期';
  return '专注模式已启用';
});

/**
 * 详情文本
 */
const detailText = computed(() => {
  if (!activeFocusMode.value) return '';
  
  const goalCount = activeFocusMode.value.focusedGoalUuids.length;
  const endDate = new Date(activeFocusMode.value.endTime).toLocaleDateString('zh-CN');
  
  return `${goalCount} 个目标 · 截止 ${endDate}`;
});

/**
 * 剩余天数颜色
 */
const remainingDaysColor = computed(() => {
  if (remainingDays.value <= 3) return 'error';
  if (remainingDays.value <= 7) return 'warning';
  return 'success';
});

// ===== 生命周期 =====

onMounted(async () => {
  try {
    await fetchActiveFocusMode();
  } catch (err) {
    logger.error('Failed to fetch active focus mode on mount', err);
  }
});

// ===== 事件处理 =====

/**
 * 处理延期操作
 */
const handleExtend = () => {
  // TODO: 打开延期对话框
  // 当前简化版：直接延期 7 天
  if (!activeFocusMode.value) return;

  const currentEndTime = activeFocusMode.value.endTime;
  const newEndTime = currentEndTime + 7 * 24 * 60 * 60 * 1000; // +7天

  extendFocusMode(newEndTime)
    .then(() => {
      logger.info('Focus mode extended successfully');
    })
    .catch((err) => {
      logger.error('Failed to extend focus mode', err);
    });
};

/**
 * 处理关闭操作
 */
const handleDeactivate = () => {
  if (!activeFocusMode.value) return;

  // 确认对话框
  if (!confirm('确定要关闭专注模式吗？')) {
    return;
  }

  deactivateFocusMode()
    .then(() => {
      logger.info('Focus mode deactivated successfully');
    })
    .catch((err) => {
      logger.error('Failed to deactivate focus mode', err);
    });
};
</script>

<style scoped>
.focus-mode-status-bar {
  position: sticky;
  top: 64px; /* 假设顶部导航栏高度为 64px */
  z-index: 100;
  border-left: 4px solid rgb(var(--v-theme-success));
}

.focus-mode-status-bar .v-card-text {
  min-height: 60px;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}
</style>
