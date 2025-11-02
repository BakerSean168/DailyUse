<template>
  <v-snackbar
    v-model="snackbarStore.isVisible"
    :color="snackbarColor"
    :timeout="snackbarStore.persistent ? -1 : snackbarStore.timeout"
    location="top"
    :multi-line="message.length > 50"
    elevation="6"
    rounded="lg"
    data-testid="global-snackbar"
  >
    <div class="d-flex align-center">
      <v-icon :icon="snackbarIcon" class="me-3" size="small" />
      <span class="flex-grow-1">{{ message }}</span>

      <!-- 操作按钮 -->
      <v-btn
        v-if="snackbarStore.action"
        variant="text"
        size="small"
        color="white"
        class="ms-2"
        @click="handleAction"
      >
        {{ snackbarStore.action.text }}
      </v-btn>

      <!-- 关闭按钮 -->
      <v-btn
        v-if="snackbarStore.persistent"
        variant="text"
        size="small"
        color="white"
        icon="mdi-close"
        class="ms-2"
        @click="snackbarStore.hide"
      />
    </div>
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSnackbarStore } from '../stores/snackbarStore';

const snackbarStore = useSnackbarStore();

// 消息文本（支持长文本自动换行）
const message = computed(() => snackbarStore.message);

// 根据类型确定颜色
const snackbarColor = computed(() => {
  const colorMap = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };
  return colorMap[snackbarStore.type] || 'info';
});

// 根据类型确定图标
const snackbarIcon = computed(() => {
  const iconMap = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information',
  };
  return iconMap[snackbarStore.type] || 'mdi-information';
});

// 处理操作按钮点击
const handleAction = () => {
  if (snackbarStore.action?.handler) {
    snackbarStore.action.handler();
    snackbarStore.hide();
  }
};
</script>

<style scoped>
/* 自定义样式可以在这里添加 */
</style>
