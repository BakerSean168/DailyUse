<template>
  <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px">
    <v-progress-circular indeterminate color="primary" />
    <span class="ml-4">加载中...</span>
  </div>
  <div
    v-else-if="!goal || !localGoalReview"
    class="d-flex justify-center align-center"
    style="height: 200px"
  >
    <v-alert type="error" variant="tonal">
      <template #title>加载失败</template>
      未获取到目标信息，请重试
    </v-alert>
  </div>
  <div v-else id="goal-review" class="h-100 w-100 d-flex flex-column">
    <!-- header -->
    <header class="goal-review-header d-flex justify-space-between align-center px-4 py-2">
      <div>
        <v-btn @click="router.back()" variant="tonal" prepend-icon="mdi-arrow-left"> 返回 </v-btn>
      </div>
      <div class="goal-review-header-content d-flex flex-column align-center text-center">
        <span class="text-h4 font-weight-bold mb-2">创建目标复盘</span>
        <span class="text-h6 font-weight-medium">{{ goal.title }}</span>
        <span class="text-caption font-weight-light">
          <template v-if="goal.startDate && goal.targetDate">
            {{ format(new Date(goal.startDate), 'yyyy-MM-dd') }} 到
            {{ format(new Date(goal.targetDate), 'yyyy-MM-dd') }}
          </template>
        </span>
      </div>
      <div>
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-check"
          @click="handleSaveReview"
          :loading="saving"
          :disabled="!canSave"
        >
          完成复盘
        </v-btn>
      </div>
    </header>

    <main class="goal-review-main pt-4">
      <!-- 目标基本相关信息 -->
      <section class="goal-analysis">
        <div class="goal-review-card-container d-flex flex-row gap-6 mb-8 justify-center">
          <!-- 目标信息卡片 -->
          <div class="goal-review-card goal-info">
            <div class="card-header pa-4 d-flex flex-column align-start">
              <div class="d-flex align-baseline">
                <span class="text-h3 font-weight-bold mr-1">{{
                  localGoalReview.snapshot.weightedProgress
                }}</span>
                <span class="text-h6 font-weight-light">%</span>
              </div>
              <div>
                <span class="text-subtitle-1">{{ goal.title }}</span>
              </div>
            </div>
            <div class="card-content d-flex flex-column pa-2">
              <div
                v-for="kr in localGoalReview.snapshot.keyResultsSnapshot || []"
                :key="kr.uuid"
                class="card-content-item d-flex justify-space-between align-center pa-3 mb-2"
              >
                <span class="item-name">{{ kr.name }}</span>
                <span class="item-value">{{ kr.currentValue }}/{{ kr.targetValue }}</span>
              </div>
              <div
                v-if="!localGoalReview.snapshot.keyResultsSnapshot?.length"
                class="pa-4 text-center text-medium-emphasis"
              >
                暂无关键结果数据
              </div>
            </div>
          </div>

          <!-- 统计信息卡片 -->
          <div class="goal-review-card stats-info">
            <div class="card-header pa-4 d-flex flex-column align-start">
              <div class="d-flex align-baseline">
                <span class="text-h3 font-weight-bold mr-1">{{
                  localGoalReview.snapshot.completedKeyResults
                }}</span>
                <span class="text-h6 font-weight-light"
                  >/{{ localGoalReview.snapshot.totalKeyResults }}</span
                >
              </div>
              <div>
                <span class="text-subtitle-1">已完成关键结果</span>
              </div>
            </div>
            <div class="card-content d-flex flex-column pa-4">
              <div class="mb-3">
                <div class="d-flex justify-space-between mb-1">
                  <span class="text-body-2">整体进度</span>
                  <span class="text-body-2">{{ localGoalReview.snapshot.overallProgress }}%</span>
                </div>
                <v-progress-linear
                  :model-value="localGoalReview.snapshot.overallProgress"
                  height="6"
                  rounded
                  color="white"
                />
              </div>
              <div class="text-body-2 text-medium-emphasis">
                复盘时间: {{ format(localGoalReview.reviewDate, 'yyyy-MM-dd HH:mm') }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Charts Section -->
      <section class="goal-review-charts mb-8">
        <v-card elevation="2" class="pa-4">
          <v-card-title class="text-h6 mb-4">
            <v-icon class="mr-2">mdi-chart-line</v-icon>
            进度分析图表
          </v-card-title>
          <v-row>
            <v-col cols="12" md="6">
              <GoalProgressChart :goal="goal as Goal" />
            </v-col>
            <v-col cols="12" md="6">
              <KrProgressChart :goal="goal as Goal" />
            </v-col>
            <v-col cols="12">
              <PeriodBarChart :goal="goal as Goal" />
            </v-col>
          </v-row>
        </v-card>
      </section>

      <!-- Self Diagnosis -->
      <section class="self-diagnosis">
        <div class="diagnosis-container pa-8">
          <h2 class="text-h5 text-center mb-8 font-weight-bold">
            <v-icon class="mr-2" color="primary">mdi-clipboard-text</v-icon>
            自我诊断与总结
          </h2>

          <div class="diagnosis-grid">
            <div class="diagnosis-card">
              <div class="diagnosis-card-header d-flex align-center gap-3 pa-4">
                <v-icon class="diagnosis-icon" color="success" size="24">mdi-trophy</v-icon>
                <h3 class="text-h6">主要成就</h3>
              </div>
              <div class="diagnosis-card-content pa-4">
                <v-textarea
                  v-model="localGoalReview.content.achievements"
                  placeholder="列出这段时间的主要成就和突破..."
                  variant="outlined"
                  rows="4"
                  auto-grow
                  hide-details
                />
              </div>
            </div>

            <div class="diagnosis-card">
              <div class="diagnosis-card-header d-flex align-center gap-3 pa-4">
                <v-icon class="diagnosis-icon" color="warning" size="24">mdi-alert-circle</v-icon>
                <h3 class="text-h6">遇到的挑战</h3>
              </div>
              <div class="diagnosis-card-content pa-4">
                <v-textarea
                  v-model="localGoalReview.content.challenges"
                  placeholder="记录遇到的主要挑战和困难..."
                  variant="outlined"
                  rows="4"
                  auto-grow
                  hide-details
                />
              </div>
            </div>

            <div class="diagnosis-card">
              <div class="diagnosis-card-header d-flex align-center gap-3 pa-4">
                <v-icon class="diagnosis-icon" color="info" size="24">mdi-lightbulb</v-icon>
                <h3 class="text-h6">经验总结</h3>
              </div>
              <div class="diagnosis-card-content pa-4">
                <v-textarea
                  v-model="localGoalReview.content.learnings"
                  placeholder="总结经验教训和心得体会..."
                  variant="outlined"
                  rows="4"
                  auto-grow
                  hide-details
                />
              </div>
            </div>

            <div class="diagnosis-card">
              <div class="diagnosis-card-header d-flex align-center gap-3 pa-4">
                <v-icon class="diagnosis-icon" color="primary" size="24"
                  >mdi-arrow-right-circle</v-icon
                >
                <h3 class="text-h6">下一步计划</h3>
              </div>
              <div class="diagnosis-card-content pa-4">
                <v-textarea
                  v-model="localGoalReview.content.nextSteps"
                  placeholder="制定下一步行动计划..."
                  variant="outlined"
                  rows="4"
                  auto-grow
                  hide-details
                />
              </div>
            </div>

            <!-- 评分区域 -->
            <div class="diagnosis-card rating-card">
              <div class="diagnosis-card-header d-flex align-center gap-3 pa-4">
                <v-icon class="diagnosis-icon" color="orange" size="24">mdi-star</v-icon>
                <h3 class="text-h6">综合评分</h3>
              </div>
              <div class="diagnosis-card-content pa-4">
                <div class="mb-4">
                  <div class="text-body-2 mb-2">进度满意度</div>
                  <v-rating
                    v-model="localGoalReview.rating.progressSatisfaction"
                    color="orange"
                    half-increments
                    hover
                  />
                </div>
                <div class="mb-4">
                  <div class="text-body-2 mb-2">执行效率</div>
                  <v-rating
                    v-model="localGoalReview.rating.executionEfficiency"
                    color="orange"
                    half-increments
                    hover
                  />
                </div>
                <div>
                  <div class="text-body-2 mb-2">目标合理性</div>
                  <v-rating
                    v-model="localGoalReview.rating.goalReasonableness"
                    color="orange"
                    half-increments
                    hover
                  />
                </div>
              </div>
            </div>

            <!-- 调整建议 -->
            <div class="diagnosis-card">
              <div class="diagnosis-card-header d-flex align-center gap-3 pa-4">
                <v-icon class="diagnosis-icon" color="purple" size="24">mdi-tune</v-icon>
                <h3 class="text-h6">调整建议</h3>
              </div>
              <div class="diagnosis-card-content pa-4">
                <v-textarea
                  v-model="localGoalReview.content.adjustments"
                  placeholder="对目标或执行策略的调整建议..."
                  variant="outlined"
                  rows="4"
                  auto-grow
                  hide-details
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 确认对话框 -->
    <v-dialog v-model="showConfirmDialog" max-width="500">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2" color="primary">mdi-check-circle</v-icon>
          确认提交复盘
        </v-card-title>
        <v-card-text>
          <p>您确定要提交这份目标复盘吗？提交后将保存到系统中。</p>
          <div class="mt-4 pa-3 rounded" style="background: rgba(var(--v-theme-primary), 0.1)">
            <div class="text-body-2 text-medium-emphasis">复盘摘要:</div>
            <div class="mt-2">
              <v-chip
                class="mr-2 mb-1"
                size="small"
                color="success"
                v-if="localGoalReview.content.achievements"
              >
                有成就记录
              </v-chip>
              <v-chip
                class="mr-2 mb-1"
                size="small"
                color="warning"
                v-if="localGoalReview.content.challenges"
              >
                有挑战记录
              </v-chip>
              <v-chip
                class="mr-2 mb-1"
                size="small"
                color="info"
                v-if="localGoalReview.content.learnings"
              >
                有经验总结
              </v-chip>
              <v-chip
                class="mr-2 mb-1"
                size="small"
                color="primary"
                v-if="localGoalReview.content.nextSteps"
              >
                有下步计划
              </v-chip>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showConfirmDialog = false">取消</v-btn>
          <v-btn color="primary" @click="confirmSaveReview" :loading="saving">确认提交</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGoalStore } from '../stores/goalStore';
import { useGoal } from '../composables/useGoal';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import GoalProgressChart from '../components/echarts/GoalProgressChart.vue';
import KrProgressChart from '../components/echarts/KrProgressChart.vue';
import PeriodBarChart from '../components/echarts/PeriodBarChart.vue';
import { GoalReviewClient } from '@dailyuse/domain-client';
import { GoalClient } from '@dailyuse/domain-client';
import { format } from 'date-fns';

// 路由和状态
const loading = ref(true);
const saving = ref(false);
const showConfirmDialog = ref(false);
const route = useRoute();
const router = useRouter();
const goalStore = useGoalStore();
const snackbar = useSnackbar();

// 业务逻辑
const { createGoalReview, getGoalAggregateView } = useGoal();

// 获取目标信息
const goalUuid = route.params.goalUuid as string;
const goal = ref<GoalClient | null>(null);
const localGoalReview = ref<GoalReviewClient | null>(null);

// 计算属性
const canSave = computed(() => {
  if (!localGoalReview.value) return false;
  const content = localGoalReview.value.content;
  return !!(content.achievements || content.challenges || content.learnings || content.nextSteps);
});

// 初始化数据
const initializeReview = async () => {
  try {
    loading.value = true;

    // 获取目标详情
    const goalData = goalStore.getGoalByUuid(goalUuid);
    if (!goalData) {
      // 如果store中没有，尝试从API获取
      await getGoalAggregateView(goalUuid);
      goal.value = goalStore.getGoalByUuid(goalUuid);
    } else {
      goal.value = goalData;
    }

    if (!goal.value) {
      throw new Error('无法获取目标信息');
    }

    // 创建复盘实例
    localGoalReview.value = GoalReview.forCreate(goalUuid);

    // 填充快照数据（基于当前目标状态）
    if (localGoalReview.value && goal.value) {
      localGoalReview.value.snapshot = {
        snapshotDate: new Date(),
        overallProgress: goal.value.overallProgress || 0,
        weightedProgress: goal.value.weightedProgress || 0,
        completedKeyResults: goal.value.keyResults?.filter((kr) => kr.progress >= 100).length || 0,
        totalKeyResults: goal.value.keyResults?.length || 0,
        keyResultsSnapshot:
          goal.value.keyResults?.map((kr) => ({
            uuid: kr.uuid,
            name: kr.name,
            progress: kr.progress,
            currentValue: kr.currentValue,
            targetValue: kr.targetValue,
          })) || [],
      };
    }
  } catch (error) {
    console.error('初始化复盘失败:', error);
    snackbar.showError('加载目标信息失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 保存复盘
const handleSaveReview = () => {
  if (!canSave.value) {
    snackbar.showWarning('请至少填写一项复盘内容');
    return;
  }
  showConfirmDialog.value = true;
};

const confirmSaveReview = async () => {
  if (!localGoalReview.value || !goal.value) return;

  try {
    saving.value = true;

    // 准备请求数据
    const reviewData = {
      title: `${goal.value.name} - ${format(new Date(), 'yyyy-MM-dd')} 复盘`,
      type: 'custom' as const,
      reviewDate: localGoalReview.value.reviewDate.getTime(),
      content: localGoalReview.value.content,
      snapshot: {
        snapshotDate: localGoalReview.value.snapshot.snapshotDate.getTime(),
        overallProgress: localGoalReview.value.snapshot.overallProgress,
        weightedProgress: localGoalReview.value.snapshot.weightedProgress,
        completedKeyResults: localGoalReview.value.snapshot.completedKeyResults,
        totalKeyResults: localGoalReview.value.snapshot.totalKeyResults,
        keyResultsSnapshot: localGoalReview.value.snapshot.keyResultsSnapshot,
      },
      rating: localGoalReview.value.rating,
    };

    // 调用API创建复盘
    await createGoalReview(goalUuid, reviewData);

    snackbar.showSuccess('目标复盘创建成功');
    showConfirmDialog.value = false;

    // 跳转到目标详情页
    router.push({ name: 'goal-detail', params: { id: goalUuid } });
  } catch (error) {
    console.error('保存复盘失败:', error);
    snackbar.showError('保存复盘失败，请重试');
  } finally {
    saving.value = false;
  }
};

// 组件挂载
onMounted(() => {
  initializeReview();
});
</script>

<style scoped>
#goal-review {
  background: linear-gradient(
    120deg,
    rgba(var(--v-theme-primary), 0.08) 0%,
    rgba(var(--v-theme-background), 0.95) 100%
  );
  overflow: hidden;
}

.goal-review-header {
  background-color: rgba(var(--v-theme-surface), 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.goal-review-main {
  padding: 0 2rem;
  flex: 1 1 auto;
  overflow-y: auto;
}

.goal-review-card {
  width: 600px;
  max-width: 600px;
  min-width: 400px;
  height: 300px;
  border-radius: 16px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.goal-review-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.goal-info {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.8),
    rgba(var(--v-theme-primary), 0.6)
  );
  color: white;
}

.goal-info .card-header {
  background-color: rgba(0, 0, 0, 0.1);
}

.stats-info {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-secondary), 0.8),
    rgba(var(--v-theme-secondary), 0.6)
  );
  color: white;
}

.stats-info .card-header {
  background-color: rgba(0, 0, 0, 0.1);
}

.card-content-item {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  transition: background-color 0.2s ease;
  margin-bottom: 8px;
}

.card-content-item:hover {
  background: rgba(255, 255, 255, 0.25);
}

.item-name {
  font-weight: 500;
  flex: 1;
  font-size: 0.9rem;
}

.item-value {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
  font-size: 0.85rem;
}

.self-diagnosis {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-surface), 0.95),
    rgba(var(--v-theme-background), 0.98)
  );
  border-radius: 20px;
  margin: 2rem 0;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.06);
}

.diagnosis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .diagnosis-grid {
    grid-template-columns: 1fr;
  }

  .goal-review-card-container {
    flex-direction: column !important;
    align-items: center;
  }
}

.diagnosis-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--v-theme-outline), 0.08);
  overflow: hidden;
}

.diagnosis-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.diagnosis-card.rating-card {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-warning), 0.05),
    rgba(var(--v-theme-surface), 1)
  );
}

.diagnosis-card-header {
  background: rgba(var(--v-theme-primary), 0.02);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.06);
}

.diagnosis-icon {
  opacity: 0.9;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: rgb(var(--v-theme-primary));
  font-size: 1.2rem;
}
</style>
