<template>
  <v-list-item
    :key="task.uuid"
    class="task-item"
    :class="{ 'border-bottom': showBorder, 'completed-task': isCompleted }"
  >
    <template v-slot:prepend>
      <!-- 未完成任务：显示完成按钮 -->
      <v-btn
        v-if="!isCompleted"
        icon
        variant="text"
        color="success"
        @click="$emit('complete', task.uuid)"
        class="complete-btn"
      >
        <v-icon>mdi-circle-outline</v-icon>
      </v-btn>
      <!-- 已完成任务：显示完成图标 -->
      <v-icon v-else color="success" class="complete-icon"> mdi-check-circle </v-icon>
    </template>

    <div class="task-content-wrapper">
      <v-list-item-title :class="['task-title', { completed: isCompleted }]">
        {{ task.title }}
      </v-list-item-title>

      <v-list-item-subtitle class="task-meta">
        <v-icon size="small" class="mr-1">{{
          isCompleted ? 'mdi-check' : 'mdi-clock-outline'
        }}</v-icon>
        <span v-if="!isCompleted">{{ getTaskInstanceTimeText(task) }}</span>
        <span v-else>完成于 {{ formatCompletionTime }}</span>
      </v-list-item-subtitle>

      <!-- 关键结果链接 -->
      <div v-if="task.goalLinks?.length" class="key-results mt-2">
        <v-chip
          v-for="link in task.goalLinks"
          :key="link.keyResultId"
          size="small"
          color="primary"
          variant="outlined"
          class="mr-1 mb-1"
        >
          <v-icon start size="small">mdi-target</v-icon>
          {{ getKeyResultName(link) }} (+{{ link.incrementValue }})
        </v-chip>
      </div>
    </div>

    <template v-slot:append>
      <!-- 已完成任务：显示撤销按钮 -->
      <v-btn
        v-if="isCompleted"
        icon
        variant="text"
        size="small"
        @click="$emit('undo', task.uuid)"
        class="undo-btn"
      >
        <v-icon>mdi-undo</v-icon>
      </v-btn>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { format } from 'date-fns';
import { TaskInstance } from '@dailyuse/domain-client';
import type { TaskContracts } from '@dailyuse/contracts';
import { GoalClient, KeyResultClient } from '@dailyuse/domain-client';
// composables
import { useTaskUtils } from '../../composables/useTaskUtils';

type KeyResultLink = TaskContracts.KeyResultLink;

const { getTaskInstanceTimeText } = useTaskUtils();
// Props
interface Props {
  task: TaskInstance;
  showBorder?: boolean;
  goalStore?: any; // 可以通过 props 传入 goalStore，或者使用全局 store
}

const props = withDefaults(defineProps<Props>(), {
  showBorder: true,
});

// Emits
const emit = defineEmits<{
  complete: [uuid: string];
  undo: [uuid: string];
}>();

// Computed
const isCompleted = computed(() => props.task.execution.status === 'completed');

const formatCompletionTime = computed(() => {
  return format(props.task.execution.actualEndTime || new Date(), 'yyyy-MM-dd HH:mm:ss');
});

// 这里需要 goalStore 来获取关键结果名称
// 如果没有传入 goalStore，可以通过 composable 或全局 store 获取
const getKeyResultName = (link: KeyResultLink) => {
  if (!props.goalStore) return '';

  const goal: Goal = props.goalStore.getGoalByUuid(link.goalUuid);
  const kr: KeyResult | undefined = goal?.keyResults.find((kr) => kr.uuid === link.keyResultId);
  return kr?.name || '';
};
</script>

<style scoped>
.task-item {
  padding: 1.25rem 1.5rem;
  transition: all 0.2s ease;
  min-height: 80px;
}

.task-item:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.task-item.border-bottom {
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.08);
}

.task-content-wrapper {
  flex: 1;
  min-width: 0;
}

.complete-btn,
.undo-btn {
  transition: all 0.2s ease;
}

.complete-btn:hover {
  background: rgba(var(--v-theme-success), 0.1);
  transform: scale(1.1);
}

.task-title {
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.4;
}

.task-title.completed {
  text-decoration: line-through;
  opacity: 0.7;
}

.task-meta {
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.completed-task {
  opacity: 0.8;
}

.complete-icon {
  margin-left: 8px;
}

/* 关键结果链接 */
.key-results {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
}
</style>
