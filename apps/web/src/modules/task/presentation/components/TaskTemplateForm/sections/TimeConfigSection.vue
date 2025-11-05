<!-- widgets/TimeConfigSection.vue -->
<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-clock-outline</v-icon>
      时间配置
    </v-card-title>
    <v-card-text>
      <!-- 显示验证错误 -->
      <v-alert v-if="!isValid" type="error" variant="tonal" class="mb-4">
        <ul class="mb-0">
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </v-alert>
      <!-- 显示警告信息 -->
      <v-alert v-if="hasWarnings" type="warning" variant="tonal" class="mb-4">
        <ul class="mb-0">
          <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
        </ul>
      </v-alert>

      <!-- 第一部分：日期配置 -->
      <v-row class="mb-4">
        <v-col cols="12">
          <h4 class="subsection-title">📅 日期范围</h4>
        </v-col>

        <!-- 开始日期 -->
        <v-col cols="12" md="6">
          <v-text-field v-model="startDateInput" label="开始日期" type="date" variant="outlined" required
            prepend-inner-icon="mdi-calendar" @update:model-value="updateStartDate" />
        </v-col>

        <!-- 无期限选项 -->
        <v-col cols="12" md="6">
          <v-switch v-model="isNoEndDate" label="无结束日期（长期任务）" color="primary" hide-details class="mt-2" />
        </v-col>

        <!-- 结束日期 -->
        <v-col cols="12" md="6" v-if="!isNoEndDate">
          <v-text-field v-model="endDateInput" label="结束日期" type="date" variant="outlined"
            prepend-inner-icon="mdi-calendar-end" hint="留空表示无结束日期" @update:model-value="updateEndDate" />
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <!-- 第二部分：时间类型和时间设置 -->
      <v-row>
        <v-col cols="12">
          <h4 class="subsection-title">⏰ 每日时间设置</h4>
        </v-col>

        <!-- 时间类型选择 -->
        <v-col cols="12">
          <v-radio-group v-model="timeType" label="时间类型" inline>
            <v-radio label="全天任务" value="ALL_DAY">
              <template #label>
                <span class="d-flex align-center">
                  <v-icon class="mr-2" size="small">mdi-weather-sunny</v-icon>
                  全天任务
                </span>
              </template>
            </v-radio>
            <v-radio label="指定时间" value="TIME_POINT">
              <template #label>
                <span class="d-flex align-center">
                  <v-icon class="mr-2" size="small">mdi-clock</v-icon>
                  指定时间
                </span>
              </template>
            </v-radio>
            <v-radio label="时间段" value="TIME_RANGE">
              <template #label>
                <span class="d-flex align-center">
                  <v-icon class="mr-2" size="small">mdi-clock-time-eight</v-icon>
                  时间段
                </span>
              </template>
            </v-radio>
          </v-radio-group>
        </v-col>

        <!-- 时间设置说明 -->
        <v-col cols="12" v-if="timeType === 'ALL_DAY'">
          <v-alert type="info" density="compact" variant="tonal">
            <v-icon start>mdi-information-outline</v-icon>
            全天任务不需要设置具体时间，将在当天任意时间执行
          </v-alert>
        </v-col>

        <!-- 开始时间（非全天任务） -->
        <v-col cols="12" md="6" v-if="timeType !== 'ALL_DAY'">
          <v-text-field v-model="startTimeInput" label="开始时间" type="time" variant="outlined" required
            prepend-inner-icon="mdi-clock-start" @update:model-value="updateStartTime" />
        </v-col>

        <!-- 结束时间（仅时间段类型） -->
        <v-col cols="12" md="6" v-if="timeType === 'TIME_RANGE'">
          <v-text-field v-model="endTimeInput" label="结束时间" type="time" variant="outlined"
            prepend-inner-icon="mdi-clock-end" hint="必须在同一天内" @update:model-value="updateEndTime" />
        </v-col>

        <!-- 时间段提示 -->
        <v-col cols="12" v-if="timeType === 'TIME_RANGE'">
          <v-alert type="info" density="compact" variant="tonal">
            <v-icon start>mdi-information-outline</v-icon>
            时间段任务将在指定的时间范围内进行，请确保结束时间晚于开始时间
          </v-alert>
        </v-col>

        <!-- 时区设置 -->
        <v-col cols="12" md="6">
          <v-select v-model="timezone" :items="timezoneOptions" label="时区" variant="outlined"
            prepend-inner-icon="mdi-earth" item-title="text" item-value="value" />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { TaskTemplate } from '@dailyuse/domain-client';
import { TaskTimeConfig } from '@dailyuse/domain-client';
import { computed, ref, watch } from 'vue';
import { useTimeConfigValidation } from '@/modules/task/presentation/composables/useTimeConfigValidation';
import type { TaskContracts } from '@dailyuse/contracts';

interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
  (e: 'update:validation', isValid: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 时区选项（保留UI，但不实际使用）
const timezoneOptions = [
  { text: '北京时间 (GMT+8)', value: 'Asia/Shanghai' },
  { text: 'UTC 标准时间', value: 'UTC' },
  { text: '纽约时间 (GMT-5)', value: 'America/New_York' },
  { text: '伦敦时间 (GMT+0)', value: 'Europe/London' },
  { text: '东京时间 (GMT+9)', value: 'Asia/Tokyo' },
];

// 更新模板的辅助函数
const updateTemplate = (updater: (template: TaskTemplate) => void) => {
  const updatedTemplate = props.modelValue.clone();
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

// 使用时间配置验证
const { isValid, hasWarnings, errors, warnings, validateTimeConfig } = useTimeConfigValidation();

// 表单输入字段
const startDateInput = ref('');
const startTimeInput = ref('');
const endDateInput = ref('');
const endTimeInput = ref('');

// 时间类型控制
const timeType = computed({
  get: () => props.modelValue.timeConfig.timeType,
  set: (newType: TaskContracts.TimeType) => {
    updateTemplate((template) => {
      const currentConfig = template.timeConfig;

      // 根据新类型创建新的 timeConfig
      const newConfig = TaskTimeConfig.fromClientDTO({
        timeType: newType,
        startDate: currentConfig.startDate,
        endDate: currentConfig.endDate,
        // 根据类型清理不相关的时间字段
        timePoint: newType === 'TIME_POINT' ? currentConfig.timePoint : null,
        timeRange: newType === 'TIME_RANGE' ? currentConfig.timeRange : null,
      } as any);

      template.updateTimeConfig(newConfig);

      // 清空对应的表单输入
      if (newType === 'ALL_DAY') {
        startTimeInput.value = '';
        endTimeInput.value = '';
      } else if (newType === 'TIME_POINT') {
        endTimeInput.value = '';
      }
    });
  },
});

// 时区控制（仅用于UI显示，不影响数据）
const timezone = computed({
  get: () => 'Asia/Shanghai',
  set: (_newTimezone: string) => {
    // TimeConfig 不再存储时区信息
  },
});

// 无期限任务控制
const isNoEndDate = computed({
  get: () => !props.modelValue.timeConfig.endDate,
  set: (value: boolean) => {
    if (value) {
      // 清除结束日期
      updateEndDate('');
    } else {
      // 设置默认结束日期（30天后）
      const defaultEndDate = new Date();
      defaultEndDate.setDate(defaultEndDate.getDate() + 30);
      endDateInput.value = formatDateToInput(defaultEndDate);
      updateEndDate(endDateInput.value);
    }
  },
});

// 格式化日期为输入格式 (YYYY-MM-DD)
const formatDateToInput = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

// 格式化时间为输入格式 (HH:MM)
const formatTimeToInput = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toTimeString().slice(0, 5);
};

// 日期更新方法
const updateStartDate = (dateStr: string) => {
  if (!dateStr) return;

  updateTemplate((template) => {
    const date = new Date(dateStr);
    const timestamp = date.getTime();

    const newConfig = TaskTimeConfig.fromClientDTO({
      timeType: template.timeConfig.timeType,
      startDate: timestamp,
      endDate: template.timeConfig.endDate,
      timePoint: template.timeConfig.timePoint,
      timeRange: template.timeConfig.timeRange,
    } as any);

    template.updateTimeConfig(newConfig);
  });
};

const updateEndDate = (dateStr: string) => {
  updateTemplate((template) => {
    const timestamp = dateStr ? new Date(dateStr).getTime() : null;

    const newConfig = TaskTimeConfig.fromClientDTO({
      timeType: template.timeConfig.timeType,
      startDate: template.timeConfig.startDate,
      endDate: timestamp,
      timePoint: template.timeConfig.timePoint,
      timeRange: template.timeConfig.timeRange,
    } as any);

    template.updateTimeConfig(newConfig);
  });
};

// 时间更新方法
const updateStartTime = (timeStr: string) => {
  if (!timeStr) return;

  updateTemplate((template) => {
    const currentType = template.timeConfig.timeType;

    // 将时间字符串转换为今天的时间戳
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    const timestamp = date.getTime();

    if (currentType === 'TIME_POINT') {
      // 更新 timePoint
      const newConfig = TaskTimeConfig.fromClientDTO({
        timeType: currentType,
        startDate: template.timeConfig.startDate,
        endDate: template.timeConfig.endDate,
        timePoint: timestamp,
        timeRange: null,
      } as any);
      template.updateTimeConfig(newConfig);
    } else if (currentType === 'TIME_RANGE') {
      // 更新 timeRange.start
      const currentEnd = template.timeConfig.timeRange?.end || timestamp + 3600000; // 默认1小时后
      const newConfig = TaskTimeConfig.fromClientDTO({
        timeType: currentType,
        startDate: template.timeConfig.startDate,
        endDate: template.timeConfig.endDate,
        timePoint: null,
        timeRange: { start: timestamp, end: currentEnd },
      } as any);
      template.updateTimeConfig(newConfig);
    }
  });
};

const updateEndTime = (timeStr: string) => {
  if (!timeStr) return;

  updateTemplate((template) => {
    if (template.timeConfig.timeType !== 'TIME_RANGE') return;

    // 将时间字符串转换为今天的时间戳
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    const timestamp = date.getTime();

    const currentStart = template.timeConfig.timeRange?.start || timestamp - 3600000; // 默认1小时前

    const newConfig = TaskTimeConfig.fromClientDTO({
      timeType: template.timeConfig.timeType,
      startDate: template.timeConfig.startDate,
      endDate: template.timeConfig.endDate,
      timePoint: null,
      timeRange: { start: currentStart, end: timestamp },
    } as any);

    template.updateTimeConfig(newConfig);
  });
};

// 初始化表单数据
const initializeFormData = () => {
  const config = props.modelValue?.timeConfig;
  if (!config) return;

  // 初始化日期字段
  if (config.startDate) {
    startDateInput.value = formatDateToInput(config.startDate);
  }

  if (config.endDate) {
    endDateInput.value = formatDateToInput(config.endDate);
  }

  // 初始化时间字段
  if (config.timeType === 'TIME_POINT' && config.timePoint) {
    startTimeInput.value = formatTimeToInput(config.timePoint);
  } else if (config.timeType === 'TIME_RANGE' && config.timeRange) {
    startTimeInput.value = formatTimeToInput(config.timeRange.start);
    endTimeInput.value = formatTimeToInput(config.timeRange.end);
  }
};

// 监听时间配置变化，触发验证
watch(
  () => props.modelValue.timeConfig,
  () => {
    const valid = validateTimeConfig(props.modelValue.timeConfig);
    emit('update:validation', valid);
  },
  { deep: true, immediate: true },
);

// 监听模板变化，初始化表单数据
watch(
  () => props.modelValue,
  () => {
    initializeFormData();
  },
  { immediate: true },
);

// 监听无期限开关，自动清空结束日期输入框
watch(isNoEndDate, (newValue) => {
  if (newValue) {
    endDateInput.value = '';
  }
});
</script>

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>
