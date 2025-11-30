<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>日程事件</span>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="showCreateDialog = true">
        创建日程
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- 加载状态 -->
      <v-progress-linear v-if="isLoading" indeterminate color="primary" />

      <!-- 错误提示 -->
      <v-alert v-if="error" type="error" closable @click:close="error = null">
        {{ error.message }}
      </v-alert>

      <!-- 空状态 -->
      <v-empty-state
        v-if="!isLoading && schedules.length === 0"
        icon="mdi-calendar-blank"
        title="暂无日程"
        text="点击右上角按钮创建您的第一个日程"
      />

      <!-- 日程列表 -->
      <v-list v-if="schedules.length > 0" lines="three">
        <v-list-item
          v-for="schedule in schedules"
          :key="schedule.uuid"
          @click="handleScheduleClick(schedule)"
        >
          <template #prepend>
            <v-avatar :color="getPriorityColor(schedule.priority)" size="40">
              <v-icon>mdi-calendar</v-icon>
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-bold">
            {{ schedule.title }}
            <v-chip
              v-if="schedule.hasConflict"
              size="x-small"
              color="warning"
              prepend-icon="mdi-alert"
              class="ml-2"
            >
              冲突
            </v-chip>
          </v-list-item-title>

          <v-list-item-subtitle>
            <div class="text-caption">
              <v-icon size="small">mdi-clock-outline</v-icon>
              {{ formatDateTime(schedule.startTime) }} - {{ formatDateTime(schedule.endTime) }}
              <span class="ml-2">({{ schedule.duration }}分钟)</span>
            </div>
            <div v-if="schedule.location" class="text-caption mt-1">
              <v-icon size="small">mdi-map-marker</v-icon>
              {{ schedule.location }}
            </div>
            <div v-if="schedule.description" class="text-caption mt-1">
              {{ schedule.description }}
            </div>
          </v-list-item-subtitle>

          <template #append>
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click.stop="handleDelete(schedule.uuid)"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>

    <!-- 创建日程对话框 -->
    <CreateScheduleDialog v-model="showCreateDialog" @created="handleScheduleCreated" />
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useScheduleEvent } from '../composables/useScheduleEvent';
import { SourceModule } from '@dailyuse/contracts/schedule';
import type { ScheduleClientDTO, ScheduleTaskClientDTO, ConflictDetectionResult, ScheduleStatisticsClientDTO } from '@dailyuse/contracts/schedule';
import CreateScheduleDialog from './CreateScheduleDialog.vue';

// ===== Composables =====
const {
  schedules,
  isLoading,
  error,
  getSchedulesByAccount,
  deleteSchedule,
  setActiveSchedule,
} = useScheduleEvent();

// ===== State =====
const showCreateDialog = ref(false);

// ===== Lifecycle =====
onMounted(async () => {
  await getSchedulesByAccount();
});

// ===== Methods =====

/**
 * 格式化日期时间
 */
function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 获取优先级颜色
 */
function getPriorityColor(priority: number | null | undefined): string {
  if (!priority) return 'grey';
  if (priority >= 5) return 'error';
  if (priority >= 4) return 'warning';
  if (priority >= 3) return 'info';
  return 'success';
}

/**
 * 点击日程
 */
function handleScheduleClick(schedule: ScheduleClientDTO) {
  setActiveSchedule(schedule.uuid);
  // TODO: 打开日程详情对话框或导航到详情页面
}

/**
 * 删除日程
 */
async function handleDelete(uuid: string) {
  if (confirm('确定要删除这个日程吗？')) {
    await deleteSchedule(uuid);
  }
}

/**
 * 日程创建成功回调
 */
function handleScheduleCreated() {
  showCreateDialog.value = false;
  getSchedulesByAccount(true); // 强制刷新
}
</script>

<style scoped>
.v-list-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.v-list-item:last-child {
  border-bottom: none;
}
</style>

