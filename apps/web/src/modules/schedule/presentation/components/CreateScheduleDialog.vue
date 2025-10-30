<template>
  <v-dialog :model-value="modelValue" max-width="600" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>创建日程事件</span>
        <v-btn icon="mdi-close" variant="text" @click="handleClose" />
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="formData.title"
            label="标题 *"
            :rules="[rules.required, rules.maxLength(200)]"
            counter="200"
            variant="outlined"
            class="mb-2"
          />

          <v-textarea
            v-model="formData.description"
            label="描述"
            :rules="[rules.maxLength(1000)]"
            counter="1000"
            variant="outlined"
            rows="3"
            class="mb-2"
          />

          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.startDate"
                label="开始日期 *"
                type="date"
                :rules="[rules.required]"
                variant="outlined"
                class="mb-2"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.startTime"
                label="开始时间 *"
                type="time"
                :rules="[rules.required]"
                variant="outlined"
                class="mb-2"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.endDate"
                label="结束日期 *"
                type="date"
                :rules="[rules.required]"
                variant="outlined"
                class="mb-2"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.endTime"
                label="结束时间 *"
                type="time"
                :rules="[rules.required]"
                variant="outlined"
                class="mb-2"
              />
            </v-col>
          </v-row>

          <v-select
            v-model="formData.priority"
            label="优先级"
            :items="priorityOptions"
            variant="outlined"
            clearable
            class="mb-2"
          />

          <v-text-field
            v-model="formData.location"
            label="地点"
            :rules="[rules.maxLength(200)]"
            counter="200"
            variant="outlined"
            prepend-inner-icon="mdi-map-marker"
            class="mb-2"
          />

          <v-combobox
            v-model="formData.attendees"
            label="参与者"
            multiple
            chips
            clearable
            variant="outlined"
            prepend-inner-icon="mdi-account-multiple"
            hint="输入邮箱或用户名后按回车添加"
            class="mb-2"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleClose">取消</v-btn>
        <v-btn color="primary" :loading="isLoading" @click="handleSubmit">创建</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useScheduleEvent } from '../composables/useScheduleEvent';
import type { CreateScheduleEventRequest } from '../../infrastructure/api/scheduleEventApiClient';

// ===== Props & Emits =====
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created'): void;
}>();

// ===== Composables =====
const { createSchedule, isLoading } = useScheduleEvent();

// ===== State =====
const formRef = ref();
const formData = reactive({
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  priority: null as number | null,
  location: '',
  attendees: [] as string[],
});

const priorityOptions = [
  { title: '最低 (1)', value: 1 },
  { title: '低 (2)', value: 2 },
  { title: '中 (3)', value: 3 },
  { title: '高 (4)', value: 4 },
  { title: '最高 (5)', value: 5 },
];

// ===== Validation Rules =====
const rules = {
  required: (value: string) => !!value || '此字段为必填项',
  maxLength: (max: number) => (value: string) =>
    !value || value.length <= max || `最多${max}个字符`,
};

// ===== Methods =====

/**
 * 重置表单
 */
function resetForm() {
  formData.title = '';
  formData.description = '';
  formData.startDate = '';
  formData.startTime = '';
  formData.endDate = '';
  formData.endTime = '';
  formData.priority = null;
  formData.location = '';
  formData.attendees = [];
  formRef.value?.reset();
}

/**
 * 关闭对话框
 */
function handleClose() {
  emit('update:modelValue', false);
  resetForm();
}

/**
 * 提交表单
 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  // 转换日期时间为时间戳
  const startTimestamp = new Date(`${formData.startDate}T${formData.startTime}`).getTime();
  const endTimestamp = new Date(`${formData.endDate}T${formData.endTime}`).getTime();

  // 验证时间范围
  if (startTimestamp >= endTimestamp) {
    alert('结束时间必须晚于开始时间');
    return;
  }

  if (startTimestamp < Date.now()) {
    alert('开始时间不能早于当前时间');
    return;
  }

  // 构建请求数据
  const requestData: CreateScheduleEventRequest = {
    title: formData.title,
    description: formData.description || undefined,
    startTime: startTimestamp,
    endTime: endTimestamp,
    priority: formData.priority || undefined,
    location: formData.location || undefined,
    attendees: formData.attendees.length > 0 ? formData.attendees : undefined,
  };

  // 调用创建方法
  const result = await createSchedule(requestData);
  if (result) {
    emit('created');
    handleClose();
  }
}

// ===== Watchers =====
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      // 对话框打开时，设置默认值
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      formData.startDate = now.toISOString().split('T')[0];
      formData.startTime = now.toTimeString().slice(0, 5);
      formData.endDate = oneHourLater.toISOString().split('T')[0];
      formData.endTime = oneHourLater.toTimeString().slice(0, 5);
    }
  }
);
</script>

<style scoped>
.v-card-title {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>
