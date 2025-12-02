<template>
  <div class="ai-kr-section">
    <!-- 标题栏 -->
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5">
        <v-icon class="mr-2" color="primary">mdi-bullseye-arrow</v-icon>
        关键结果管理
      </h2>
      <v-spacer />
      
      <!-- AI 生成按钮 -->
      <AIGenerateKRButton
        ref="generateButtonRef"
        :initial-goal-title="goalTitle"
        :initial-goal-description="goalDescription"
        @generated="handleGenerated"
        @error="handleError"
        data-testid="ai-generate-kr-button-section"
      />
    </div>

    <!-- 使用提示 -->
    <v-alert
      v-if="showHint && !hasGeneratedResults"
      type="info"
      variant="tonal"
      closable
      @click:close="showHint = false"
      class="mb-4"
      data-testid="usage-hint"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-lightbulb</v-icon>
        <div>
          <strong>提示：</strong>
          点击"AI 生成关键结果"按钮，让 AI 帮你智能生成可量化的关键结果，
          你可以预览、编辑后再采纳。
        </div>
      </div>
    </v-alert>

    <!-- 关键结果预览列表 -->
    <KRPreviewList
      ref="previewListRef"
      :results="generatedResults"
      @accept="handleAccept"
      @edit="handleEdit"
      @remove="handleRemove"
      @selectionChange="handleSelectionChange"
      data-testid="kr-preview-list-section"
    />

    <!-- 已采纳的关键结果 -->
    <div v-if="acceptedResults.length > 0" class="mt-6">
      <v-divider class="mb-4" />
      
      <div class="d-flex align-center mb-4">
        <h3 class="text-h6">
          <v-icon class="mr-2" color="success">mdi-check-circle</v-icon>
          已采纳的关键结果
        </h3>
        <v-chip size="small" color="success" variant="flat" class="ml-2">
          {{ acceptedResults.length }} 个
        </v-chip>
      </div>

      <v-list class="pa-0" data-testid="accepted-results-list">
        <v-list-item
          v-for="(kr, index) in acceptedResults"
          :key="kr.uuid || index"
          class="accepted-kr-item mb-2 pa-4"
          elevation="1"
          rounded
          data-testid="accepted-kr-item"
        >
          <template v-slot:prepend>
            <v-icon color="success">mdi-check-circle</v-icon>
          </template>

          <v-list-item-title class="mb-2">
            <strong>{{ kr.title }}</strong>
          </v-list-item-title>

          <v-list-item-subtitle>
            <div class="d-flex flex-wrap gap-2">
              <v-chip size="small" variant="tonal" color="success">
                目标：{{ kr.targetValue }} {{ kr.unit }}
              </v-chip>
              <v-chip v-if="kr.weight" size="small" variant="tonal" color="info">
                权重：{{ kr.weight }}%
              </v-chip>
            </div>
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-btn
              icon="mdi-close"
              size="small"
              variant="text"
              color="error"
              @click="handleRemoveAccepted(index)"
              data-testid="remove-accepted-button"
            />
          </template>
        </v-list-item>
      </v-list>
    </div>

    <!-- 手动添加关键结果按钮 -->
    <div class="mt-4">
      <v-btn
        variant="outlined"
        prepend-icon="mdi-plus"
        @click="handleManualAdd"
        data-testid="manual-add-button"
      >
        手动添加关键结果
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import AIGenerateKRButton from './AIGenerateKRButton.vue';
import KRPreviewList from './KRPreviewList.vue';
import { getGlobalMessage } from '@dailyuse/ui';

// ===== Types =====
interface KeyResultData {
  uuid?: string;
  title: string;
  description?: string;
  targetValue: number;
  unit: string;
  weight?: number;
  importance?: string;
  selected?: boolean;
}

// ===== Props & Emits =====
interface Props {
  goalTitle?: string;
  goalDescription?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  resultsUpdated: [results: KeyResultData[]];
  manualAdd: [];
}>();

// ===== Composables =====
const { success: showSuccess, error: showError } = getGlobalMessage();

// ===== State =====
const generateButtonRef = ref();
const previewListRef = ref();
const showHint = ref(true);
const generatedResults = ref<any[]>([]);
const acceptedResults = ref<KeyResultData[]>([]);
const selectedResults = ref<KeyResultData[]>([]);

// ===== Computed =====
const hasGeneratedResults = computed(() => generatedResults.value.length > 0);

// ===== Methods =====
function handleGenerated(result: any) {
  console.log('✅ AI 生成成功:', result);
  
  // 更新生成的结果列表
  if (result.keyResults && Array.isArray(result.keyResults)) {
    generatedResults.value = result.keyResults;
    showSuccess(`成功生成 ${result.keyResults.length} 个关键结果！`);
  }
}

function handleError(error: string) {
  console.error('❌ AI 生成失败:', error);
  showError(error);
}

function handleAccept(results: KeyResultData[]) {
  console.log('✅ 采纳关键结果:', results);
  
  // 添加到已采纳列表
  acceptedResults.value.push(...results);
  
  // 清空生成列表
  generatedResults.value = [];
  
  // 通知父组件
  emit('resultsUpdated', acceptedResults.value);
  
  showSuccess(`已采纳 ${results.length} 个关键结果`);
}

function handleEdit(index: number, kr: KeyResultData) {
  console.log('✏️ 编辑关键结果:', index, kr);
}

function handleRemove(index: number) {
  console.log('🗑️ 移除关键结果:', index);
}

function handleSelectionChange(selected: KeyResultData[]) {
  selectedResults.value = selected;
  console.log('📋 选择变更:', selected.length);
}

function handleRemoveAccepted(index: number) {
  if (confirm('确定要移除这个已采纳的关键结果吗？')) {
    acceptedResults.value.splice(index, 1);
    emit('resultsUpdated', acceptedResults.value);
    showSuccess('已移除');
  }
}

function handleManualAdd() {
  emit('manualAdd');
}

// ===== Public API =====
function openGenerateDialog() {
  generateButtonRef.value?.openDialog();
}

function clearAll() {
  generatedResults.value = [];
  acceptedResults.value = [];
  selectedResults.value = [];
  emit('resultsUpdated', []);
}

function getAcceptedResults() {
  return acceptedResults.value;
}

function setAcceptedResults(results: KeyResultData[]) {
  acceptedResults.value = results;
}

// ===== Watchers =====
watch([() => props.goalTitle, () => props.goalDescription], () => {
  console.log('📝 目标信息更新:', {
    title: props.goalTitle,
    description: props.goalDescription,
  });
});

// ===== Expose Public API =====
defineExpose({
  openGenerateDialog,
  clearAll,
  getAcceptedResults,
  setAcceptedResults,
});
</script>

<style scoped>
.ai-kr-section {
  width: 100%;
}

.accepted-kr-item {
  background-color: rgba(var(--v-theme-success), 0.05);
  border-left: 3px solid rgb(var(--v-theme-success));
}

.gap-2 {
  gap: 0.5rem;
}
</style>
