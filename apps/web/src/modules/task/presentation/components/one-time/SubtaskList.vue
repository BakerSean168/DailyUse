<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-checks</v-icon>
        <span>子任务</span>
        <v-chip size="small" class="ml-2">
          {{ completedCount }} / {{ subtasks.length }}
        </v-chip>
      </div>

      <v-btn
        color="primary"
        size="small"
        prepend-icon="mdi-plus"
        @click="$emit('add-subtask')"
        :disabled="disabled"
      >
        添加子任务
      </v-btn>
    </v-card-title>

    <v-divider />

    <!-- 进度条 -->
    <v-card-text v-if="subtasks.length > 0" class="pb-0">
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="text-caption">完成进度</span>
        <span class="text-caption font-weight-bold">{{ progressPercentage }}%</span>
      </div>
      <v-progress-linear
        :model-value="progressPercentage"
        :color="progressColor"
        height="8"
        rounded
      />
    </v-card-text>

    <!-- 子任务列表 -->
    <v-card-text class="pa-0">
      <!-- 空状态 -->
      <v-empty-state
        v-if="subtasks.length === 0"
        title="暂无子任务"
        text="将大任务拆分成小任务，逐步完成"
        icon="mdi-clipboard-check-outline"
        class="my-8"
      >
        <template v-slot:actions>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="$emit('add-subtask')"
            :disabled="disabled"
          >
            创建第一个子任务
          </v-btn>
        </template>
      </v-empty-state>

      <!-- 子任务列表 -->
      <v-list v-else density="comfortable">
        <template v-for="(subtask, index) in sortedSubtasks" :key="subtask.uuid">
          <v-list-item
            :class="{
              'subtask-item': true,
              'completed-subtask': subtask.status === 'COMPLETED',
              'overdue-subtask': isSubtaskOverdue(subtask),
            }"
          >
            <!-- 复选框 -->
            <template v-slot:prepend>
              <v-checkbox
                :model-value="subtask.status === 'COMPLETED'"
                @update:model-value="handleToggle(subtask.uuid, $event)"
                hide-details
                density="compact"
                :disabled="disabled || !canToggle(subtask)"
                color="success"
              />
            </template>

            <!-- 子任务内容 -->
            <div class="subtask-content">
              <v-list-item-title
                :class="{
                  'text-decoration-line-through': subtask.status === 'COMPLETED',
                  'font-weight-medium': true,
                }"
              >
                {{ subtask.title }}
              </v-list-item-title>

              <v-list-item-subtitle class="mt-1">
                <div class="d-flex align-center flex-wrap gap-2">
                  <!-- 状态 -->
                  <v-chip
                    :color="getStatusColor(subtask.status)"
                    size="x-small"
                    variant="flat"
                  >
                    {{ getStatusText(subtask.status) }}
                  </v-chip>

                  <!-- 优先级 -->
                  <v-chip
                    v-if="subtask.priority && subtask.priority >= 4"
                    color="error"
                    size="x-small"
                    variant="outlined"
                  >
                    <v-icon start size="x-small">mdi-fire</v-icon>
                    高优先级
                  </v-chip>

                  <!-- 截止日期 -->
                  <span v-if="subtask.dueDate" class="text-caption">
                    <v-icon size="x-small" class="mr-1">mdi-calendar</v-icon>
                    <span :class="{ 'text-error': isSubtaskOverdue(subtask) }">
                      {{ formatDueDate(subtask.dueDate) }}
                    </span>
                  </span>

                  <!-- 预估时长 -->
                  <span v-if="subtask.estimatedMinutes" class="text-caption">
                    <v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>
                    {{ subtask.estimatedMinutes }} 分钟
                  </span>
                </div>
              </v-list-item-subtitle>
            </div>

            <!-- 操作按钮 -->
            <template v-slot:append>
              <div class="d-flex align-center gap-1">
                <v-btn
                  v-if="subtask.status === 'PENDING'"
                  icon="mdi-play"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="$emit('start-subtask', subtask.uuid)"
                  :disabled="disabled"
                />

                <v-btn
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  @click="$emit('view-subtask', subtask.uuid)"
                />

                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn
                      icon="mdi-dots-vertical"
                      size="small"
                      variant="text"
                      v-bind="props"
                      :disabled="disabled"
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="$emit('edit-subtask', subtask)">
                      <template v-slot:prepend>
                        <v-icon>mdi-pencil</v-icon>
                      </template>
                      <v-list-item-title>编辑</v-list-item-title>
                    </v-list-item>

                    <v-list-item
                      v-if="index > 0"
                      @click="$emit('move-up', subtask.uuid)"
                    >
                      <template v-slot:prepend>
                        <v-icon>mdi-arrow-up</v-icon>
                      </template>
                      <v-list-item-title>上移</v-list-item-title>
                    </v-list-item>

                    <v-list-item
                      v-if="index < subtasks.length - 1"
                      @click="$emit('move-down', subtask.uuid)"
                    >
                      <template v-slot:prepend>
                        <v-icon>mdi-arrow-down</v-icon>
                      </template>
                      <v-list-item-title>下移</v-list-item-title>
                    </v-list-item>

                    <v-divider />

                    <v-list-item
                      @click="$emit('delete-subtask', subtask.uuid)"
                      class="text-error"
                    >
                      <template v-slot:prepend>
                        <v-icon color="error">mdi-delete</v-icon>
                      </template>
                      <v-list-item-title>删除</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-list-item>

          <v-divider v-if="index < subtasks.length - 1" />
        </template>
      </v-list>
    </v-card-text>

    <!-- 统计信息 -->
    <v-card-text v-if="subtasks.length > 0" class="pt-0">
      <v-divider class="mb-3" />
      <div class="d-flex justify-space-between text-caption">
        <div>
          <v-icon size="small" color="success" class="mr-1">mdi-check-circle</v-icon>
          已完成: {{ completedCount }}
        </div>
        <div>
          <v-icon size="small" color="primary" class="mr-1">mdi-progress-clock</v-icon>
          进行中: {{ inProgressCount }}
        </div>
        <div>
          <v-icon size="small" color="grey" class="mr-1">mdi-circle-outline</v-icon>
          待执行: {{ pendingCount }}
        </div>
        <div v-if="blockedCount > 0">
          <v-icon size="small" color="warning" class="mr-1">mdi-pause-circle</v-icon>
          被阻塞: {{ blockedCount }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TaskTemplateDTO } from '@dailyuse/contracts';

interface Props {
  subtasks: TaskTemplateDTO[];
  disabled?: boolean;
  sortBy?: 'order' | 'priority' | 'dueDate' | 'status';
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  sortBy: 'order',
});

defineEmits<{
  'add-subtask': [];
  'view-subtask': [uuid: string];
  'edit-subtask': [subtask: TaskTemplateDTO];
  'delete-subtask': [uuid: string];
  'start-subtask': [uuid: string];
  'toggle-subtask': [uuid: string, completed: boolean];
  'move-up': [uuid: string];
  'move-down': [uuid: string];
}>();

// 计算属性
const completedCount = computed(() => {
  return props.subtasks.filter(st => st.status === 'COMPLETED').length;
});

const inProgressCount = computed(() => {
  return props.subtasks.filter(st => st.status === 'IN_PROGRESS').length;
});

const pendingCount = computed(() => {
  return props.subtasks.filter(st => st.status === 'PENDING').length;
});

const blockedCount = computed(() => {
  return props.subtasks.filter(st => st.status === 'BLOCKED').length;
});

const progressPercentage = computed(() => {
  if (props.subtasks.length === 0) return 0;
  return Math.round((completedCount.value / props.subtasks.length) * 100);
});

const progressColor = computed(() => {
  const percentage = progressPercentage.value;
  if (percentage >= 80) return 'success';
  if (percentage >= 50) return 'primary';
  if (percentage >= 30) return 'warning';
  return 'grey';
});

const sortedSubtasks = computed(() => {
  const tasks = [...props.subtasks];
  
  switch (props.sortBy) {
    case 'priority':
      return tasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    case 'dueDate':
      return tasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    
    case 'status':
      const statusOrder = { PENDING: 0, IN_PROGRESS: 1, BLOCKED: 2, COMPLETED: 3, CANCELED: 4 };
      return tasks.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    
    case 'order':
    default:
      return tasks; // 保持原始顺序
  }
});

// 方法
function isSubtaskOverdue(subtask: TaskTemplateDTO): boolean {
  if (!subtask.dueDate || subtask.status === 'COMPLETED') return false;
  return new Date(subtask.dueDate) < new Date();
}

function canToggle(subtask: TaskTemplateDTO): boolean {
  // 只有 PENDING 和 IN_PROGRESS 可以切换到 COMPLETED
  // 只有 COMPLETED 可以切换回 PENDING
  return ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(subtask.status);
}

function handleToggle(uuid: string, completed: boolean) {
  emit('toggle-subtask', uuid, completed);
}

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

function formatDueDate(date: string): string {
  const dueDate = new Date(date);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `逾期 ${Math.abs(diffDays)} 天`;
  } else if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '明天';
  } else if (diffDays <= 7) {
    return `${diffDays} 天后`;
  } else {
    return dueDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  }
}

const emit = defineEmits<{
  'add-subtask': [];
  'view-subtask': [uuid: string];
  'edit-subtask': [subtask: TaskTemplateDTO];
  'delete-subtask': [uuid: string];
  'start-subtask': [uuid: string];
  'toggle-subtask': [uuid: string, completed: boolean];
  'move-up': [uuid: string];
  'move-down': [uuid: string];
}>();
</script>

<style scoped lang="scss">
.subtask-item {
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.04);
  }

  &.completed-subtask {
    opacity: 0.7;
  }

  &.overdue-subtask {
    border-left: 3px solid rgb(var(--v-theme-error));
  }
}

.subtask-content {
  flex: 1;
  min-width: 0; // 防止文本溢出
}
</style>
