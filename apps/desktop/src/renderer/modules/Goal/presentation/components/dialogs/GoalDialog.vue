<template>
  <v-dialog :model-value="visible" height="550" width="800" class="goal-dialog" persistent>
    <v-card
      :style="{ backgroundColor: 'rgb(var(--v-theme-surface))' }"
      class="px-2 pb-2 d-flex flex-column"
      style="height: 550px"
    >
      <!-- 对话框头部 -->
      <v-card-title class="d-flex justify-space-between pa-4 flex-shrink-0">
        <v-btn variant="elevated" color="red-darken-3" @click="handleCancel">取消</v-btn>
        <span class="text-h5">{{ isEditing ? '编辑目标' : '新建目标' }}</span>
        <v-btn
          color="primary"
          @click="handleSave"
          :disabled="!isFormValid || loading"
          :loading="loading"
        >
          完成
        </v-btn>
      </v-card-title>

      <!-- Tabs -->
      <v-tabs
        v-model="activeTab"
        class="d-flex justify-center align-center flex-shrink-0 mb-2 pa-2"
        :style="{ backgroundColor: 'rgb(var(--v-theme-surface))' }"
      >
        <v-tab
          v-for="(tab, index) in tabs"
          :key="index"
          :value="index"
          class="flex-grow-1"
          :style="
            activeTab === index
              ? { backgroundColor: 'rgba(var(--v-theme-surface-light), 0.3)' }
              : {}
          "
        >
          <v-icon :icon="tab.icon" :color="tab.color" class="mr-2" />
          {{ tab.name }}
        </v-tab>
      </v-tabs>

      <v-card-text
        :style="{ backgroundColor: 'rgba(var(--v-theme-surface-light), 0.3)' }"
        class="pa-0 scroll-area"
      >
        <v-window v-model="activeTab" class="h-100 w-90">
          <!-- 基本信息 -->
          <v-window-item :value="0">
            <v-form @submit.prevent class="px-4 py-2">
              <v-row>
                <v-col cols="11">
                  <v-text-field
                    v-model="goalModel.name"
                    :rules="nameRules"
                    label="目标"
                    placeholder="一段话来描述自己的目标"
                    required
                  />
                </v-col>
                <v-col cols="1">
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        :style="{ backgroundColor: goalModel.color }"
                        class="color-btn mt-2"
                        icon
                      >
                        <v-icon color="white">mdi-palette</v-icon>
                      </v-btn>
                    </template>
                    <v-card min-width="200">
                      <v-card-text>
                        <div class="color-grid">
                          <v-btn
                            v-for="colorOption in predefinedColors"
                            :key="colorOption"
                            :style="{ backgroundColor: colorOption }"
                            class="color-option"
                            icon
                            @click="goalModel.color = colorOption"
                          />
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-menu>
                </v-col>
              </v-row>

              <v-select
                v-model="goalModel.dirUuid"
                :items="directoryOptions"
                item-title="text"
                item-value="value"
                label="目标文件夹"
                :disabled="directoryOptions.length === 0"
              >
                <template v-slot:prepend-inner>
                  <v-icon>mdi-folder</v-icon>
                </template>
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-icon>{{ item.raw.value ? 'mdi-folder' : 'mdi-folder-outline' }}</v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>

              <v-textarea v-model="goalModel.description" label="目标描述" rows="3" />

              <v-row>
                <v-col cols="6">
                  <v-text-field
                    v-model="startTimeFormatted"
                    label="开始时间"
                    type="date"
                    :rules="startTimeRules"
                    @update:model-value="updateStartTime"
                    :min="minDate"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="endTimeFormatted"
                    label="结束时间"
                    type="date"
                    :rules="endTimeRules"
                    :min="startTimeFormatted"
                    @update:model-value="updateEndTime"
                  />
                </v-col>
              </v-row>

              <v-textarea v-model="goalModel.note" label="备注" rows="3" />
            </v-form>
          </v-window-item>

          <!-- Key Results Tab -->
          <v-window-item :value="1">
            <div class="key-results-overview">
              <div v-if="goalModel.keyResults.length > 0" class="mb-4">
                <h4 class="text-h6 mb-3">已添加的关键结果 ({{ goalModel.keyResults.length }})</h4>
                <v-list>
                  <v-list-item
                    v-for="(kr, index) in goalModel.keyResults"
                    :key="`kr-${index}`"
                    class="mb-2"
                  >
                    <template v-slot:prepend>
                      <v-icon :color="goalModel.color">mdi-target</v-icon>
                    </template>
                    <v-list-item-title>{{ kr.name || '未命名关键结果' }}</v-list-item-title>
                    <v-list-item-subtitle>
                      目标值: {{ kr.startValue || 0 }} → {{ kr.targetValue || 0 }}
                      <span v-if="kr.weight">(权重: {{ kr.weight }})</span>
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-pencil"
                        variant="text"
                        :color="goalModel.color"
                        size="small"
                        @click="startEditKeyResult(KeyResult.ensureKeyResultNeverNull(kr))"
                      />
                      <v-btn
                        icon="mdi-delete"
                        variant="text"
                        color="error"
                        size="small"
                        @click="startRemoveKeyResult(props.goal as Goal, kr.uuid)"
                      />
                    </template>
                  </v-list-item>
                </v-list>
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-target-variant</v-icon>
                <h4 class="text-h6 text-medium-emphasis mb-2">还没有关键结果</h4>
                <p class="text-body-2 text-medium-emphasis mb-4">
                  关键结果是衡量目标达成的具体指标
                </p>
              </div>
              <v-btn
                :color="goalModel.color"
                variant="elevated"
                prepend-icon="mdi-plus"
                block
                class="add-kr-btn"
                @click="startCreateKeyResult"
              >
                {{ goalModel.keyResults.length === 0 ? '添加第一个关键结果' : '添加更多关键结果' }}
              </v-btn>
              <v-alert type="info" variant="tonal" class="mt-4" density="compact">
                <template v-slot:prepend>
                  <v-icon>mdi-lightbulb-outline</v-icon>
                </template>
                建议为每个目标设置 2-4 个关键结果，确保目标的可衡量性
              </v-alert>
            </div>
          </v-window-item>

          <!-- Motivation & Feasibility Tab -->
          <v-window-item :value="2">
            <div class="motivation-section">
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="h-100">
                    <v-card-title class="pb-2">
                      <v-icon color="primary" class="mr-2">mdi-lighthouse</v-icon>
                      目标动机
                    </v-card-title>
                    <v-card-text>
                      <v-textarea
                        v-model="goalModel.analysis.motive"
                        placeholder="为什么要实现这个目标？它对你意味着什么？"
                        variant="outlined"
                        rows="6"
                        density="comfortable"
                        hide-details
                      />
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="h-100">
                    <v-card-title class="pb-2">
                      <v-icon color="success" class="mr-2">mdi-lightbulb</v-icon>
                      可行性分析
                    </v-card-title>
                    <v-card-text>
                      <v-textarea
                        v-model="goalModel.analysis.feasibility"
                        placeholder="分析实现这个目标的可行性、所需资源和可能的挑战"
                        variant="outlined"
                        rows="6"
                        density="comfortable"
                        hide-details
                      />
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- 内嵌的关键结果对话框 -->
  <KeyResultDialog
    :model-value="keyResultDialog.show"
    :key-result="KeyResult.ensureKeyResult(keyResultDialog.keyResult)"
    @update:model-value="keyResultDialog.show = $event"
    @create-key-result="handleCreateKeyResult(goalModel as Goal, $event as KeyResult)"
    @update-key-result="handleUpdateKeyResult(goalModel as Goal, $event as KeyResult)"
    @remove-key-result="handleRemoveKeyResult(goalModel as Goal, $event as string)"
  />
  <!-- 确认对话框 -->
  <ConfirmDialog
    v-model="confirmDialog.show"
    :title="confirmDialog.title"
    :message="confirmDialog.message"
    confirm-text="确认"
    cancel-text="取消"
    @update:modelValue="confirmDialog.show = $event"
    @confirm="confirmDialog.onConfirm"
    @cancel="confirmDialog.onCancel"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
// components
import KeyResultDialog from './KeyResultDialog.vue';
import ConfirmDialog from '@renderer/shared/components/ConfirmDialog.vue';
// types
import { useGoalStore } from '@renderer/modules/Goal/presentation/stores/goalStore';
import { Goal } from '@renderer/modules/Goal/domain/aggregates/goal';
import { KeyResult } from '@renderer/modules/Goal/domain/entities/keyResult';
// composables
import { useGoalDialog } from '@renderer/modules/Goal/presentation/composables/useGoalDialog';

const {
  keyResultDialog,
  startCreateKeyResult,
  startEditKeyResult,
  handleCreateKeyResult,
  handleUpdateKeyResult,
  handleRemoveKeyResult,
} = useGoalDialog();

const goalStore = useGoalStore();
// Props & Emits
const props = defineProps<{
  visible: boolean;
  goal: Goal | null;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'create-goal', goal: Goal): void;
  (e: 'update-goal', goal: Goal): void;
}>();

// 本地表单对象
const loading = ref(false);
const goalModel = ref<Goal>(Goal.forCreate());

const isEditing = computed(() => !!props.goal);

const confirmDialog = ref<{
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}>({
  show: false,
  title: '',
  message: '',
  onConfirm: () => {},
  onCancel: () => {},
});

const startRemoveKeyResult = (goal: Goal, keyResultUuid: string) => {
  confirmDialog.value = {
    show: true,
    title: '确认删除',
    message: '您确定要删除这个关键结果吗？',
    onConfirm: () => {
      handleRemoveKeyResult(goal, keyResultUuid);
      confirmDialog.value.show = false;
    },
    onCancel: () => {
      confirmDialog.value.show = false;
    },
  };
};

// 监听弹窗和传入对象，初始化本地对象
watch(
  [() => props.visible, () => props.goal],
  ([visible, goal]) => {
    if (visible) {
      if (goal) {
        goalModel.value = goal.clone();
      } else {
        goalModel.value = Goal.forCreate();
      }
    }
  },
  { immediate: true },
);

// Tabs
const activeTab = ref(0);
const tabs = [
  { name: '基本信息', icon: 'mdi-information', color: 'primary' },
  { name: '关键结果', icon: 'mdi-target', color: 'success' },
  { name: '动机分析', icon: 'mdi-lightbulb', color: 'warning' },
];

// 预定义颜色
const predefinedColors = [
  '#FF5733',
  '#33FF57',
  '#3357FF',
  '#FF33F1',
  '#F1FF33',
  '#33FFF1',
  '#F133FF',
  '#FF3333',
  '#33FF33',
  '#3333FF',
  '#FFAA33',
  '#AA33FF',
  '#33AAFF',
  '#FF33AA',
  '#AAFF33',
];

// 校验规则
const nameRules = [(value: string) => !!value || '目标标题不能为空'];
const startTimeRules = [(value: string) => !!value || '开始时间不能为空'];
const endTimeRules = [
  (value: string) => !!value || '结束时间不能为空',
  (value: string) => {
    if (!value || !startTimeFormatted.value) return true;
    return new Date(value) >= new Date(startTimeFormatted.value) || '结束时间不能早于开始时间';
  },
];

// 日期格式化
const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});
const startTimeFormatted = computed({
  get: () =>
    goalModel.value.startTime ? goalModel.value.startTime.toISOString().split('T')[0] : '',
  set: (val: string) => {
    if (val) goalModel.value.startTime = new Date(val);
  },
});
const endTimeFormatted = computed({
  get: () => (goalModel.value.endTime ? goalModel.value.endTime.toISOString().split('T')[0] : ''),
  set: (val: string) => {
    if (val) goalModel.value.endTime = new Date(val);
  },
});
const updateStartTime = (val: string) => {
  startTimeFormatted.value = val;
};
const updateEndTime = (val: string) => {
  endTimeFormatted.value = val;
};

const allGoalFolders = computed(() => goalStore.getAllGoalFolders);

const directoryOptions = computed(() =>
  allGoalFolders.value
    .filter((dir) => !goalStore.isSystemGoalFolder(dir.uuid))
    .map((dir) => ({
      text: dir.name,
      value: dir.uuid,
    })),
);

// 表单有效性
const isFormValid = computed(() => {
  return !!goalModel.value.name?.trim() && goalModel.value.endTime > goalModel.value.startTime;
});
// 保存和取消
const handleSave = () => {
  if (!isFormValid.value) return;
  if (isEditing.value) {
    emit('update-goal', Goal.ensureGoalNeverNull(goalModel.value));
  } else {
    emit('create-goal', Goal.ensureGoalNeverNull(goalModel.value));
  }
  closeDialog();
};

const handleCancel = () => {
  closeDialog();
};

const closeDialog = () => {
  emit('update:modelValue', false);
};
</script>

<style scoped>
.goal-dialog {
  overflow-y: auto;
}

.v-card {
  overflow-y: auto;
  max-height: 90vh;
}

.color-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.color-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 8px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  min-width: 32px;
}

.color-option:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.motivation-section {
  height: 100%;
}

.v-window {
  height: 100%;
}

.v-window-item {
  height: 100%;
  overflow-y: auto;
}

.v-tab {
  text-transform: none;
  font-weight: 500;
  border-radius: 12px;
  margin: 0 4px;
  transition: all 0.3s ease;
}

.v-tab:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.v-text-field,
.v-textarea,
.v-select {
  margin-bottom: 8px;
}

.v-card[variant='outlined'] {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.v-card[variant='outlined']:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.v-list-item {
  border-radius: 8px;
  margin: 4px 0;
  transition: all 0.2s ease;
}

.v-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.key-results-overview {
  padding: 16px 0;
}

.add-kr-btn {
  border-radius: 12px;
  text-transform: none;
  font-weight: 500;
}

.add-kr-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

.scroll-area {
  flex: 1 1 auto;
  overflow: auto;
  min-height: 0;
}

@media (max-width: 768px) {
  .color-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .v-dialog {
    width: 95vw !important;
    height: 90vh !important;
    max-width: none !important;
  }

  .motivation-section .v-row {
    flex-direction: column;
  }

  .motivation-section .v-col {
    max-width: 100%;
  }
}
</style>
