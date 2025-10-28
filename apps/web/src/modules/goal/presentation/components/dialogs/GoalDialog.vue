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
              <!-- 使用模板按钮 -->
              <v-alert v-if="!isEditing" type="info" variant="tonal" density="compact" class="mb-4">
                <div class="d-flex align-center justify-space-between">
                  <span>快速开始：从专业模板创建目标</span>
                  <v-btn
                    variant="elevated"
                    color="secondary"
                    prepend-icon="mdi-lightbulb-outline"
                    @click="templateBrowserRef?.open()"
                  >
                    浏览模板
                  </v-btn>
                </div>
              </v-alert>

              <v-row>
                <v-col cols="11">
                  <v-text-field
                    v-model="goalName"
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
                        :style="{ backgroundColor: goalColor }"
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
                            @click="goalColor = colorOption"
                          />
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-menu>
                </v-col>
              </v-row>

              <v-select
                v-model="GoalFolderUuid"
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

              <v-textarea v-model="goalDescription" label="目标描述" rows="3" />

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

              <v-textarea v-model="goalNote" label="备注" rows="3" />
            </v-form>
          </v-window-item>

          <!-- Key Results Tab -->
          <v-window-item :value="1">
            <div class="key-results-overview">
              <div v-if="goalModel && goalModel.keyResults && goalModel.keyResults.length > 0" class="mb-4">
                <h4 class="text-h6 mb-3">已添加的关键结果 ({{ goalModel.keyResults.length }})</h4>
                <v-list>
                  <v-list-item
                    v-for="(kr, index) in goalModel.keyResults"
                    :key="`kr-${index}`"
                    class="mb-2"
                  >
                    <template v-slot:prepend>
                      <v-icon :color="goalColor">mdi-target</v-icon>
                    </template>
                    <v-list-item-title>{{ kr.title || '未命名关键结果' }}</v-list-item-title>
                    <v-list-item-subtitle>
                      当前值: {{ kr.progress.currentValue || 0 }} / 目标值: {{ kr.progress.targetValue || 0 }}
                      <span v-if="kr.weight">(权重: {{ kr.weight }})</span>
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-pencil"
                        variant="text"
                        :color="goalColor"
                        size="small"
                        @click="
                          goalModel && keyResultDialogRef?.openForUpdateKeyResultInGoalEditing(
                            goalModel as GoalClient,
                            kr as KeyResultClient,
                          )
                        "
                      />
                      <v-btn
                        icon="mdi-delete"
                        variant="text"
                        color="error"
                        size="small"
                        @click="goalModel && startRemoveKeyResult(goalModel as GoalClient, kr.uuid)"
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
              <v-row class="mt-2">
                <v-col cols="12" md="8">
                  <v-btn
                    :color="goalColor"
                    variant="elevated"
                    prepend-icon="mdi-plus"
                    block
                    class="add-kr-btn"
                    @click="
                      goalModel && keyResultDialogRef?.openForCreateKeyResultInGoalEditing(goalModel as GoalClient)
                    "
                  >
                    {{
                      (goalModel?.keyResults?.length || 0) === 0 ? '添加第一个关键结果' : '添加更多关键结果'
                    }}
                  </v-btn>
                </v-col>
                <v-col cols="12" md="4">
                  <v-btn
                    color="secondary"
                    variant="tonal"
                    prepend-icon="mdi-robot"
                    block
                    :disabled="(goalModel?.keyResults?.length || 0) < 2"
                    @click="weightSuggestionRef?.open()"
                  >
                    AI 权重推荐
                  </v-btn>
                </v-col>
              </v-row>
              <v-alert type="info" variant="tonal" class="mt-4" density="compact">
                <template v-slot:prepend>
                  <v-icon>mdi-lightbulb-outline</v-icon>
                </template>
                建议为每个目标设置 2-4 个关键结果，确保目标的可衡量性。 添加 2 个以上 KR 后可使用 AI
                权重推荐功能。
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
                        v-model="goalMotive"
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
                        v-model="goalFeasibility"
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

          <!-- Auto Status Rules Tab -->
          <v-window-item :value="3">
            <div class="rules-section px-4 py-2">
              <StatusRuleEditor />
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- 内嵌的关键结果对话框 -->
  <KeyResultDialog ref="keyResultDialogRef" />
  <!-- AI 权重推荐面板 -->
  <WeightSuggestionPanel
    ref="weightSuggestionRef"
    :key-results="(goalModel?.keyResults || []) as KeyResultClient[]"
    @apply="handleApplyWeightStrategy"
  />
  <!-- 目标模板浏览器 -->
  <TemplateBrowser ref="templateBrowserRef" @apply="handleApplyTemplate" />
  <!-- 确认对话框 -->
  <DuConfirmDialog
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
import WeightSuggestionPanel from '../weight/WeightSuggestionPanel.vue';
import TemplateBrowser from '../template/TemplateBrowser.vue';
import StatusRuleEditor from '../rules/StatusRuleEditor.vue';
import DuConfirmDialog from '@dailyuse/ui/components/dialog/DuConfirmDialog.vue';
// types
import { useGoalStore } from '../../stores/goalStore';
import { GoalClient, KeyResultClient } from '@dailyuse/domain-client';
import { GoalContracts } from '@dailyuse/contracts';
import type { WeightStrategy } from '../../../application/services/WeightRecommendationService';
import type { GoalTemplate } from '../../../domain/templates/GoalTemplates';
// composables
import { useGoalManagement } from '../../composables/useGoalManagement';
import { useKeyResult } from '../../composables/useKeyResult';
import { useAccountStore } from '@/modules/account/presentation/stores/useAccountStore';

const goalManagement = useGoalManagement();
const keyResultComposable = useKeyResult();

const { createGoal, updateGoal } = goalManagement;
const { deleteKeyResult } = keyResultComposable;

const goalStore = useGoalStore();
const accountStore = useAccountStore();

const visible = ref(false);
const propGoal = ref<GoalClient | null>(null);

// 组件对象
const keyResultDialogRef = ref<InstanceType<typeof KeyResultDialog> | null>(null);
const weightSuggestionRef = ref<InstanceType<typeof WeightSuggestionPanel> | null>(null);
const templateBrowserRef = ref<InstanceType<typeof TemplateBrowser> | null>(null);

// 使用GoalClient管理完整goal（包括keyResults）
const loading = ref(false);
const goalModel = ref<GoalClient | null>(null);

const isEditing = computed(() => !!propGoal.value);

// 监听弹窗和传入对象，初始化本地对象
watch(
  [visible, () => propGoal.value],
  ([isVisible, goal]) => {
    if (isVisible) {
      if (goal) {
        // 编辑模式：克隆现有 goal
        goalModel.value = goal.clone();
      } else {
        // 创建模式：创建新 goal（accountUuid 在保存时注入）
        goalModel.value = GoalClient.forCreate();
      }
    }
  },
  { immediate: true },
);

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

// Apply AI weight strategy
const handleApplyWeightStrategy = (strategy: WeightStrategy) => {
  if (!goalModel.value?.keyResults || goalModel.value.keyResults.length === 0) {
    return;
  }

  // 应用权重到每个 KeyResult
  goalModel.value.keyResults.forEach((kr, index) => {
    if (strategy.weights[index] !== undefined && kr.uuid) {
      try {
        goalModel.value?.updateKeyResult(kr.uuid, {
          ...kr,
          weight: strategy.weights[index],
        } as any);
      } catch (error) {
        console.error('Failed to update key result weight:', error);
      }
    }
  });

  console.log(`Applied ${strategy.label} strategy:`, strategy.weights);
};

// 应用目标模板
const handleApplyTemplate = (template: GoalTemplate) => {
  // 填充目标基本信息
  goalName.value = template.title;
  goalDescription.value = template.description;

  // 设置建议的时间范围
  if (template.suggestedDuration) {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + template.suggestedDuration);

    startTimeFormatted.value = today.toISOString().split('T')[0];
    endTimeFormatted.value = endDate.toISOString().split('T')[0];
  }

  // 清空现有关键结果（如果有）
  // KeyResults 是只读的，需要通过 removeKeyResult 逐个删除
  const keyResults = goalModel.value?.keyResults || [];
  keyResults.forEach(kr => {
    goalModel.value?.removeKeyResult(kr.uuid);
  });

  // TODO: 从模板创建关键结果
  // 由于 KeyResult 的创建需要通过 KeyResultDialog，这里只记录日志
  // 用户需要手动添加关键结果，但会看到模板的建议值
  console.log(`Applied template: ${template.title}`);
  console.log(`Suggested KeyResults (${template.keyResults.length}):`, template.keyResults);

  // 切换到 KeyResults tab，引导用户添加 KR
  activeTab.value = 1;

  // 可选：显示提示信息
  alert(
    `已应用模板"${template.title}"！\n建议添加 ${template.keyResults.length} 个关键结果，请点击"添加关键结果"按钮继续。`,
  );
};

const startRemoveKeyResult = (goal: GoalClient, keyResultUuid: string) => {
  confirmDialog.value = {
    show: true,
    title: '确认删除',
    message: '您确定要删除这个关键结果吗？',
    onConfirm: () => {
      // 直接使用 removeKeyResult 方法
      goalModel.value?.removeKeyResult(keyResultUuid);
      confirmDialog.value.show = false;
    },
    onCancel: () => {
      confirmDialog.value.show = false;
    },
  };
};

// 监听弹窗和传入对象，初始化本地对象
watch(
  [visible, () => propGoal.value],
  ([isVisible, goal]) => {
    if (isVisible) {
      if (goal) {
        console.log('[GoalDialog] Original Goal before clone:', {
          uuid: goal.uuid,
          title: goal.title,
          keyResultsCount: goal.keyResults?.length || 0,
          keyResults: goal.keyResults,
        });

        goalModel.value = goal.clone();

        console.log('[GoalDialog] Cloned Goal after clone:', {
          uuid: goalModel.value.uuid,
          title: goalModel.value.title,
          keyResultsCount: goalModel.value.keyResults?.length || 0,
          keyResults: goalModel.value.keyResults,
        });
      } else {
        // 创建模式：创建新 goal（accountUuid 在保存时注入）
        goalModel.value = GoalClient.forCreate();
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
  { name: '规则设置', icon: 'mdi-robot', color: 'info' },
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

// 表单字段的 getter/setter
const goalName = computed({
  get: () => goalModel.value?.title || '',
  set: (val: string) => {
    goalModel.value?.updateTitle(val);
  },
});

const goalColor = computed({
  get: () => goalModel.value?.color || '#FF5733',
  set: (val: string) => {
    goalModel.value?.updateColor(val);
  },
});

const GoalFolderUuid = computed({
  get: () => goalModel.value?.folderUuid || '',
  set: (val: string) => {
    goalModel.value?.updateFolder(val);
  },
});

const goalDescription = computed({
  get: () => goalModel.value?.description || '',
  set: (val: string) => {
    goalModel.value?.updateDescription(val);
  },
});

const goalNote = computed({
  get: () => goalModel.value?.motivation || '',
  set: (val: string) => {
    goalModel.value?.updateMotivation(val);
  },
});

const goalMotive = computed({
  get: () => goalModel.value?.motivation || '',
  set: (val: string) => {
    goalModel.value?.updateMotivation(val);
  },
});

const goalFeasibility = computed({
  get: () => goalModel.value?.feasibilityAnalysis || '',
  set: (val: string) => {
    goalModel.value?.updateFeasibilityAnalysis(val);
  },
});

const importanceLevel = computed({
  get: () => goalModel.value?.importance || GoalContracts.ImportanceLevel.Moderate,
  set: (val: GoalContracts.ImportanceLevel) => {
    goalModel.value?.updateImportance(val);
  },
});

const urgencyLevel = computed({
  get: () => goalModel.value?.urgency || GoalContracts.UrgencyLevel.Medium,
  set: (val: GoalContracts.UrgencyLevel) => {
    goalModel.value?.updateUrgency(val);
  },
});

// 日期格式化
const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

const startTimeFormatted = computed({
  get: () => {
    const startDate = goalModel.value?.startDate;
    return startDate ? new Date(startDate).toISOString().split('T')[0] : '';
  },
  set: (val: string) => {
    if (val) {
      const timestamp = new Date(val).getTime();
      goalModel.value?.updateStartDate(timestamp);
    }
  },
});

const endTimeFormatted = computed({
  get: () => {
    const targetDate = goalModel.value?.targetDate;
    return targetDate ? new Date(targetDate).toISOString().split('T')[0] : '';
  },
  set: (val: string) => {
    if (val) {
      const timestamp = new Date(val).getTime();
      goalModel.value?.updateTargetDate(timestamp);
    }
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
  if (!goalModel.value || !goalName.value?.trim()) return false;
  const startDate = goalModel.value.startDate;
  const targetDate = goalModel.value.targetDate;
  if (!startDate || !targetDate) return false;
  return targetDate > startDate;
});

// 保存和取消
const handleSave = async () => {
  if (!isFormValid.value || !goalModel.value) return;
  
  loading.value = true;
  try {
    if (isEditing.value) {
      // 编辑模式：只发送基本字段
      const updateData: any = {
        title: goalModel.value.title,
        description: goalModel.value.description ?? undefined,
        color: goalModel.value.color ?? undefined,
        feasibilityAnalysis: goalModel.value.feasibilityAnalysis ?? undefined,
        motivation: goalModel.value.motivation ?? undefined,
        importance: goalModel.value.importance,
        urgency: goalModel.value.urgency,
        category: goalModel.value.category ?? undefined,
        tags: goalModel.value.tags,
        startDate: goalModel.value.startDate ?? undefined,
        targetDate: goalModel.value.targetDate ?? undefined,
        folderUuid: goalModel.value.folderUuid ?? undefined,
        parentGoalUuid: goalModel.value.parentGoalUuid ?? undefined,
      };
      await updateGoal(goalModel.value.uuid, updateData);
    } else {
      // 创建模式：注入 accountUuid（乐观更新）
      // 优先使用 accountStore.accountUuid（state），fallback 到 account.uuid（computed）
      let accountUuid = accountStore.accountUuid || accountStore.getAccountUuid;
      
      // 如果还是失败，尝试从 localStorage 获取 token 并解析
      if (!accountUuid) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            accountUuid = payload.accountUuid;
            console.log('✅ 从 token 中获取 accountUuid:', accountUuid);
          } catch (e) {
            console.error('❌ 解析 token 失败:', e);
          }
        }
      }
      
      if (!accountUuid) {
        console.error('❌ 无法获取 accountUuid，AccountStore 状态:', {
          account: accountStore.account,
          accountUuid: accountStore.accountUuid,
          isAuthenticated: accountStore.isAuthenticated,
          currentAccount: accountStore.currentAccount,
          getAccountUuid: accountStore.getAccountUuid,
          token: !!localStorage.getItem('token'),
        });
        throw new Error('无法获取用户信息，请重新登录');
      }
      
      console.log('✅ 成功获取 accountUuid:', accountUuid);
      
      // 设置 accountUuid（只在创建时设置一次）
      goalModel.value.setAccountUuid(accountUuid);
      
      // 转换 KeyResults 为简化格式
      const keyResults = (goalModel.value.keyResults || []).map(kr => ({
        title: kr.title,
        description: kr.description ?? undefined,
        valueType: kr.progress.valueType,
        targetValue: kr.progress.targetValue,
        unit: kr.progress.unit ?? undefined,
        weight: kr.weight,
      }));
      
      const createData: any = {
        accountUuid: goalModel.value.accountUuid,
        title: goalModel.value.title,
        description: goalModel.value.description ?? undefined,
        color: goalModel.value.color ?? undefined,
        feasibilityAnalysis: goalModel.value.feasibilityAnalysis ?? undefined,
        motivation: goalModel.value.motivation ?? undefined,
        importance: goalModel.value.importance,
        urgency: goalModel.value.urgency,
        category: goalModel.value.category ?? undefined,
        tags: goalModel.value.tags,
        startDate: goalModel.value.startDate ?? undefined,
        targetDate: goalModel.value.targetDate ?? undefined,
        folderUuid: goalModel.value.folderUuid ?? undefined,
        parentGoalUuid: goalModel.value.parentGoalUuid ?? undefined,
        keyResults: keyResults.length > 0 ? keyResults : undefined,
      };
      await createGoal(createData);
    }
    closeDialog();
  } catch (error) {
    console.error('Failed to save goal:', error);
    // TODO: 显示错误提示
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  closeDialog();
};

const closeDialog = () => {
  visible.value = false;
};

const openDialog = (goal?: GoalClient) => {
  propGoal.value = goal || null;
  visible.value = true;
};

watch(visible, (newVal) => {
  if (!newVal) {
    // 重置表单
    propGoal.value = null;
    goalModel.value = null;
    activeTab.value = 0;
    loading.value = false;
  }
});

defineExpose({
  openDialog,
});
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
