<template>
  <v-badge
    :content="unreadCount"
    :model-value="hasUnread"
    color="error"
    overlap
  >
    <v-btn
      icon
      variant="text"
      @click="$emit('click')"
      :loading="loading"
    >
      <v-icon>mdi-bell</v-icon>
      <v-tooltip activator="parent" location="bottom">
        {{ hasUnread ? `${unreadCount} 条未读通知` : '通知' }}
      </v-tooltip>
    </v-btn>
  </v-badge>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  unreadCount?: number;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  unreadCount: 0,
  loading: false,
});

defineEmits<{
  click: [];
}>();

const hasUnread = computed(() => props.unreadCount > 0);
</script>
