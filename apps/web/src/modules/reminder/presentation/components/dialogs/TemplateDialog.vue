<template>
  <v-dialog v-model="visible" max-width="600px">
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ isEditMode ? '编辑提醒模板' : '创建提醒模板' }}</span>
      </v-card-title>
      <v-card-text>
        <v-alert type="info" class="mb-4">
          提醒模板创建/编辑功能开发中...
        </v-alert>
        
        <div v-if="currentTemplate">
          <p><strong>标题:</strong> {{ currentTemplate.title || '(未设置)' }}</p>
          <p><strong>描述:</strong> {{ currentTemplate.description || '(未设置)' }}</p>
          <p><strong>触发:</strong> {{ currentTemplate.triggerText }}</p>
          <p><strong>状态:</strong> {{ currentTemplate.statusText }}</p>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="close">关闭</v-btn>
        <v-btn color="primary" variant="text" @click="handleSave">保存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ReminderTemplateClient } from '@dailyuse/domain-client';

const visible = ref(false);
const currentTemplate = ref<ReminderTemplateClient | null>(null);
const isEditMode = computed(() => !!currentTemplate.value?.uuid);

const emit = defineEmits<{
  templateCreated: [template: ReminderTemplateClient];
  templateUpdated: [template: ReminderTemplateClient];
}>();

const open = () => {
  visible.value = true;
};

const openForCreate = () => {
  currentTemplate.value = ReminderTemplateClient.forCreate();
  visible.value = true;
};

const openForEdit = (template: ReminderTemplateClient) => {
  currentTemplate.value = template.clone();
  visible.value = true;
};

const close = () => {
  visible.value = false;
  currentTemplate.value = null;
};

const handleSave = () => {
  if (!currentTemplate.value) return;
  
  if (isEditMode.value) {
    emit('templateUpdated', currentTemplate.value as ReminderTemplateClient);
  } else {
    emit('templateCreated', currentTemplate.value as ReminderTemplateClient);
  }
  
  close();
};

defineExpose({
  open,
  openForCreate,
  openForEdit,
  close,
});
</script>
