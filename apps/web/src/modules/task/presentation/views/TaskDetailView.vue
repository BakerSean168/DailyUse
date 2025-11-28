<!--
  Task Detail View
  任务详情页面 - 完整实现
  
  TODO: 此文件需要完全重构
  - 使用 TaskTemplate 和 TaskInstance 替代 OneTimeTask
  - 使用 taskTemplateApiClient 和 taskInstanceApiClient
  - 移除 useOneTimeTask composable 的使用
  - 更新组件引用（TaskDetail, TaskForm 组件可能已过时）
-->
<template>
  <v-dialog v-model="dialog" fullscreen persistent>
    <!-- 编辑任务 Dialog -->
    <v-dialog v-model="editDialog" max-width="900px" persistent scrollable>
      <TaskForm v-if="editDialog && task" :task="task" :submitting="editSubmitting" @submit="handleEditSubmit"
        @cancel="handleEditCancel" />
    </v-dialog>

    <!-- 加载状态 -->
    <v-card v-if="loading" class="d-flex align-center justify-center" style="min-height: 400px">
      <div class="text-center">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 text-medium-emphasis mt-4">加载任务信息...</p>
      </div>
    </v-card>

    <!-- 错误状态 -->
    <v-card v-else-if="error" class="d-flex align-center justify-center" style="min-height: 400px">
      <div class="text-center">
        <v-icon size="64" color="error">mdi-alert-circle</v-icon>
        <p class="text-h6 mt-4">{{ error }}</p>
        <v-btn color="primary" class="mt-4" @click="handleClose">返回</v-btn>
      </div>
    </v-card>

    <!-- 任务详情 -->
    <TaskDetail v-else-if="task" :task="task" :subtasks="subtasks" :dependencies="dependencies"
      :task-history="taskHistory" :loading="operationLoading" :show-subtasks="showSubtasks" :show-history="showHistory"
      @close="handleClose" @start="handleStart" @complete="handleComplete" @block="handleBlock" @unblock="handleUnblock"
      @cancel="handleCancel" @edit="handleEdit" @delete="handleDelete" @add-subtask="handleAddSubtask"
      @view-subtask="handleViewSubtask" @view-dependency="handleViewDependency" @view-goal="handleViewGoal"
      @toggle-subtask="handleToggleSubtask" />
  </v-dialog>
</template>

<script setup lang="ts">
// @ts-nocheck
// TODO: 此文件需要完全重构以使用新的 TaskTemplate/TaskInstance 架构
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
// import { TaskDetail, TaskForm } from '@/modules/task/presentation/components/one-time';
// import { useOneTimeTask } from '@/modules/task/presentation/composables/useOneTimeTask';
import { useNotification } from '@/modules/task/presentation/composables/useNotification';
import type { TaskTemplateClientDTO, TaskInstanceClientDTO } from '@dailyuse/contracts/task';

const router = useRouter();
const route = useRoute();
// TODO: Replace with taskTemplateApiClient and taskInstanceApiClient
// const { 
//   getTaskByUuid, 
//   updateTask, 
//   updateTaskStatus, 
//   deleteTask, 
//   getTaskHistory,
//   fetchSubtasks,
//   createSubtask,
// } = useOneTimeTask();

const { showSuccess, showError, showWarning } = useNotification();

const dialog = ref(false);
const loading = ref(false);
const operationLoading = ref(false);
const error = ref<string>('');
const task = ref<OneTimeTaskClientDTO | null>(null);
const subtasks = ref<OneTimeTaskClientDTO[]>([]);
const dependencies = ref<OneTimeTaskClientDTO[]>([]);
const taskHistory = ref<any[]>([]);

// Edit Dialog State
const editDialog = ref(false);
const editSubmitting = ref(false);

// 显示选项
const showSubtasks = computed(() => (task.value?.isParent ?? false) || subtasks.value.length > 0);
const showHistory = computed(() => taskHistory.value.length > 0);

// 加载任务数据
const loadTask = async () => {
  loading.value = true;
  error.value = '';
  const taskUuid = route.params.id as string;

  try {
    // 加载任务基本信息
    task.value = await getTaskByUuid(taskUuid);

    // 加载子任务
    if (task.value.isParent) {
      try {
        subtasks.value = await fetchSubtasks(taskUuid);
      } catch (err) {
        console.warn('Failed to load subtasks:', err);
        // 子任务加载失败不影响主流程
      }
    }

    // TODO: 加载依赖任务
    // 需要实现 TaskDependencyService 和相关接口
    // dependencies.value = await loadDependencies(taskUuid);

    // 加载任务历史
    try {
      taskHistory.value = await getTaskHistory(taskUuid);
    } catch (err) {
      console.warn('Failed to load task history:', err);
      // 历史记录加载失败不影响主流程
    }
  } catch (err: any) {
    console.error('Failed to load task:', err);
    error.value = err.message || '加载任务失败';
  } finally {
    loading.value = false;
  }
};

// 组件挂载时加载数据并打开对话框
onMounted(async () => {
  await loadTask();
  dialog.value = true;
});

// 关闭对话框
const handleClose = () => {
  dialog.value = false;
  setTimeout(() => {
    router.back();
  }, 300);
};

// 任务操作
const handleStart = async () => {
  if (!task.value) return;
  operationLoading.value = true;
  try {
    await updateTaskStatus(task.value.uuid, 'IN_PROGRESS');
    showSuccess('任务已开始');
    await loadTask(); // 重新加载数据
  } catch (err) {
    console.error('Failed to start task:', err);
    showError('开始任务失败');
  } finally {
    operationLoading.value = false;
  }
};

const handleComplete = async () => {
  if (!task.value) return;
  operationLoading.value = true;
  try {
    await updateTaskStatus(task.value.uuid, 'COMPLETED');
    showSuccess('任务已完成 🎉');
    await loadTask();
  } catch (err) {
    console.error('Failed to complete task:', err);
    showError('完成任务失败');
  } finally {
    operationLoading.value = false;
  }
};

const handleBlock = async () => {
  if (!task.value) return;
  const reason = prompt('请输入阻塞原因（可选）：');

  operationLoading.value = true;
  try {
    await updateTaskStatus(task.value.uuid, 'BLOCKED');
    showWarning(`任务已阻塞${reason ? '：' + reason : ''}`);
    await loadTask();
  } catch (err) {
    console.error('Failed to block task:', err);
    showError('阻塞任务失败');
  } finally {
    operationLoading.value = false;
  }
};

const handleUnblock = async () => {
  if (!task.value) return;
  operationLoading.value = true;
  try {
    await updateTaskStatus(task.value.uuid, 'PENDING');
    showSuccess('任务已解除阻塞');
    await loadTask();
  } catch (err) {
    console.error('Failed to unblock task:', err);
    showError('解除阻塞失败');
  } finally {
    operationLoading.value = false;
  }
};

const handleCancel = async () => {
  if (!task.value) return;
  if (!confirm('确定要取消此任务吗？')) {
    return;
  }

  operationLoading.value = true;
  try {
    await updateTaskStatus(task.value.uuid, 'CANCELLED');
    showWarning('任务已取消');
    await loadTask();
  } catch (err) {
    console.error('Failed to cancel task:', err);
    showError('取消任务失败');
  } finally {
    operationLoading.value = false;
  }
};

const handleEdit = () => {
  editDialog.value = true;
};

const handleEditSubmit = async (formData: any) => {
  if (!task.value) return;
  editSubmitting.value = true;
  try {
    await updateTask(task.value.uuid, formData);
    showSuccess('任务更新成功');
    editDialog.value = false;
    await loadTask(); // 重新加载任务数据
  } catch (err) {
    console.error('Failed to update task:', err);
    showError('任务更新失败');
  } finally {
    editSubmitting.value = false;
  }
};

const handleEditCancel = () => {
  editDialog.value = false;
};

const handleDelete = async () => {
  if (!task.value) return;
  if (!confirm(`确定要删除任务「${task.value.title}」吗？此操作不可恢复。`)) {
    return;
  }

  operationLoading.value = true;
  try {
    await deleteTask(task.value.uuid);
    showSuccess('任务已删除');
    handleClose();
  } catch (err) {
    console.error('Failed to delete task:', err);
    showError('删除任务失败');
    operationLoading.value = false;
  }
};

const handleAddSubtask = async () => {
  if (!task.value) return;

  // 使用简化的方式创建子任务
  // 实际应用中可以打开一个对话框让用户输入详细信息
  const subtaskTitle = prompt('请输入子任务标题：');
  if (!subtaskTitle || !subtaskTitle.trim()) return;

  operationLoading.value = true;
  try {
    await createSubtask(task.value.uuid, {
      title: subtaskTitle.trim(),
      description: '',
      taskType: 'ONE_TIME',
    });
    showSuccess('子任务创建成功');
    await loadTask(); // 重新加载数据
  } catch (err) {
    console.error('Failed to create subtask:', err);
    showError('创建子任务失败');
  } finally {
    operationLoading.value = false;
  }
};

const handleViewSubtask = (subtaskUuid: string) => {
  router.push(`/tasks/${subtaskUuid}`);
};

const handleViewDependency = (dependencyUuid: string) => {
  router.push(`/tasks/${dependencyUuid}`);
};

const handleViewGoal = (goalUuid: string) => {
  router.push(`/goals/${goalUuid}`);
};

const handleToggleSubtask = async (subtaskUuid: string) => {
  operationLoading.value = true;
  try {
    // 查找子任务
    const subtask = subtasks.value.find(st => st.uuid === subtaskUuid);
    if (!subtask) return;

    // 切换状态：如果已完成则标记为进行中，否则标记为已完成
    const newStatus = subtask.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
    await updateTaskStatus(subtaskUuid, newStatus);

    const statusText = newStatus === 'COMPLETED' ? '已完成' : '进行中';
    showSuccess(`子任务「${subtask.title}」标记为${statusText}`);
    await loadTask(); // 重新加载数据
  } catch (err) {
    console.error('Failed to toggle subtask:', err);
    showError('更新子任务状态失败');
  } finally {
    operationLoading.value = false;
  }
};
</script>

