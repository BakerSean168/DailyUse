<template>
  <v-card
    :class="[
      'task-card',
      `status-${task.status.toLowerCase()}`,
      { 'overdue': isOverdue, 'high-priority': isHighPriority }
    ]"
    :elevation="hover ? 8 : 2"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <!-- 卡片头部 -->
    <v-card-title class="d-flex align-center pb-2">
      <v-checkbox
        v-if="selectable"
        :model-value="selected"
        @update:model-value="$emit('toggle-select', task.uuid)"
        hide-details
        density="compact"
        class="mr-2"
      />
      
      <div class="flex-grow-1">
        <div class="d-flex align-center">
          <v-chip
            :color="statusColor"
            size="small"
            class="mr-2"
            variant="flat"
          >
            {{ statusText }}
          </v-chip>
          
          <v-chip
            v-if="task.priority"
            :color="priorityColor"
            size="small"
            variant="outlined"
            class="mr-2"
          >
            <v-icon start size="small">{{ priorityIcon }}</v-icon>
            {{ priorityText }}
          </v-chip>
          
          <v-chip
            v-if="isOverdue"
            color="error"
            size="small"
            variant="tonal"
          >
            <v-icon start size="small">mdi-alert</v-icon>
            逾期
          </v-chip>
        </div>
      </div>

      <v-btn
        icon
        variant="text"
        size="small"
        @click="$emit('toggle-detail')"
      >
        <v-icon>{{ detailExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </v-btn>
    </v-card-title>

    <!-- 卡片内容 -->
    <v-card-text>
      <!-- 任务标题 -->
      <div class="task-title mb-2" :class="{ 'completed': isCompleted }">
        {{ task.title }}
      </div>

      <!-- 任务描述 -->
      <div v-if="task.description" class="task-description mb-3">
        {{ truncatedDescription }}
        <a
          v-if="task.description.length > 100"
          href="#"
          @click.prevent="$emit('toggle-detail')"
          class="text-primary"
        >
          {{ detailExpanded ? '收起' : '查看更多' }}
        </a>
      </div>

      <!-- 任务元信息 -->
      <div class="task-meta">
        <!-- 截止日期 -->
        <div v-if="task.dueDate" class="meta-item">
          <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
          <span :class="{ 'text-error': isOverdue }">
            {{ dueDateText }}
          </span>
        </div>

        <!-- 预估时长 -->
        <div v-if="task.estimatedMinutes" class="meta-item">
          <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
          <span>{{ estimatedTimeText }}</span>
        </div>

        <!-- 标签 -->
        <div v-if="task.tags && task.tags.length > 0" class="meta-item">
          <v-icon size="small" class="mr-1">mdi-tag-multiple</v-icon>
          <v-chip
            v-for="tag in task.tags.slice(0, 3)"
            :key="tag"
            size="x-small"
            class="mr-1"
            variant="outlined"
          >
            {{ tag }}
          </v-chip>
          <span v-if="task.tags.length > 3" class="text-caption">
            +{{ task.tags.length - 3 }}
          </span>
        </div>

        <!-- 目标关联 -->
        <div v-if="task.goalUuid" class="meta-item">
          <v-icon size="small" class="mr-1" color="primary">mdi-target</v-icon>
          <span class="text-primary">已关联目标</span>
        </div>

        <!-- 子任务数量 -->
        <div v-if="task.subtaskCount && task.subtaskCount > 0" class="meta-item">
          <v-icon size="small" class="mr-1">mdi-format-list-checks</v-icon>
          <span>{{ task.subtaskCount }} 个子任务</span>
        </div>
      </div>
    </v-card-text>

    <!-- 卡片操作 -->
    <v-card-actions class="pt-0">
      <v-spacer />
      
      <!-- 根据状态显示不同操作 -->
      <template v-if="task.status === 'PENDING'">
        <v-btn
          color="primary"
          variant="text"
          @click="$emit('start')"
          :disabled="!canStart"
        >
          <v-icon start>mdi-play</v-icon>
          开始
        </v-btn>
      </template>

      <template v-if="task.status === 'IN_PROGRESS'">
        <v-btn
          color="success"
          variant="text"
          @click="$emit('complete')"
          :disabled="!canComplete"
        >
          <v-icon start>mdi-check</v-icon>
          完成
        </v-btn>
        <v-btn
          color="warning"
          variant="text"
          @click="$emit('block')"
        >
          <v-icon start>mdi-pause</v-icon>
          阻塞
        </v-btn>
      </template>

      <template v-if="task.status === 'BLOCKED'">
        <v-btn
          color="primary"
          variant="text"
          @click="$emit('unblock')"
        >
          <v-icon start>mdi-play</v-icon>
          解除阻塞
        </v-btn>
      </template>

      <template v-if="!isCompleted && !isCanceled">
        <v-btn
          color="error"
          variant="text"
          @click="$emit('cancel')"
          :disabled="!canCancel"
        >
          <v-icon start>mdi-close</v-icon>
          取消
        </v-btn>
      </template>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="text"
            v-bind="props"
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="$emit('edit')">
            <template v-slot:prepend>
              <v-icon>mdi-pencil</v-icon>
            </template>
            <v-list-item-title>编辑</v-list-item-title>
          </v-list-item>
          <v-list-item @click="$emit('view-detail')">
            <template v-slot:prepend>
              <v-icon>mdi-eye</v-icon>
            </template>
            <v-list-item-title>查看详情</v-list-item-title>
          </v-list-item>
          <v-list-item @click="$emit('add-subtask')">
            <template v-slot:prepend>
              <v-icon>mdi-plus</v-icon>
            </template>
            <v-list-item-title>添加子任务</v-list-item-title>
          </v-list-item>
          <v-list-item @click="$emit('link-goal')">
            <template v-slot:prepend>
              <v-icon>mdi-target</v-icon>
            </template>
            <v-list-item-title>关联目标</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item @click="$emit('delete')" class="text-error">
            <template v-slot:prepend>
              <v-icon color="error">mdi-delete</v-icon>
            </template>
            <v-list-item-title>删除</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { TaskTemplateDTO } from '@dailyuse/contracts';

interface Props {
  task: TaskTemplateDTO;
  selectable?: boolean;
  selected?: boolean;
  detailExpanded?: boolean;
  canStart?: boolean;
  canComplete?: boolean;
  canCancel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectable: false,
  selected: false,
  detailExpanded: false,
  canStart: true,
  canComplete: true,
  canCancel: true,
});

defineEmits<{
  'toggle-select': [uuid: string];
  'toggle-detail': [];
  'start': [];
  'complete': [];
  'block': [];
  'unblock': [];
  'cancel': [];
  'edit': [];
  'view-detail': [];
  'add-subtask': [];
  'link-goal': [];
  'delete': [];
}>();

const hover = ref(false);

// 状态相关计算属性
const isCompleted = computed(() => props.task.status === 'COMPLETED');
const isCanceled = computed(() => props.task.status === 'CANCELED');
const isOverdue = computed(() => {
  if (!props.task.dueDate || isCompleted.value) return false;
  return new Date(props.task.dueDate) < new Date();
});
const isHighPriority = computed(() => props.task.priority && props.task.priority >= 4);

// 状态颜色和文本
const statusColor = computed(() => {
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
  const texts: Record<string, string> = {
    PENDING: '待执行',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    BLOCKED: '被阻塞',
    CANCELED: '已取消',
  };
  return texts[props.task.status] || props.task.status;
});

// 优先级相关
const priorityColor = computed(() => {
  const priority = props.task.priority || 0;
  if (priority >= 4) return 'error';
  if (priority === 3) return 'warning';
  if (priority === 2) return 'info';
  return 'grey';
});

const priorityIcon = computed(() => {
  const priority = props.task.priority || 0;
  if (priority >= 4) return 'mdi-chevron-double-up';
  if (priority === 3) return 'mdi-chevron-up';
  if (priority === 2) return 'mdi-minus';
  return 'mdi-chevron-down';
});

const priorityText = computed(() => {
  const priority = props.task.priority || 0;
  if (priority >= 4) return '高优先级';
  if (priority === 3) return '中优先级';
  if (priority === 2) return '普通';
  return '低优先级';
});

// 截止日期文本
const dueDateText = computed(() => {
  if (!props.task.dueDate) return '';
  
  const dueDate = new Date(props.task.dueDate);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `逾期 ${Math.abs(diffDays)} 天`;
  } else if (diffDays === 0) {
    return '今天到期';
  } else if (diffDays === 1) {
    return '明天到期';
  } else if (diffDays <= 7) {
    return `${diffDays} 天后到期`;
  } else {
    return dueDate.toLocaleDateString('zh-CN');
  }
});

// 预估时长文本
const estimatedTimeText = computed(() => {
  const minutes = props.task.estimatedMinutes || 0;
  if (minutes < 60) {
    return `${minutes} 分钟`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours} 小时 ${remainingMinutes} 分钟` : `${hours} 小时`;
  }
});

// 截断描述
const truncatedDescription = computed(() => {
  const desc = props.task.description || '';
  if (props.detailExpanded || desc.length <= 100) {
    return desc;
  }
  return desc.substring(0, 100) + '...';
});
</script>

<style scoped lang="scss">
.task-card {
  transition: all 0.3s ease;
  margin-bottom: 12px;

  &.status-completed {
    opacity: 0.7;
  }

  &.status-canceled {
    opacity: 0.5;
  }

  &.overdue {
    border-left: 4px solid rgb(var(--v-theme-error));
  }

  &.high-priority {
    border-left: 4px solid rgb(var(--v-theme-error));
  }
}

.task-title {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;

  &.completed {
    text-decoration: line-through;
    opacity: 0.6;
  }
}

.task-description {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.6;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.text-error {
  color: rgb(var(--v-theme-error));
}
</style>
