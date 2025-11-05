<!--
  Task Edit View
  编辑任务页面 - 使用 Dialog 形式
-->
<template>
  <v-dialog v-model="dialog" max-width="900px" persistent scrollable>
    <v-card v-if="template">
      <v-card-title>编辑任务模板</v-card-title>
      <v-card-text>
        <TaskTemplateForm :model-value="(template as any)" :is-edit-mode="true"
          @update:model-value="handleTemplateUpdate" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">取消</v-btn>
        <v-btn color="primary" :loading="loading" @click="handleUpdate">保存</v-btn>
      </v-card-actions>
    </v-card>

    <!-- 加载状态 -->
    <v-card v-else>
      <v-card-text class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <p class="text-medium-emphasis mt-4">加载任务模板...</p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { TaskTemplate } from '@dailyuse/domain-client';
import { type TaskContracts } from '@dailyuse/contracts';
import TaskTemplateForm from '@/modules/task/presentation/components/TaskTemplateForm/TaskTemplateForm.vue';
import { taskTemplateApiClient } from '@/modules/task/infrastructure/api';

const router = useRouter();
const route = useRoute();

const dialog = ref(false);
const loading = ref(false);
const template = ref<TaskTemplate | null>(null);

// 加载任务模板数据
const loadTemplate = async () => {
  const templateUuid = route.params.id as string;
  try {
    // TODO: 需要实现 taskTemplateApiClient.getByUuid() 方法
    const templateDTO = await taskTemplateApiClient.getByUuid(templateUuid);
    template.value = TaskTemplate.fromServerDTO(templateDTO);
  } catch (error) {
    console.error('Failed to load task template:', error);
    // 加载失败，返回上一页
    router.back();
  }
};

// 组件挂载时加载数据并打开对话框
onMounted(async () => {
  await loadTemplate();
  dialog.value = true;
});

const handleTemplateUpdate = (updatedTemplate: TaskTemplate) => {
  template.value = updatedTemplate;
};

const handleUpdate = async () => {
  if (!template.value) return;

  loading.value = true;
  try {
    const dto = template.value.toServerDTO();
    // 过滤掉 null 值，转换为 UpdateTaskTemplateRequest
    const request: TaskContracts.UpdateTaskTemplateRequest = {
      title: dto.title,
      description: dto.description ?? undefined,
      timeConfig: dto.timeConfig ?? undefined,
      recurrenceRule: dto.recurrenceRule ?? undefined,
      reminderConfig: dto.reminderConfig ?? undefined,
      importance: dto.importance,
      urgency: dto.urgency,
      folderUuid: dto.folderUuid ?? undefined,
      tags: dto.tags ?? undefined,
      color: dto.color ?? undefined,
      generateAheadDays: dto.generateAheadDays ?? undefined,
    };
    await taskTemplateApiClient.update(template.value.uuid, request);
    // 更新成功后跳转到详情页
    router.push(`/tasks/templates/${template.value.uuid}`);
  } catch (error) {
    console.error('Failed to update task template:', error);
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
