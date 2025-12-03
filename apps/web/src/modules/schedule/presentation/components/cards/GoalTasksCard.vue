<template>
  <v-card class="module-task-card" elevation="2">
    <v-card-title class="d-flex align-center justify-space-between pa-4">
      <div class="d-flex align-center">
        <v-avatar color="warning" size="40" class="mr-3" variant="tonal">
          <v-icon color="warning">mdi-target</v-icon>
        </v-avatar>
        <div>
          <h3 class="text-h6 font-weight-bold">目标模块任务</h3>
          <p class="text-caption text-medium-emphasis mb-0">Goal Module Tasks</p>
        </div>
      </div>
      <v-chip :color="getStatusColor()" size="small" variant="tonal" class="font-weight-medium">
        {{ tasks.length }} 个任务
      </v-chip>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-4">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="d-flex justify-center align-center py-8">
        <v-progress-circular indeterminate color="warning" size="48" />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="py-4">
        <v-alert type="error" variant="tonal">
          {{ error }}
        </v-alert>
      </div>

      <!-- 任务列表 -->
      <div v-else-if="tasks.length > 0" class="task-list">
        <v-list>
          <v-list-item
            v-for="task in tasks"
            :key="task.uuid"
            class="task-item px-0"
            :class="{ 'task-paused': task.status === 'paused' }"
          >
            <template v-slot:prepend>
              <v-icon :color="getTaskStatusColor(task.status)" size="20">
                {{ getTaskStatusIcon(task.status) }}
              </v-icon>
            </template>

            <v-list-item-title class="font-weight-medium">
              {{ task.name }}
            </v-list-item-title>

            <v-list-item-subtitle class="text-caption">
              {{ task.description || '暂无描述' }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <div class="d-flex align-center gap-2">
                <!-- 状态标签 -->
                <v-chip :color="getTaskStatusColor(task.status)" size="x-small" variant="flat">
                  {{ getTaskStatusText(task.status) }}
                </v-chip>

                <!-- 操作按钮 -->
                <v-btn
                  icon="mdi-eye-outline"
                  variant="text"
                  size="small"
                  color="info"
                  @click="$emit('view-detail', task.uuid)"
                />
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" />
                  </template>
                  <v-list>
                    <v-list-item
                      v-if="task.status === 'active'"
                      @click="$emit('pause-task', task.uuid)"
                    >
                      <v-list-item-title>
                        <v-icon start size="small">mdi-pause</v-icon>
                        暂停
                      </v-list-item-title>
                    </v-list-item>
                    <v-list-item
                      v-if="task.status === 'paused'"
                      @click="$emit('resume-task', task.uuid)"
                    >
                      <v-list-item-title>
                        <v-icon start size="small">mdi-play</v-icon>
                        恢复
                      </v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="$emit('delete-task', task.uuid)">
                      <v-list-item-title class="text-error">
                        <v-icon start size="small">mdi-delete</v-icon>
                        删除
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-target-variant</v-icon>
        <p class="text-body-2 text-medium-emphasis mt-4 mb-0">暂无目标模块任务</p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { ScheduleTaskClient } from '@dailyuse/contracts/schedule';

// Props
const props = defineProps<{
  tasks: ScheduleTaskClient[];
  isLoading?: boolean;
  error?: string | null;
}>();;

// Emits
defineEmits<{
  'pause-task': [taskUuid: string];
  'resume-task': [taskUuid: string];
  'delete-task': [taskUuid: string];
  'view-detail': [taskUuid: string];
}>();

// 方法
function getStatusColor() {
  const activeCount = props.tasks.filter((t) => t.status === 'active').length;
  if (activeCount === 0) return 'grey';
  return 'warning';
}

function getTaskStatusColor(status: string) {
  const colorMap: Record<string, string> = {
    active: 'success',
    paused: 'warning',
    completed: 'info',
    failed: 'error',
    cancelled: 'grey',
  };
  return colorMap[status] || 'grey';
}

function getTaskStatusIcon(status: string) {
  const iconMap: Record<string, string> = {
    active: 'mdi-play-circle',
    paused: 'mdi-pause-circle',
    completed: 'mdi-check-circle',
    failed: 'mdi-alert-circle',
    cancelled: 'mdi-close-circle',
  };
  return iconMap[status] || 'mdi-help-circle';
}

function getTaskStatusText(status: string) {
  const textMap: Record<string, string> = {
    active: '活跃',
    paused: '暂停',
    completed: '完成',
    failed: '失败',
    cancelled: '取消',
  };
  return textMap[status] || status;
}
</script>

<style scoped>
.module-task-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.task-list {
  max-height: 400px;
  overflow-y: auto;
}

.task-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.task-item:last-child {
  border-bottom: none;
}

.task-paused {
  opacity: 0.7;
}
</style>
