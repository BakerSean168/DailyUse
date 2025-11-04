<!-- widgets/RecurrenceSection.vue -->
<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-repeat</v-icon>
      调度配置
    </v-card-title>
    <v-card-text>
      <!-- 显示验证错误 -->
      <v-alert v-if="validationErrors.length > 0" type="error" variant="tonal" class="mb-4">
        <ul class="mb-0">
          <li v-for="error in validationErrors" :key="error">{{ error }}</li>
        </ul>
      </v-alert>

      <!-- 显示调度规则描述 -->
      <v-alert v-if="isValid && scheduleMode !== 'once'" type="info" variant="tonal" class="mb-4">
        当前设置：{{ getScheduleDescription }}
      </v-alert>

      <v-row>
        <v-col cols="12" md="6">
          <v-select v-model="scheduleMode" label="调度模式" :items="scheduleModes" variant="outlined" />
        </v-col>

        <!-- 间隔天数（当模式为intervalDays时） -->
        <v-col cols="12" md="6" v-if="scheduleMode === 'intervalDays'">
          <v-text-field v-model.number="intervalDays" label="间隔天数" type="number" variant="outlined" min="1" max="365" />
        </v-col>

        <!-- 每周重复的星期选择 -->
        <v-col cols="12" v-if="scheduleMode === 'weekly'">
          <WeekdaySelector v-model="selectedWeekdays" @update:model-value="updateWeekdays" />
        </v-col>

        <!-- 每月重复的日期选择 -->
        <v-col cols="12" v-if="scheduleMode === 'monthly'">
          <MonthDaySelector v-model="selectedMonthDays" @update:model-value="updateMonthDays" />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { TaskTemplate } from '@dailyuse/domain-client';
import { computed, ref, watch } from 'vue';
import { TaskContracts } from '@dailyuse/contracts';

import WeekdaySelector from '../widgets/WeekdaySelector.vue';
import MonthDaySelector from '../widgets/MonthDaySelector.vue';

interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
  (e: 'update:validation', isValid: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const updateTemplate = (updater: (template: TaskTemplate) => void) => {
  const updatedTemplate = props.modelValue.clone();
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

// TODO: 此组件需要完全重构
// TaskTimeConfig 不再包含 schedule 字段，应该使用 template.recurrenceRule (RecurrenceRule) 来处理重复规则
// RecurrenceRule 有自己的结构： frequency, interval, byWeekday, byMonthDay 等
// 暂时保留旧代码以防止编译错误，但功能已失效

// 调度模式
const scheduleMode = computed({
  get: () => (props.modelValue.timeConfig as any)?.schedule?.mode ?? 'once',
  set: (value: TaskContracts.TaskScheduleMode | string) => {
    updateTemplate((template) => {
      (template as any)._timeConfig = {
        ...template.timeConfig,
        schedule: {
          mode: value,
          // 根据模式清理其他字段
          ...((value as string) === 'intervalDays' ? { intervalDays: 1 } : {}),
          ...((value as string) === 'weekly' ? { weekdays: [] } : {}),
          ...((value as string) === 'monthly' ? { monthDays: [] } : {}),
        },
      };
    });
  },
});

// 间隔天数
const intervalDays = computed({
  get: () => (props.modelValue.timeConfig as any)?.schedule?.intervalDays || 1,
  set: (value: number) => {
    updateTemplate((template) => {
      (template as any)._timeConfig = {
        ...template.timeConfig,
        schedule: {
          ...(template.timeConfig as any).schedule,
          intervalDays: value,
        },
      };
    });
  },
});

// 选中的星期几
const selectedWeekdays = ref<number[]>([]);

// 选中的月日期
const selectedMonthDays = ref<number[]>([]);

// 表单选项
const scheduleModes = [
  { title: '单次任务', value: 'once' },
  { title: '每日', value: 'daily' },
  { title: '每周', value: 'weekly' },
  { title: '每月', value: 'monthly' },
  { title: '间隔天数', value: 'intervalDays' },
];

// 验证相关 - 暂时简化
const isValid = ref(true);
const validationErrors = ref<string[]>([]);
const getScheduleDescription = computed(() => {
  const schedule = (props.modelValue.timeConfig as any)?.schedule || {};
  switch (schedule.mode) {
    case 'once':
      return '单次任务';
    case 'daily':
      return '每日重复';
    case 'weekly':
      return `每周重复${schedule.weekdays?.length ? ` (${schedule.weekdays.join(',')})` : ''}`;
    case 'monthly':
      return `每月重复${schedule.monthDays?.length ? ` (${schedule.monthDays.join(',')})` : ''}`;
    case 'intervalDays':
      return `每${schedule.intervalDays || 1}天重复`;
    default:
      return '未配置';
  }
});

// 更新星期几选择
const updateWeekdays = (weekdays: number[]) => {
  selectedWeekdays.value = [...weekdays];
  updateTemplate((template) => {
    (template as any)._timeConfig = {
      ...template.timeConfig,
      schedule: {
        ...(template.timeConfig as any).schedule,
        weekdays: [...weekdays],
      },
    };
  });
};

// 更新月日期选择
const updateMonthDays = (monthDays: number[]) => {
  selectedMonthDays.value = [...monthDays];
  updateTemplate((template) => {
    (template as any)._timeConfig = {
      ...template.timeConfig,
      schedule: {
        ...(template.timeConfig as any).schedule,
        monthDays: [...monthDays],
      },
    };
  });
};

// 初始化数据
const initializeData = () => {
  const schedule = (props.modelValue.timeConfig as any)?.schedule;
  if (schedule?.weekdays) {
    selectedWeekdays.value = [...schedule.weekdays];
  }
  if (schedule?.monthDays) {
    selectedMonthDays.value = [...schedule.monthDays];
  }
};

watch(
  isValid,
  (newValue) => {
    emit('update:validation', newValue);
  },
  { immediate: true },
);

watch(
  () => (props.modelValue.timeConfig as any)?.schedule,
  () => {
    // 简单验证
    isValid.value = true;
    validationErrors.value = [];
    initializeData();
  },
  { deep: true, immediate: true },
);
</script>

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>
