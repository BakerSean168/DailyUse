<template>
  <v-dialog v-model="visible" max-width="600px">
    <v-card>
      <v-card-title>
        <span class="text-h5">提醒模板详情</span>
      </v-card-title>
      <v-card-text v-if="template">
        <v-list>
          <v-list-item>
            <v-list-item-title>标题</v-list-item-title>
            <v-list-item-subtitle>{{ template.title }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>描述</v-list-item-title>
            <v-list-item-subtitle>{{ template.description || '无' }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>触发器</v-list-item-title>
            <v-list-item-subtitle>{{ template.triggerText }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>状态</v-list-item-title>
            <v-list-item-subtitle>
              <v-chip :color="template.effectiveEnabled ? 'success' : 'grey'" size="small">
                {{ template.effectiveEnabled ? '已启用' : '已禁用' }}
              </v-chip>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="close">关闭</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ReminderContracts } from '@dailyuse/contracts';

type ReminderTemplate = ReminderContracts.ReminderTemplateClientDTO;

const visible = ref(false);
const template = ref<ReminderTemplate | null>(null);

const open = (templateData: ReminderTemplate) => {
  template.value = templateData;
  visible.value = true;
};

const close = () => {
  visible.value = false;
  template.value = null;
};

defineExpose({
  open,
  close,
});
</script>
