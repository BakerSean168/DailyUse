<template>
  <v-container fluid class="key-result-detail-container pa-0">
    <!-- 加载状态 -->
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px">
      <v-progress-circular indeterminate color="primary" size="64" />
      <span class="ml-4 text-h6">加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="d-flex justify-center align-center" style="height: 400px">
      <v-alert type="error" variant="tonal" class="ma-4">
        <template #title>加载失败</template>
        {{ error }}
        <template #append>
          <v-btn @click="loadData" variant="text" color="error">重试</v-btn>
        </template>
      </v-alert>
    </div>

    <!-- 找不到 KeyResult -->
    <div v-else-if="!keyResult" class="d-flex justify-center align-center" style="height: 400px">
      <v-alert type="warning" variant="tonal" class="ma-4">
        <template #title>关键结果不存在</template>
        找不到指定的关键结果
        <template #append>
          <v-btn @click="$router.back()" variant="text" color="warning">返回</v-btn>
        </template>
      </v-alert>
    </div>

    <!-- 正常内容 -->
    <template v-else>
      <!-- 头部导航栏 -->
      <v-toolbar
        :color="`rgba(var(--v-theme-surface))`"
        elevation="2"
        class="key-result-header flex-shrink-0"
      >
        <v-btn icon @click="$router.back()">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>

        <v-toolbar-title class="text-h6 font-weight-medium">
          {{ keyResult.title }}
        </v-toolbar-title>

        <v-spacer />

        <!-- 编辑按钮 -->
        <v-btn icon @click="handleEditKeyResult">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>

        <!-- 更多功能菜单 -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="startDeleteKeyResult">
              <template v-slot:prepend>
                <v-icon>mdi-delete</v-icon>
              </template>
              <v-list-item-title>删除</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-toolbar>

      <!-- 主要内容区域 -->
      <div class="main-content flex-grow-1">
        <div class="content-wrapper px-6 py-4">
          <!-- KeyResult 基本信息卡片 -->
          <v-card class="mb-6 flex-shrink-0" elevation="2">
            <v-card-text class="pa-6">
              <v-row>
                <!-- 进度信息 -->
                <v-col cols="12" md="6">
                  <div class="mb-4">
                    <div class="text-body-2 text-medium-emphasis mb-2">当前进度</div>
                    <div class="text-h4 font-weight-bold">
                      {{ keyResult.currentValue ?? 0 }} / {{ keyResult.targetValue }}
                      <span v-if="keyResult.unit" class="text-body-1">{{ keyResult.unit }}</span>
                    </div>
                  </div>

                  <!-- 进度条 -->
                  <v-progress-linear
                    :model-value="progressPercentage"
                    height="8"
                    :color="progressColor"
                    class="mb-4"
                    rounded
                  />

                  <!-- 完成百分比 -->
                  <div class="text-body-2 text-medium-emphasis">
                    完成度：<span class="font-weight-bold">{{ progressPercentage }}%</span>
                    <v-chip
                      v-if="keyResult.isCompleted"
                      color="success"
                      size="small"
                      variant="elevated"
                      class="ml-2"
                    >
                      已完成
                    </v-chip>
                  </div>
                </v-col>

                <!-- 权重和汇聚方式 -->
                <v-col cols="12" md="6">
                  <v-row dense>
                    <v-col cols="12" sm="6">
                      <div class="text-body-2 text-medium-emphasis mb-1">权重</div>
                      <div class="text-h5 font-weight-bold">{{ keyResult.weight ?? 0 }}%</div>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <div class="text-body-2 text-medium-emphasis mb-1">聚合方式</div>
                      <v-chip
                        :color="goalColor || 'primary'"
                        variant="tonal"
                        size="small"
                        class="font-weight-medium"
                      >
                        {{ aggregationMethodLabel }}
                      </v-chip>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <div class="text-body-2 text-medium-emphasis mb-1">值类型</div>
                      <v-chip
                        color="info"
                        variant="tonal"
                        size="small"
                        class="font-weight-medium"
                      >
                        {{ valueTypeLabel }}
                      </v-chip>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <div class="text-body-2 text-medium-emphasis mb-1">所属目标</div>
                      <div class="text-body-2 font-weight-medium text-truncate">
                        {{ goal?.title || '加载中...' }}
                      </div>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>

              <!-- 描述 -->
              <v-divider class="my-4" />
              <div v-if="keyResult.description" class="mb-2">
                <div class="text-body-2 text-medium-emphasis mb-2">描述</div>
                <p class="text-body-2 mb-0">{{ keyResult.description }}</p>
              </div>
              <div v-else class="text-body-2 text-medium-emphasis italic">暂无描述</div>
            </v-card-text>
          </v-card>

          <!-- 进度记录列表卡片 -->
          <v-card class="mb-6" elevation="2">
            <v-card-title class="pa-6 d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-history</v-icon>
                <span class="text-h6">进度记录<v-chip size="small" variant="flat" class="ml-2">{{ records.length }}</v-chip></span>
              </div>
              <v-btn
                color="primary"
                variant="elevated"
                size="small"
                prepend-icon="mdi-plus"
                @click="handleAddRecord"
              >
                添加记录
              </v-btn>
            </v-card-title>

            <v-divider />

            <!-- 记录列表 -->
            <div v-if="records.length > 0" class="record-list">
              <v-list density="compact">
                <template v-for="(record, index) in records" :key="record.uuid">
                  <v-list-item class="py-3">
                    <template v-slot:prepend>
                      <v-avatar
                        :color="record.changeAmount > 0 ? 'success' : 'error'"
                        variant="tonal"
                        size="small"
                      >
                        <v-icon size="small">
                          {{ record.changeAmount > 0 ? 'mdi-plus' : 'mdi-minus' }}
                        </v-icon>
                      </v-avatar>
                    </template>

                    <v-list-item-title class="text-body-2">
                      <div class="d-flex align-center justify-space-between mb-1">
                        <span class="font-weight-medium">
                          {{ record.previousValue }} → {{ record.newValue }}
                        </span>
                        <span class="text-caption text-medium-emphasis">
                          {{ formatRecordDate(record.recordedAt) }}
                        </span>
                      </div>
                    </v-list-item-title>

                    <v-list-item-subtitle v-if="record.note" class="text-caption">
                      <v-icon size="12" class="mr-1">mdi-note-text</v-icon>
                      {{ record.note }}
                    </v-list-item-subtitle>

                    <v-list-item-subtitle class="text-caption">
                      <v-chip
                        :color="record.changeAmount > 0 ? 'success' : 'error'"
                        size="x-small"
                        variant="tonal"
                        class="font-weight-bold"
                      >
                        {{ record.changeAmount > 0 ? '+' : '' }}{{ record.changeAmount }}
                      </v-chip>
                    </v-list-item-subtitle>

                    <template v-slot:append>
                      <v-menu>
                        <template v-slot:activator="{ props }">
                          <v-btn icon size="x-small" v-bind="props" variant="text">
                            <v-icon size="small">mdi-dots-vertical</v-icon>
                          </v-btn>
                        </template>
                        <v-list>
                          <v-list-item @click="handleDeleteRecord(record.uuid)">
                            <v-list-item-title class="text-caption">删除</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </template>
                  </v-list-item>

                  <v-divider v-if="index < records.length - 1" class="my-1" />
                </template>
              </v-list>
            </div>

            <!-- 空状态 -->
            <div v-else class="pa-12 d-flex flex-column align-center justify-center">
              <v-icon size="64" color="medium-emphasis" class="mb-2">mdi-history</v-icon>
              <p class="text-body-2 text-medium-emphasis">暂无进度记录</p>
              <v-btn
                color="primary"
                variant="text"
                size="small"
                @click="handleAddRecord"
                class="mt-2"
              >
                立即添加
              </v-btn>
            </div>
          </v-card>
        </div>
      </div>

      <!-- GoalRecordDialog -->
      <GoalRecordDialog ref="recordDialogRef" />
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGoal } from '../composables/useGoal';
import { GoalContracts } from '@dailyuse/contracts';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import GoalRecordDialog from '../components/dialogs/GoalRecordDialog.vue';

const router = useRouter();
const route = useRoute();
const { goals, getGoalRecordsByKeyResult, deleteKeyResultForGoal, fetchGoalById } = useGoal();

const recordDialogRef = ref<InstanceType<typeof GoalRecordDialog> | null>(null);
const records = ref<GoalContracts.GoalRecordClientDTO[]>([]);
const loading = ref(true);
const error = ref('');

// 从路由参数获取 goalUuid 和 keyResultUuid
const goalUuid = computed(() => route.params.goalUuid as string);
const keyResultUuid = computed(() => route.params.keyResultUuid as string);

// 找到对应的 Goal
const goal = computed(() => {
  return goals.value.find((g: any) => g.uuid === goalUuid.value);
});

// 找到对应的 KeyResult
const keyResult = computed(() => {
  const goalData = goal.value;
  if (!goalData) return null;
  return goalData.keyResults?.find((kr: any) => kr.uuid === keyResultUuid.value);
});

// Goal 颜色
const goalColor = computed(() => goal.value?.color || 'primary');

// 计算进度百分比
const progressPercentage = computed(() => {
  if (!keyResult.value) return 0;
  const current = keyResult.value.currentValue ?? 0;
  const target = keyResult.value.targetValue;
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
});

// 进度条颜色
const progressColor = computed(() => {
  if (progressPercentage.value >= 100) return 'success';
  if (progressPercentage.value >= 75) return 'info';
  if (progressPercentage.value >= 50) return 'warning';
  return 'error';
});

// 聚合方式标签
const aggregationMethodLabel = computed(() => {
  const method = keyResult.value?.progress?.aggregationMethod;
  const map: Record<string, string> = {
    SUM: '求和',
    AVERAGE: '平均',
    MAX: '最大',
    MIN: '最小',
    LAST: '最后一个',
  };
  return map[method as string] || method || '--';
});

// 值类型标签
const valueTypeLabel = computed(() => {
  const type = keyResult.value?.progress?.valueType;
  const map: Record<string, string> = {
    INCREMENTAL: '增量',
    ABSOLUTE: '绝对值',
    PERCENTAGE: '百分比',
    BINARY: '二进制',
  };
  return map[type as string] || type || '--';
});

// 格式化记录日期
const formatRecordDate = (timestamp: number | Date) => {
  return format(new Date(timestamp), 'MM-dd HH:mm', { locale: zhCN });
};

// 加载数据
const loadData = async () => {
  try {
    loading.value = true;
    error.value = '';

    // ✅ 改进的缓存检查逻辑：
    // 1. 检查 Goal 是否存在
    // 2. 检查 Goal 是否包含 KeyResults（缓存可能没有完整数据）
    // 这解决了页面刷新后 keyResults 为空的问题
    if (!goal.value || !goal.value.keyResults?.length) {
      // 从 API 强制刷新 Goal 数据（includeChildren=true）
      const fetchedGoal = await fetchGoalById(goalUuid.value, true);
      
      if (!fetchedGoal) {
        error.value = '目标不存在';
        setTimeout(() => {
          router.back();
        }, 1500);
        return;
      }
    }

    // 再次验证 KeyResult 是否存在
    if (!keyResult.value) {
      error.value = '未找到该关键结果';
      setTimeout(() => {
        router.back();
      }, 1500);
      return;
    }

    // 加载进度记录
    await loadRecords();
  } catch (err) {
    console.error('加载数据失败', err);
    error.value = '加载数据失败，请重试';
  } finally {
    loading.value = false;
  }
};

// 加载进度记录
const loadRecords = async () => {
  try {
    const response = await getGoalRecordsByKeyResult(goalUuid.value, keyResultUuid.value, {
      page: 1,
      limit: 100,
    });
    // ✅ 安全地处理记录类型
    records.value = (response.records || []).filter(
      (record: any) => record.uuid
    ) as GoalContracts.GoalRecordClientDTO[];
  } catch (err) {
    console.error('加载进度记录失败', err);
  }
};

// 编辑 KeyResult
const handleEditKeyResult = () => {
  snackbar.showInfo('编辑功能待实现');
};

// 删除 KeyResult - 使用优雅的确认对话框
const startDeleteKeyResult = async () => {
  try {
    // 使用 useMessage 的 delConfirm 获取用户确认
    const confirmed = await message.delConfirm(
      '此操作将同时删除所有关联的进度记录，无法撤销。',
      '删除关键结果'
    );

    if (!confirmed) {
      return;
    }

    // 用户确认删除
    handleDeleteKeyResult();
  } catch (error) {
    console.error('确认删除失败:', error);
  }
};

// 执行删除 KeyResult
const handleDeleteKeyResult = async () => {
  try {
    await deleteKeyResultForGoal(goalUuid.value, keyResultUuid.value);
    // 删除成功，延迟返回让用户看到成功提示
    setTimeout(() => {
      router.back();
    }, 800);
  } catch (error) {
    console.error('删除关键结果失败', error);
  }
};

// 添加记录
const handleAddRecord = () => {
  recordDialogRef.value?.openDialog(goalUuid.value, keyResultUuid.value);
  // 记录添加后需要重新加载
  setTimeout(() => {
    loadRecords();
  }, 800);
};

// 删除记录（直接调用 API）
const handleDeleteRecord = async (recordUuid: string) => {
  try {
    if (!confirm('确定要删除此记录吗？')) return;
    
    // ✅ 直接调用 goalApiClient 删除
    const { goalApiClient } = await import('../../infrastructure/api/goalApiClient');
    await goalApiClient.deleteGoalRecord(goalUuid.value, keyResultUuid.value, recordUuid);
    
    snackbar.showSuccess('记录删除成功');
    await loadRecords();
  } catch (err) {
    console.error('删除记录失败', err);
    snackbar.showError('删除记录失败');
  }
};

// 引入 snackbar 和 message
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { useMessage } from '@dailyuse/ui';
const snackbar = useSnackbar();
const message = useMessage();

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.key-result-detail-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
}

.key-result-header {
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.main-content {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.record-list {
  max-height: 600px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(var(--v-theme-surface), 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-on-surface), 0.2);
    border-radius: 3px;

    &:hover {
      background: rgba(var(--v-theme-on-surface), 0.4);
    }
  }
}

@media (max-width: 960px) {
  .content-wrapper {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
  }
}

@media (max-width: 600px) {
  .content-wrapper {
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }

  .record-list {
    max-height: none;
  }
}
</style>

