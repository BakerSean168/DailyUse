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
                <v-text-field
                  v-model="formData.startDate"
                  label="开始日期 *"
                  type="date"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-start"
                  :disabled="isGenerating"
                  data-testid="start-date-input"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.endDate"
                  label="结束日期 *"
                  type="date"
                  :rules="[rules.required, rules.endAfterStart]"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-end"
                  :disabled="isGenerating"
                  data-testid="end-date-input"
                />
              </v-col>
            </v-row>

            <v-textarea
              v-model="formData.goalContext"
              label="额外上下文（可选）"
              placeholder="提供额外的目标背景信息，帮助AI更好地生成关键结果..."
              rows="2"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-information"
              :disabled="isGenerating"
              data-testid="goal-context-input"
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
import { useAIGeneration } from '@/modules/ai/presentation/composables/useAIGeneration';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

// ===== Props & Emits =====
interface Props {
  initialGoalTitle?: string;
  initialGoalDescription?: string;
  initialStartDate?: number;  // timestamp
  initialEndDate?: number;    // timestamp
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

const { success: showSuccess, error: showError } = getGlobalMessage();

// ===== State =====
const showDialog = ref(false);
const formRef = ref();
const formValid = ref(false);

const formData = ref({
  goalTitle: '',
  goalDescription: '',
  startDate: '',  // ISO date string (YYYY-MM-DD)
  endDate: '',    // ISO date string (YYYY-MM-DD)
  goalContext: '',
});

// ===== Validation Rules =====
const rules = {
  required: (v: string) => !!v || '此项为必填',
  endAfterStart: (v: string) => {
    if (!v || !formData.value.startDate) return true;
    return new Date(v) >= new Date(formData.value.startDate) || '结束日期必须晚于或等于开始日期';
  },
};

// ===== Helper Functions =====
function dateToTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime();
}

function timestampToDateStr(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

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
  if (props.initialStartDate) {
    formData.value.startDate = timestampToDateStr(props.initialStartDate);
  } else {
    // 默认：今天
    formData.value.startDate = timestampToDateStr(Date.now());
  }
  if (props.initialEndDate) {
    formData.value.endDate = timestampToDateStr(props.initialEndDate);
  } else {
    // 默认：30天后
    formData.value.endDate = timestampToDateStr(Date.now() + 30 * 24 * 60 * 60 * 1000);
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
    startDate: '',
    endDate: '',
    goalContext: '',
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
      startDate: dateToTimestamp(formData.value.startDate),
      endDate: dateToTimestamp(formData.value.endDate),
      goalContext: formData.value.goalContext || undefined,
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
