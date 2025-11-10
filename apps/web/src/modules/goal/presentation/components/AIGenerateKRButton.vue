<template>
  <div>
    <!-- AI 生成按钮 -->
    <v-btn
      color="primary"
      variant="elevated"
      prepend-icon="mdi-sparkles"
      :disabled="!hasQuota || isGenerating"
      :loading="isGenerating"
      @click="openDialog"
      data-testid="ai-generate-kr-button"
    >
      <span>AI 生成关键结果</span>
      <v-chip
        v-if="quota"
        size="small"
        class="ml-2"
        :color="hasQuota ? 'success' : 'error'"
        variant="flat"
      >
        {{ quota.remainingQuota }}/{{ quota.quotaLimit }}
      </v-chip>
    </v-btn>

    <!-- 生成对话框 -->
    <v-dialog
      v-model="showDialog"
      max-width="700"
      persistent
      data-testid="ai-generate-kr-dialog"
    >
      <v-card>
        <v-card-title class="d-flex align-center bg-primary pa-4">
          <v-icon class="mr-2">mdi-sparkles</v-icon>
          <span>AI 智能生成关键结果</span>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="closeDialog"
            :disabled="isGenerating"
          />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <!-- 配额状态提示 -->
          <v-alert
            v-if="quota"
            :type="hasQuota ? 'info' : 'warning'"
            variant="tonal"
            class="mb-4"
            density="compact"
          >
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-information</v-icon>
              <div>
                <strong>今日剩余额度：</strong>
                {{ quota.remainingQuota }} / {{ quota.quotaLimit }} 次
                <span v-if="timeToReset" class="ml-2 text-caption">
                  ({{ timeToReset }}后重置)
                </span>
              </div>
            </div>
          </v-alert>

          <!-- 表单 -->
          <v-form ref="formRef" v-model="formValid">
            <v-text-field
              v-model="formData.goalTitle"
              label="目标标题 *"
              placeholder="例如：提升团队工作效率"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-target"
              :disabled="isGenerating"
              data-testid="goal-title-input"
            />

            <v-textarea
              v-model="formData.goalDescription"
              label="目标描述（可选）"
              placeholder="详细描述目标的背景、意义和期望结果..."
              rows="3"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-text"
              :disabled="isGenerating"
              data-testid="goal-description-input"
            />

            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.category"
                  label="目标类别（可选）"
                  :items="categoryOptions"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-folder"
                  clearable
                  :disabled="isGenerating"
                  data-testid="category-select"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.importance"
                  label="重要程度（可选）"
                  :items="importanceOptions"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-star"
                  clearable
                  :disabled="isGenerating"
                  data-testid="importance-select"
                />
              </v-col>
            </v-row>

            <v-select
              v-model="formData.urgency"
              label="紧急程度（可选）"
              :items="urgencyOptions"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-clock-alert"
              clearable
              :disabled="isGenerating"
              data-testid="urgency-select"
            />
          </v-form>

          <!-- 错误提示 -->
          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            class="mt-4"
            closable
            @click:close="clearError()"
            data-testid="error-alert"
          >
            {{ error }}
          </v-alert>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeDialog"
            :disabled="isGenerating"
            data-testid="cancel-button"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="isGenerating"
            :disabled="!formValid || !hasQuota"
            @click="handleGenerate"
            prepend-icon="mdi-sparkles"
            data-testid="generate-button"
          >
            {{ isGenerating ? '生成中...' : '生成关键结果' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAIGeneration } from '@/modules/ai/composables/useAIGeneration';
import { useSnackbar } from '@/shared/composables/useSnackbar';

// ===== Props & Emits =====
interface Props {
  initialGoalTitle?: string;
  initialGoalDescription?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  generated: [result: any];
  error: [error: string];
}>();

// ===== Composables =====
const {
  generateKeyResults,
  isGenerating,
  error,
  quota,
  hasQuota,
  timeToReset,
  loadQuotaStatus,
  clearError,
} = useAIGeneration();

const { showSuccess, showError } = useSnackbar();

// ===== State =====
const showDialog = ref(false);
const formRef = ref();
const formValid = ref(false);

const formData = ref({
  goalTitle: '',
  goalDescription: '',
  category: '',
  importance: '',
  urgency: '',
});

// ===== Options =====
const categoryOptions = [
  { title: '工作', value: 'work' },
  { title: '个人', value: 'personal' },
  { title: '学习', value: 'learning' },
  { title: '健康', value: 'health' },
  { title: '财务', value: 'finance' },
];

const importanceOptions = [
  { title: '高', value: 'high' },
  { title: '中', value: 'medium' },
  { title: '低', value: 'low' },
];

const urgencyOptions = [
  { title: '紧急', value: 'urgent' },
  { title: '一般', value: 'normal' },
  { title: '不急', value: 'low' },
];

// ===== Validation Rules =====
const rules = {
  required: (v: string) => !!v || '此项为必填',
};

// ===== Methods =====
async function openDialog() {
  showDialog.value = true;
  
  // 填充初始值
  if (props.initialGoalTitle) {
    formData.value.goalTitle = props.initialGoalTitle;
  }
  if (props.initialGoalDescription) {
    formData.value.goalDescription = props.initialGoalDescription;
  }
  
  // 加载配额状态
  try {
    await loadQuotaStatus();
  } catch (err) {
    console.error('Failed to load quota:', err);
  }
}

function closeDialog() {
  if (!isGenerating.value) {
    showDialog.value = false;
    resetForm();
  }
}

function resetForm() {
  formData.value = {
    goalTitle: '',
    goalDescription: '',
    category: '',
    importance: '',
    urgency: '',
  };
  clearError();
  formRef.value?.reset();
}

async function handleGenerate() {
  if (!formValid.value || !hasQuota.value) {
    return;
  }

  try {
    console.log('🚀 Starting AI generation...', formData.value);
    
    const result = await generateKeyResults({
      goalTitle: formData.value.goalTitle,
      goalDescription: formData.value.goalDescription || undefined,
      category: formData.value.category || undefined,
      importance: formData.value.importance || undefined,
      urgency: formData.value.urgency || undefined,
    });

    console.log('✅ AI generation successful:', result);

    // 通知父组件
    emit('generated', result);

    // 显示成功消息
    showSuccess(`成功生成 ${result.keyResults?.length || 0} 个关键结果！`);

    // 关闭对话框
    closeDialog();
  } catch (err: any) {
    console.error('❌ AI generation failed:', err);
    
    const errorMessage = err.response?.data?.message || err.message || '生成失败，请重试';
    emit('error', errorMessage);
    showError(errorMessage);
  }
}

// ===== Watchers =====
watch(() => props.initialGoalTitle, (newVal) => {
  if (newVal && !showDialog.value) {
    formData.value.goalTitle = newVal;
  }
});

watch(() => props.initialGoalDescription, (newVal) => {
  if (newVal && !showDialog.value) {
    formData.value.goalDescription = newVal;
  }
});

// ===== Expose Public API =====
defineExpose({
  openDialog,
  closeDialog,
});
</script>

<style scoped>
.bg-primary {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: white !important;
}
</style>
