<template>
  <v-dialog v-model="visible" max-width="800px" persistent>
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ isEditMode ? '编辑提醒模板' : '创建提醒模板' }}</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="formRef" v-model="formValid">
          <!-- 基本信息 -->
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="formData.title"
                label="标题 *"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="formData.description"
                label="描述"
                variant="outlined"
                density="comfortable"
                rows="2"
              />
            </v-col>
          </v-row>

          <!-- 提醒类型 -->
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.type"
                label="提醒类型 *"
                :items="reminderTypes"
                item-title="label"
                item-value="value"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.importanceLevel"
                label="重要程度"
                :items="importanceLevels"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <!-- 触发配置 -->
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="formData.triggerType"
                label="触发类型 *"
                :items="triggerTypes"
                item-title="label"
                item-value="value"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            
            <!-- 固定时间触发器 -->
            <v-col cols="12" v-if="formData.triggerType === 'FIXED_TIME'">
              <v-text-field
                v-model="formData.fixedTime"
                label="固定时间 (HH:MM)"
                placeholder="09:00"
                :rules="[rules.timeFormat]"
                variant="outlined"
                density="comfortable"
                hint="格式: 小时:分钟 (例如: 09:00, 14:30)"
              />
            </v-col>
            
            <!-- 间隔触发器 -->
            <v-col cols="12" md="6" v-if="formData.triggerType === 'INTERVAL'">
              <v-text-field
                v-model.number="formData.intervalMinutes"
                label="间隔时间（分钟）"
                type="number"
                :rules="[rules.positiveNumber]"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <!-- 通知配置 -->
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="formData.notificationTitle"
                label="通知标题"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="formData.notificationBody"
                label="通知内容"
                variant="outlined"
                density="comfortable"
                rows="2"
              />
            </v-col>
          </v-row>

          <!-- 样式配置 -->
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.color"
                label="颜色"
                type="color"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.icon"
                label="图标 (mdi-*)"
                placeholder="mdi-bell"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <!-- 标签 -->
          <v-row>
            <v-col cols="12">
              <v-combobox
                v-model="formData.tags"
                label="标签"
                multiple
                chips
                closable-chips
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn 
          data-testid="reminder-dialog-close-button"
          color="grey-darken-1" 
          variant="text" 
          @click="close"
        >
          取消
        </v-btn>
        <v-btn 
          data-testid="reminder-dialog-save-button"
          color="primary" 
          variant="elevated"
          :disabled="!formValid || saving"
          :loading="saving"
          @click="handleSave"
        >
          {{ isEditMode ? '更新' : '创建' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { ReminderTemplate } from '@dailyuse/domain-client';
import type { ReminderContracts } from '@dailyuse/contracts';
import { useReminder } from '../../composables/useReminder';
import { useSnackbar } from '@/shared/composables/useSnackbar';

const visible = ref(false);
const formRef = ref();
const formValid = ref(false);
const saving = ref(false);
const currentTemplate = ref<ReminderTemplate | null>(null);
const isEditMode = computed(() => !!currentTemplate.value?.uuid);

const { createReminderTemplate, updateTemplate } = useReminder();
const snackbar = useSnackbar();

// 表单数据
const formData = reactive({
  title: '',
  description: '',
  type: 'TASK' as ReminderContracts.ReminderType,
  importanceLevel: 'NORMAL' as ReminderContracts.ImportanceLevel,
  triggerType: 'FIXED_TIME' as ReminderContracts.TriggerType,
  fixedTime: '09:00',
  intervalMinutes: 60,
  notificationTitle: '',
  notificationBody: '',
  color: '#2196F3',
  icon: 'mdi-bell',
  tags: [] as string[],
});

// 选项列表
const reminderTypes = [
  { label: '任务提醒', value: 'TASK' },
  { label: '事件提醒', value: 'EVENT' },
  { label: '目标提醒', value: 'GOAL' },
  { label: '习惯提醒', value: 'HABIT' },
  { label: '自定义提醒', value: 'CUSTOM' },
];

const importanceLevels = [
  { label: '普通', value: 'NORMAL' },
  { label: '重要', value: 'HIGH' },
  { label: '紧急', value: 'CRITICAL' },
];

const triggerTypes = [
  { label: '固定时间', value: 'FIXED_TIME' },
  { label: '间隔触发', value: 'INTERVAL' },
];

// 验证规则
const rules = {
  required: (v: any) => !!v || '此字段为必填项',
  positiveNumber: (v: any) => (v && v > 0) || '请输入大于0的数字',
  timeFormat: (v: string) => {
    if (!v) return true;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(v) || '请输入正确的时间格式 (HH:MM)';
  },
};

const emit = defineEmits<{
  templateCreated: [];
  templateUpdated: [];
}>();

const open = () => {
  visible.value = true;
};

const openForCreate = () => {
  resetForm();
  currentTemplate.value = null;
  visible.value = true;
};

const openForEdit = (template: ReminderTemplate) => {
  currentTemplate.value = template;
  loadTemplateData(template);
  visible.value = true;
};

const close = () => {
  visible.value = false;
  resetForm();
  currentTemplate.value = null;
};

const resetForm = () => {
  formData.title = '';
  formData.description = '';
  formData.type = 'TASK';
  formData.importanceLevel = 'NORMAL';
  formData.triggerType = 'FIXED_TIME';
  formData.fixedTime = '09:00';
  formData.intervalMinutes = 60;
  formData.notificationTitle = '';
  formData.notificationBody = '';
  formData.color = '#2196F3';
  formData.icon = 'mdi-bell';
  formData.tags = [];
  formRef.value?.resetValidation();
};

const loadTemplateData = (template: ReminderTemplate) => {
  formData.title = template.title;
  formData.description = template.description || '';
  formData.type = template.type;
  formData.importanceLevel = template.importanceLevel;
  // TODO: 从 template.trigger 解析触发配置
  formData.notificationTitle = template.notificationConfig?.title || '';
  formData.notificationBody = template.notificationConfig?.body || '';
  formData.color = template.color || '#2196F3';
  formData.icon = template.icon || 'mdi-bell';
  formData.tags = template.tags || [];
};

const handleSave = async () => {
  if (!formRef.value) return;
  
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  try {
    saving.value = true;

    if (isEditMode.value && currentTemplate.value) {
      // 更新模式
      const updateRequest: ReminderContracts.UpdateReminderTemplateRequestDTO = {
        title: formData.title,
        description: formData.description || undefined,
        importanceLevel: formData.importanceLevel,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        color: formData.color || undefined,
        icon: formData.icon || undefined,
      };
      
      await updateTemplate(currentTemplate.value.uuid, updateRequest);
      snackbar.showSuccess('提醒模板已更新');
      emit('templateUpdated');
    } else {
      // 创建模式
      const createRequest: ReminderContracts.CreateReminderTemplateRequestDTO = {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        trigger: buildTriggerConfig(),
        activeTime: buildActiveTimeConfig(),
        notificationConfig: buildNotificationConfig(),
        importanceLevel: formData.importanceLevel,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        color: formData.color || undefined,
        icon: formData.icon || undefined,
      };
      
      await createReminderTemplate(createRequest);
      snackbar.showSuccess('提醒模板已创建');
      emit('templateCreated');
    }

    close();
  } catch (error) {
    console.error('保存提醒模板失败:', error);
    snackbar.showError(isEditMode.value ? '更新失败' : '创建失败');
  } finally {
    saving.value = false;
  }
};

const buildTriggerConfig = (): ReminderContracts.TriggerConfigServerDTO => {
  if (formData.triggerType === 'FIXED_TIME') {
    const [hours, minutes] = formData.fixedTime.split(':').map(Number);
    return {
      type: 'FIXED_TIME',
      time: { hours, minutes },
    };
  } else {
    return {
      type: 'INTERVAL',
      intervalMinutes: formData.intervalMinutes,
    };
  }
};

const buildActiveTimeConfig = (): ReminderContracts.ActiveTimeConfigServerDTO => {
  // 默认全天有效
  return {
    startTime: Date.now(),
    endTime: Date.now() + 365 * 24 * 60 * 60 * 1000, // 一年后
  };
};

const buildNotificationConfig = (): ReminderContracts.NotificationConfigServerDTO => {
  return {
    title: formData.notificationTitle || formData.title,
    body: formData.notificationBody || formData.description || '提醒',
    sound: true,
    vibrate: true,
    priority: formData.importanceLevel === 'CRITICAL' ? 'HIGH' : 'NORMAL',
  };
};

defineExpose({
  open,
  openForCreate,
  openForEdit,
  close,
});
</script>
