<template>
  <div class="kr-preview-list">
    <!-- 标题 -->
    <div class="d-flex align-center mb-4">
      <v-icon class="mr-2" color="primary">mdi-lightbulb-on</v-icon>
      <h3 class="text-h6">AI 生成的关键结果预览</h3>
      <v-spacer />
      <v-chip
        size="small"
        color="primary"
        variant="flat"
        prepend-icon="mdi-check-circle"
      >
        {{ selectedCount }} / {{ keyResults.length }} 已选择
      </v-chip>
    </div>

    <!-- 空状态 -->
    <v-alert
      v-if="keyResults.length === 0"
      type="info"
      variant="tonal"
      icon="mdi-information"
      class="mb-4"
    >
      暂无生成的关键结果。请点击"AI 生成关键结果"按钮开始。
    </v-alert>

    <!-- 关键结果列表 -->
    <v-list v-else class="pa-0" data-testid="kr-preview-list">
      <v-list-item
        v-for="(kr, index) in keyResults"
        :key="kr.uuid || index"
        class="kr-preview-item mb-3 pa-4"
        :class="{ 'kr-selected': kr.selected, 'kr-disabled': !kr.selected }"
        elevation="2"
        rounded
        data-testid="kr-preview-item"
      >
        <template v-slot:prepend>
          <!-- 选择复选框 -->
          <v-checkbox
            v-model="kr.selected"
            hide-details
            density="compact"
            color="primary"
            @update:model-value="handleSelectionChange(kr)"
            data-testid="kr-checkbox"
          />
        </template>

        <v-list-item-title class="d-flex align-center mb-2">
          <v-icon class="mr-2" size="small" color="primary">mdi-target</v-icon>
          <strong>{{ kr.title }}</strong>
        </v-list-item-title>

        <v-list-item-subtitle class="mb-3">
          <div class="d-flex flex-wrap gap-2 mt-2">
            <!-- 目标值 -->
            <v-chip
              size="small"
              variant="tonal"
              color="success"
              prepend-icon="mdi-flag-checkered"
            >
              目标：{{ kr.targetValue }} {{ kr.unit }}
            </v-chip>

            <!-- 权重 -->
            <v-chip
              v-if="kr.weight"
              size="small"
              variant="tonal"
              color="info"
              prepend-icon="mdi-weight"
            >
              权重：{{ kr.weight }}%
            </v-chip>

            <!-- 重要性 -->
            <v-chip
              v-if="kr.importance"
              size="small"
              variant="tonal"
              :color="getImportanceColor(kr.importance)"
              prepend-icon="mdi-star"
            >
              {{ getImportanceLabel(kr.importance) }}
            </v-chip>
          </div>

          <!-- 描述 -->
          <div v-if="kr.description" class="mt-3 text-body-2">
            <v-icon size="small" class="mr-1">mdi-text</v-icon>
            {{ kr.description }}
          </div>
        </v-list-item-subtitle>

        <template v-slot:append>
          <!-- 编辑和删除按钮 -->
          <div class="d-flex flex-column gap-2">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="primary"
              @click="handleEdit(kr, index)"
              data-testid="kr-edit-button"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="handleRemove(index)"
              data-testid="kr-remove-button"
            />
          </div>
        </template>
      </v-list-item>
    </v-list>

    <!-- 批量操作按钮 -->
    <div v-if="keyResults.length > 0" class="d-flex gap-2 mt-4">
      <v-btn
        variant="text"
        prepend-icon="mdi-select-all"
        @click="selectAll"
        data-testid="select-all-button"
      >
        全选
      </v-btn>
      <v-btn
        variant="text"
        prepend-icon="mdi-select-off"
        @click="deselectAll"
        data-testid="deselect-all-button"
      >
        全不选
      </v-btn>
      <v-spacer />
      <v-btn
        color="error"
        variant="text"
        prepend-icon="mdi-close-circle"
        @click="clearAll"
        :disabled="keyResults.length === 0"
        data-testid="clear-all-button"
      >
        清空列表
      </v-btn>
      <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-check-circle"
        @click="handleAccept"
        :disabled="selectedCount === 0"
        data-testid="accept-button"
      >
        采纳选中的结果 ({{ selectedCount }})
      </v-btn>
    </div>

    <!-- 编辑对话框 -->
    <v-dialog
      v-model="showEditDialog"
      max-width="600"
      persistent
      data-testid="kr-edit-dialog"
    >
      <v-card v-if="editingKR">
        <v-card-title class="bg-primary pa-4">
          <v-icon class="mr-2">mdi-pencil</v-icon>
          编辑关键结果
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-form ref="editFormRef" v-model="editFormValid">
            <v-text-field
              v-model="editingKR.title"
              label="标题 *"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-target"
            />

            <v-textarea
              v-model="editingKR.description"
              label="描述（可选）"
              rows="3"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-text"
            />

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editingKR.targetValue"
                  label="目标值 *"
                  type="number"
                  :rules="[rules.required, rules.positive]"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-flag-checkered"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editingKR.unit"
                  label="单位 *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-ruler"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editingKR.weight"
                  label="权重（可选）"
                  type="number"
                  min="0"
                  max="100"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-weight"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="editingKR.importance"
                  label="重要性（可选）"
                  :items="importanceOptions"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-star"
                  clearable
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="cancelEdit">
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :disabled="!editFormValid"
            @click="saveEdit"
          >
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

// ===== Types =====
interface KeyResultPreview {
  uuid?: string;
  title: string;
  description?: string;
  targetValue: number;
  unit: string;
  weight?: number;
  importance?: string;
  selected: boolean; // 是否被选中
}

// ===== Props & Emits =====
interface Props {
  results?: any[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  accept: [results: KeyResultPreview[]];
  remove: [index: number];
  edit: [index: number, kr: KeyResultPreview];
  selectionChange: [selectedResults: KeyResultPreview[]];
}>();

// ===== Composables =====
const { success: showSuccess, warning: showWarning } = getGlobalMessage();

// ===== State =====
const keyResults = ref<KeyResultPreview[]>([]);
const showEditDialog = ref(false);
const editingKR = ref<KeyResultPreview | null>(null);
const editingIndex = ref(-1);
const editFormRef = ref();
const editFormValid = ref(false);

// ===== Computed =====
const selectedCount = computed(() => {
  return keyResults.value.filter(kr => kr.selected).length;
});

const selectedResults = computed(() => {
  return keyResults.value.filter(kr => kr.selected);
});

// ===== Options =====
const importanceOptions = [
  { title: '高', value: 'high' },
  { title: '中', value: 'medium' },
  { title: '低', value: 'low' },
];

// ===== Validation Rules =====
const rules = {
  required: (v: any) => !!v || '此项为必填',
  positive: (v: number) => v > 0 || '必须大于0',
};

// ===== Methods =====
function loadResults(results: any[]) {
  keyResults.value = results.map((kr: any) => ({
    uuid: kr.uuid || crypto.randomUUID(),
    title: kr.title || kr.name || '',
    description: kr.description || '',
    targetValue: kr.targetValue || kr.target || 0,
    unit: kr.unit || '',
    weight: kr.weight || null,
    importance: kr.importance || null,
    selected: true, // 默认全选
  }));
}

function handleSelectionChange(kr: KeyResultPreview) {
  emit('selectionChange', selectedResults.value);
}

function selectAll() {
  keyResults.value.forEach(kr => kr.selected = true);
  emit('selectionChange', selectedResults.value);
}

function deselectAll() {
  keyResults.value.forEach(kr => kr.selected = false);
  emit('selectionChange', selectedResults.value);
}

function clearAll() {
  if (confirm('确定要清空所有生成的关键结果吗？')) {
    keyResults.value = [];
    emit('selectionChange', []);
    showSuccess('已清空列表');
  }
}

function handleEdit(kr: KeyResultPreview, index: number) {
  editingKR.value = { ...kr };
  editingIndex.value = index;
  showEditDialog.value = true;
}

function cancelEdit() {
  showEditDialog.value = false;
  editingKR.value = null;
  editingIndex.value = -1;
}

function saveEdit() {
  if (!editFormValid.value || editingKR.value === null) {
    return;
  }

  keyResults.value[editingIndex.value] = { ...editingKR.value };
  emit('edit', editingIndex.value, editingKR.value);
  showSuccess('关键结果已更新');
  cancelEdit();
}

function handleRemove(index: number) {
  if (confirm('确定要移除这个关键结果吗？')) {
    keyResults.value.splice(index, 1);
    emit('remove', index);
    showSuccess('已移除');
  }
}

function handleAccept() {
  if (selectedCount.value === 0) {
    showWarning('请至少选择一个关键结果');
    return;
  }

  emit('accept', selectedResults.value);
}

function getImportanceColor(importance: string): string {
  switch (importance) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'grey';
  }
}

function getImportanceLabel(importance: string): string {
  switch (importance) {
    case 'high':
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
    default:
      return importance;
  }
}

// ===== Watchers =====
watch(() => props.results, (newResults) => {
  if (newResults && newResults.length > 0) {
    loadResults(newResults);
  }
}, { immediate: true });

// ===== Expose Public API =====
defineExpose({
  loadResults,
  selectAll,
  deselectAll,
  clearAll,
});
</script>

<style scoped>
.kr-preview-list {
  width: 100%;
}

.kr-preview-item {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.kr-preview-item.kr-selected {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.kr-preview-item.kr-disabled {
  opacity: 0.6;
}

.kr-preview-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.gap-2 {
  gap: 0.5rem;
}

.bg-primary {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: white !important;
}
</style>
