<!--
  Task Create View
  创建任务页面 - 使用 Dialog 形式
-->
<template>
  <v-dialog v-model="dialog" max-width="900px" persistent scrollable>
    <TaskForm :is-edit="false" :loading="loading" @submit="handleCreate" @cancel="handleCancel" />
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { TaskForm } from '@/modules/task/presentation/components/one-time';
import { useOneTimeTask } from '@/modules/task/presentation/composables/useOneTimeTask';

const router = useRouter();
const { createTask } = useOneTimeTask();

const dialog = ref(false);
const loading = ref(false);

// 组件挂载时打开对话框
onMounted(() => {
  dialog.value = true;
});

const handleCreate = async (taskData: any) => {
  loading.value = true;
  try {
    const newTask = await createTask(taskData);
    // 创建成功后跳转到详情页
    router.push(`/tasks/${newTask.uuid}`);
  } catch (error) {
    console.error('Failed to create task:', error);
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
