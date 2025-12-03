<template>
  <v-dialog :model-value="show" @update:model-value="$emit('update:show', $event)" max-width="900">
    <v-card>
      <!-- 对话框头部 -->
      <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
        <div class="d-flex align-center">
          <v-icon size="32" class="mr-3">mdi-calendar-clock</v-icon>
          <div class="text-white">
            <h2 class="text-h5 font-weight-bold">任务详情</h2>
            <p class="text-caption mb-0 opacity-80">Schedule Task Details</p>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" color="white" @click="$emit('update:show', false)" />
      </v-card-title>

      <v-divider />

      <!-- 加载状态 -->
      <div v-if="isLoading" class="d-flex justify-center align-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" />
      </div>

      <!-- 错误状态 -->
      <v-card-text v-else-if="error" class="pa-6">
        <v-alert type="error" variant="tonal">
          {{ error }}
        </v-alert>
      </v-card-text>

      <!-- 任务详情 -->
      <v-card-text v-else-if="task" class="pa-6">
        <v-row>
          <!-- 左侧：基本信息 -->
          <v-col cols="12" md="6">
            <v-card variant="tonal">
              <v-card-title class="text-h6 font-weight-bold pa-4">
                <v-icon start>mdi-information-outline</v-icon>
                基本信息
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-4">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title class="text-caption text-medium-emphasis">任务名称</v-list-item-title>
                    <v-list-item-subtitle class="text-body-2 font-weight-medium">
                      {{ task.name }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item v-if="task.description">
                    <v-list-item-title class="text-caption text-medium-emphasis">描述</v-list-item-title>
                    <v-list-item-subtitle class="text-body-2">
                      {{ task.description }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title class="text-caption text-medium-emphasis">来源模块</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip :color="getSourceModuleColor(task.sourceModule)" size="small" variant="flat">
                        {{ getSourceModuleText(task.sourceModule) }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title class="text-caption text-medium-emphasis">任务状态</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip :color="getTaskStatusColor(task.status)" size="small" variant="flat">
                        <v-icon start size="16">{{ getTaskStatusIcon(task.status) }}</v-icon>
                        {{ getTaskStatusText(task.status) }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title class="text-caption text-medium-emphasis">启用状态</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip :color="task.enabled ? 'success' : 'error'" size="small" variant="flat">
                        <v-icon start size="16">{{ task.enabled ? 'mdi-check' : 'mdi-close' }}</v-icon>
                        {{ task.enabled ? '已启用' : '已禁用' }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 右侧：执行信息 -->
          <v-col cols="12" md="6">
            <v-card variant="tonal" color="info">
              <v-card-title class="text-h6 font-weight-bold pa-4">
                <v-icon start>mdi-clock-outline</v-icon>
                执行信息
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-4">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title class="text-caption text-medium-emphasis">执行次数</v-list-item-title>
                    <v-list-item-subtitle class="text-body-2 font-weight-medium">
                      {{ task.execution.executionCount }} 次
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item v-if="task.execution.nextRunAt">
                    <v-list-item-title class="text-caption text-medium-emphasis">下次执行</v-list-item-title>
                    <v-list-item-subtitle class="text-body-2">
                      {{ formatDateTime(task.execution.nextRunAt) }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item v-if="task.execution.lastRunAt">
                    <v-list-item-title class="text-caption text-medium-emphasis">上次执行</v-list-item-title>
                    <v-list-item-subtitle class="text-body-2">
                      {{ formatDateTime(task.execution.lastRunAt) }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item v-if="task.execution.lastExecutionStatus">
                    <v-list-item-title class="text-caption text-medium-emphasis">上次执行状态</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip :color="getExecutionStatusColor(task.execution.lastExecutionStatus)" size="small">
                        {{ getExecutionStatusText(task.execution.lastExecutionStatus) }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item v-if="task.execution.consecutiveFailures > 0">
                    <v-list-item-title class="text-caption text-medium-emphasis">连续失败</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip color="error" size="small">
                        {{ task.execution.consecutiveFailures }} 次
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- 调度配置 -->
        <v-card class="mt-4" variant="outlined">
          <v-card-title class="text-h6 font-weight-bold pa-4">
            <v-icon start>mdi-cog-outline</v-icon>
            调度配置
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <v-row>
              <v-col cols="6" md="3">
                <div class="text-caption text-medium-emphasis mb-1">Cron 表达式</div>
                <div class="text-body-2 font-weight-medium">{{ task.schedule.cronExpression }}</div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-caption text-medium-emphasis mb-1">时区</div>
                <div class="text-body-2">{{ task.schedule.timezone }}</div>
              </v-col>
              <v-col cols="6" md="3" v-if="task.schedule.startDate">
                <div class="text-caption text-medium-emphasis mb-1">开始日期</div>
                <div class="text-body-2">{{ formatDate(task.schedule.startDate) }}</div>
              </v-col>
              <v-col cols="6" md="3" v-if="task.schedule.endDate">
                <div class="text-caption text-medium-emphasis mb-1">结束日期</div>
                <div class="text-body-2">{{ formatDate(task.schedule.endDate) }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 执行历史记录 -->
        <v-card class="mt-4" variant="outlined">
          <v-card-title class="d-flex align-center justify-space-between pa-4">
            <div>
              <v-icon start>mdi-history</v-icon>
              <span class="text-h6 font-weight-bold">执行历史</span>
            </div>
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-refresh"
              @click="handleRefreshExecutions"
              :loading="isLoadingHistory"
            >
              刷新
            </v-btn>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0">
            <!-- 加载中 -->
            <div v-if="isLoadingHistory" class="d-flex justify-center align-center py-8">
              <v-progress-circular indeterminate color="primary" size="48" />
            </div>

            <!-- 执行记录列表 -->
            <v-list v-else-if="executions.length > 0" density="compact">
              <v-list-item
                v-for="(execution, index) in executions"
                :key="execution.uuid"
                :class="{ 'bg-grey-lighten-5': index % 2 === 0 }"
              >
                <template v-slot:prepend>
                  <v-icon :color="getExecutionStatusColor(execution.status)" size="20">
                    {{ getExecutionStatusIcon(execution.status) }}
                  </v-icon>
                </template>

                <v-list-item-title class="text-body-2">
                  {{ formatDateTime(execution.executionTime) }}
                </v-list-item-title>

                <v-list-item-subtitle class="text-caption">
                  <span v-if="execution.duration">耗时: {{ execution.duration }}ms</span>
                  <span v-if="execution.error" class="text-error ml-2">
                    {{ execution.error }}
                  </span>
                </v-list-item-subtitle>

                <template v-slot:append>
                  <v-chip :color="getExecutionStatusColor(execution.status)" size="x-small" variant="flat">
                    {{ getExecutionStatusText(execution.status) }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>

            <!-- 空状态 -->
            <div v-else class="text-center py-8 text-medium-emphasis">
              <v-icon size="64" color="grey-lighten-1">mdi-calendar-remove</v-icon>
              <p class="text-body-2 mt-2 mb-0">暂无执行记录</p>
            </div>
          </v-card-text>
        </v-card>
      </v-card-text>

      <v-divider />

      <!-- 对话框底部 -->
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:show', false)">关闭</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useScheduleTaskDetail } from '../composables/useScheduleTaskDetail';

interface Props {
  show: boolean;
  taskUuid: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

// 使用 composable
const {
  task,
  isLoading,
  error,
  executions,
  isLoadingExecutions: isLoadingHistory,
  loadTaskDetail,
  loadExecutions,
  refreshExecutions,
  clearState,
} = useScheduleTaskDetail();

// 监听 taskUuid 变化，自动加载数据
watch(() => [props.show, props.taskUuid], async ([show, uuid]) => {
  if (show && uuid && typeof uuid === 'string') {
    await loadTaskDetail(uuid);
    await loadExecutions(uuid);
  } else if (!show) {
    // 对话框关闭时清空状态
    clearState();
  }
}, { immediate: true });

/**
 * 刷新执行历史
 */
async function handleRefreshExecutions() {
  if (props.taskUuid) {
    await refreshExecutions(props.taskUuid);
  }
}

function formatDateTime(timestamp: number | string | null | undefined): string {
  if (!timestamp) return 'N/A';
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDate(timestamp: number | string | null | undefined): string {
  if (!timestamp) return 'N/A';
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  return new Date(time).toLocaleDateString('zh-CN');
}

function getSourceModuleColor(module: string): string {
  const colors: Record<string, string> = {
    reminder: 'primary',
    task: 'success',
    goal: 'warning',
  };
  return colors[module] || 'grey';
}

function getSourceModuleText(module: string): string {
  const texts: Record<string, string> = {
    reminder: '提醒模块',
    task: '任务模块',
    goal: '目标模块',
  };
  return texts[module] || module;
}

function getTaskStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'success',
    paused: 'warning',
    completed: 'info',
    cancelled: 'error',
  };
  return colors[status] || 'grey';
}

function getTaskStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    active: 'mdi-play-circle',
    paused: 'mdi-pause-circle',
    completed: 'mdi-check-circle',
    cancelled: 'mdi-close-circle',
  };
  return icons[status] || 'mdi-help-circle';
}

function getTaskStatusText(status: string): string {
  const texts: Record<string, string> = {
    active: '运行中',
    paused: '已暂停',
    completed: '已完成',
    cancelled: '已取消',
  };
  return texts[status] || status;
}

function getExecutionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'grey',
    running: 'info',
    success: 'success',
    failed: 'error',
    timeout: 'warning',
    skipped: 'grey-lighten-1',
  };
  return colors[status] || 'grey';
}

function getExecutionStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    pending: 'mdi-clock-outline',
    running: 'mdi-loading',
    success: 'mdi-check-circle',
    failed: 'mdi-alert-circle',
    timeout: 'mdi-timer-alert',
    skipped: 'mdi-skip-next',
  };
  return icons[status] || 'mdi-help-circle';
}

function getExecutionStatusText(status: string): string {
  const texts: Record<string, string> = {
    pending: '待执行',
    running: '执行中',
    success: '成功',
    failed: '失败',
    timeout: '超时',
    skipped: '跳过',
  };
  return texts[status] || status;
}
</script>

<style scoped>
.bg-primary {
  background-color: rgb(var(--v-theme-primary));
}
</style>
