<template>
  <DuDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="title"
    :title-icon="titleIcon"
    :persistent="persistent"
    :loading="loading"
    :max-width="maxWidth"
    show-default-actions
    :cancel-text="cancelText"
    :confirm-text="confirmText"
    :confirm-color="confirmColor"
    :confirm-variant="confirmVariant"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="text-body-1">
      <v-icon v-if="messageIcon" :icon="messageIcon" :color="iconColor" class="me-3" size="large" />
      <slot>{{ message }}</slot>
    </div>

    <v-alert v-if="showWarning" type="warning" variant="tonal" class="mt-4" density="compact">
      {{ warningText }}
    </v-alert>
  </DuDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DuDialog from './DuDialog.vue';

interface Props {
  modelValue: boolean;
  title?: string;
  titleIcon?: string;
  message?: string;
  messageIcon?: string;
  iconColor?: string;
  maxWidth?: string | number;
  persistent?: boolean;
  loading?: boolean;

  // Actions
  cancelText?: string;
  confirmText?: string;
  confirmColor?: string;
  confirmVariant?: 'flat' | 'elevated' | 'tonal' | 'outlined' | 'text' | 'plain';

  // Warning
  showWarning?: boolean;
  warningText?: string;

  // Types
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: '确认操作',
  message: '您确定要执行此操作吗？',
  maxWidth: '400px',
  persistent: false,
  loading: false,
  cancelText: '取消',
  confirmText: '确定',
  confirmColor: 'primary',
  confirmVariant: 'elevated',
  showWarning: false,
  warningText: '此操作不可撤销，请谨慎操作。',
  type: 'info',
});

const emit = defineEmits<Emits>();

// 根据类型设置默认图标和颜色
const titleIcon = computed(() => {
  if (props.titleIcon) return props.titleIcon;
  switch (props.type) {
    case 'success':
      return 'mdi-check-circle';
    case 'warning':
      return 'mdi-alert';
    case 'error':
      return 'mdi-alert-circle';
    case 'info':
    default:
      return 'mdi-help-circle';
  }
});

const messageIcon = computed(() => {
  if (props.messageIcon) return props.messageIcon;
  switch (props.type) {
    case 'success':
      return 'mdi-check-circle-outline';
    case 'warning':
      return 'mdi-alert-outline';
    case 'error':
      return 'mdi-alert-circle-outline';
    case 'info':
    default:
      return 'mdi-information-outline';
  }
});

const iconColor = computed(() => {
  if (props.iconColor) return props.iconColor;
  switch (props.type) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'info':
    default:
      return 'info';
  }
});

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>
