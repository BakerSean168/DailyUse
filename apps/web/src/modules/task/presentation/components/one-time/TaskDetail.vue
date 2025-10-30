<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="900"
    scrollable
  >
    <v-card v-if="task">
      <!-- 卡片头部 -->
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-chip :color="statusColor" size="small" class="mr-2">
            {{ statusText }}
          </v-chip>
          <span class="text-h5">{{ task.title }}</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>

      <v-divider />

      <!-- 卡片内容 -->
      <v-card-text class="pa-6">
        <v-row>
          <!-- 左侧主要信息 -->
          <v-col cols="12" md="8">
            <!-- 描述 -->
            <div class="mb-6">
              <div class="text-h6 mb-3 d-flex align-center">
                <v-icon class="mr-2">mdi-text</v-icon>
                描述
              </div>
              <div v-if="task.description" class="text-body-1 description-text">
                {{ task.description }}
              </div>
              <div v-else class="text-grey text-body-2">
                暂无描述
              </div>
            </div>

            <!-- 子任务 -->
            <div v-if="showSubtasks && subtasks.length > 0" class="mb-6">
              <div class="text-h6 mb-3 d-flex align-center justify-space-between">
                <div>
                  <v-icon class="mr-2">mdi-format-list-checks</v-icon>
                  子任务 ({{ completedSubtasksCount }} / {{ subtasks.length }})
                </div>
                <v-btn
                  size="small"
                  variant="text"
                  prepend-icon="mdi-plus"
                  @click="$emit('add-subtask')"
                >
                  添加子任务
                </v-btn>
              </div>

              <v-list density="compact">
                <v-list-item
                  v-for="subtask in subtasks"
                  :key="subtask.uuid"
                  @click="$emit('view-subtask', subtask.uuid)"
                  :class="{ 'completed-subtask': subtask.status === 'COMPLETED' }"
                >
                  <template v-slot:prepend>
                    <v-checkbox
                      :model-value="subtask.status === 'COMPLETED'"
                      @click.stop
                      @update:model-value="toggleSubtask(subtask.uuid, $event)"
                      hide-details
                      density="compact"
                    />
                  </template>

                  <v-list-item-title :class="{ 'text-decoration-line-through': subtask.status === 'COMPLETED' }">
                    {{ subtask.title }}
                  </v-list-item-title>

                  <template v-slot:append>
                    <v-chip
                      v-if="subtask.priority && subtask.priority >= 4"
                      size="x-small"
                      color="error"
                    >
                      高优先级
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>

              <v-progress-linear
                :model-value="subtaskProgress"
                color="success"
                height="8"
                rounded
                class="mt-3"
              />
            </div>

            <!-- 依赖任务 -->
            <div v-if="dependencies.length > 0" class="mb-6">
              <div class="text-h6 mb-3 d-flex align-center">
                <v-icon class="mr-2">mdi-link-variant</v-icon>
                依赖任务
              </div>
              <v-list density="compact">
                <v-list-item
                  v-for="dep in dependencies"
                  :key="dep.uuid"
                  @click="$emit('view-dependency', dep.uuid)"
                >
                  <template v-slot:prepend>
                    <v-chip :color="getStatusColor(dep.status)" size="small">
                      {{ getStatusText(dep.status) }}
                    </v-chip>
                  </template>
                  <v-list-item-title>{{ dep.title }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </div>

            <!-- 活动历史 -->
            <div v-if="showHistory" class="mb-6">
              <div class="text-h6 mb-3 d-flex align-center">
                <v-icon class="mr-2">mdi-history</v-icon>
                活动历史
              </div>
              <v-timeline side="end" density="compact">
                <v-timeline-item
                  v-for="(event, index) in taskHistory"
                  :key="index"
                  :dot-color="event.color"
                  size="small"
                >
                  <template v-slot:opposite>
                    <div class="text-caption">{{ formatDateTime(event.timestamp) }}</div>
                  </template>
                  <div>
                    <div class="font-weight-medium">{{ event.title }}</div>
                    <div v-if="event.description" class="text-caption text-grey">
                      {{ event.description }}
                    </div>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </div>

            <!-- 备注 -->
            <div v-if="task.notes" class="mb-6">
              <div class="text-h6 mb-3 d-flex align-center">
                <v-icon class="mr-2">mdi-note-text</v-icon>
                备注
              </div>
              <v-card variant="tonal">
                <v-card-text>{{ task.notes }}</v-card-text>
              </v-card>
            </div>
          </v-col>

          <!-- 右侧元信息 -->
          <v-col cols="12" md="4">
            <v-card variant="outlined">
              <v-card-text>
                <!-- 优先级 -->
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-flag</v-icon>
                    优先级
                  </div>
                  <v-chip
                    v-if="task.priority"
                    :color="getPriorityColor(task.priority)"
                    size="small"
                  >
                    <v-icon start size="small">{{ getPriorityIcon(task.priority) }}</v-icon>
                    {{ getPriorityText(task.priority) }}
                  </v-chip>
                  <span v-else class="text-grey">未设置</span>
                </div>

                <v-divider class="my-3" />

                <!-- 截止日期 -->
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
                    截止日期
                  </div>
                  <div v-if="task.dueDate" :class="{ 'text-error': isOverdue }">
                    {{ formatDate(task.dueDate) }}
                    <v-chip v-if="isOverdue" size="x-small" color="error" class="ml-1">
                      已逾期
                    </v-chip>
                  </div>
                  <span v-else class="text-grey">未设置</span>
                </div>

                <v-divider class="my-3" />

                <!-- 预估时长 -->
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                    预估时长
                  </div>
                  <div v-if="task.estimatedMinutes">
                    {{ formatDuration(task.estimatedMinutes) }}
                  </div>
                  <span v-else class="text-grey">未设置</span>
                </div>

                <v-divider class="my-3" />

                <!-- 标签 -->
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-tag-multiple</v-icon>
                    标签
                  </div>
                  <div v-if="task.tags && task.tags.length > 0" class="d-flex flex-wrap gap-1">
                    <v-chip
                      v-for="tag in task.tags"
                      :key="tag"
                      size="x-small"
                      variant="outlined"
                    >
                      {{ tag }}
                    </v-chip>
                  </div>
                  <span v-else class="text-grey">无标签</span>
                </div>

                <v-divider class="my-3" />

                <!-- 关联目标 -->
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1" color="primary">mdi-target</v-icon>
                    关联目标
                  </div>
                  <div v-if="task.goalUuid">
                    <v-btn
                      size="small"
                      variant="text"
                      color="primary"
                      @click="$emit('view-goal', task.goalUuid)"
                    >
                      查看目标
                    </v-btn>
                  </div>
                  <span v-else class="text-grey">未关联</span>
                </div>

                <v-divider class="my-3" />

                <!-- 创建时间 -->
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-clock-plus-outline</v-icon>
                    创建时间
                  </div>
                  <div class="text-caption">
                    {{ formatDateTime(task.createdAt) }}
                  </div>
                </div>

                <v-divider class="my-3" />

                <!-- 更新时间 -->
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-clock-edit-outline</v-icon>
                    更新时间
                  </div>
                  <div class="text-caption">
                    {{ formatDateTime(task.updatedAt) }}
                  </div>
                </div>

                <!-- 阻塞原因 -->
                <template v-if="task.status === 'BLOCKED'">
                  <v-divider class="my-3" />
                  <div class="info-item">
                    <div class="info-label">
                      <v-icon size="small" class="mr-1" color="warning">mdi-alert-circle</v-icon>
                      阻塞原因
                    </div>
                    <v-alert type="warning" variant="tonal" density="compact" class="mt-2">
                      {{ task.blockReason || '未填写阻塞原因' }}
                    </v-alert>
                  </div>
                </template>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <!-- 卡片操作 -->
      <v-card-actions class="pa-4">
        <v-btn
          v-if="task.status === 'PENDING'"
          color="primary"
          prepend-icon="mdi-play"
          @click="$emit('start')"
        >
          开始任务
        </v-btn>

        <v-btn
          v-if="task.status === 'IN_PROGRESS'"
          color="success"
          prepend-icon="mdi-check"
          @click="$emit('complete')"
        >
          完成任务
        </v-btn>

        <v-btn
          v-if="task.status === 'IN_PROGRESS'"
          color="warning"
          prepend-icon="mdi-pause"
          @click="$emit('block')"
        >
          阻塞任务
        </v-btn>

        <v-btn
          v-if="task.status === 'BLOCKED'"
          color="primary"
          prepend-icon="mdi-play"
          @click="$emit('unblock')"
        >
          解除阻塞
        </v-btn>

        <v-btn
          v-if="!['COMPLETED', 'CANCELED'].includes(task.status)"
          color="error"
          prepend-icon="mdi-close"
          @click="$emit('cancel')"
        >
          取消任务
        </v-btn>

        <v-spacer />

        <v-btn
          variant="outlined"
          prepend-icon="mdi-pencil"
          @click="$emit('edit')"
        >
          编辑
        </v-btn>

        <v-btn
          variant="outlined"
          color="error"
          prepend-icon="mdi-delete"
          @click="$emit('delete')"
        >
          删除
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- 加载状态 -->
    <v-card v-else-if="loading">
      <v-card-text class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="mt-4">加载任务详情...</p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TaskTemplateDTO } from '@dailyuse/contracts';

interface TaskHistory {
  timestamp: string;
  title: string;
  description?: string;
  color: string;
}

interface Props {
  modelValue: boolean;
  task?: TaskTemplateDTO | null;
  subtasks?: TaskTemplateDTO[];
  dependencies?: TaskTemplateDTO[];
  taskHistory?: TaskHistory[];
  loading?: boolean;
  showSubtasks?: boolean;
  showHistory?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  task: null,
  subtasks: () => [],
  dependencies: () => [],
  taskHistory: () => [],
  loading: false,
  showSubtasks: true,
  showHistory: true,
});

defineEmits<{
  'update:modelValue': [value: boolean];
  'start': [];
  'complete': [];
  'block': [];
  'unblock': [];
  'cancel': [];
  'edit': [];
  'delete': [];
  'add-subtask': [];
  'view-subtask': [uuid: string];
  'view-dependency': [uuid: string];
  'view-goal': [uuid: string];
  'toggle-subtask': [uuid: string, completed: boolean];
}>();

// 计算属性
const statusColor = computed(() => {
  if (!props.task) return 'grey';
  const colors: Record<string, string> = {
    PENDING: 'grey',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    BLOCKED: 'warning',
    CANCELED: 'error',
  };
  return colors[props.task.status] || 'grey';
});

const statusText = computed(() => {
  if (!props.task) return '';
  const texts: Record<string, string> = {
    PENDING: '待执行',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    BLOCKED: '被阻塞',
    CANCELED: '已取消',
  };
  return texts[props.task.status] || props.task.status;
});

const isOverdue = computed(() => {
  if (!props.task?.dueDate || props.task.status === 'COMPLETED') return false;
  return new Date(props.task.dueDate) < new Date();
});

const completedSubtasksCount = computed(() => {
  return props.subtasks.filter(st => st.status === 'COMPLETED').length;
});

const subtaskProgress = computed(() => {
  if (props.subtasks.length === 0) return 0;
  return (completedSubtasksCount.value / props.subtasks.length) * 100;
});

// 方法
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'grey',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    BLOCKED: 'warning',
    CANCELED: 'error',
  };
  return colors[status] || 'grey';
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    PENDING: '待执行',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    BLOCKED: '被阻塞',
    CANCELED: '已取消',
  };
  return texts[status] || status;
}

function getPriorityColor(priority: number): string {
  if (priority >= 4) return 'error';
  if (priority === 3) return 'warning';
  if (priority === 2) return 'info';
  return 'grey';
}

function getPriorityIcon(priority: number): string {
  if (priority >= 4) return 'mdi-chevron-double-up';
  if (priority === 3) return 'mdi-chevron-up';
  if (priority === 2) return 'mdi-minus';
  return 'mdi-chevron-down';
}

function getPriorityText(priority: number): string {
  if (priority >= 4) return '高优先级';
  if (priority === 3) return '中优先级';
  if (priority === 2) return '普通';
  return '低优先级';
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours} 小时 ${remainingMinutes} 分钟` : `${hours} 小时`;
}

function toggleSubtask(uuid: string, completed: boolean) {
  // 这里可以添加子任务状态切换的逻辑
  console.log('Toggle subtask', uuid, completed);
}
</script>

<style scoped lang="scss">
.description-text {
  white-space: pre-wrap;
  line-height: 1.8;
}

.info-item {
  .info-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgb(var(--v-theme-on-surface-variant));
    margin-bottom: 8px;
    display: flex;
    align-items: center;
  }
}

.completed-subtask {
  opacity: 0.6;
}
</style>
