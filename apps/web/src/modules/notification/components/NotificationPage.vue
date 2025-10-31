<template>
  <v-container>
    <v-card>
      <v-card-title>通知中心</v-card-title>
      <v-card-text>
        <NotificationList
          :notifications="notifications"
          :loading="loading"
        />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import NotificationList from './NotificationList.vue';
import { useNotification } from '../composables/useNotification';

const { notifications, loading, loadNotifications } = useNotification();

onMounted(() => {
  loadNotifications();
});
</script>
