<template>
  <div>
    <!-- Snackbar 消息提示 -->
    <v-snackbar
      v-model="snackbar.visible"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top"
      multi-line
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="closeSnackbar"> 关闭 </v-btn>
      </template>
    </v-snackbar>

    <!-- 确认对话框 -->
    <v-dialog v-model="dialog.visible" max-width="400" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon
            :icon="getDialogIcon(dialog.type)"
            :color="getDialogColor(dialog.type)"
            class="mr-2"
          />
          {{ dialog.title }}
        </v-card-title>

        <v-card-text>
          {{ dialog.message }}
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="handleDialogCancel"> 取消 </v-btn>
          <v-btn :color="getDialogColor(dialog.type)" variant="flat" @click="handleDialogConfirm">
            确定
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import { getGlobalMessage, type MessageType } from '../../composables/useMessage';

// 🔥 使用全局单例，确保所有地方调用的是同一个实例
const { snackbar, dialog, closeSnackbar, handleDialogConfirm, handleDialogCancel } = getGlobalMessage();

/**
 * 获取对话框图标
 */
const getDialogIcon = (type: MessageType): string => {
  const icons = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information',
  };
  return icons[type];
};

/**
 * 获取对话框颜色
 */
const getDialogColor = (type: MessageType): string => {
  const colors = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };
  return colors[type];
};
</script>

<style scoped>
.v-card-title {
  font-size: 1.25rem;
  font-weight: 500;
}
</style>
