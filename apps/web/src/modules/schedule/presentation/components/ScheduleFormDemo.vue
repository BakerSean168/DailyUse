<template>
  <v-card class="pa-4">
    <v-card-title class="text-h5 mb-4">
      <v-icon class="mr-2">mdi-calendar-plus</v-icon>
      创建日程 (冲突检测演示)
    </v-card-title>

    <v-form @submit.prevent="handleSubmit">
      <v-row>
        <!-- 标题 -->
        <v-col cols="12">
          <v-text-field
            v-model="form.title"
            label="日程标题 *"
            placeholder="例如：团队会议"
            variant="outlined"
            density="comfortable"
            :rules="[rules.required]"
            required
          />
        </v-col>

        <!-- 描述 -->
        <v-col cols="12">
          <v-textarea
            v-model="form.description"
            label="描述"
            placeholder="日程详细说明（可选）"
            variant="outlined"
            density="comfortable"
            rows="3"
          />
        </v-col>

        <!-- 开始时间 -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="startTimeFormatted"
            label="开始时间 *"
            type="datetime-local"
            variant="outlined"
            density="comfortable"
            :rules="[rules.required]"
            @change="handleStartTimeChange"
            required
          />
        </v-col>

        <!-- 结束时间 -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="endTimeFormatted"
            label="结束时间 *"
            type="datetime-local"
            variant="outlined"
            density="comfortable"
            :rules="[rules.required, rules.endAfterStart]"
            @change="handleEndTimeChange"
            required
          />
        </v-col>

        <!-- 时长显示 -->
        <v-col cols="12">
          <v-chip
            v-if="form.duration > 0"
            color="primary"
            variant="tonal"
            size="small"
          >
            <v-icon start size="small">mdi-clock-outline</v-icon>
            时长: {{ formatDuration(form.duration) }}
          </v-chip>
        </v-col>

        <!-- 优先级 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="form.priority"
            label="优先级"
            :items="priorityOptions"
            variant="outlined"
            density="comfortable"
          />
        </v-col>

        <!-- 地点 -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.location"
            label="地点"
            placeholder="例如：会议室A"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
      </v-row>

      <!-- 冲突检测警告组件 (Story 9.6) -->
      <schedule-conflict-alert
        :conflicts="schedule.conflicts.value"
        :is-loading="schedule.isDetectingConflicts.value"
        :error="schedule.conflictError.value"
        @apply-suggestion="handleApplySuggestion"
        @ignore-conflict="handleIgnoreConflict"
      />

      <!-- 操作按钮 -->
      <v-card-actions class="px-0 pt-4">
        <v-btn
          variant="text"
          @click="handleReset"
        >
          重置
        </v-btn>
        <v-spacer />
        <v-btn
          type="submit"
          color="primary"
          variant="flat"
          :loading="schedule.isCreatingSchedule.value"
          :disabled="!isFormValid"
        >
          <v-icon start>mdi-check</v-icon>
          创建日程
        </v-btn>
      </v-card-actions>
    </v-form>

    <!-- 成功提示 -->
    <v-snackbar
      v-model="showSuccessSnackbar"
      color="success"
      timeout="3000"
      location="top"
    >
      <v-icon start>mdi-check-circle</v-icon>
      日程创建成功！
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSchedule } from '../composables/useSchedule';
import ScheduleConflictAlert from './ScheduleConflictAlert.vue';
import { useDebounceFn } from '@vueuse/core';
import type { ScheduleClientDTO, ScheduleTaskClientDTO, ConflictDetectionResult, ConflictSuggestion, CreateScheduleRequest } from '@dailyuse/contracts/schedule';

// Composable
const schedule = useSchedule();

// Form state
const form = ref({
  accountUuid: 'demo-user-uuid', // In real app, get from auth
  title: '',
  description: '',
  startTime: null as number | null,
  endTime: null as number | null,
  duration: 0,
  priority: 3,
  location: '',
  autoDetectConflicts: true,
});

// Formatted datetime strings for input fields
const startTimeFormatted = ref('');
const endTimeFormatted = ref('');

// UI state
const showSuccessSnackbar = ref(false);
const ignoreConflicts = ref(false);

// Options
const priorityOptions = [
  { title: '最高', value: 5 },
  { title: '高', value: 4 },
  { title: '中', value: 3 },
  { title: '低', value: 2 },
  { title: '最低', value: 1 },
];

// Validation rules
const rules = {
  required: (v: any) => !!v || '此项为必填',
  endAfterStart: () => {
    if (form.value.startTime && form.value.endTime) {
      return form.value.endTime > form.value.startTime || '结束时间必须晚于开始时间';
    }
    return true;
  },
};

// Computed
const isFormValid = computed(() => {
  return (
    form.value.title &&
    form.value.startTime &&
    form.value.endTime &&
    form.value.endTime > form.value.startTime
  );
});

// Helper: Convert datetime-local string to timestamp
const parseDateTime = (dateTimeStr: string): number | null => {
  if (!dateTimeStr) return null;
  return new Date(dateTimeStr).getTime();
};

// Helper: Convert timestamp to datetime-local string
const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper: Format duration
const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
};

// Calculate duration when times change
const calculateDuration = () => {
  if (form.value.startTime && form.value.endTime) {
    form.value.duration = Math.floor(
      (form.value.endTime - form.value.startTime) / 60000
    );
  } else {
    form.value.duration = 0;
  }
};

// Debounced conflict detection (Story 9.5)
const debouncedDetectConflicts = useDebounceFn(async () => {
  if (form.value.startTime && form.value.endTime && !ignoreConflicts.value) {
    try {
      await schedule.detectConflicts(
        form.value.accountUuid,
        form.value.startTime,
        form.value.endTime
      );
    } catch (error) {
      console.error('Conflict detection failed:', error);
    }
  }
}, 500);

// Watch time changes for auto-detection
watch([() => form.value.startTime, () => form.value.endTime], () => {
  calculateDuration();
  if (form.value.startTime && form.value.endTime) {
    debouncedDetectConflicts();
  }
});

// Event handlers
const handleStartTimeChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  form.value.startTime = parseDateTime(target.value);
};

const handleEndTimeChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  form.value.endTime = parseDateTime(target.value);
};

const handleApplySuggestion = (suggestion: ConflictSuggestion) => {
  // Apply suggested times to form
  form.value.startTime = suggestion.newStartTime;
  form.value.endTime = suggestion.newEndTime;
  
  // Update formatted strings for inputs
  startTimeFormatted.value = formatDateTime(suggestion.newStartTime);
  endTimeFormatted.value = formatDateTime(suggestion.newEndTime);
  
  // Re-calculate duration
  calculateDuration();
  
  // Re-detect conflicts
  debouncedDetectConflicts();
};

const handleIgnoreConflict = () => {
  ignoreConflicts.value = true;
  // User chooses to proceed despite conflicts
  console.log('User chose to ignore conflicts');
};

const handleSubmit = async () => {
  if (!isFormValid.value) {
    return;
  }

  try {
    const request: CreateScheduleRequest = {
      accountUuid: form.value.accountUuid,
      title: form.value.title,
      description: form.value.description,
      startTime: form.value.startTime!,
      endTime: form.value.endTime!,
      duration: form.value.duration,
      priority: form.value.priority,
      location: form.value.location || undefined,
      autoDetectConflicts: !ignoreConflicts.value,
    };

    await schedule.createSchedule(request);
    
    showSuccessSnackbar.value = true;
    handleReset();
  } catch (error) {
    console.error('Failed to create schedule:', error);
  }
};

const handleReset = () => {
  form.value = {
    accountUuid: 'demo-user-uuid',
    title: '',
    description: '',
    startTime: null,
    endTime: null,
    duration: 0,
    priority: 3,
    location: '',
    autoDetectConflicts: true,
  };
  startTimeFormatted.value = '';
  endTimeFormatted.value = '';
  ignoreConflicts.value = false;
};
</script>

<style scoped>
/* Component-specific styles */
</style>

