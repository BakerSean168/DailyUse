<template>
  <v-navigation-drawer
    v-model="isOpen"
    location="right"
    temporary
    width="400"
  >
    <v-toolbar density="compact">
      <v-toolbar-title>通知中心</v-toolbar-title>
      <v-btn
        icon="mdi-check-all"
        @click="$emit('mark-all-read')"
        :disabled="unreadCount === 0"
      />
      <v-btn icon="mdi-close" @click="close" />
    </v-toolbar>

    <NotificationList
      :notifications="notifications"
      :loading="loading"
      @notification-click="handleNotificationClick"
      @mark-read="$emit('mark-read', $event)"
      @delete="$emit('delete', $event)"
    />

    <template #append>
      <v-btn
        block
        variant="text"
        to="/notifications"
        @click="close"
      >
        查看全部通知
      </v-btn>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import NotificationList from './NotificationList.vue';
import type { NotificationClientDTO, NotificationPreferenceClientDTO } from '@dailyuse/contracts/notification';

type NotificationClientDTO = NotificationClientDTO;

interface Props {
  modelValue: boolean;
  notifications: NotificationClientDTO[];
  loading?: boolean;
  unreadCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  unreadCount: 0,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'notification-click': [notification: NotificationClientDTO];
  'mark-read': [uuid: string];
  delete: [uuid: string];
  'mark-all-read': [];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const close = () => {
  isOpen.value = false;
};

const handleNotificationClick = (notification: NotificationClientDTO) => {
  emit('notification-click', notification);
  close();
};
</script>

