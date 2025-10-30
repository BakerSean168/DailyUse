<template>
  <v-dialog v-model="visible" max-width="600px">
    <v-card>
      <v-card-title>
        <span class="text-h5">分组详情</span>
      </v-card-title>
      <v-card-text v-if="group">
        <v-list>
          <v-list-item>
            <v-list-item-title>名称</v-list-item-title>
            <v-list-item-subtitle>{{ group.name }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>描述</v-list-item-title>
            <v-list-item-subtitle>{{ group.description || '无' }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>状态</v-list-item-title>
            <v-list-item-subtitle>
              <v-chip :color="group.enabled ? 'success' : 'grey'" size="small">
                {{ group.enabled ? '已启用' : '已禁用' }}
              </v-chip>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <v-alert type="info" class="mt-4">
          分组管理功能开发中...
        </v-alert>
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

type ReminderTemplateGroup = ReminderContracts.ReminderGroupClientDTO;

const visible = ref(false);
const group = ref<ReminderTemplateGroup | null>(null);

const open = (groupData: ReminderTemplateGroup) => {
  group.value = groupData;
  visible.value = true;
};

const close = () => {
  visible.value = false;
  group.value = null;
};

defineExpose({
  open,
  close,
});
</script>
