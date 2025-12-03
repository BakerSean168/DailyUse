<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :width="width"
    :max-width="maxWidth"
    :persistent="persistent"
    :no-click-animation="noClickAnimation"
  >
    <v-card :class="cardClass">
      <!-- Header -->
      <v-card-title v-if="title || $slots.title" class="d-flex align-center">
        <v-icon v-if="titleIcon" :icon="titleIcon" class="me-3" />
        <span class="flex-grow-1">
          <slot name="title">{{ title }}</slot>
        </span>
        <v-btn
          v-if="showCloseButton"
          icon="mdi-close"
          variant="text"
          size="small"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>

      <v-divider v-if="showDivider && (title || $slots.title)" />

      <!-- Content -->
      <v-card-text v-if="$slots.default" :class="contentClass">
        <slot />
      </v-card-text>

      <!-- Actions -->
      <v-card-actions v-if="$slots.actions" :class="actionsClass">
        <slot name="actions" />
      </v-card-actions>

      <!-- Default Actions -->
      <v-card-actions v-else-if="showDefaultActions" class="justify-end">
        <v-btn v-if="showCancelButton" variant="text" @click="handleCancel" :disabled="loading">
          {{ cancelText }}
        </v-btn>
        <v-btn
          v-if="showConfirmButton"
          :color="confirmColor"
          :variant="confirmVariant"
          @click="handleConfirm"
          :loading="loading"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
  title?: string;
  titleIcon?: string;
  width?: string | number;
  maxWidth?: string | number;
  persistent?: boolean;
  noClickAnimation?: boolean;
  showCloseButton?: boolean;
  showDivider?: boolean;
  cardClass?: string;
  contentClass?: string;
  actionsClass?: string;

  // Default actions
  showDefaultActions?: boolean;
  showCancelButton?: boolean;
  showConfirmButton?: boolean;
  cancelText?: string;
  confirmText?: string;
  confirmColor?: string;
  confirmVariant?: 'flat' | 'elevated' | 'tonal' | 'outlined' | 'text' | 'plain';
  loading?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  width: 'auto',
  maxWidth: '500px',
  persistent: false,
  noClickAnimation: false,
  showCloseButton: true,
  showDivider: true,
  showDefaultActions: false,
  showCancelButton: true,
  showConfirmButton: true,
  cancelText: '取消',
  confirmText: '确定',
  confirmColor: 'primary',
  confirmVariant: 'elevated',
  loading: false,
});

const emit = defineEmits<Emits>();

const handleCancel = () => {
  emit('cancel');
  emit('update:modelValue', false);
};

const handleConfirm = () => {
  emit('confirm');
};
</script>
