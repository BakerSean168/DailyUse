<template>
  <v-card class="task-summary-card" elevation="2">
    <!-- 卡片头部 -->
    <v-card-title class="task-header pa-4">
      <div class="d-flex align-center justify-space-between w-100">
        <div class="d-flex align-center">
          <v-icon color="primary" size="24" class="mr-3">mdi-checkbox-marked-circle-outline</v-icon>
          <div>
            <h3 class="text-h6 font-weight-bold mb-0">今日任务</h3>
            <span class="text-caption text-medium-emphasis">
              {{ todayTasks.length }} 个待办任务
            </span>
          </div>
        </div>

        <!-- 进度指示器 -->
        <v-progress-circular :model-value="completionPercentage" size="40" width="4" color="primary">
          <span class="text-caption font-weight-bold">{{ completionPercentage }}%</span>
        </v-progress-circular>
      </div>
    </v-card-title>

    <v-divider />

    <!-- 任务列表内容 -->
    <v-card-text class="task-content pa-0">
      <!-- 有任务时显示 -->
      <v-list v-if="todayTasks.length > 0" class="py-0">
        <v-list-item v-for="(task, index) in todayTasks" :key="task.uuid"
          :class="{ 'task-completed': task.status === 'completed' }" class="task-item pa-4"
          :style="{ '--task-index': index }">
          <template v-slot:prepend>
            <v-checkbox :model-value="task.status === 'completed'" @update:model-value="toggleTaskComplete(task)"
              hide-details color="primary" class="task-checkbox" />
          </template>

          <div class="task-content-wrapper flex-grow-1">
            <v-list-item-title
              :class="{ 'text-decoration-line-through text-medium-emphasis': task.status === 'completed' }"
              class="task-title font-weight-medium mb-1">
              {{ task.title }}
            </v-list-item-title>

            <div class="d-flex align-center">
              <v-icon size="14" color="medium-emphasis" class="mr-1">mdi-clock-outline</v-icon>
              <v-list-item-subtitle class="text-caption">
                任务实践信息
              </v-list-item-subtitle>
            </div>
          </div>

          <template v-slot:append>
            <!-- 关键结果链接 -->
            <div v-if="task.keyResultLinks && task.keyResultLinks.length > 0" class="key-results-container">
              <v-chip v-for="link in task.keyResultLinks" :key="link.keyResultId" size="small" variant="tonal"
                color="primary" class="mr-1 mb-1 result-chip">
                <v-icon start size="12">mdi-target</v-icon>
                {{ getKeyResultName(link) }}
                <v-chip size="x-small" color="success" variant="flat" class="ml-1 increment-chip">
                  +{{ link.incrementValue }}
                </v-chip>
              </v-chip>
            </div>

            <!-- 无关联提示 -->
            <div v-else class="no-links-container">
              <v-chip size="small" variant="outlined" color="surface-variant" class="no-links-chip">
                <v-icon start size="12">mdi-link-off</v-icon>
                无关联
              </v-chip>
            </div>
          </template>
        </v-list-item>
      </v-list>

      <!-- 空状态 -->
      <div v-else class="empty-state pa-8">
        <v-empty-state icon="mdi-check-circle" title="今日任务已完成" text="恭喜！您已完成今天的所有任务">
          <template v-slot:media>
            <v-icon color="success" size="64" class="empty-icon">
              mdi-check-circle
            </v-icon>
          </template>

          <template v-slot:actions>
            <v-btn color="primary" variant="outlined" prepend-icon="mdi-plus" size="small" @click="navigateToTaskManagement">
              添加新任务
            </v-btn>
          </template>
        </v-empty-state>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import { useGoalStore } from '@/modules/Goal/presentation/stores/goalStore';
import type { KeyResultLink } from '@/modules/Task/domain/types/task';
import { useRouter } from 'vue-router';
import type { TaskInstance } from '@/modules/Task/domain/aggregates/taskInstance';
const router = useRouter();
const taskStore = useTaskStore();
const goalStore = useGoalStore();

const navigateToTaskManagement = () => {
  router.push('/task-management');
};

// ✅ 获取今日任务列表 - 使用新的状态字段
const todayTasks = computed(() => {
  let tasks = taskStore.getTodayTaskInstances.filter(task =>
    task.status === 'pending' || task.status === 'inProgress'
  );
  return tasks;
});

// ✅ 计算完成百分比 - 使用新的状态字段
const completionPercentage = computed(() => {
  const allTasks = taskStore.getTodayTaskInstances;
  const completedTasks = allTasks.filter(task => task.status === 'completed');
  return allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;
});

// ✅ 切换任务完成状态
const toggleTaskComplete = async (task: TaskInstance) => {
  console.log('切换任务状态:', task.uuid);
};

// 获取关键结果名称的方法
const getKeyResultName = (link: KeyResultLink) => {
  const goal = goalStore.getGoalById(link.goalUuid);
  const kr = goal?.keyResults.find(kr => kr.uuid === link.keyResultId);
  return kr?.name || '未知关键结果';
};
</script>



<style scoped>
.task-summary-card {
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  min-height: 200px;
  max-height: 500px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.task-summary-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.task-header {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-primary), 0.02) 100%);
  border-radius: 16px 16px 0 0;
}

.task-content {
  overflow-y: auto;
  max-height: 400px;
}

.task-item {
  transition: all 0.3s ease;
  border-radius: 8px;
  margin: 4px 8px;
  animation: slideInUp 0.4s ease calc(var(--task-index) * 0.1s) both;
}

.task-item:hover {
  background: rgba(var(--v-theme-primary), 0.04);
  transform: translateX(4px);
}

.task-completed {
  opacity: 0.6;
  background: rgba(var(--v-theme-success), 0.08);
}

.task-completed:hover {
  background: rgba(var(--v-theme-success), 0.12);
}

.task-checkbox {
  margin-right: 12px;
}

.task-title {
  transition: all 0.3s ease;
}

.key-results-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  max-width: 200px;
}

.result-chip {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.result-chip:hover {
  transform: scale(1.05);
}

.increment-chip {
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.7rem;
}

.no-links-container {
  opacity: 0.7;
}

.no-links-chip {
  border-radius: 8px;
}

.empty-state {
  text-align: center;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  animation: bounce 2s infinite;
}

/* 滚动条美化 */
.task-content::-webkit-scrollbar {
  width: 4px;
}

.task-content::-webkit-scrollbar-track {
  background: transparent;
}

.task-content::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.3);
  border-radius: 2px;
}

.task-content::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.5);
}

/* 动画 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {

  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-8px);
  }

  60% {
    transform: translateY(-4px);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .key-results-container {
    max-width: 150px;
  }

  .task-item {
    padding: 12px 16px !important;
  }

  .result-chip {
    font-size: 0.7rem;
  }
}
</style>