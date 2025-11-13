<script setup lang="ts">
/**
 * GoalTimelineWidget - 目标时间进度 Widget
 * 
 * 功能：
 * - 展示目标的时间进度（浅色框 = 时间范围，深色 = 完成百分比）
 * - 显示目标标题、进度百分比、剩余天数
 * - 支持三种尺寸 (small/medium/large)
 */

import { computed, onMounted, ref } from 'vue';
import type { DashboardContracts } from '@dailyuse/contracts';
import { useGoalStore } from '@/modules/goal/presentation/stores/goalStore';
import { GoalStatus } from '@dailyuse/contracts';

// ===== Props =====
interface Props {
    size?: DashboardContracts.WidgetSize;
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium' as DashboardContracts.WidgetSize,
});

// ===== Stores =====
const goalStore = useGoalStore();

// ===== State =====
const isLoading = ref(true);

// ===== Computed =====

/**
 * Widget 容器样式类
 */
const containerClasses = computed(() => [
    'goal-timeline-widget',
    `widget-size-${props.size}`,
    {
        'widget-loading': isLoading.value,
    },
]);

/**
 * 活跃目标列表（有时间范围的进行中目标）
 */
const activeGoals = computed(() => {
    const today = new Date();

    return goalStore.allGoals
        .filter(goal => {
            if (goal.status !== GoalStatus.IN_PROGRESS) return false;
            return goal.startDate && goal.targetDate;
        })
        .map(goal => {
            const start = new Date(goal.startDate!);
            const end = new Date(goal.targetDate!);
            const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const elapsedDays = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const remainingDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // 时间进度百分比
            const timeProgress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

            // 实际完成进度（如果有 currentValue 和 targetValue）
            let completionProgress = 0;
            if (goal.keyResults && goal.keyResults.length > 0) {
                const completedKRs = goal.keyResults.filter(kr => kr.isCompleted).length;
                completionProgress = (completedKRs / goal.keyResults.length) * 100;
            }

            return {
                uuid: goal.uuid,
                title: goal.title,
                startDate: goal.startDate!,
                targetDate: goal.targetDate!,
                totalDays,
                elapsedDays: Math.max(elapsedDays, 0),
                remainingDays: Math.max(remainingDays, 0),
                timeProgress,
                completionProgress,
                isOverdue: remainingDays < 0,
                isWarning: remainingDays >= 0 && remainingDays <= 7,
            };
        })
        .sort((a, b) => {
            // 优先显示即将到期的
            if (a.isOverdue && !b.isOverdue) return -1;
            if (!a.isOverdue && b.isOverdue) return 1;
            if (a.isWarning && !b.isWarning) return -1;
            if (!a.isWarning && b.isWarning) return 1;
            return a.remainingDays - b.remainingDays;
        })
        .slice(0, props.size === 'small' ? 3 : props.size === 'medium' ? 5 : 8);
});

/**
 * 是否为小尺寸
 */
const isSmallSize = computed(() => props.size === 'small');

/**
 * 获取进度条颜色
 */
const getProgressColor = (goal: typeof activeGoals.value[0]) => {
    if (goal.isOverdue) return 'bg-red-500';
    if (goal.isWarning) return 'bg-orange-500';
    if (goal.completionProgress >= 80) return 'bg-green-500';
    return 'bg-blue-500';
};

/**
 * 获取时间背景颜色
 */
const getTimeBackgroundColor = (goal: typeof activeGoals.value[0]) => {
    if (goal.isOverdue) return 'bg-red-100 dark:bg-red-900';
    if (goal.isWarning) return 'bg-orange-100 dark:bg-orange-900';
    return 'bg-gray-200 dark:bg-gray-700';
};

/**
 * 格式化日期
 */
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

// ===== Lifecycle =====
onMounted(async () => {
    try {
        isLoading.value = true;
        await goalStore.fetchAllGoals();
    } catch (error) {
        console.error('[GoalTimelineWidget] Failed to load goals:', error);
    } finally {
        isLoading.value = false;
    }
});
</script>

<template>
    <div :class="containerClasses">
        <!-- Widget Header -->
        <div class="widget-header">
            <div class="widget-title">
                <div class="i-heroicons-chart-bar widget-icon" />
                <h3>目标进度</h3>
            </div>
            <div class="widget-stats">
                <span class="stats-badge">{{ activeGoals.length }}</span>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="widget-loading-state">
            <div class="i-heroicons-arrow-path animate-spin text-2xl text-gray-400" />
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">加载中...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="activeGoals.length === 0" class="empty-state">
            <div class="i-heroicons-flag text-4xl text-gray-400 mb-2" />
            <p class="text-sm text-gray-600 dark:text-gray-400">暂无进行中的目标</p>
        </div>

        <!-- Goal Timeline List -->
        <div v-else class="goal-list">
            <div v-for="goal in activeGoals" :key="goal.uuid" class="goal-item">
                <!-- Goal Header -->
                <div class="goal-header">
                    <span class="goal-title">{{ goal.title }}</span>
                    <div class="goal-meta">
                        <span v-if="goal.isOverdue" class="status-badge overdue">
                            超期 {{ Math.abs(goal.remainingDays) }}天
                        </span>
                        <span v-else-if="goal.isWarning" class="status-badge warning">
                            剩{{ goal.remainingDays }}天
                        </span>
                        <span v-else class="status-badge normal">
                            剩{{ goal.remainingDays }}天
                        </span>
                    </div>
                </div>

                <!-- Timeline Progress Bar -->
                <div class="timeline-container">
                    <!-- 时间范围背景 -->
                    <div :class="['timeline-background', getTimeBackgroundColor(goal)]">
                        <!-- 时间进度（深色） -->
                        <div :class="['timeline-progress', getProgressColor(goal)]"
                            :style="{ width: `${goal.timeProgress}%` }">
                            <!-- 完成进度标记 -->
                            <div v-if="goal.completionProgress > 0" class="completion-marker"
                                :style="{ left: `${(goal.completionProgress / goal.timeProgress) * 100}%` }" />
                        </div>
                    </div>

                    <!-- 进度百分比 -->
                    <div class="timeline-labels">
                        <span class="timeline-label">{{ Math.round(goal.completionProgress) }}%</span>
                        <span class="timeline-label time">{{ Math.round(goal.timeProgress) }}%</span>
                    </div>
                </div>

                <!-- Dates (Medium/Large only) -->
                <div v-if="!isSmallSize" class="goal-dates">
                    <span class="date-label">
                        <div class="i-heroicons-calendar w-3 h-3" />
                        {{ formatDate(goal.startDate) }}
                    </span>
                    <span class="date-range">
                        <div class="i-heroicons-arrow-right w-3 h-3" />
                    </span>
                    <span class="date-label">
                        <div class="i-heroicons-flag w-3 h-3" />
                        {{ formatDate(goal.targetDate) }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ===== Widget Container ===== */
.goal-timeline-widget {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden;
    @apply transition-all duration-300 hover:shadow-xl hover:scale-[1.02];
    @apply backdrop-blur-sm bg-opacity-90;
}

/* Size Variants */
.widget-size-small {
    @apply p-4;
    min-height: 180px;
    max-height: 300px;
}

.widget-size-medium {
    @apply p-5;
    min-height: 300px;
    max-height: 500px;
}

.widget-size-large {
    @apply p-6;
    min-height: 450px;
    max-height: 700px;
}

/* ===== Header ===== */
.widget-header {
    @apply flex items-center justify-between mb-5;
    @apply pb-4 border-b border-gray-100 dark:border-gray-700;
}

.widget-title {
    @apply flex items-center gap-3;
}

.widget-icon {
    @apply text-2xl text-purple-600 dark:text-purple-400;
}

.widget-title h3 {
    @apply text-lg font-bold text-gray-900 dark:text-white;
}

.widget-stats {
    @apply flex items-center gap-2;
}

.stats-badge {
    @apply px-3 py-1 rounded-full;
    @apply text-sm font-bold;
    @apply bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800;
    @apply text-purple-600 dark:text-purple-300;
}

/* ===== Loading/Empty State ===== */
.widget-loading-state,
.empty-state {
    @apply flex flex-col items-center justify-center py-12;
}

/* ===== Goal List ===== */
.goal-list {
    @apply flex flex-col gap-4 overflow-y-auto;
    max-height: calc(100% - 100px);
}

.goal-item {
    @apply p-4 rounded-lg;
    @apply bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800;
    @apply border border-gray-200 dark:border-gray-600;
    @apply transition-all duration-200 hover:scale-[1.02] hover:shadow-md;
}

/* Goal Header */
.goal-header {
    @apply flex items-start justify-between gap-3 mb-3;
}

.goal-title {
    @apply text-sm font-semibold text-gray-900 dark:text-white flex-1;
    @apply line-clamp-2;
}

.goal-meta {
    @apply flex-shrink-0;
}

.status-badge {
    @apply px-2 py-1 rounded text-xs font-bold;
}

.status-badge.overdue {
    @apply bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300;
}

.status-badge.warning {
    @apply bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300;
}

.status-badge.normal {
    @apply bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300;
}

/* Timeline Progress */
.timeline-container {
    @apply mb-2;
}

.timeline-background {
    @apply relative h-6 rounded-full overflow-hidden;
    @apply transition-all duration-300;
}

.timeline-progress {
    @apply relative h-full rounded-full;
    @apply transition-all duration-500 ease-out;
    position: relative;
}

.timeline-progress::after {
    content: '';
    @apply absolute inset-0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }

    100% {
        transform: translateX(100%);
    }
}

.completion-marker {
    @apply absolute top-0 bottom-0 w-0.5 bg-white;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
}

.timeline-labels {
    @apply flex items-center justify-between mt-2 text-xs font-medium;
}

.timeline-label {
    @apply text-gray-700 dark:text-gray-300;
}

.timeline-label.time {
    @apply text-gray-500 dark:text-gray-400;
}

/* Goal Dates */
.goal-dates {
    @apply flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mt-2;
    @apply pt-2 border-t border-gray-200 dark:border-gray-600;
}

.date-label {
    @apply flex items-center gap-1;
}

.date-range {
    @apply flex items-center;
}

/* ===== Scrollbar ===== */
.goal-list::-webkit-scrollbar {
    width: 6px;
}

.goal-list::-webkit-scrollbar-track {
    @apply bg-gray-100 dark:bg-gray-800 rounded;
}

.goal-list::-webkit-scrollbar-thumb {
    @apply bg-gray-300 dark:bg-gray-600 rounded;
}

.goal-list::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400 dark:bg-gray-500;
}
</style>
