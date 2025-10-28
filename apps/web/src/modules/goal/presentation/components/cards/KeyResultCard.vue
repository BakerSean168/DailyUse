<template>
  <v-card
    class="key-result-card"
    :class="{ 'key-result-card--completed': keyResult.progressPercentage >= 100 }"
    variant="outlined"
    elevation="0"
    hover
    @click="goToKeyResultInfo"
  >
    <!-- 进度背景层 -->
    <div
      class="progress-background"
      :style="{
        background: `linear-gradient(90deg, ${goal?.color || '#1976D2'} 0%, ${goal?.color || '#1976D2'}88 100%)`,
        width: `${keyResult.progressPercentage}%`,
      }"
    ></div>

    <!-- 卡片头部 -->
    <v-card-title class="pa-4 pb-2">
      <div class="d-flex align-center justify-space-between w-100">
        <div class="key-result-title">
          <h3 class="text-h6 font-weight-bold mb-0">{{ keyResult.title }}</h3>
          <div class="d-flex align-center mt-1">
            <v-icon
              :color="keyResult.progressPercentage >= 100 ? 'success' : 'medium-emphasis'"
              size="16"
              class="mr-1"
            >
              {{ keyResult.progressPercentage >= 100 ? 'mdi-check-circle' : 'mdi-target' }}
            </v-icon>
            <span class="text-caption text-medium-emphasis"> 权重: {{ keyResult.weight }} </span>
          </div>
        </div>

        <!-- 进度圆环 -->
        <v-progress-circular
          :model-value="keyResult.progressPercentage"
          :color="goal?.color || 'primary'"
          size="48"
          width="4"
          class="progress-ring"
        >
          <span class="text-caption font-weight-bold">{{ Math.round(keyResult.progressPercentage) }}%</span>
        </v-progress-circular>
      </div>
    </v-card-title>

    <!-- 卡片内容 -->
    <v-card-text class="pa-4 pt-0">
      <div class="d-flex align-center justify-space-between">
        <!-- 数值显示 -->
        <div class="value-display">
          <v-chip :color="goal?.color || 'primary'" variant="tonal" size="small" class="mr-2">
            <span class="font-weight-bold">{{ keyResult.progress.currentValue }}</span>
          </v-chip>
          <v-icon size="16" color="medium-emphasis">mdi-arrow-right</v-icon>
          <v-chip color="surface-variant" variant="outlined" size="small" class="ml-2">
            <span class="font-weight-bold">{{ keyResult.progress.targetValue }}</span>
          </v-chip>
        </div>

        <!-- 添加记录按钮 -->
        <v-btn
          :color="goal?.color || 'primary'"
          icon="mdi-plus"
          size="small"
          variant="tonal"
          class="add-record-btn"
          @click.stop="goalRecordDialogRef?.openDialog(keyResult.goalUuid, keyResult.uuid)"
        >
          <v-icon>mdi-plus</v-icon>
          <v-tooltip activator="parent" location="bottom"> 添加进度记录 </v-tooltip>
        </v-btn>
      </div>

      <!-- 关键结果描述 -->
      <p v-if="keyResult.description" class="text-body-2 text-medium-emphasis mt-2 mb-0">
        {{ keyResult.description }}
      </p>

      <!-- 最近记录时间 -->
      <!-- <div v-if="keyResult.lastUpdateTime" class="d-flex align-center mt-2">
        <v-icon size="14" color="medium-emphasis" class="mr-1">mdi-clock-outline</v-icon>
        <span class="text-caption text-medium-emphasis">
          最近更新: {{ format(keyResult.lastUpdateTime, 'MM-DD HH:mm') }}
        </span>
      </div> -->
    </v-card-text>
    <GoalRecordDialog ref="goalRecordDialogRef" />
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { format } from 'date-fns';
import { KeyResultClient, GoalClient } from '@dailyuse/domain-client';
// composables
import { useGoal } from '../../composables/useGoal';
// components
import GoalRecordDialog from '../dialogs/GoalRecordDialog.vue';

const { archiveGoal } = useGoal();
const props = defineProps<{
  keyResult: KeyResultClient;
  goal?: GoalClient;
}>();

// components
const goalRecordDialogRef = ref<InstanceType<typeof GoalRecordDialog> | null>(null);

const goToKeyResultInfo = () => {
  console.log('好像没必要');
};
</script>

<style scoped>
.key-result-card {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border-radius: 12px;
}

.key-result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.key-result-card--completed {
  border-color: rgb(var(--v-theme-success));
}

.progress-background {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 0;
  opacity: 0.1;
  transition: width 0.5s ease;
}

.v-card-title,
.v-card-text {
  position: relative;
  z-index: 1;
}

.key-result-title {
  flex: 1;
  min-width: 0;
}

.progress-ring {
  flex-shrink: 0;
}

.value-display {
  display: flex;
  align-items: center;
}

.add-record-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.key-result-card:hover .add-record-btn {
  opacity: 1;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .v-card-title {
    padding: 12px 16px 8px;
  }

  .v-card-text {
    padding: 8px 16px 12px;
  }

  .progress-ring {
    width: 40px !important;
    height: 40px !important;
  }
}
</style>
