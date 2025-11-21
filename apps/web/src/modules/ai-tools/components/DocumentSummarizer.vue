<template>
  <v-container class="document-summarizer" :fluid="$vuetify.display.mobile">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <!-- Page Header -->
        <div class="page-header mb-6" data-test="page-header">
          <h1 class="text-h4 font-weight-bold" data-test="page-title">
            <v-icon icon="mdi-file-document-edit-outline" class="mr-2" />
            文档摘要工具
          </h1>
          <p class="text-subtitle-1 text-medium-emphasis mt-2" data-test="page-subtitle">
            快速提取长文本的核心内容、关键要点和行动建议
          </p>
        </div>

        <!-- Input Section -->
        <v-card elevation="2" class="input-card mb-4" data-test="input-card">
          <v-card-text>
            <!-- Text Area -->
            <v-textarea
              v-model="inputText"
              label="粘贴要摘要的文本"
              placeholder="在此粘贴文章、邮件、会议记录等内容..."
              variant="outlined"
              rows="10"
              auto-grow
              counter
              :maxlength="50000"
              :disabled="isLoading"
              :rules="[textValidationRule]"
              class="mb-4"
              data-test="input-textarea"
              aria-label="文档内容输入区"
              aria-describedby="character-count-indicator"
              autofocus
            />

            <!-- Character Count Indicator -->
            <div id="character-count-indicator" class="character-count mb-4" data-test="character-count" role="status" aria-live="polite">
              <v-chip
                :color="characterCountColor"
                size="small"
                variant="flat"
                data-test="character-count-chip"
              >
                <v-icon :icon="characterCountIcon" size="small" class="mr-1" />
                {{ characterCount }} / 50,000 字符
              </v-chip>
              <span v-if="!isTextValid && characterCount > 0" class="text-error text-caption ml-2" data-test="character-count-error" role="alert">
                {{ characterCount > 50000 ? '文本超出长度限制' : '请输入至少 1 个字符' }}
              </span>
            </div>

            <!-- Options -->
            <div class="options-section mb-4" data-test="options-section">
              <v-switch
                v-model="includeActions"
                color="primary"
                label="包含行动建议"
                density="compact"
                hide-details
                :disabled="isLoading"
                data-test="include-actions-switch"
              />
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons" data-test="action-buttons">
              <v-btn
                color="primary"
                size="large"
                :disabled="!canSummarize"
                :loading="isLoading"
                @click="handleSummarize"
                @keydown.enter="handleSummarize"
                prepend-icon="mdi-magic-staff"
                aria-label="生成文档摘要"
                data-test="summarize-button"
              >
                生成摘要
              </v-btn>
              <v-btn
                variant="outlined"
                size="large"
                :disabled="isLoading || (characterCount === 0 && !summary)"
                @click="handleClear"
                @keydown.enter="handleClear"
                prepend-icon="mdi-refresh"
                class="ml-2"
                aria-label="清空输入和输出"
                data-test="clear-button"
              >
                清空
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Error Alert -->
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          closable
          @click:close="error = null"
          class="mb-4"
          data-test="error-alert"
          role="alert"
          aria-live="assertive"
        >
          <template #prepend>
            <v-icon icon="mdi-alert-circle" />
          </template>
          {{ error }}
        </v-alert>

        <!-- Loading Overlay -->
        <v-overlay
          :model-value="isLoading"
          class="align-center justify-center"
          contained
          data-test="loading-overlay"
          role="status"
          aria-label="正在生成摘要"
          aria-busy="true"
        >
          <v-progress-circular
            indeterminate
            size="64"
            color="primary"
            aria-label="加载中"
            data-test="loading-spinner"
          />
          <div class="text-h6 mt-4" aria-live="polite">正在生成摘要...</div>
        </v-overlay>

        <!-- Summary Display -->
        <summary-display
          v-if="summary"
          ref="summaryOutputRef"
          :summary="summary"
          @copy="handleCopy"
          tabindex="0"
          role="region"
          aria-label="生成的摘要结果"
          data-test="summary-display"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDocumentSummarizer } from '../composables/useDocumentSummarizer';
import SummaryDisplay from './SummaryDisplay.vue';

// ============ Composable ============
const {
  inputText,
  summary,
  isLoading,
  error,
  includeActions,
  characterCount,
  isTextValid,
  canSummarize,
  summarize,
  copyToClipboard,
  reset,
} = useDocumentSummarizer();

// ============ Refs ============
const summaryOutputRef = ref<InstanceType<typeof SummaryDisplay> | null>(null);

// ============ Computed ============
const characterCountColor = computed(() => {
  if (characterCount.value === 0) return 'grey';
  if (characterCount.value > 50000) return 'error';
  if (characterCount.value > 40000) return 'warning';
  return 'success';
});

const characterCountIcon = computed(() => {
  if (characterCount.value === 0) return 'mdi-text';
  if (characterCount.value > 50000) return 'mdi-alert-circle';
  if (characterCount.value > 40000) return 'mdi-alert';
  return 'mdi-check-circle';
});

// ============ Methods ============
async function handleSummarize() {
  await summarize();
}

function handleClear() {
  if (confirm('确定要清空输入和输出吗？')) {
    reset();
  }
}

async function handleCopy() {
  await copyToClipboard();
}

// ============ Validation ============
function textValidationRule(value: string): boolean | string {
  if (!value) return '请输入文本';
  if (value.length > 50000) return '文本长度不能超过 50,000 字符';
  return true;
}

// ============ Focus Management ============
// Focus summary output when it appears
watch(summary, (newSummary) => {
  if (newSummary && summaryOutputRef.value) {
    // Announce to screen readers
    const announcement = `摘要生成完成。包含 ${newSummary.summary.keyPoints.length} 个关键要点。`;
    announceToScreenReader(announcement);
    
    // Focus the summary section for keyboard navigation
    setTimeout(() => {
      summaryOutputRef.value?.$el?.focus();
    }, 100);
  }
});

function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
</script>

<style scoped>
.document-summarizer {
  padding-top: 24px;
  padding-bottom: 48px;
  min-height: 100vh;
}

.page-header {
  text-align: center;
}

.input-card {
  position: relative;
}

.character-count {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.options-section {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

@media (max-width: 600px) {
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons .v-btn {
    margin-left: 0 !important;
    margin-top: 8px;
  }

  .action-buttons .v-btn:first-child {
    margin-top: 0;
  }
}

/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
