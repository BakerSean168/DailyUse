<template>
  <v-dialog :model-value="dialogState.visible" max-width="900" persistent scrollable>
    <v-card class="task-template-dialog">
      <!-- 对话框标题 -->
      <v-card-title class="dialog-header">
        <div class="d-flex align-center">
          <v-icon :color="getHeaderIconColor()" class="mr-3" size="24">
            {{ getHeaderIcon() }}
          </v-icon>
          <div>
            <h3 class="text-h6">{{ getHeaderTitle() }}</h3>
            <p v-if="getHeaderSubtitle()" class="text-caption text-medium-emphasis ma-0">
              {{ getHeaderSubtitle() }}
            </p>
          </div>
        </div>
      </v-card-title>

      <!-- 对话框内容 -->
      <v-card-text class="dialog-content pa-0">
        <!-- 加载状态 -->
        <div v-if="operationState.loading" class="loading-container text-center pa-8">
          <v-progress-circular color="primary" indeterminate size="48" class="mb-4" />
          <p class="text-body-1">{{ operationState.loadingText }}</p>
        </div>

        <!-- 错误状态 -->
        <v-alert v-else-if="operationState.error" type="error" variant="tonal" class="ma-4">
          <v-alert-title>操作失败</v-alert-title>
          <div>{{ operationState.error }}</div>
          <template #append>
            <v-btn variant="text" @click="clearError"> 关闭 </v-btn>
          </template>
        </v-alert>

        <!-- 表单内容 -->
        <div v-else class="form-container pa-4" :class="{ readonly: operationState.loading }">
          <!-- Debug: 显示 taskTemplate 状态 -->
          <div v-if="!formData.taskTemplate" class="pa-4 text-center">
            <v-alert type="warning" variant="tonal">
              <v-alert-title>调试信息</v-alert-title>
              <p>formData.taskTemplate is {{ formData.taskTemplate }}</p>
              <p>dialogState.mode is {{ dialogState.mode }}</p>
              <p>dialogState.visible is {{ dialogState.visible }}</p>
            </v-alert>
          </div>
          <TaskTemplateForm v-else ref="formRef" :model-value="formData.taskTemplate as TaskTemplate"
            :is-edit-mode="dialogState.mode === 'edit'" :readonly="operationState.loading"
            @update:model-value="handleTemplateUpdate" @update:validation="handleValidationUpdate"
            @close="handleCancel" />
        </div>
      </v-card-text>

      <!-- 对话框操作 -->
      <v-card-actions class="dialog-actions">
        <v-spacer />

        <!-- 取消按钮 -->
        <v-btn data-testid="task-dialog-cancel-button" variant="text" :disabled="operationState.loading"
          @click="handleCancel">
          取消
        </v-btn>

        <!-- 保存按钮 -->
        <v-btn data-testid="task-dialog-save-button" color="primary" variant="elevated" :disabled="!canSave"
          :loading="operationState.saving" @click="handleSave">
          {{ getSaveButtonText() }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
/**
 * TaskTemplateDialog - 任务模板创建和编辑对话框
 *
 * 功能特性：
 * - 支持三种模式：创建(create)、编辑(edit)、基于元模板创建(createFromMeta)
 * - 完整的表单验证和错误处理
 * - 响应式设计，支持移动端
 * - 键盘快捷键支持 (Ctrl+S保存, Esc取消, Ctrl+Enter快速保存)
 * - 步骤指示器(仅在基于元模板创建时显示)
 * - 加载状态和错误状态处理
 * - 事件通知机制
 *
 * 使用方法：
 * ```vue
 * <TaskTemplateDialog
 *   ref="dialogRef"
 *   @saved="handleSaved"
 *   @cancelled="handleCancelled"
 * />
 *
 * // 在代码中调用
 * dialogRef.value?.openForCreation()
 * dialogRef.value?.openForUpdate(template)
 * dialogRef.value?.openForCreationWithMetaTemplateUuid(uuid)
 * ```
 */

import { ref, computed, watch, reactive, defineEmits } from 'vue';
import TaskTemplateForm from '../TaskTemplateForm/TaskTemplateForm.vue';
import { TaskTemplate } from '@dailyuse/domain-client/task';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { useTaskTemplate } from '../../composables/useTaskTemplate';
import { useTaskStore } from '../../stores/taskStore';

// ===== 类型定义 =====
type DialogMode = 'create' | 'edit';

interface DialogState {
  visible: boolean;
  mode: DialogMode;
}

interface OperationState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  loadingText: string;
}

interface FormData {
  taskTemplate: TaskTemplate | null;
  originalTemplate: TaskTemplate | null; // 用于编辑模式的原始数据备份
}

// ===== 组合式函数 =====
const { createTaskTemplate, updateTaskTemplate } = useTaskTemplate();
const taskStore = useTaskStore();

// ===== Emits 定义 =====
interface Emits {
  saved: [template: any, mode: DialogMode];
  cancelled: [];
}

const emit = defineEmits<Emits>();

// ===== 响应式数据 =====
const formRef = ref<InstanceType<typeof TaskTemplateForm> | null>(null);

const dialogState = reactive<DialogState>({
  visible: false,
  mode: 'create',
});

const operationState = reactive<OperationState>({
  loading: false,
  saving: false,
  error: null,
  loadingText: '',
});

const formData = reactive<FormData>({
  taskTemplate: null,
  originalTemplate: null,
});

const formValidation = ref({
  isValid: false,
});

// ===== 计算属性 =====
const canSave = computed(() => {
  return (
    formValidation.value.isValid &&
    !operationState.loading &&
    !operationState.saving &&
    formData.taskTemplate !== null
  );
});

// ===== 方法 =====

/**
 * 获取标题图标
 */
const getHeaderIcon = (): string => {
  switch (dialogState.mode) {
    case 'create':
      return 'mdi-plus-circle';
    case 'edit':
      return 'mdi-pencil';
    default:
      return 'mdi-file-document';
  }
};

/**
 * 获取标题图标颜色
 */
const getHeaderIconColor = (): string => {
  switch (dialogState.mode) {
    case 'create':
      return 'success';
    case 'edit':
      return 'primary';
    default:
      return 'grey';
  }
};

/**
 * 获取标题文本
 */
const getHeaderTitle = (): string => {
  switch (dialogState.mode) {
    case 'create':
      return '创建任务模板';
    case 'edit':
      return '编辑任务模板';
    default:
      return '任务模板';
  }
};

/**
 * 获取副标题
 */
const getHeaderSubtitle = (): string => {
  switch (dialogState.mode) {
    case 'create':
      return '创建一个新的任务模板';
    case 'edit':
      return '修改现有任务模板的配置';
    default:
      return '';
  }
};

/**
 * 获取保存按钮文本
 */
const getSaveButtonText = (): string => {
  switch (dialogState.mode) {
    case 'create':
      return '创建模板';
    case 'edit':
      return '保存更改';
    default:
      return '保存';
  }
};

/**
 * 清除错误状态
 */
const clearError = (): void => {
  operationState.error = null;
};

/**
 * 重置对话框状态
 */
const resetDialog = (): void => {
  dialogState.visible = false;
  dialogState.mode = 'create';

  operationState.loading = false;
  operationState.saving = false;
  operationState.error = null;
  operationState.loadingText = '';

  formData.taskTemplate = null;
  formData.originalTemplate = null;

  formValidation.value.isValid = false;
};

/**
 * 创建空白的任务模板
 */
const createBlankTemplate = (): TaskTemplate => {
  console.log('Creating blank template...');
  
  // 使用静态工厂方法创建空白模板
  // forCreate 方法已提供智能默认值：
  // - accountUuid 使用空字符串占位符，保存时由后端从 token 注入
  // - 标题为空，让用户直接输入
  // - 开始日期默认为今天
  // - 结束日期默认为一个月后
  // - 时间点默认为当前时间
  // - 时间段默认为当前时间到1小时后
  const template = TaskTemplate.forCreate();

  console.log('Created blank template:', template);
  return template;
};

/**
 * 处理模板数据更新
 */
const handleTemplateUpdate = (updatedTemplate: TaskTemplate): void => {
  formData.taskTemplate = updatedTemplate;
};

/**
 * 处理验证状态更新
 */
const handleValidationUpdate = (validationResult: { isValid: boolean }): void => {
  formValidation.value = validationResult;
};

/**
 * 处理取消操作
 */
const handleCancel = (): void => {
  emit('cancelled');
  resetDialog();
};

/**
 * 处理保存操作
 */
const handleSave = async (): Promise<void> => {
  if (!canSave.value || !formData.taskTemplate) {
    return;
  }

  try {
    operationState.saving = true;
    operationState.error = null;

    // 先验证表单
    const isFormValid = await formRef.value?.validate();
    if (!isFormValid) {
      operationState.error = '请检查表单数据的有效性';
      return;
    }

    // 根据模式执行不同的保存逻辑
    let result: any;

    switch (dialogState.mode) {
      case 'create':
        // 将 TaskTemplate 对象转换为 CreateTaskTemplateRequest
        // 🔥 自动判断 taskType：如果有 recurrenceRule 则为 RECURRING，否则为 ONE_TIME
        const taskType = formData.taskTemplate.recurrenceRule 
          ? 'RECURRING' 
          : 'ONE_TIME';
        
        const createRequest: any = {
          accountUuid: formData.taskTemplate.accountUuid,
          title: formData.taskTemplate.title,
          description: formData.taskTemplate.description,
          taskType: taskType, // 使用自动判断的 taskType
          timeConfig: formData.taskTemplate.timeConfig?.toServerDTO(),
          recurrenceRule: formData.taskTemplate.recurrenceRule?.toServerDTO(),
          reminderConfig: formData.taskTemplate.reminderConfig?.toServerDTO(),
          importance: formData.taskTemplate.importance,
          urgency: formData.taskTemplate.urgency,
          goalBinding: formData.taskTemplate.goalBinding,
          folderUuid: formData.taskTemplate.folderUuid,
          tags: formData.taskTemplate.tags,
          color: formData.taskTemplate.color,
          generateAheadDays: formData.taskTemplate.generateAheadDays,
        };
        result = await createTaskTemplate(createRequest);
        break;

      case 'edit':
        if (!formData.originalTemplate) {
          throw new Error('缺少原始模板数据');
        }
        // 将 TaskTemplate 对象转换为 UpdateTaskTemplateRequest
        // 🔥 自动判断 taskType：如果有 recurrenceRule 则为 RECURRING，否则为 ONE_TIME
        const editTaskType = formData.taskTemplate.recurrenceRule 
          ? 'RECURRING' 
          : 'ONE_TIME';
        
        const updateRequest: any = {
          title: formData.taskTemplate.title,
          description: formData.taskTemplate.description,
          taskType: editTaskType, // 使用自动判断的 taskType
          timeConfig: formData.taskTemplate.timeConfig?.toServerDTO(),
          recurrenceRule: formData.taskTemplate.recurrenceRule?.toServerDTO(),
          reminderConfig: formData.taskTemplate.reminderConfig?.toServerDTO(),
          importance: formData.taskTemplate.importance,
          urgency: formData.taskTemplate.urgency,
          goalBinding: formData.taskTemplate.goalBinding,
          folderUuid: formData.taskTemplate.folderUuid,
          tags: formData.taskTemplate.tags,
          color: formData.taskTemplate.color,
          generateAheadDays: formData.taskTemplate.generateAheadDays,
        };
        result = await updateTaskTemplate(formData.originalTemplate.uuid, updateRequest);
        break;

      default:
        throw new Error('未知的对话框模式');
    }

    // 成功后通知父组件并关闭对话框
    emit('saved', result, dialogState.mode);
    resetDialog();

    // 记录成功日志
    console.log('任务模板保存成功:', result);
  } catch (error) {
    console.error('保存任务模板失败:', error);
    operationState.error = error instanceof Error ? error.message : '保存失败';
  } finally {
    operationState.saving = false;
  }
};

// ===== 公开方法（供外部调用）=====

/**
 * 打开创建模式
 */
const openForCreation = (): void => {
  console.log('[TaskTemplateDialog] openForCreation called');
  resetDialog();
  dialogState.mode = 'create';
  dialogState.visible = true;

  // 创建空白模板
  formData.taskTemplate = createBlankTemplate();
  console.log('[TaskTemplateDialog] Created blank template:', formData.taskTemplate);
  console.log('[TaskTemplateDialog] Dialog visible:', dialogState.visible);
};

/**
 * 打开编辑模式
 */
const openForUpdate = (template: TaskTemplate): void => {
  resetDialog();
  dialogState.mode = 'edit';
  dialogState.visible = true;

  // 克隆模板以避免直接修改原始数据
  formData.originalTemplate = template;
  formData.taskTemplate = template.clone();
};

// ===== 监听器 =====

// 监听对话框关闭，清理状态
watch(
  () => dialogState.visible,
  (newVisible) => {
    if (!newVisible) {
      // 延迟重置以确保动画完成
      setTimeout(resetDialog, 300);
    }
  },
);

// 监听键盘事件
watch(
  () => dialogState.visible,
  (visible) => {
    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
  },
);

// ===== 键盘快捷键支持 =====
const handleKeyDown = (event: KeyboardEvent): void => {
  // Ctrl/Cmd + S 保存
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault();
    if (canSave.value) {
      handleSave();
    }
  }

  // Escape 取消
  if (event.key === 'Escape') {
    event.preventDefault();
    handleCancel();
  }

  // Ctrl/Cmd + Enter 快速保存
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    if (canSave.value) {
      handleSave();
    }
  }
};

// ===== 暴露给父组件的方法 =====
defineExpose({
  openForCreation,
  openForUpdate,
});
</script>

<style scoped>
.task-template-dialog {
  border-radius: 16px;
  max-height: 90vh;
}

.dialog-header {
  background: linear-gradient(135deg,
      rgba(var(--v-theme-primary), 0.1),
      rgba(var(--v-theme-secondary), 0.05));
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
  padding: 1.5rem;
}

.dialog-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0;
}

.dialog-actions {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
  padding: 1rem 1.5rem;
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(8px);
}

/* 步骤指示器样式 */
.v-stepper-header {
  box-shadow: none !important;
  background: transparent;
}

/* 加载状态动画 */
.loading-container {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 表单容器 */
.form-container {
  transition: all 0.3s ease;
}

.form-container.readonly {
  opacity: 0.7;
  pointer-events: none;
}

/* 错误状态样式 */
.v-alert {
  border-radius: 12px;
}

/* 按钮样式增强 */
.dialog-actions .v-btn {
  min-width: 100px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-template-dialog {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
  }

  .dialog-header {
    padding: 1rem;
  }

  .dialog-actions {
    padding: 1rem;
  }

  .dialog-actions .v-btn {
    min-width: 80px;
    font-size: 0.875rem;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .dialog-header {
    background: linear-gradient(135deg,
        rgba(var(--v-theme-primary), 0.15),
        rgba(var(--v-theme-secondary), 0.08));
  }

  .dialog-actions {
    background: rgba(var(--v-theme-surface), 0.9);
  }
}

/* 焦点状态增强 */
.v-btn:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

/* 步骤指示器在小屏幕上的样式 */
@media (max-width: 600px) {
  .v-stepper-header .v-stepper-item {
    font-size: 0.75rem;
  }
}
</style>

