<template>
  <div class="notification-list">
    <div v-if="loading" class="pa-4 text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-empty-state
      v-else-if="!notifications.length"
      icon="mdi-bell-outline"
      title="暂无通知"
    />

    <v-list v-else>
      <NotificationItem
        v-for="notification in notifications"
        :key="notification.uuid"
        :notification="notification"
        @click="$emit('notification-click', $event)"
        @mark-read="$emit('mark-read', $event)"
        @delete="$emit('delete', $event)"
      />
    </v-list>
  </div>
</template>

<script setup lang="ts">
import NotificationItem from './NotificationItem.vue';
import type { NotificationContracts } from '@dailyuse/contracts';

type NotificationClientDTO = NotificationContracts.NotificationClientDTO;

interface Props {
  notifications: NotificationClientDTO[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

defineEmits<{
  'notification-click': [notification: NotificationClientDTO];
  'mark-read': [uuid: string];
  delete: [uuid: string];
}>();
</script>
