<template>
  <v-dialog v-model="isOpen" max-width="600px" persistent>
    <template #activator="{ props }">
      <slot name="activator" :props="props">
        <v-btn color="primary" v-bind="props">
          <v-icon start>mdi-bullseye-arrow</v-icon>
          启用专注模式
        </v-btn>
      </slot>
    </template>

    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-h5">启用专注模式</span>
        <v-btn icon="mdi-close" variant="text" @click="handleClose"></v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pt-4">
        <v-form ref="formRef" v-model="isFormValid" @submit.prevent="handleSubmit">
          <!-- 目标选择 -->
          <v-select
            v-model="formData.focusedGoalUuids"
            :items="availableGoals"
            item-title="title"
            item-value="uuid"
            label="选择专注目标"
            placeholder="请选择 1-3 个目标"
            multiple
            chips
            closable-chips
            :rules="goalRules"
            :loading="isLoadingGoals"
            hint="选择 1-3 个你想要专注完成的目标"
            persistent-hint
          >
            <template #chip="{ item, props }">
              <v-chip v-bind="props" color="primary" size="small">
                {{ item.title }}
              </v-chip>
            </template>
          </v-select>

          <!-- 开始时间 -->
          <v-text-field
            v-model="formData.startTime"
            label="开始时间"
            type="datetime-local"
            :rules="startTimeRules"
            class="mt-4"
            hint="专注周期的开始时间"
            persistent-hint
          ></v-text-field>

          <!-- 结束时间 -->
          <v-text-field
            v-model="formData.endTime"
            label="结束时间"
            type="datetime-local"
            :rules="endTimeRules"
            class="mt-4"
            hint="专注周期的结束时间（建议 14-30 天）"
            persistent-hint
          ></v-text-field>

          <!-- 隐藏目标模式 -->
          <v-select
            v-model="formData.hiddenGoalsMode"
            :items="hiddenModeOptions"
            item-title="label"
            item-value="value"
            label="隐藏目标模式"
            :rules="[(v) => !!v || '请选择隐藏模式']"
            class="mt-4"
            hint="控制非专注目标的显示方式"
            persistent-hint
          >
            <template #item="{ item, props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon>{{ item.raw.icon }}</v-icon>
                </template>
                <v-list-item-title>{{ item.raw.label }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-select>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="handleClose" :disabled="isLoading">
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="handleSubmit"
          :loading="isLoading"
          :disabled="!isFormValid"
        >
          启用专注模式
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { GoalClientDTO, KeyResultClientDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';
import { useFocusMode } from '../composables/useFocusMode';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ActivateFocusModeDialog');

// ===== Props & Emits =====
interface Props {
  modelValue?: boolean;
  goals?: Array<{ uuid: string; title: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  goals: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  activated: [focusMode: FocusModeClientDTO];
}>();

// ===== Composables =====
const { activateFocusMode, isLoading: isFocusModeLoading } = useFocusMode();

// ===== 响应式状态 =====
const formRef = ref<any>(null);
const isFormValid = ref(false);
const isLoadingGoals = ref(false);

const formData = ref({
  focusedGoalUuids: [] as string[],
  startTime: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
  endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // +30天
  hiddenGoalsMode: 'hide_all' as HiddenGoalsMode,
});

// ===== 计算属性 =====
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isLoading = computed(() => isFocusModeLoading.value || isLoadingGoals.value);

const availableGoals = computed(() => {
  // TODO: 从后端获取目标列表
  // 当前使用 props 传入的目标
  return props.goals;
});

const hiddenModeOptions = [
  {
    value: 'hide_all',
    label: '隐藏所有',
    description: '隐藏所有非专注目标',
    icon: 'mdi-eye-off',
  },
  {
    value: 'hide_folder',
    label: '隐藏文件夹',
    description: '只隐藏非专注目标的文件夹层级',
    icon: 'mdi-folder-off',
  },
  {
    value: 'hide_none',
    label: '不隐藏',
    description: '仅标记专注目标，不隐藏其他目标',
    icon: 'mdi-eye',
  },
];

// ===== 表单验证规则 =====
const goalRules = [
  (v: string[]) => !!v && v.length > 0 || '至少选择 1 个目标',
  (v: string[]) => v.length <= 3 || '最多选择 3 个目标',
];

const startTimeRules = [
  (v: string) => !!v || '请选择开始时间',
  (v: string) => {
    const startTime = new Date(v).getTime();
    const now = Date.now();
    return startTime <= now + 24 * 60 * 60 * 1000 || '开始时间不能超过未来 24 小时';
  },
];

const endTimeRules = [
  (v: string) => !!v || '请选择结束时间',
  (v: string) => {
    const endTime = new Date(v).getTime();
    const startTime = new Date(formData.value.startTime).getTime();
    return endTime > startTime || '结束时间必须晚于开始时间';
  },
  (v: string) => {
    const endTime = new Date(v).getTime();
    const startTime = new Date(formData.value.startTime).getTime();
    const duration = endTime - startTime;
    const minDuration = 14 * 24 * 60 * 60 * 1000; // 14天
    return duration >= minDuration || '专注周期至少 14 天';
  },
];

// ===== 事件处理 =====

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!formRef.value) return;

  const { valid } = await formRef.value.validate();
  if (!valid) {
    logger.warn('Form validation failed');
    return;
  }

  try {
    const request: ActivateFocusModeRequest = {
      focusedGoalUuids: formData.value.focusedGoalUuids,
      startTime: new Date(formData.value.startTime).getTime(),
      endTime: new Date(formData.value.endTime).getTime(),
      hiddenGoalsMode: formData.value.hiddenGoalsMode,
    };

    logger.info('Submitting activate focus mode request', request);

    const focusMode = await activateFocusMode(request);

    emit('activated', focusMode);
    handleClose();
  } catch (err) {
    logger.error('Failed to activate focus mode', err);
  }
};

/**
 * 关闭对话框
 */
const handleClose = () => {
  isOpen.value = false;
  resetForm();
};

/**
 * 重置表单
 */
const resetForm = () => {
  formData.value = {
    focusedGoalUuids: [],
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    hiddenGoalsMode: 'hide_all',
  };
  formRef.value?.resetValidation();
};

// ===== Watchers =====
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      resetForm();
    }
  },
);
</script>

<style scoped>
.v-card-title {
  padding: 16px 24px;
}

.v-card-text {
  max-height: 60vh;
  overflow-y: auto;
}
</style>

