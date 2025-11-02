<!--
  One-Time Task List View
  一次性任务列表页面 - 集成新的 ONE_TIME 组件
-->
<template>
  <v-container fluid class="one-time-task-list-view">
    <!-- 创建/编辑任务 Dialog -->
    <v-dialog v-model="formDialog" max-width="900px" persistent scrollable>
      <TaskForm v-if="formDialog" :task="editingTask" :submitting="formSubmitting" @submit="handleFormSubmit"
        @cancel="handleFormCancel" />
    </v-dialog>

    <!-- 批量操作工具栏 -->
    <TaskBatchToolbar v-if="selectedTasks.size > 0" :selected-count="selectedTasks.size" :total-count="tasks.length"
      :all-selected="allSelected" :operation-loading="batchOperationLoading"
      :operation-progress="batchOperationProgress" :operation-message="batchOperationMessage"
      @select-all="handleSelectAll" @clear-selection="handleClearSelection" @invert-selection="handleInvertSelection"
      @select-overdue="handleSelectOverdue" @select-high-priority="handleSelectHighPriority"
      @select-pending="handleSelectPending" @batch-update-priority="handleBatchUpdatePriority"
      @batch-start="handleBatchStart" @batch-complete="handleBatchComplete" @batch-cancel="handleBatchCancel"
      @batch-add-tags="handleBatchAddTags" @batch-link-goal="handleBatchLinkGoal" @batch-export="handleBatchExport"
      @batch-delete="handleBatchDelete" />

    <v-row>
      <v-col cols="12">
        <!-- 页面标题和操作栏 -->
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h4">
            <v-icon class="mr-2">mdi-check-circle</v-icon>
            一次性任务
          </h1>

          <div class="d-flex gap-2">
            <!-- 视图模式切换 -->
            <v-btn-toggle v-model="viewMode" mandatory density="compact" variant="outlined">
              <v-btn value="list" size="small">
                <v-icon start>mdi-format-list-bulleted</v-icon>
                列表
              </v-btn>
              <v-btn value="card" size="small">
                <v-icon start>mdi-view-grid</v-icon>
                卡片
              </v-btn>
              <v-btn value="dashboard" size="small">
                <v-icon start>mdi-view-dashboard</v-icon>
                仪表盘
              </v-btn>
            </v-btn-toggle>

            <!-- 创建任务 -->
            <v-btn color="primary" data-testid="create-task-button" @click="handleCreateTask">
              <v-icon start>mdi-plus</v-icon>
              创建任务
            </v-btn>
          </div>
        </div>

        <!-- 仪表盘视图 -->
        <TaskDashboard v-if="viewMode === 'dashboard'" :statistics="statistics"
          :priority-distribution="priorityDistribution" :status-distribution="statusDistribution"
          :overdue-tasks="overdueTasks" :upcoming-tasks="upcomingTasks" :recent-completed="recentCompleted"
          :loading="loading" @view-overdue="handleViewOverdue" @view-upcoming="handleViewUpcoming"
          @view-recent="handleViewRecent" @view-all="handleViewAll" />

        <!-- 列表/卡片视图 -->
        <TaskList v-else :tasks="filteredTasks" :loading="loading" :view-mode="viewMode"
          :selected-tasks="Array.from(selectedTasks)" :sort-by="sortBy" :sort-order="sortOrder" :show-selection="true"
          @task-click="handleTaskClick" @task-select="handleTaskSelect" @task-start="handleTaskStart"
          @task-complete="handleTaskComplete" @task-edit="handleTaskEdit" @task-delete="handleTaskDelete"
          @update-sort="handleUpdateSort" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  TaskList,
  TaskDashboard,
  TaskBatchToolbar,
  TaskForm,
} from '@/modules/task/presentation/components/one-time';
import { useOneTimeTask } from '@/modules/task/presentation/composables/useOneTimeTask';
import { useTaskDashboard } from '@/modules/task/presentation/composables/useTaskDashboard';
import { useTaskBatchOperations } from '@/modules/task/presentation/composables/useTaskBatchOperations';
import { useNotification } from '@/modules/task/presentation/composables/useNotification';
import type { TaskContracts } from '@dailyuse/contracts';

const router = useRouter();
const { showSuccess, showError } = useNotification();

// Composables
const {
  tasks,
  loading,
  fetchTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = useOneTimeTask();

const {
  statistics,
  priorityDistribution,
  statusDistribution,
  overdueTasks,
  upcomingTasks,
  recentCompleted,
  refreshDashboard,
} = useTaskDashboard();

const {
  selectedTasks,
  selectTask,
  deselectTask,
  selectAll,
  clearSelection,
  invertSelection,
  selectByCondition,
  batchUpdatePriority,
  batchUpdateStatus,
  batchAddTags,
  batchLinkGoal,
  batchDelete,
  exportTasks,
  operationLoading: batchOperationLoading,
  operationProgress: batchOperationProgress,
  operationMessage: batchOperationMessage,
} = useTaskBatchOperations();

// UI State
const viewMode = ref<'list' | 'card' | 'dashboard'>('list');
const sortBy = ref<string>('createdAt');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Form Dialog State
const formDialog = ref(false);
const editingTask = ref<TaskContracts.OneTimeTaskClientDTO | null>(null);
const formSubmitting = ref(false);

// Filter State
const filterMode = ref<'all' | 'overdue' | 'upcoming' | 'recent'>('all');

// Computed
const filteredTasks = computed(() => {
  let result = tasks.value;

  // 根据筛选模式
  const now = new Date();
  switch (filterMode.value) {
    case 'overdue':
      result = result.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = typeof task.dueDate === 'number' ? new Date(task.dueDate) : new Date(task.dueDate);
        return dueDate < now && task.status !== 'COMPLETED';
      });
      break;

    case 'upcoming':
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      result = result.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = typeof task.dueDate === 'number' ? new Date(task.dueDate) : new Date(task.dueDate);
        return dueDate >= now && dueDate <= weekLater;
      });
      break;

    case 'recent':
      result = result.filter(task => task.status === 'COMPLETED');
      // 按完成时间排序（最新的在前）
      result.sort((a, b) => {
        const aTime = a.updatedAt || a.createdAt || 0;
        const bTime = b.updatedAt || b.createdAt || 0;
        return bTime - aTime;
      });
      break;
  }

  return result;
});

const allSelected = computed(() => {
  return tasks.value.length > 0 && selectedTasks.value.size === tasks.value.length;
});

// Methods
const loadData = async () => {
  await Promise.all([
    fetchTasks(),
    refreshDashboard(),
  ]);
};

const handleCreateTask = () => {
  editingTask.value = null;
  formDialog.value = true;
};

const handleTaskClick = (task: TaskContracts.OneTimeTaskClientDTO) => {
  router.push(`/tasks/${task.uuid}`);
};

const handleTaskSelect = (task: TaskContracts.OneTimeTaskClientDTO, selected: boolean) => {
  if (selected) {
    selectTask(task.uuid);
  } else {
    deselectTask(task.uuid);
  }
};

const handleTaskStart = async (task: TaskContracts.OneTimeTaskClientDTO) => {
  try {
    await updateTaskStatus(task.uuid, 'IN_PROGRESS');
    showSuccess(`任务「${task.title}」已开始`);
    await loadData();
  } catch (error) {
    console.error('Failed to start task:', error);
    showError('开始任务失败');
  }
};

const handleTaskComplete = async (task: TaskContracts.OneTimeTaskClientDTO) => {
  try {
    await updateTaskStatus(task.uuid, 'COMPLETED');
    showSuccess(`任务「${task.title}」已完成 🎉`);
    await loadData();
  } catch (error) {
    console.error('Failed to complete task:', error);
    showError('完成任务失败');
  }
};

const handleTaskEdit = (task: TaskContracts.OneTimeTaskClientDTO) => {
  editingTask.value = task;
  formDialog.value = true;
};

const handleTaskDelete = async (task: TaskContracts.OneTimeTaskClientDTO) => {
  // 确认删除
  if (!confirm(`确定要删除任务「${task.title}」吗？`)) {
    return;
  }

  try {
    await deleteTask(task.uuid);
    showSuccess('任务已删除');
    await loadData();
  } catch (error) {
    console.error('Failed to delete task:', error);
    showError('删除任务失败');
  }
};

// Form handlers
const handleFormSubmit = async (formData: any) => {
  formSubmitting.value = true;
  try {
    if (editingTask.value) {
      // 编辑模式
      await updateTask(editingTask.value.uuid, formData);
      showSuccess('任务更新成功');
    } else {
      // 创建模式
      await createTask(formData);
      showSuccess('任务创建成功');
    }
    formDialog.value = false;
    await loadData();
  } catch (error) {
    console.error('Failed to submit form:', error);
    showError(editingTask.value ? '任务更新失败' : '任务创建失败');
  } finally {
    formSubmitting.value = false;
  }
};

const handleFormCancel = () => {
  formDialog.value = false;
  editingTask.value = null;
};

const handleUpdateSort = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
  sortBy.value = newSortBy;
  sortOrder.value = newSortOrder;
};

// Batch operations
const handleSelectAll = () => {
  selectAll(tasks.value.map(t => t.uuid));
};

const handleClearSelection = () => {
  clearSelection();
};

const handleInvertSelection = () => {
  invertSelection(tasks.value.map(t => t.uuid));
};

const handleSelectOverdue = () => {
  const now = new Date();
  selectByCondition(tasks.value, (task) => {
    return task.dueDate ? new Date(task.dueDate) < now : false;
  });
};

const handleSelectHighPriority = () => {
  selectByCondition(tasks.value, (task) => {
    return task.priority === 'CRITICAL' || task.priority === 'HIGH';
  });
};

const handleSelectPending = () => {
  selectByCondition(tasks.value, (task) => {
    return task.status === 'PENDING';
  });
};

const handleBatchUpdatePriority = async (priority: string) => {
  const count = selectedTasks.value.size;
  try {
    await batchUpdatePriority(Array.from(selectedTasks.value), priority);
    showSuccess(`已更新 ${count} 个任务的优先级`);
    await loadData();
    clearSelection();
  } catch (error) {
    console.error('Failed to batch update priority:', error);
    showError('批量更新优先级失败');
  }
};

const handleBatchStart = async () => {
  const count = selectedTasks.value.size;
  try {
    await batchUpdateStatus(Array.from(selectedTasks.value), 'IN_PROGRESS');
    showSuccess(`已开始 ${count} 个任务`);
    await loadData();
    clearSelection();
  } catch (error) {
    console.error('Failed to batch start tasks:', error);
    showError('批量开始任务失败');
  }
};

const handleBatchComplete = async () => {
  const count = selectedTasks.value.size;
  try {
    await batchUpdateStatus(Array.from(selectedTasks.value), 'COMPLETED');
    showSuccess(`已完成 ${count} 个任务 🎉`);
    await loadData();
    clearSelection();
  } catch (error) {
    console.error('Failed to batch complete tasks:', error);
    showError('批量完成任务失败');
  }
};

const handleBatchCancel = async () => {
  const count = selectedTasks.value.size;
  if (!confirm(`确定要取消 ${count} 个任务吗？`)) {
    return;
  }

  try {
    await batchUpdateStatus(Array.from(selectedTasks.value), 'CANCELLED');
    showSuccess(`已取消 ${count} 个任务`);
    await loadData();
    clearSelection();
  } catch (error) {
    console.error('Failed to batch cancel tasks:', error);
    showError('批量取消任务失败');
  }
};

const handleBatchAddTags = async (tags: string[]) => {
  try {
    await batchAddTags(Array.from(selectedTasks.value), tags);
    await loadData();
    clearSelection();
  } catch (error) {
    console.error('Failed to batch add tags:', error);
  }
};

const handleBatchLinkGoal = async (goalUuid: string) => {
  try {
    await batchLinkGoal(Array.from(selectedTasks.value), goalUuid);
    await loadData();
    clearSelection();
  } catch (error) {
    console.error('Failed to batch link goal:', error);
  }
};

const handleBatchExport = async () => {
  try {
    await exportTasks(Array.from(selectedTasks.value));
    clearSelection();
  } catch (error) {
    console.error('Failed to export tasks:', error);
  }
};

const handleBatchDelete = async () => {
  const count = selectedTasks.value.size;
  if (!confirm(`确定要删除 ${count} 个任务吗？此操作不可恢复。`)) {
    return;
  }

  try {
    await batchDelete(Array.from(selectedTasks.value));
    showSuccess(`已删除 ${count} 个任务`);
    await loadData();
    clearSelection();
  } catch (error) {
    console.error('Failed to batch delete tasks:', error);
    showError('批量删除任务失败');
  }
};

// Dashboard actions
const handleViewOverdue = () => {
  viewMode.value = 'list';
  filterMode.value = 'overdue';
};

const handleViewUpcoming = () => {
  viewMode.value = 'list';
  filterMode.value = 'upcoming';
};

const handleViewRecent = () => {
  viewMode.value = 'list';
  filterMode.value = 'recent';
};

const handleViewAll = () => {
  viewMode.value = 'list';
  filterMode.value = 'all';
};

// Lifecycle
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.one-time-task-list-view {
  max-width: 1400px;
  margin: 0 auto;
  padding-top: 1rem;
}

.gap-2 {
  gap: 8px;
}
</style>
