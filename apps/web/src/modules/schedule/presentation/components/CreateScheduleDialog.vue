<template>
  <v-dialog :model-value="visible" max-width="600" persistent @update:model-value="visible = $event">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>{{ isEditing ? '编辑日程事件' : '创建日程事件' }}</span>
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
        <v-btn color="primary" :loading="isLoading" @click="handleSubmit">
          {{ isEditing ? '保存' : '创建' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { useScheduleEvent } from '../composables/useScheduleEvent';
import type { CreateScheduleEventRequest, UpdateScheduleEventRequest } from '../../infrastructure/api/scheduleEventApiClient';
import type { ScheduleClientDTO, ScheduleTaskClientDTO, ConflictDetectionResult } from '@dailyuse/contracts/schedule';

// ===== Composables =====
const { createSchedule, updateSchedule, isLoading } = useScheduleEvent();

// ===== State =====
const visible = ref(false);
const editingSchedule = ref<ScheduleClientDTO | null>(null);

const isEditing = computed(() => !!editingSchedule.value);

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
  visible.value = false;
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

  if (!isEditing.value && startTimestamp < Date.now()) {
    alert('开始时间不能早于当前时间');
    return;
  }

  if (isEditing.value && editingSchedule.value) {
    // 编辑模式
    const updateData: UpdateScheduleEventRequest = {
      title: formData.title,
      description: formData.description || undefined,
      startTime: startTimestamp,
      endTime: endTimestamp,
      priority: formData.priority || undefined,
      location: formData.location || undefined,
      attendees: formData.attendees.length > 0 ? formData.attendees : undefined,
    };

    const result = await updateSchedule(editingSchedule.value.uuid, updateData);
    if (result) {
      handleClose();
    }
  } else {
    // 创建模式
    const requestData: CreateScheduleEventRequest = {
      title: formData.title,
      description: formData.description || undefined,
      startTime: startTimestamp,
      endTime: endTimestamp,
      priority: formData.priority || undefined,
      location: formData.location || undefined,
      attendees: formData.attendees.length > 0 ? formData.attendees : undefined,
    };

    const result = await createSchedule(requestData);
    if (result) {
      handleClose();
    }
  }
}

// ===== Public Methods =====

/**
 * 打开创建对话框
 */
function openForCreate() {
  editingSchedule.value = null;
  resetForm();
  
  // 设置默认值
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  formData.startDate = now.toISOString().split('T')[0];
  formData.startTime = now.toTimeString().slice(0, 5);
  formData.endDate = oneHourLater.toISOString().split('T')[0];
  formData.endTime = oneHourLater.toTimeString().slice(0, 5);
  
  visible.value = true;
}

/**
 * 打开编辑对话框
 */
function openForEdit(schedule: ScheduleClientDTO) {
  if (!schedule) {
    console.error('[CreateScheduleDialog] openForEdit: schedule is required');
    return;
  }
  
  editingSchedule.value = schedule;
  
  // 填充表单数据
  formData.title = schedule.title;
  formData.description = schedule.description || '';
  formData.priority = schedule.priority || null;
  formData.location = schedule.location || '';
  formData.attendees = schedule.attendees ? [...schedule.attendees] : [];
  
  // 转换时间戳为日期时间
  const startDate = new Date(schedule.startTime);
  const endDate = new Date(schedule.endTime);
  
  formData.startDate = startDate.toISOString().split('T')[0];
  formData.startTime = startDate.toTimeString().slice(0, 5);
  formData.endDate = endDate.toISOString().split('T')[0];
  formData.endTime = endDate.toTimeString().slice(0, 5);
  
  visible.value = true;
}

/**
 * 通用打开方法（向后兼容）
 */
function openDialog(schedule?: ScheduleClientDTO) {
  if (schedule) {
    openForEdit(schedule);
  } else {
    openForCreate();
  }
}

// ===== Watchers =====
watch(visible, (newValue) => {
  if (!newValue) {
    // 对话框关闭时重置
    editingSchedule.value = null;
    resetForm();
  }
});

// ===== Expose Public API =====
defineExpose({
  openForCreate,
  openForEdit,
  openDialog,
});
</script>

<style scoped>
.v-card-title {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>

