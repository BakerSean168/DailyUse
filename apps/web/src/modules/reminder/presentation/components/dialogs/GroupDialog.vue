<template>
  <v-dialog v-model="visible" max-width="600px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center bg-primary text-white">
        <v-icon class="mr-2">mdi-folder</v-icon>
        <span class="text-h5">{{ isEditMode ? '编辑分组' : '创建分组' }}</span>
      </v-card-title>

      <v-card-text class="pt-4">
        <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSave">
          <!-- 分组名称 -->
          <v-text-field
            v-model="formData.name"
            label="分组名称 *"
            placeholder="例如: 工作提醒、生活提醒"
            :rules="nameRules"
            variant="outlined"
            prepend-inner-icon="mdi-rename-box"
            autofocus
            required
            counter="50"
            maxlength="50"
          />

          <!-- 分组描述 -->
          <v-textarea
            v-model="formData.description"
            label="分组描述"
            placeholder="描述该分组的用途..."
            variant="outlined"
            prepend-inner-icon="mdi-text"
            rows="3"
            counter="200"
            maxlength="200"
            class="mt-4"
          />

          <!-- 分组图标 -->
          <v-select
            v-model="formData.icon"
            label="分组图标"
            :items="iconOptions"
            variant="outlined"
            prepend-inner-icon="mdi-emoticon"
            class="mt-4"
          >
            <template #selection="{ item }">
              <v-icon :icon="item.value" class="mr-2" />
              {{ item.title }}
            </template>
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon :icon="item.value" />
                </template>
              </v-list-item>
            </template>
          </v-select>

          <!-- 分组颜色 -->
          <v-text-field
            v-model="formData.color"
            label="分组颜色"
            type="color"
            variant="outlined"
            prepend-inner-icon="mdi-palette"
            class="mt-4"
          />

          <!-- 控制模式 -->
          <v-select
            v-model="formData.controlMode"
            label="控制模式"
            :items="controlModeOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            prepend-inner-icon="mdi-cog"
            class="mt-4"
          >
            <template #selection="{ item }">
              <div>
                <div class="font-weight-medium">{{ item.raw.title }}</div>
                <div class="text-caption text-grey">{{ item.raw.description }}</div>
              </div>
            </template>
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #title>{{ item.raw.title }}</template>
                <template #subtitle>{{ item.raw.description }}</template>
              </v-list-item>
            </template>
          </v-select>

          <!-- 排序权重 -->
          <v-text-field
            v-model.number="formData.order"
            label="排序权重"
            type="number"
            variant="outlined"
            prepend-inner-icon="mdi-sort"
            hint="数字越小越靠前"
            persistent-hint
            class="mt-4"
          />
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="grey-darken-1"
          variant="text"
          @click="close"
          :disabled="isSaving"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="handleSave"
          :loading="isSaving"
          :disabled="!formValid"
        >
          {{ isEditMode ? '保存' : '创建' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { ReminderContracts } from '@dailyuse/contracts';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { useReminderGroup } from '../../composables/useReminderGroup';

type ReminderTemplateGroup = ReminderContracts.ReminderGroupClientDTO;

// Composables
const snackbar = useSnackbar();
const { createGroup, updateGroup, fetchGroups } = useReminderGroup();

// 响应式状态
const visible = ref(false);
const formRef = ref();
const formValid = ref(false);
const isSaving = ref(false);
const currentGroup = ref<ReminderTemplateGroup | null>(null);

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  icon: 'mdi-folder',
  color: '#2196F3',
  controlMode: ReminderContracts.ControlMode.INDIVIDUAL, // 默认个体控制
  order: 0,
});

// 计算属性
const isEditMode = computed(() => !!currentGroup.value?.uuid);

// 图标选项
const iconOptions = [
  { title: '文件夹', value: 'mdi-folder' },
  { title: '工作', value: 'mdi-briefcase' },
  { title: '家庭', value: 'mdi-home' },
  { title: '学习', value: 'mdi-school' },
  { title: '健康', value: 'mdi-heart' },
  { title: '购物', value: 'mdi-cart' },
  { title: '娱乐', value: 'mdi-gamepad' },
  { title: '旅行', value: 'mdi-airplane' },
  { title: '财务', value: 'mdi-currency-usd' },
  { title: '社交', value: 'mdi-account-group' },
];

// 颜色选项
const colorOptions = [
  { title: '蓝色', value: '#2196F3' },
  { title: '绿色', value: '#4CAF50' },
  { title: '橙色', value: '#FF9800' },
  { title: '红色', value: '#F44336' },
  { title: '紫色', value: '#9C27B0' },
  { title: '粉色', value: '#E91E63' },
  { title: '青色', value: '#00BCD4' },
  { title: '灰色', value: '#9E9E9E' },
];

// 控制模式选项
const controlModeOptions = [
  {
    title: '个体控制',
    value: ReminderContracts.ControlMode.INDIVIDUAL,
    description: '每个提醒模板可以独立启用/暂停',
  },
  {
    title: '组控制',
    value: ReminderContracts.ControlMode.GROUP,
    description: '所有提醒模板统一启用/暂停',
  },
];

// 验证规则
const nameRules = [
  (v: string) => !!v || '分组名称不能为空',
  (v: string) => (v && v.length <= 50) || '分组名称不能超过50个字符',
  (v: string) => (v && v.length >= 2) || '分组名称至少2个字符',
];

// 重置表单
const resetForm = () => {
  formData.name = '';
  formData.description = '';
  formData.icon = 'mdi-folder';
  formData.color = '#2196F3';
  formData.controlMode = ReminderContracts.ControlMode.INDIVIDUAL;
  formData.order = 0;
  formRef.value?.resetValidation();
};

// 填充表单
const fillForm = (group: ReminderTemplateGroup) => {
  formData.name = group.name;
  formData.description = group.description || '';
  formData.icon = group.icon || 'mdi-folder';
  formData.color = group.color || '#2196F3';
  formData.controlMode = group.controlMode;
  formData.order = group.order || 0;
};

// 打开对话框（创建模式）
const open = () => {
  resetForm();
  currentGroup.value = null;
  visible.value = true;
};

// 打开对话框（编辑模式）
const openForEdit = (group: ReminderTemplateGroup) => {
  currentGroup.value = group;
  fillForm(group);
  visible.value = true;
};

// 关闭对话框
const close = () => {
  visible.value = false;
  setTimeout(() => {
    resetForm();
    currentGroup.value = null;
  }, 300);
};

// 保存分组
const handleSave = async () => {
  // 验证表单
  const { valid } = await formRef.value?.validate();
  if (!valid) {
    snackbar.showError('请检查表单填写');
    return;
  }

  isSaving.value = true;

  try {
    // 构建分组数据
    const groupData: ReminderContracts.CreateReminderGroupRequestDTO = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      color: formData.color,
      icon: formData.icon,
      controlMode: formData.controlMode,
      order: formData.order,
    };

    if (isEditMode.value && currentGroup.value) {
      // 编辑模式 - 调用 API 更新分组
      await updateGroup(currentGroup.value.uuid, groupData);
      snackbar.showSuccess('分组已更新');
    } else {
      // 创建模式 - 调用 API 创建分组
      await createGroup(groupData);
      snackbar.showSuccess('分组已创建');
    }

    // 保存后自动刷新数据
    await fetchGroups(true);
    close();
  } catch (error) {
    console.error('保存分组失败:', error);
    snackbar.showError('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
  } finally {
    isSaving.value = false;
  }
};

// 监听 visible 变化
watch(visible, (newVal) => {
  if (!newVal) {
    // 对话框关闭时重置表单
    setTimeout(resetForm, 300);
  }
});

defineExpose({
  open,
  openForEdit,
  close,
});
</script>

<style scoped>
:deep(.v-text-field .v-input__details) {
  padding-inline-start: 12px;
}
</style>
