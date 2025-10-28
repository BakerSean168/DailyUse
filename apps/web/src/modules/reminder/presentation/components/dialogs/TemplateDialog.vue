<template>
  <v-dialog :model-value="visible" max-width="600" persistent>
    <v-card>
      <v-card-title class="pa-4">
        <v-icon size="24" class="mr-2">{{ isEditing ? 'mdi-pencil' : 'mdi-bell-plus' }}</v-icon>
        {{ isEditing ? '编辑提醒模板' : '创建提醒模板' }}
      </v-card-title>

      <v-form ref="formRef">
        <v-card-text class="pa-4">
          <!-- 模板名称 -->
          <v-text-field
            v-model="name"
            label="模板名称"
            variant="outlined"
            density="compact"
            :rules="nameRules"
            class="mb-3"
            @keyup.enter="handleSave"
          />

          <!-- 提醒消息 -->
          <v-text-field
            v-model="message"
            label="提醒消息"
            variant="outlined"
            density="compact"
            :rules="messageRules"
            class="mb-3"
            @keyup.enter="handleSave"
          />

          <!-- 描述 -->
          <v-textarea
            v-model="description"
            label="描述"
            variant="outlined"
            density="compact"
            rows="2"
            class="mb-3"
          />

          <!-- 分类 -->
          <v-text-field
            v-model="category"
            label="分类"
            variant="outlined"
            density="compact"
            class="mb-3"
          />

          <!-- 优先级 -->
          <v-select
            v-model="priority"
            :items="priorityOptions"
            label="优先级"
            variant="outlined"
            density="compact"
            item-title="title"
            item-value="value"
            class="mb-3"
          />

          <!-- 图标选择 -->
          <v-select
            v-model="icon"
            :items="iconOptions"
            label="选择图标"
            variant="outlined"
            density="compact"
            item-title="text"
            item-value="value"
            class="mb-3"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:prepend>
                  <v-icon>{{ item.raw.value }}</v-icon>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <!-- 启用开关 -->
          <v-switch v-model="enabled" label="启用模板" color="primary" class="mb-3" />

          <!-- 自我启用开关 (当分组为individual模式时显示) -->
          <v-switch v-model="selfEnabled" label="自我启用" color="secondary" class="mb-3" />

          <!-- 时间配置区域 -->
          <v-card variant="outlined" class="mb-3">
            <v-card-title class="pa-3 text-h6">时间配置</v-card-title>
            <v-card-text class="pa-3">
              <!-- 重复类型选择 -->
              <v-select
                v-model="timeConfigType"
                :items="timeConfigOptions"
                label="重复类型"
                variant="outlined"
                density="compact"
                item-title="title"
                item-value="value"
                class="mb-3"
              />

              <!-- 时间选择 (仅非自定义类型显示) -->
              <div v-if="timeConfigType !== 'custom'" class="mb-3">
                <v-text-field
                  v-for="(time, index) in timeConfigTimes"
                  :key="index"
                  v-model="timeConfigTimes[index]"
                  :label="`时间 ${index + 1}`"
                  type="time"
                  variant="outlined"
                  density="compact"
                  class="mb-2"
                >
                  <template v-slot:append>
                    <v-btn
                      v-if="timeConfigTimes.length > 1"
                      icon
                      size="small"
                      @click="removeTime(index)"
                    >
                      <v-icon>mdi-minus</v-icon>
                    </v-btn>
                  </template>
                </v-text-field>

                <v-btn
                  v-if="timeConfigTimes.length < 5"
                  size="small"
                  prepend-icon="mdi-plus"
                  variant="outlined"
                  @click="addTime"
                >
                  添加时间
                </v-btn>
              </div>

              <!-- 每周重复选项 -->
              <div v-if="timeConfigType === 'weekly'" class="mb-3">
                <v-label class="mb-2">选择星期几</v-label>
                <v-chip-group v-model="weekdays" multiple color="primary">
                  <v-chip
                    v-for="(day, index) in weekdayOptions"
                    :key="index"
                    :value="index"
                    filter
                    variant="outlined"
                  >
                    {{ day }}
                  </v-chip>
                </v-chip-group>
              </div>

              <!-- 每月重复选项 -->
              <div v-if="timeConfigType === 'monthly'" class="mb-3">
                <v-label class="mb-2">选择日期</v-label>
                <v-chip-group v-model="monthDays" multiple color="primary">
                  <v-chip v-for="day in 31" :key="day" :value="day" filter variant="outlined">
                    {{ day }}日
                  </v-chip>
                </v-chip-group>
              </div>

              <!-- 自定义间隔选项 -->
              <div v-if="timeConfigType === 'custom'" class="mb-3">
                <v-alert type="info" variant="tonal" density="compact" class="mb-3">
                  <template v-slot:prepend>
                    <v-icon>mdi-information</v-icon>
                  </template>
                  <div class="text-caption">
                    自定义间隔提醒将从应用启动或提醒启用时开始计算，每隔设定的时间自动触发提醒。
                  </div>
                </v-alert>
                <v-row>
                  <v-col cols="6">
                    <v-text-field
                      v-model.number="customInterval"
                      label="间隔时间"
                      type="number"
                      variant="outlined"
                      density="compact"
                      min="1"
                      hint="设置提醒间隔"
                      persistent-hint
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-select
                      v-model="customUnit"
                      :items="customUnitOptions"
                      label="时间单位"
                      variant="outlined"
                      density="compact"
                      item-title="title"
                      item-value="value"
                    />
                  </v-col>
                </v-row>
                <v-chip color="primary" size="small" class="mt-2">
                  <v-icon start>mdi-timer-outline</v-icon>
                  将每隔 {{ customInterval }}
                  {{ customUnitOptions.find((u) => u.value === customUnit)?.title }} 提醒一次
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-card-text>
      </v-form>

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="handleCancel">取消</v-btn>
        <v-btn
          color="primary"
          class="ml-2"
          @click="handleSave"
          variant="elevated"
          :disabled="!isFormValid"
        >
          确定
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { ReminderTemplate } from '@dailyuse/domain-client';
import { ReminderContracts, ImportanceLevel } from '@dailyuse/contracts';
// composables
import { useReminder } from '../../composables/useReminder';

const { createTemplate, updateTemplate } = useReminder();

const visible = ref(false);
const propReminderTemplate = ref<ReminderTemplate | null>(null);
const localReminderTemplate = ref<ReminderTemplate>(ReminderTemplate.forCreate());

const isEditing = computed(() => !!propReminderTemplate.value);
const formRef = ref<InstanceType<typeof HTMLFormElement> | null>(null);
const isFormValid = computed(() => {
  return formRef.value?.isValid ?? false;
});

const name = computed({
  get: () => localReminderTemplate.value.name,
  set: (val: string) => {
    localReminderTemplate.value.updateBasicInfo({ name: val });
  },
});

const message = computed({
  get: () => localReminderTemplate.value.message,
  set: (val: string) => {
    localReminderTemplate.value.updateBasicInfo({ message: val });
  },
});

const description = computed({
  get: () => localReminderTemplate.value.description || '',
  set: (val: string) => {
    localReminderTemplate.value.updateBasicInfo({ description: val });
  },
});

const category = computed({
  get: () => localReminderTemplate.value.category || '',
  set: (val: string) => {
    localReminderTemplate.value.updateBasicInfo({ category: val });
  },
});

const icon = computed({
  get: () => localReminderTemplate.value.icon || '',
  set: (val: string) => {
    localReminderTemplate.value.updateBasicInfo({ icon: val });
  },
});

const enabled = computed({
  get: () => localReminderTemplate.value.enabled,
  set: (val: boolean) => {
    localReminderTemplate.value.toggleEnabled(val);
  },
});

const selfEnabled = computed({
  get: () => localReminderTemplate.value.selfEnabled,
  set: (val: boolean) => {
    localReminderTemplate.value.toggleSelfEnabled(val);
  },
});

// 使用 computed 来同步 localReminderTemplate 的数据，避免临时变量导致的不一致
const priority = computed({
  get: () => localReminderTemplate.value.priority,
  set: (val: ReminderContracts.ReminderPriority) => {
    // Priority 通过 updateBasicInfo 不能更新，需要特殊处理
    (localReminderTemplate.value as any)._priority = val;
    (localReminderTemplate.value as any).updateVersion();
  },
});

// 时间配置相关计算属性 - 直接从 localReminderTemplate.timeConfig 读取和更新
const timeConfigType = computed({
  get: () => (localReminderTemplate.value.timeConfig?.type as any) || 'daily',
  set: (val: 'daily' | 'weekly' | 'monthly' | 'custom') => {
    const newConfig = { ...localReminderTemplate.value.timeConfig, type: val };
    // 切换类型时重置相关字段
    if (val === 'custom') {
      delete newConfig.times;
      newConfig.customPattern = newConfig.customPattern || {
        interval: 1,
        unit: ReminderContracts.ReminderDurationUnit.HOURS,
      };
    } else {
      delete newConfig.customPattern;
      if (!newConfig.times || newConfig.times.length === 0) {
        newConfig.times = ['09:00'];
      }
    }
    localReminderTemplate.value.updateTimeConfig(newConfig as any);
  },
});

const timeConfigTimes = computed({
  get: () => localReminderTemplate.value.timeConfig?.times || ['09:00'],
  set: (val: string[]) => {
    const currentConfig = localReminderTemplate.value.timeConfig || { type: 'daily' };
    const newConfig = { ...currentConfig, times: val };
    localReminderTemplate.value.updateTimeConfig(newConfig as any);
  },
});

const weekdays = computed({
  get: () => localReminderTemplate.value.timeConfig?.weekdays || [],
  set: (val: number[]) => {
    const currentConfig = localReminderTemplate.value.timeConfig || { type: 'weekly' };
    const newConfig = { ...currentConfig, weekdays: val };
    localReminderTemplate.value.updateTimeConfig(newConfig as any);
  },
});

const monthDays = computed({
  get: () => localReminderTemplate.value.timeConfig?.monthDays || [],
  set: (val: number[]) => {
    const currentConfig = localReminderTemplate.value.timeConfig || { type: 'monthly' };
    const newConfig = { ...currentConfig, monthDays: val };
    localReminderTemplate.value.updateTimeConfig(newConfig as any);
  },
});

const customInterval = computed({
  get: () => localReminderTemplate.value.timeConfig?.customPattern?.interval || 1,
  set: (val: number) => {
    const currentConfig = localReminderTemplate.value.timeConfig || { type: 'custom' };
    const newConfig = {
      ...currentConfig,
      customPattern: {
        ...(currentConfig.customPattern || {}),
        interval: val,
      },
    };
    localReminderTemplate.value.updateTimeConfig(newConfig as any);
  },
});

const customUnit = computed({
  get: () => (localReminderTemplate.value.timeConfig?.customPattern?.unit as any) || 'hours',
  set: (val: 'minutes' | 'hours' | 'days') => {
    const currentConfig = localReminderTemplate.value.timeConfig || { type: 'custom' };
    const newConfig = {
      ...currentConfig,
      customPattern: {
        ...(currentConfig.customPattern || {}),
        unit: val,
      },
    };
    localReminderTemplate.value.updateTimeConfig(newConfig as any);
  },
});

const iconOptions = [
  { text: '提醒', value: 'mdi-bell' },
  { text: '工作', value: 'mdi-briefcase' },
  { text: '学习', value: 'mdi-school' },
  { text: '生活', value: 'mdi-home' },
  { text: '健康', value: 'mdi-heart' },
  { text: '时间', value: 'mdi-clock' },
];

const priorityOptions = [
  { title: '无关紧要', value: ImportanceLevel.Trivial },
  { title: '不太重要', value: ImportanceLevel.Minor },
  { title: '中等重要', value: ImportanceLevel.Moderate },
  { title: '非常重要', value: ImportanceLevel.Important },
  { title: '极其重要', value: ImportanceLevel.Vital },
];

const timeConfigOptions = [
  { title: '每天', value: 'daily' },
  { title: '每周', value: 'weekly' },
  { title: '每月', value: 'monthly' },
  { title: '自定义间隔', value: 'custom' },
];

const weekdayOptions = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const customUnitOptions = [
  { title: '分钟', value: 'minutes' },
  { title: '小时', value: 'hours' },
  { title: '天', value: 'days' },
];

const nameRules = [
  (v: string) => !!v || '名称不能为空',
  (v: string) => (v && v.length >= 1) || '名称至少需要1个字符',
  (v: string) => (v && v.length <= 50) || '名称不能超过50个字符',
];

const messageRules = [
  (v: string) => !!v || '提醒消息不能为空',
  (v: string) => (v && v.length <= 200) || '消息不能超过200个字符',
];

// 时间配置管理方法
const addTime = () => {
  const currentTimes = [...timeConfigTimes.value];
  if (currentTimes.length < 5) {
    currentTimes.push('09:00');
    timeConfigTimes.value = currentTimes;
  }
};

const removeTime = (index: number) => {
  const currentTimes = [...timeConfigTimes.value];
  if (currentTimes.length > 1) {
    currentTimes.splice(index, 1);
    timeConfigTimes.value = currentTimes;
  }
};

const handleSave = async () => {
  if (!isFormValid.value) return;

  try {
    console.log('💾 保存提醒模板:', {
      mode: isEditing.value ? '编辑' : '创建',
      data: localReminderTemplate.value.toDTO(),
    });

    if (isEditing.value) {
      // 编辑模式 - 使用 updateTemplate
      await updateTemplate(localReminderTemplate.value.uuid, {
        name: localReminderTemplate.value.name,
        description: localReminderTemplate.value.description,
        message: localReminderTemplate.value.message,
        category: localReminderTemplate.value.category,
        priority: localReminderTemplate.value.priority,
        enabled: localReminderTemplate.value.enabled,
        selfEnabled: localReminderTemplate.value.selfEnabled,
        timeConfig: localReminderTemplate.value.timeConfig,
        icon: localReminderTemplate.value.icon,
        tags: localReminderTemplate.value.tags,
      });
    } else {
      // 创建模式 - 直接使用 toDTO()，包含前端生成的 uuid
      await createTemplate(localReminderTemplate.value.toDTO());
    }
    closeDialog();
  } catch (error) {
    console.error('保存提醒模板失败:', error);
  }
};

const handleCancel = () => {
  closeDialog();
};

const openDialog = (reminderTemplate?: ReminderTemplate) => {
  visible.value = true;
  propReminderTemplate.value = reminderTemplate || null;
};

const openForCreate = () => {
  openDialog();
};

const openForEdit = (reminderTemplate: ReminderTemplate) => {
  openDialog(reminderTemplate);
};

const closeDialog = () => {
  visible.value = false;
};

watch(
  [() => visible.value, () => propReminderTemplate.value],
  ([show]) => {
    if (show) {
      // 使用 clone() 或 forCreate() 创建本地副本
      localReminderTemplate.value = propReminderTemplate.value
        ? propReminderTemplate.value.clone()
        : ReminderTemplate.forCreate();

      console.log('📝 初始化提醒模板编辑器:', {
        mode: propReminderTemplate.value ? '编辑' : '创建',
        timeConfig: localReminderTemplate.value.timeConfig,
      });
    } else {
      // 关闭时重置
      localReminderTemplate.value = ReminderTemplate.forCreate();
    }
  },
  { immediate: true },
);

defineExpose({
  openForCreate,
  openForEdit,
});
</script>
