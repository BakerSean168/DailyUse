<template>
  <v-list-item
    :class="{ 'bg-blue-50': !notification.isRead }"
    @click="handleClick"
    class="notification-item"
  >
    <template #prepend>
      <v-avatar :color="typeColor" size="40">
        <v-icon :icon="typeIcon" color="white" />
      </v-avatar>
    </template>

    <v-list-item-title class="d-flex align-center">
      <span :class="{ 'font-weight-bold': !notification.isRead }">
        {{ notification.title }}
      </span>
      <v-chip
        v-if="notification.importance === 'HIGH' || notification.importance === 'CRITICAL'"
        size="x-small"
        :color="priorityColor"
        class="ml-2"
      >
        {{ priorityText }}
      </v-chip>
    </v-list-item-title>

    <v-list-item-subtitle class="mt-1">
      {{ notification.content }}
    </v-list-item-subtitle>

    <v-list-item-subtitle class="mt-1 text-caption text-grey">
      {{ timeDisplay }}
    </v-list-item-subtitle>

    <template #append>
      <div class="d-flex flex-column ga-1">
        <v-btn
          v-if="!notification.isRead"
          icon="mdi-check"
          size="small"
          variant="text"
          @click.stop="handleMarkRead"
        >
          <v-icon size="small" />
          <v-tooltip activator="parent" location="left">标记已读</v-tooltip>
        </v-btn>
        <v-btn
          icon="mdi-delete"
          size="small"
          variant="text"
          color="error"
          @click.stop="handleDelete"
        >
          <v-icon size="small" />
          <v-tooltip activator="parent" location="left">删除</v-tooltip>
        </v-btn>
      </div>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { NotificationContracts } from '@dailyuse/contracts';

type NotificationClientDTO = NotificationContracts.NotificationClientDTO;

interface Props {
  notification: NotificationClientDTO;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [notification: NotificationClientDTO];
  'mark-read': [uuid: string];
  delete: [uuid: string];
}>();

// 类型图标映射
const typeIconMap: Record<string, string> = {
  SYSTEM: 'mdi-information-outline',
  TASK: 'mdi-checkbox-marked-circle-outline',
  GOAL: 'mdi-target',
  REMINDER: 'mdi-bell-ring-outline',
  SCHEDULE: 'mdi-calendar-clock',
};

// 类型颜色映射
const typeColorMap: Record<string, string> = {
  SYSTEM: 'blue',
  TASK: 'green',
  GOAL: 'orange',
  REMINDER: 'purple',
  SCHEDULE: 'cyan',
};

const typeIcon = computed(() => typeIconMap[props.notification.type] || 'mdi-bell');
const typeColor = computed(() => typeColorMap[props.notification.type] || 'grey');

const priorityColor = computed(() => {
  switch (props.notification.importance) {
    case 'CRITICAL':
    case 'HIGH':
      return 'error';
    case 'NORMAL':
      return 'warning';
    default:
      return 'grey';
  }
});

const priorityText = computed(() => {
  switch (props.notification.importance) {
    case 'CRITICAL':
      return '紧急';
    case 'HIGH':
      return '重要';
    default:
      return '';
  }
});

const timeDisplay = computed(() => {
  try {
    return formatDistanceToNow(new Date(props.notification.createdAt), {
      addSuffix: true,
      locale: zhCN,
    });
  } catch {
    return props.notification.createdAt;
  }
});

function handleClick() {
  emit('click', props.notification);
}

function handleMarkRead() {
  emit('mark-read', props.notification.uuid);
}

function handleDelete() {
  emit('delete', props.notification.uuid);
}
</script>

<style scoped>
.notification-item {
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
