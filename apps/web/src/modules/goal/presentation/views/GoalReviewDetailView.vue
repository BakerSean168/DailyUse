<template>
  <v-container fluid class="goal-review-detail-container pa-0">
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
          <v-btn @click="loadReview" variant="text" color="error">重试</v-btn>
        </template>
      </v-alert>
    </div>

    <!-- 找不到复盘 -->
    <div v-else-if="!review" class="d-flex justify-center align-center" style="height: 400px">
      <v-alert type="warning" variant="tonal" class="ma-4">
        <template #title>复盘不存在</template>
        找不到指定的复盘记录
        <template #append>
          <v-btn @click="$router.back()" variant="text" color="warning">返回</v-btn>
        </template>
      </v-alert>
    </div>

    <!-- 复盘详情内容 -->
    <div v-else>
      <!-- 头部导航栏 -->
      <v-toolbar
        color="rgba(var(--v-theme-surface))"
        elevation="2"
        class="goal-review-header flex-shrink-0 mb-4"
      >
        <v-btn icon @click="$router.back()">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>

        <v-toolbar-title class="text-h6 font-weight-medium">
          <div class="d-flex align-center">
            <v-icon class="mr-2" :color="getReviewTypeColor(review.type)">
              {{ getReviewTypeIcon(review.type) }}
            </v-icon>
            {{ review.title || '复盘详情' }}
          </div>
        </v-toolbar-title>

        <v-spacer />

        <!-- 复盘类型标签 -->
        <v-chip :color="getReviewTypeColor(review.type)" variant="tonal" class="mr-3">
          {{ getReviewTypeText(review.type) }}
        </v-chip>

        <!-- 编辑按钮 -->
        <v-btn color="warning" prepend-icon="mdi-pencil" @click="editReview" variant="elevated">
          编辑
        </v-btn>
      </v-toolbar>

      <!-- 主要内容区域 -->
      <div class="main-content flex-grow-1 px-6">
        <div class="content-wrapper">
          <!-- 基本信息卡片 -->
          <v-card class="mb-6" elevation="2">
            <v-card-title class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h5">{{ review.title }}</div>
                <div class="text-body-2 text-medium-emphasis mt-1">
                  复盘时间: {{ format(review.reviewDate, 'yyyy年MM月dd日 HH:mm') }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  目标: {{ goal?.name || '加载中...' }}
                </div>
              </div>
            </v-card-title>
          </v-card>

          <!-- 快照信息 -->
          <v-card variant="tonal" class="mb-6" elevation="2">
            <v-card-title class="text-subtitle-1">
              <v-icon class="mr-2">mdi-camera</v-icon>
              目标快照信息 ({{ format(review.snapshot.snapshotDate, 'yyyy年MM月dd日') }})
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-primary">
                      {{ review.snapshot.weightedProgress }}%
                    </div>
                    <div class="text-body-2 text-medium-emphasis">加权进度</div>
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-secondary">
                      {{ review.snapshot.overallProgress }}%
                    </div>
                    <div class="text-body-2 text-medium-emphasis">整体进度</div>
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-success">
                      {{ review.snapshot.completedKeyResults }}
                    </div>
                    <div class="text-body-2 text-medium-emphasis">已完成</div>
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-info">
                      {{ review.snapshot.totalKeyResults }}
                    </div>
                    <div class="text-body-2 text-medium-emphasis">总计</div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- 关键结果快照详情 -->
          <v-card
            v-if="review.snapshot.keyResultsSnapshot.length > 0"
            variant="outlined"
            class="mb-6"
            elevation="2"
          >
            <v-card-title class="text-subtitle-1">
              <v-icon class="mr-2">mdi-target</v-icon>
              关键结果快照
            </v-card-title>
            <v-card-text>
              <div
                v-for="krSnapshot in review.snapshot.keyResultsSnapshot"
                :key="krSnapshot.uuid"
                class="mb-4"
              >
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="text-subtitle-2 font-weight-medium">{{ krSnapshot.name }}</div>
                  <v-chip
                    size="small"
                    :color="getProgressColor(krSnapshot.progress)"
                    variant="tonal"
                  >
                    {{ krSnapshot.progress }}%
                  </v-chip>
                </div>
                <v-progress-linear
                  :model-value="krSnapshot.progress"
                  height="8"
                  rounded
                  :color="getProgressColor(krSnapshot.progress)"
                />
                <div class="d-flex justify-space-between mt-2 text-caption text-medium-emphasis">
                  <span>当前值: {{ krSnapshot.currentValue }}</span>
                  <span>目标值: {{ krSnapshot.targetValue }}</span>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- 复盘内容 -->
          <div class="content-sections">
            <div v-if="review.content.achievements" class="content-section mb-4">
              <v-card elevation="2">
                <v-card-title class="d-flex align-center">
                  <v-icon color="success" class="mr-2">mdi-trophy</v-icon>
                  <h3 class="text-h6">主要成就</h3>
                </v-card-title>
                <v-card-text>
                  <p class="text-body-1 whitespace-pre-line">{{ review.content.achievements }}</p>
                </v-card-text>
              </v-card>
            </div>

            <div v-if="review.content.challenges" class="content-section mb-4">
              <v-card elevation="2">
                <v-card-title class="d-flex align-center">
                  <v-icon color="warning" class="mr-2">mdi-alert-circle</v-icon>
                  <h3 class="text-h6">遇到的挑战</h3>
                </v-card-title>
                <v-card-text>
                  <p class="text-body-1 whitespace-pre-line">{{ review.content.challenges }}</p>
                </v-card-text>
              </v-card>
            </div>

            <div v-if="review.content.learnings" class="content-section mb-4">
              <v-card elevation="2">
                <v-card-title class="d-flex align-center">
                  <v-icon color="info" class="mr-2">mdi-lightbulb</v-icon>
                  <h3 class="text-h6">经验总结</h3>
                </v-card-title>
                <v-card-text>
                  <p class="text-body-1 whitespace-pre-line">{{ review.content.learnings }}</p>
                </v-card-text>
              </v-card>
            </div>

            <div v-if="review.content.nextSteps" class="content-section mb-4">
              <v-card elevation="2">
                <v-card-title class="d-flex align-center">
                  <v-icon color="primary" class="mr-2">mdi-arrow-right-circle</v-icon>
                  <h3 class="text-h6">下一步计划</h3>
                </v-card-title>
                <v-card-text>
                  <p class="text-body-1 whitespace-pre-line">{{ review.content.nextSteps }}</p>
                </v-card-text>
              </v-card>
            </div>

            <div v-if="review.content.adjustments" class="content-section mb-4">
              <v-card elevation="2">
                <v-card-title class="d-flex align-center">
                  <v-icon color="purple" class="mr-2">mdi-tune</v-icon>
                  <h3 class="text-h6">调整建议</h3>
                </v-card-title>
                <v-card-text>
                  <p class="text-body-1 whitespace-pre-line">{{ review.content.adjustments }}</p>
                </v-card-text>
              </v-card>
            </div>
          </div>

          <!-- 评分详情 -->
          <div v-if="hasRating(review)" class="rating-section mb-4">
            <v-card variant="tonal" color="orange" elevation="2">
              <v-card-title class="text-subtitle-1">
                <v-icon class="mr-2">mdi-star</v-icon>
                综合评分
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="4">
                    <div class="text-body-2 mb-2">进度满意度</div>
                    <v-rating
                      :model-value="review.rating.progressSatisfaction"
                      readonly
                      color="orange"
                    />
                    <div class="text-caption text-center mt-1">
                      {{ review.rating.progressSatisfaction }}/5
                    </div>
                  </v-col>
                  <v-col cols="12" md="4">
                    <div class="text-body-2 mb-2">执行效率</div>
                    <v-rating
                      :model-value="review.rating.executionEfficiency"
                      readonly
                      color="orange"
                    />
                    <div class="text-caption text-center mt-1">
                      {{ review.rating.executionEfficiency }}/5
                    </div>
                  </v-col>
                  <v-col cols="12" md="4">
                    <div class="text-body-2 mb-2">目标合理性</div>
                    <v-rating
                      :model-value="review.rating.goalReasonableness"
                      readonly
                      color="orange"
                    />
                    <div class="text-caption text-center mt-1">
                      {{ review.rating.goalReasonableness }}/5
                    </div>
                  </v-col>
                </v-row>
                <v-divider class="my-4" />
                <div class="text-center">
                  <div class="text-h6 font-weight-bold">
                    平均评分: {{ getAverageRating(review).toFixed(1) }}/5
                  </div>
                  <v-rating
                    :model-value="getAverageRating(review)"
                    readonly
                    color="orange"
                    size="large"
                  />
                </div>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGoalStore } from '../stores/goalStore';
import { useGoal } from '../composables/useGoal';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { GoalReviewClient, GoalClient } from '@dailyuse/domain-client';
import { format } from 'date-fns';

// 路由和状态
const loading = ref(false);
const error = ref('');
const route = useRoute();
const router = useRouter();
const goalStore = useGoalStore();
const snackbar = useSnackbar();

// 业务逻辑
const { fetchGoalById } = useGoal();

// 数据
const goalUuid = route.params.goalUuid as string;
const reviewUuid = route.params.reviewUuid as string;
const goal = ref<GoalClient | null>(null);
const review = ref<any | null>(null);

// 工具方法
const getReviewTypeIcon = (type: string): string => {
  const icons = {
    weekly: 'mdi-calendar-week',
    monthly: 'mdi-calendar-month',
    midterm: 'mdi-calendar-check',
    final: 'mdi-flag-checkered',
    custom: 'mdi-calendar-edit',
  };
  return icons[type as keyof typeof icons] || 'mdi-book-open-variant';
};

const getReviewTypeColor = (type: string): string => {
  const colors = {
    weekly: 'primary',
    monthly: 'secondary',
    midterm: 'warning',
    final: 'success',
    custom: 'info',
  };
  return colors[type as keyof typeof colors] || 'grey';
};

const getReviewTypeText = (type: string): string => {
  const texts = {
    weekly: '周复盘',
    monthly: '月复盘',
    midterm: '期中复盘',
    final: '最终复盘',
    custom: '自定义复盘',
  };
  return texts[type as keyof typeof texts] || '复盘';
};

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'success';
  if (progress >= 60) return 'warning';
  if (progress >= 40) return 'orange';
  return 'error';
};

const hasRating = (review: any): boolean => {
  return !!(
    review.rating &&
    (review.rating.progressSatisfaction > 0 ||
      review.rating.executionEfficiency > 0 ||
      review.rating.goalReasonableness > 0)
  );
};

const getAverageRating = (review: any): number => {
  if (!review.rating) return 0;
  const { progressSatisfaction, executionEfficiency, goalReasonableness } = review.rating;
  return (progressSatisfaction + executionEfficiency + goalReasonableness) / 3;
};

// 业务方法
const loadReview = async () => {
  try {
    loading.value = true;
    error.value = '';

    // 加载目标信息
    if (!goal.value) {
      const goalData = goalStore.getGoalByUuid(goalUuid);
      if (!goalData) {
        await fetchGoalById(goalUuid);
        goal.value = goalStore.getGoalByUuid(goalUuid);
      } else {
        goal.value = goalData;
      }
    }

    // 从store中获取复盘数据
    if (goal.value && goal.value.reviews) {
      const foundReview = goal.value.reviews.find((r) => r.uuid === reviewUuid);
      if (foundReview) {
        review.value = foundReview;
      } else {
        throw new Error('找不到指定的复盘记录');
      }
    } else {
      throw new Error('无法获取复盘信息');
    }
  } catch (err) {
    console.error('加载复盘详情失败:', err);
    error.value = typeof err === 'string' ? err : '加载复盘详情失败，请重试';
    snackbar.showError('加载复盘详情失败');
  } finally {
    loading.value = false;
  }
};

const editReview = () => {
  snackbar.showInfo('编辑功能尚未实现');
};

// 初始化
onMounted(() => {
  // 从store获取目标信息
  goal.value = goalStore.getGoalByUuid(goalUuid);
  loadReview();
});
</script>

<style scoped>
.goal-review-detail-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.02) 0%,
    rgba(var(--v-theme-surface), 0.95) 100%
  );
}

.goal-review-header {
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.main-content {
  min-height: 0;
  overflow: hidden;
}

.content-wrapper {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.content-section {
  margin-bottom: 16px;
}

.content-section .v-card {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.content-section .v-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.whitespace-pre-line {
  white-space: pre-line;
}

.rating-section {
  margin-top: 24px;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .content-wrapper {
    padding: 8px;
  }
}

/* 对话框内容样式 */
.v-card {
  border-radius: 16px;
}

/* 评分显示样式 */
.v-rating {
  gap: 4px;
}

.v-rating--readonly .v-icon {
  opacity: 0.8;
}

/* 芯片样式 */
.v-chip {
  font-weight: 500;
}

/* 进度条样式 */
.v-progress-linear {
  border-radius: 4px;
}
</style>
