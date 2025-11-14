<template>
  <v-container fluid class="pa-0 h-100">
    <!-- 页面头部 -->
    <v-card class="schedule-header flex-shrink-0" elevation="1" rounded="0">
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-avatar size="48" color="primary" variant="tonal" class="mr-4">
              <v-icon size="24">mdi-calendar-clock</v-icon>
            </v-avatar>
            <div>
              <h1 class="text-h4 font-weight-bold text-primary mb-1">调度控制台</h1>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">管理和监控您的自动化任务调度</p>
            </div>
          </div>

          <div class="d-flex gap-2">
            <v-btn
              color="info"
              variant="tonal"
              prepend-icon="mdi-refresh"
              @click="handleRefresh"
              :loading="isLoading || isLoadingStats"
            >
              刷新数据
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 主体内容 -->
    <div class="main-content flex-grow-1 pa-6 overflow-hidden">
      <div class="content-wrapper h-100">
        <!-- 错误提示 -->
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable>
          {{ error }}
        </v-alert>

        <v-row class="h-100">
          <!-- 左侧：任务队列 -->
          <v-col cols="12" lg="8" class="d-flex flex-column gap-4">
            <!-- 提醒模块任务 -->
            <reminder-tasks-card
              :tasks="reminderTasks"
              :is-loading="isLoading"
              :error="error"
              @pause-task="handlePauseTask"
              @resume-task="handleResumeTask"
              @delete-task="handleDeleteTask"
              @view-detail="handleViewDetail"
            />

            <!-- 任务模块任务 -->
            <task-module-tasks-card
              :tasks="taskModuleTasks"
              :is-loading="isLoading"
              :error="error"
              @pause-task="handlePauseTask"
              @resume-task="handleResumeTask"
              @delete-task="handleDeleteTask"
              @view-detail="handleViewDetail"
            />

            <!-- 目标模块任务 -->
            <goal-tasks-card
              :tasks="goalTasks"
              :is-loading="isLoading"
              :error="error"
              @pause-task="handlePauseTask"
              @resume-task="handleResumeTask"
              @delete-task="handleDeleteTask"
              @view-detail="handleViewDetail"
            />
          </v-col>

          <!-- 右侧：统计信息 -->
          <v-col cols="12" lg="4">
            <statistics-card
              :statistics="statistics"
              :module-statistics="moduleStatistics"
              :is-loading="isLoadingStats"
              :error="error"
              @refresh="handleRefresh"
            />
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- 确认对话框 -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title class="text-h6">{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog.show = false">取消</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="confirmDialog.onConfirm"
            :loading="confirmDialog.loading"
          >
            确认
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 任务详情对话框 -->
    <schedule-task-detail-dialog
      v-model:show="detailDialog.show"
      :task-uuid="detailDialog.taskUuid"
    />

    <!-- Snackbar 通知 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">关闭</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { ScheduleContracts } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

// 组件
import ReminderTasksCard from '../components/cards/ReminderTasksCard.vue';
import TaskModuleTasksCard from '../components/cards/TaskModuleTasksCard.vue';
import GoalTasksCard from '../components/cards/GoalTasksCard.vue';
import StatisticsCard from '../components/cards/StatisticsCard.vue';
import ScheduleTaskDetailDialog from '../components/ScheduleTaskDetailDialog.vue';

// Composables
import { useSchedule } from '../composables/useSchedule';

const logger = createLogger('ScheduleDashboardView');

// ===== 使用 composable =====
const {
  tasks,
  statistics,
  moduleStatistics,
  isLoading,
  isLoadingStats,
  error,
  fetchTasks,
  fetchStatistics,
  fetchAllModuleStatistics,
  pauseTask,
  resumeTask,
  deleteTask,
  initialize,
  clearError,
} = useSchedule();

// ===== 本地状态 =====
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
});

const confirmDialog = reactive({
  show: false,
  title: '',
  message: '',
  onConfirm: () => {},
  loading: false,
});

const detailDialog = reactive({
  show: false,
  taskUuid: null as string | null,
});

// ===== 计算属性 - 按模块分组任务 =====
const reminderTasks = computed(() => {
  return tasks.value.filter((task) => task.sourceModule === 'reminder');
});

const taskModuleTasks = computed(() => {
  return tasks.value.filter((task) => task.sourceModule === 'task');
});

const goalTasks = computed(() => {
  return tasks.value.filter((task) => task.sourceModule === 'goal');
});

// ===== 方法 =====

/**
 * 刷新所有数据
 */
async function handleRefresh() {
  try {
    logger.info('Refreshing schedule dashboard data');
    clearError();
    await Promise.all([fetchTasks(), fetchStatistics(), fetchAllModuleStatistics()]);
    showSnackbar('数据已刷新', 'success');
    logger.info('Schedule dashboard data refreshed successfully');
  } catch (err) {
    logger.error('Failed to refresh schedule dashboard data', { error: err });
    showSnackbar('刷新失败，请重试', 'error');
  }
}

/**
 * 暂停任务
 */
async function handlePauseTask(taskUuid: string) {
  confirmDialog.show = true;
  confirmDialog.title = '暂停任务';
  confirmDialog.message = '确定要暂停这个任务吗？';
  confirmDialog.onConfirm = async () => {
    confirmDialog.loading = true;
    try {
      logger.info('Pausing task', { taskUuid });
      await pauseTask(taskUuid);
      showSnackbar('任务已暂停', 'success');
      logger.info('Task paused successfully', { taskUuid });
      confirmDialog.show = false;
    } catch (err) {
      logger.error('Failed to pause task', { error: err, taskUuid });
      showSnackbar('暂停任务失败', 'error');
    } finally {
      confirmDialog.loading = false;
    }
  };
}

/**
 * 恢复任务
 */
async function handleResumeTask(taskUuid: string) {
  confirmDialog.show = true;
  confirmDialog.title = '恢复任务';
  confirmDialog.message = '确定要恢复这个任务吗？';
  confirmDialog.onConfirm = async () => {
    confirmDialog.loading = true;
    try {
      logger.info('Resuming task', { taskUuid });
      await resumeTask(taskUuid);
      showSnackbar('任务已恢复', 'success');
      logger.info('Task resumed successfully', { taskUuid });
      confirmDialog.show = false;
    } catch (err) {
      logger.error('Failed to resume task', { error: err, taskUuid });
      showSnackbar('恢复任务失败', 'error');
    } finally {
      confirmDialog.loading = false;
    }
  };
}

/**
 * 删除任务
 */
async function handleDeleteTask(taskUuid: string) {
  confirmDialog.show = true;
  confirmDialog.title = '删除任务';
  confirmDialog.message = '确定要删除这个任务吗？此操作不可撤销。';
  confirmDialog.onConfirm = async () => {
    confirmDialog.loading = true;
    try {
      logger.info('Deleting task', { taskUuid });
      await deleteTask(taskUuid);
      showSnackbar('任务已删除', 'success');
      logger.info('Task deleted successfully', { taskUuid });
      confirmDialog.show = false;
      // 删除后刷新统计信息
      await fetchStatistics();
      await fetchAllModuleStatistics();
    } catch (err) {
      logger.error('Failed to delete task', { error: err, taskUuid });
      showSnackbar('删除任务失败', 'error');
    } finally {
      confirmDialog.loading = false;
    }
  };
}

/**
 * 查看任务详情
 */
function handleViewDetail(taskUuid: string) {
  logger.info('Opening task detail', { taskUuid });
  detailDialog.taskUuid = taskUuid;
  detailDialog.show = true;
}

/**
 * 显示 Snackbar 通知
 */
function showSnackbar(message: string, color: 'success' | 'error' | 'info' = 'success') {
  snackbar.message = message;
  snackbar.color = color;
  snackbar.show = true;
}

// ===== 生命周期 =====
onMounted(async () => {
  logger.info('Schedule Dashboard mounted, initializing data');
  await initialize();
});
</script>

<style scoped>
.schedule-header {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

.main-content {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-surface), 1),
    rgba(var(--v-theme-background), 1)
  );
  overflow-y: auto;
}

.content-wrapper {
  max-width: 1600px;
  margin: 0 auto;
}
</style>
