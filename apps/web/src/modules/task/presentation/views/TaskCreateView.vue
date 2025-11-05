<!--
  Task Create View
  创建任务页面 - 使用 Dialog 形式
-->
<template>
  <v-dialog v-model="dialog" max-width="900px" persistent scrollable>
    <v-card>
      <v-card-title>创建任务</v-card-title>
      <v-card-text>
        <TaskTemplateForm v-if="newTemplate" :model-value="(newTemplate as any)" :is-edit-mode="false"
          @update:model-value="handleTemplateUpdate" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">取消</v-btn>
        <v-btn color="primary" :loading="loading" @click="handleCreate">创建</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { TaskTemplate } from '@dailyuse/domain-client';
import { type TaskContracts } from '@dailyuse/contracts';
import TaskTemplateForm from '@/modules/task/presentation/components/TaskTemplateForm/TaskTemplateForm.vue';
import { taskTemplateApiClient } from '@/modules/task/infrastructure/api';

const router = useRouter();

const dialog = ref(false);
const loading = ref(false);

// 创建新的空模板
// TODO: 需要从当前用户上下文获取 accountUuid
const newTemplate = ref(TaskTemplate.forCreate('account-uuid-placeholder'));

// 组件挂载时打开对话框
onMounted(() => {
  dialog.value = true;
});

const handleTemplateUpdate = (updatedTemplate: TaskTemplate) => {
  newTemplate.value = updatedTemplate;
};

const handleCreate = async () => {
  loading.value = true;
  try {
    const dto = newTemplate.value.toServerDTO();
    // 过滤掉 null 值，转换为 CreateTaskTemplateRequest
    const request: TaskContracts.CreateTaskTemplateRequest = {
      ...dto,
      description: dto.description ?? undefined,
      timeConfig: dto.timeConfig!,
      recurrenceRule: dto.recurrenceRule ?? undefined,
      reminderConfig: dto.reminderConfig ?? undefined,
      goalBinding: dto.goalBinding ?? undefined,
      folderUuid: dto.folderUuid ?? undefined,
      tags: dto.tags ?? undefined,
      color: dto.color ?? undefined,
      generateAheadDays: dto.generateAheadDays ?? undefined,
    };
    const createdTemplate = await taskTemplateApiClient.create(request);
    // 创建成功后跳转到详情页
    router.push(`/tasks/templates/${createdTemplate.uuid}`);
  } catch (error) {
    console.error('Failed to create task template:', error);
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
