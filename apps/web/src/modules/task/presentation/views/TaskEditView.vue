<!--
  Task Edit View
  编辑任务页面 - 使用 Dialog 形式
-->
<template>
  <v-dialog v-model="dialog" max-width="900px" persistent scrollable>
    <TaskForm
      v-if="task"
      :is-edit="true"
      :initial-data="task"
      :loading="loading"
      @submit="handleUpdate"
      @cancel="handleCancel"
    />

    <!-- 加载状态 -->
    <v-card v-else>
      <v-card-text class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <p class="text-medium-emphasis mt-4">加载任务信息...</p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { TaskForm } from '@/modules/task/presentation/components/one-time';
import { useOneTimeTask } from '@/modules/task/presentation/composables/useOneTimeTask';

const router = useRouter();
const route = useRoute();
const { getTaskByUuid, updateTask } = useOneTimeTask();

const dialog = ref(false);
const loading = ref(false);
const task = ref<any>(null);

// 加载任务数据
const loadTask = async () => {
  const taskUuid = route.params.id as string;
  try {
    task.value = await getTaskByUuid(taskUuid);
  } catch (error) {
    console.error('Failed to load task:', error);
    // 加载失败，返回上一页
    router.back();
  }
};

// 组件挂载时加载数据并打开对话框
onMounted(async () => {
  await loadTask();
  dialog.value = true;
});

const handleUpdate = async (taskData: any) => {
  loading.value = true;
  try {
    const taskUuid = route.params.id as string;
    await updateTask(taskUuid, taskData);
    // 更新成功后跳转到详情页
    router.push(`/tasks/${taskUuid}`);
  } catch (error) {
    console.error('Failed to update task:', error);
    loading.value = false;
  }
};

const handleCancel = () => {
  dialog.value = false;
  // 延迟返回，等待对话框关闭动画
  setTimeout(() => {
    router.back();
  }, 300);
};
</script>
