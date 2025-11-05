<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-bell-outline</v-icon>
      提醒设置
      <!-- 验证状态指示器 -->
      <v-icon v-if="!isValid" color="error" class="ml-2">mdi-alert-circle</v-icon>
      <v-icon v-else color="success" class="ml-2">mdi-check-circle</v-icon>
    </v-card-title>
    <v-card-text>
      <!-- 显示验证错误 -->
      <v-alert v-if="errors.length > 0" type="error" variant="tonal" class="mb-4">
        <ul class="mb-0">
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </v-alert>

      <v-row>
        <v-col cols="12">
          <v-switch v-model="reminderEnabled" label="启用提醒" color="primary" />
        </v-col>

        <template v-if="reminderEnabled">
          <v-col cols="12" md="6">
            <v-text-field v-model.number="minutesBefore" label="提前提醒时间（分钟）" type="number" variant="outlined" min="1"
              max="1440" hint="在任务开始前多少分钟提醒" />
          </v-col>

          <v-col cols="12" md="6">
            <v-select v-model="selectedMethods" label="提醒方式" :items="reminderMethods" variant="outlined" multiple chips
              closable-chips />
          </v-col>
        </template>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useReminderValidation } from '../../../composables/useReminderValidation';
import type { TaskTemplate } from '@dailyuse/domain-client';

interface Props {
  modelValue: TaskTemplate;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: TaskTemplate];
  'update:validation': [isValid: boolean];
}>();

const updateTemplate = (updater: (template: TaskTemplate) => void) => {
  const updatedTemplate = props.modelValue.clone();
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

// TODO: 提醒配置字段需要重构以匹配新的 TaskReminderConfig 结构（使用 triggers 数组）
// 当前代码使用旧的 enabled/minutesBefore/methods 结构，需要更新为 triggers 数组
const reminderEnabled = computed({
  get: () => (props.modelValue.reminderConfig as any)?.enabled ?? false,
  set: (value: boolean) => {
    updateTemplate((template) => {
      (template as any)._reminderConfig = {
        ...template.reminderConfig,
        enabled: value,
      };
    });
  },
});

const minutesBefore = computed({
  get: () => (props.modelValue.reminderConfig as any)?.minutesBefore ?? 15,
  set: (value: number) => {
    updateTemplate((template) => {
      (template as any)._reminderConfig = {
        ...template.reminderConfig,
        minutesBefore: value,
      };
    });
  },
});

const selectedMethods = computed({
  get: () => (props.modelValue.reminderConfig as any)?.methods ?? [],
  set: (value: ('notification' | 'sound')[]) => {
    updateTemplate((template) => {
      (template as any)._reminderConfig = {
        ...template.reminderConfig,
        methods: value,
      };
    });
  },
});

// 提醒方式选项
const reminderMethods = [
  { title: '通知', value: 'notification' },
  { title: '声音', value: 'sound' },
];

// 简单的验证
const errors = ref<string[]>([]);

const validateReminderConfig = () => {
  errors.value = [];

  if (reminderEnabled.value) {
    if (minutesBefore.value < 1 || minutesBefore.value > 1440) {
      errors.value.push('提前提醒时间必须在1-1440分钟之间');
    }

    if (!selectedMethods.value || selectedMethods.value.length === 0) {
      errors.value.push('请至少选择一种提醒方式');
    }
  }
};

const isValid = computed(() => {
  return errors.value.length === 0;
});

// 监听验证状态变化
watch(
  isValid,
  (newValue) => {
    emit('update:validation', newValue);
  },
  { immediate: true },
);

// 监听提醒配置变化
watch(
  () => props.modelValue.reminderConfig,
  () => {
    validateReminderConfig();
  },
  { deep: true, immediate: true },
);
</script>
