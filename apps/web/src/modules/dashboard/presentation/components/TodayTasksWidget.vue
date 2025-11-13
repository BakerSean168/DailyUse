<script setup lang="ts">
/**
 * TodayTasksWidget - 今日待办任务 Widget
 * 
 * 功能：
 * - 展示今日的待办任务（TaskInstance）
 * - 显示任务标题、优先级、完成状态
 * - 支持快速标记完成
 * - 支持三种尺寸 (small/medium/large)
 */

import { computed, onMounted, ref } from 'vue';
import type { DashboardContracts } from '@dailyuse/contracts';
import { useTaskInstanceStore } from '@/modules/task/presentation/stores/taskInstanceStore';
import { TaskInstanceStatus } from '@dailyuse/contracts';

// ===== Props =====
interface Props {
    size?: DashboardContracts.WidgetSize;
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium' as DashboardContracts.WidgetSize,
});

// ===== Stores =====
const taskInstanceStore = useTaskInstanceStore();

// ===== State =====
const isLoading = ref(true);

// ===== Computed =====

/**
 * Widget 容器样式类
 */
const containerClasses = computed(() => [
    'today-tasks-widget',
    `widget-size-${props.size}`,
    {
        'widget-loading': isLoading.value,
    },
]);

/**
 * 今日待办任务
 */
const todayTasks = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return taskInstanceStore.allInstances
        .filter(task => {
            if (task.status === TaskInstanceStatus.COMPLETED) return false;

            // 检查是否有今天的 scheduledTime
            if (task.scheduledTime) {
                const taskDate = new Date(task.scheduledTime);
                return taskDate >= today && taskDate < tomorrow;
            }

            // 或者检查 dueDate 是否是今天
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                return dueDate >= today && dueDate < tomorrow;
            }

            return false;
        })
        .slice(0, props.size === 'small' ? 3 : props.size === 'medium' ? 5 : 10)
        .sort((a, b) => {
            // 按优先级和时间排序
            const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
            const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
            const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;

            if (aPriority !== bPriority) return aPriority - bPriority;

            const aTime = a.scheduledTime || a.dueDate;
            const bTime = b.scheduledTime || b.dueDate;
            if (!aTime) return 1;
            if (!bTime) return -1;
            return new Date(aTime).getTime() - new Date(bTime).getTime();
        });
});

/**
 * 任务数量统计
 */
const taskStats = computed(() => ({
    total: todayTasks.value.length,
    highPriority: todayTasks.value.filter(t => t.priority === 'HIGH').length,
    mediumPriority: todayTasks.value.filter(t => t.priority === 'MEDIUM').length,
    lowPriority: todayTasks.value.filter(t => t.priority === 'LOW').length,
}));

/**
 * 是否为小尺寸
 */
const isSmallSize = computed(() => props.size === 'small');

/**
 * 是否为大尺寸
 */
const isLargeSize = computed(() => props.size === 'large');

/**
 * 获取优先级颜色
 */
const getPriorityColor = (priority: string) => {
    const colors = {
        HIGH: 'text-red-600 dark:text-red-400',
        MEDIUM: 'text-orange-600 dark:text-orange-400',
        LOW: 'text-blue-600 dark:text-blue-400',
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
};

/**
 * 获取优先级图标
 */
const getPriorityIcon = (priority: string) => {
    const icons = {
        HIGH: 'i-heroicons-arrow-up-circle',
        MEDIUM: 'i-heroicons-minus-circle',
        LOW: 'i-heroicons-arrow-down-circle',
    };
    return icons[priority as keyof typeof icons] || 'i-heroicons-minus-circle';
};

/**
 * 格式化时间
 */
const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

/**
 * 快速标记完成
 */
const toggleComplete = async (taskUuid: string) => {
    try {
        await taskInstanceStore.updateInstance(taskUuid, {
            status: TaskInstanceStatus.COMPLETED,
        });
    } catch (error) {
        console.error('[TodayTasksWidget] Failed to toggle task completion:', error);
    }
};

// ===== Lifecycle =====
onMounted(async () => {
    try {
        isLoading.value = true;
        await taskInstanceStore.fetchAllInstances();
    } catch (error) {
        console.error('[TodayTasksWidget] Failed to load tasks:', error);
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
                <div class="i-heroicons-calendar-days widget-icon" />
                <h3>今日待办</h3>
            </div>
            <div class="widget-stats">
                <span class="stats-badge">{{ taskStats.total }}</span>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="widget-loading-state">
            <div class="i-heroicons-arrow-path animate-spin text-2xl text-gray-400" />
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">加载中...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="todayTasks.length === 0" class="empty-state">
            <div class="i-heroicons-check-circle text-4xl text-green-500 mb-2" />
            <p class="text-sm text-gray-600 dark:text-gray-400">今天没有待办任务</p>
        </div>

        <!-- Task List -->
        <div v-else class="task-list">
            <div v-for="task in todayTasks" :key="task.uuid" class="task-item">
                <!-- Checkbox -->
                <button class="task-checkbox" @click="toggleComplete(task.uuid)">
                    <div class="i-heroicons-check w-4 h-4" />
                </button>

                <!-- Task Content -->
                <div class="task-content">
                    <div class="task-header">
                        <span class="task-title">{{ task.title }}</span>
                        <div
                            :class="[getPriorityIcon(task.priority), getPriorityColor(task.priority), 'priority-icon']" />
                    </div>
                    <div v-if="!isSmallSize" class="task-meta">
                        <span v-if="task.scheduledTime" class="task-time">
                            <div class="i-heroicons-clock w-3 h-3" />
                            {{ formatTime(task.scheduledTime) }}
                        </span>
                        <span v-if="task.templateTitle" class="task-template">
                            {{ task.templateTitle }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer Stats (Medium/Large) -->
        <div v-if="!isSmallSize && taskStats.total > 0" class="widget-footer">
            <div class="priority-stats">
                <span v-if="taskStats.highPriority > 0" class="priority-stat high">
                    <div class="i-heroicons-arrow-up-circle w-4 h-4" />
                    {{ taskStats.highPriority }}
                </span>
                <span v-if="taskStats.mediumPriority > 0" class="priority-stat medium">
                    <div class="i-heroicons-minus-circle w-4 h-4" />
                    {{ taskStats.mediumPriority }}
                </span>
                <span v-if="taskStats.lowPriority > 0" class="priority-stat low">
                    <div class="i-heroicons-arrow-down-circle w-4 h-4" />
                    {{ taskStats.lowPriority }}
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ===== Widget Container ===== */
.today-tasks-widget {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    @apply rounded-xl shadow-lg overflow-hidden;
    @apply transition-all duration-300 hover:shadow-xl hover:scale-[1.02];
    color: white;
}

/* Size Variants */
.widget-size-small {
    @apply p-4;
    min-height: 180px;
    max-height: 240px;
}

.widget-size-medium {
    @apply p-5;
    min-height: 280px;
    max-height: 400px;
}

.widget-size-large {
    @apply p-6;
    min-height: 400px;
    max-height: 600px;
}

/* ===== Header ===== */
.widget-header {
    @apply flex items-center justify-between mb-4;
    @apply pb-4;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.widget-title {
    @apply flex items-center gap-3;
}

.widget-icon {
    @apply text-2xl;
}

.widget-title h3 {
    @apply text-lg font-bold;
}

.widget-stats {
    @apply flex items-center gap-2;
}

.stats-badge {
    @apply px-3 py-1 rounded-full;
    @apply text-sm font-bold;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
}

/* ===== Loading/Empty State ===== */
.widget-loading-state,
.empty-state {
    @apply flex flex-col items-center justify-center py-12;
}

/* ===== Task List ===== */
.task-list {
    @apply flex flex-col gap-2 overflow-y-auto;
    max-height: calc(100% - 120px);
}

.task-item {
    @apply flex items-start gap-3 p-3 rounded-lg;
    @apply transition-all duration-200 hover:scale-[1.02];
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.task-item:hover {
    background: rgba(255, 255, 255, 0.15);
}

.task-checkbox {
    @apply flex-shrink-0 w-5 h-5 rounded border-2 border-white;
    @apply flex items-center justify-center;
    @apply transition-all duration-200 hover:bg-white hover:text-purple-600;
    background: rgba(255, 255, 255, 0.1);
}

.task-checkbox:hover {
    transform: scale(1.1);
}

.task-content {
    @apply flex-1 min-w-0;
}

.task-header {
    @apply flex items-start justify-between gap-2 mb-1;
}

.task-title {
    @apply text-sm font-medium flex-1;
    @apply truncate;
}

.priority-icon {
    @apply flex-shrink-0 w-4 h-4;
}

.task-meta {
    @apply flex items-center gap-3 text-xs;
    color: rgba(255, 255, 255, 0.8);
}

.task-time,
.task-template {
    @apply flex items-center gap-1;
}

.task-template {
    @apply truncate;
}

/* ===== Footer ===== */
.widget-footer {
    @apply pt-4 mt-4;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.priority-stats {
    @apply flex items-center gap-4 justify-center;
}

.priority-stat {
    @apply flex items-center gap-1 text-sm font-medium;
}

.priority-stat.high {
    color: #fca5a5;
}

.priority-stat.medium {
    color: #fdba74;
}

.priority-stat.low {
    color: #93c5fd;
}

/* ===== Scrollbar ===== */
.task-list::-webkit-scrollbar {
    width: 6px;
}

.task-list::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
}

.task-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
}

.task-list::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
}
</style>
