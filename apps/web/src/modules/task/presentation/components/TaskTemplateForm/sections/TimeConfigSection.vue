<!--
  TimeConfigSection.vue
  任务模板时间配置部分
  重构：使用新的 TaskTimeConfig 结构
-->
<template>
  <v-card>
    <v-card-title>⏰ 时间配置</v-card-title>
    <v-card-text>
      <!-- 时间类型选择 -->
      <v-radio-group v-model="timeType" label="时间类型" @update:model-value="handleTimeTypeChange">
        <v-radio label="全天" :value="TimeType.ALL_DAY"></v-radio>
        <v-radio label="时间点" :value="TimeType.timePoint"></v-radio>
        <v-radio label="时间段" :value="TimeType.timeRange"></v-radio>
      </v-radio-group>

      <!-- 日期范围 -->
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field v-model="startDate" label="开始日期" type="date" variant="outlined" density="comfortable"
            @update:model-value="handleDateChange"></v-text-field>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field v-model="endDate" label="结束日期" type="date" variant="outlined" density="comfortable"
            @update:model-value="handleDateChange"></v-text-field>
        </v-col>
      </v-row>

      <!-- 时间点输入 (仅当选择 timePoint 时显示) -->
      <v-row v-if="timeType === TimeType.timePoint">
        <v-col cols="12">
          <v-text-field v-model="timePoint" label="具体时间" type="time" variant="outlined" density="comfortable"
            hint="格式: HH:MM" @update:model-value="handleTimePointChange"></v-text-field>
        </v-col>
      </v-row>

      <!-- 时间段输入 (仅当选择 timeRange 时显示) -->
      <v-row v-if="timeType === TimeType.timeRange">
        <v-col cols="12" md="6">
          <v-text-field v-model="timeRangeStart" label="开始时间" type="time" variant="outlined" density="comfortable"
            hint="格式: HH:MM" @update:model-value="handleTimeRangeChange"></v-text-field>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field v-model="timeRangeEnd" label="结束时间" type="time" variant="outlined" density="comfortable"
            hint="格式: HH:MM" @update:model-value="handleTimeRangeChange"></v-text-field>
        </v-col>
      </v-row>

      <!-- 验证提示 -->
      <v-alert v-if="validationError" type="error" density="compact" class="mt-2">
        {{ validationError }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { TaskTemplate, TaskTimeConfig } from '@dailyuse/domain-client';
import { TaskContracts } from '@dailyuse/contracts';

const TimeType = TaskContracts.TimeType;

const props = defineProps<{
  modelValue: TaskTemplate;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: TaskTemplate): void;
  (e: 'update:validation', valid: boolean): void;
}>();

// 表单数据
const timeType = ref<TaskContracts.TimeType>(TimeType.ALL_DAY);
const startDate = ref<string>('');
const endDate = ref<string>('');
const timePoint = ref<string>('');
const timeRangeStart = ref<string>('');
const timeRangeEnd = ref<string>('');
const validationError = ref<string>('');

/**
 * 初始化表单数据
 */
const initializeFormData = () => {
  const config = props.modelValue.timeConfig;

  if (!config) {
    // 默认配置
    timeType.value = TimeType.ALL_DAY;
    startDate.value = '';
    endDate.value = '';
    timePoint.value = '';
    timeRangeStart.value = '';
    timeRangeEnd.value = '';
    return;
  }

  timeType.value = config.timeType;

  // 日期范围
  if (config.startDate) {
    startDate.value = formatDateToInput(config.startDate);
  }
  if (config.endDate) {
    endDate.value = formatDateToInput(config.endDate);
  }

  // 时间点
  if (config.timeType === TimeType.timePoint && config.timePoint) {
    timePoint.value = formatTimeToInput(config.timePoint);
  }

  // 时间段
  if (config.timeType === TimeType.timeRange && config.timeRange) {
    timeRangeStart.value = formatTimeToInput(config.timeRange.start);
    timeRangeEnd.value = formatTimeToInput(config.timeRange.end);
  }
};

/**
 * 格式化日期为 input[type=date] 格式
 */
const formatDateToInput = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
};

/**
 * 格式化时间为 input[type=time] 格式
 */
const formatTimeToInput = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toTimeString().slice(0, 5); // HH:MM
};

/**
 * 解析日期字符串为时间戳
 */
const parseDateInput = (dateStr: string): number | null => {
  if (!dateStr) return null;
  return new Date(dateStr).getTime();
};

/**
 * 解析时间字符串为时间戳 (使用今天的日期)
 */
const parseTimeInput = (timeStr: string): number | null => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};

/**
 * 处理时间类型变更
 */
const handleTimeTypeChange = () => {
  updateTimeConfig();
};

/**
 * 处理日期变更
 */
const handleDateChange = () => {
  updateTimeConfig();
};

/**
 * 处理时间点变更
 */
const handleTimePointChange = () => {
  updateTimeConfig();
};

/**
 * 处理时间段变更
 */
const handleTimeRangeChange = () => {
  updateTimeConfig();
};

/**
 * 更新时间配置
 */
const updateTimeConfig = () => {
  try {
    validationError.value = '';

    // 构建新的时间配置
    const newConfig: TaskContracts.TaskTimeConfigClientDTO = {
      timeType: timeType.value,
      startDate: parseDateInput(startDate.value),
      endDate: parseDateInput(endDate.value),
      timePoint: timeType.value === TimeType.timePoint ? parseTimeInput(timePoint.value) : null,
      timeRange:
        timeType.value === TimeType.timeRange && timeRangeStart.value && timeRangeEnd.value
          ? {
            start: parseTimeInput(timeRangeStart.value)!,
            end: parseTimeInput(timeRangeEnd.value)!,
          }
          : null,
      timeTypeText: '',
      formattedStartDate: '',
      formattedEndDate: '',
      formattedTimePoint: '',
      formattedTimeRange: '',
      displayText: '',
      hasDateRange: false,
    };

    // 验证
    if (timeType.value === TimeType.timePoint && !newConfig.timePoint) {
      validationError.value = '请输入具体时间';
      emit('update:validation', false);
      return;
    }

    if (timeType.value === TimeType.timeRange && !newConfig.timeRange) {
      validationError.value = '请输入完整的时间段';
      emit('update:validation', false);
      return;
    } if (
      timeType.value === TimeType.timeRange &&
      newConfig.timeRange &&
      newConfig.timeRange.start >= newConfig.timeRange.end
    ) {
      validationError.value = '结束时间必须晚于开始时间';
      emit('update:validation', false);
      return;
    }

    // 创建新的 TaskTimeConfig 值对象
    const newTimeConfig = TaskTimeConfig.fromClientDTO(newConfig);

    // 使用 TaskTemplate 的更新方法
    props.modelValue.updateTimeConfig(newTimeConfig);

    // 发出验证成功事件
    emit('update:validation', true);
  } catch (error) {
    console.error('更新时间配置失败:', error);
    validationError.value = error instanceof Error ? error.message : '更新失败';
    emit('update:validation', false);
  }
};

// 初始化
onMounted(() => {
  initializeFormData();
});

// 监听模板变化
watch(
  () => props.modelValue,
  () => {
    initializeFormData();
  },
  { deep: true },
);
</script>

<style scoped>
.v-card {
  margin-bottom: 16px;
}
</style>
