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
import { useTaskInstance } from '@/modules/task/presentation/composables/useTaskInstance';
import { TaskInstanceStatus } from '@dailyuse/contracts';
import type { TaskInstance } from '@dailyuse/domain-client';

// ===== Props =====
interface Props {
    size?: DashboardContracts.WidgetSize;
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium' as DashboardContracts.WidgetSize,
});

// ===== Composables =====
const { taskInstances, completeTaskInstance } = useTaskInstance();

// ===== State =====
const isLoading = ref(true);

// ===== Computed =====

/**
 * 今日待办任务
 */
const todayTasks = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 使用 composable 提供的响应式数据
    const instances = taskInstances.value;
    if (!instances || !Array.isArray(instances)) {
        return [];
    }

    return instances
        .filter((task: TaskInstance) => {
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
        .sort((a: TaskInstance, b: TaskInstance) => {
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
    highPriority: todayTasks.value.filter((t: TaskInstance) => t.priority === 'HIGH').length,
    mediumPriority: todayTasks.value.filter((t: TaskInstance) => t.priority === 'MEDIUM').length,
    lowPriority: todayTasks.value.filter((t: TaskInstance) => t.priority === 'LOW').length,
}));

/**
 * 是否为小尺寸
 */
const isSmallSize = computed(() => props.size === 'small');

/**
 * 获取优先级颜色
 */
const getPriorityColor = (priority: string) => {
    const colors = {
        HIGH: 'red',
        MEDIUM: 'orange',
        LOW: 'blue',
    };
    return colors[priority as keyof typeof colors] || 'grey';
};

/**
 * 获取优先级图标
 */
const getPriorityIcon = (priority: string) => {
    const icons = {
        HIGH: 'mdi-arrow-up-circle',
        MEDIUM: 'mdi-minus-circle',
        LOW: 'mdi-arrow-down-circle',
    };
    return icons[priority as keyof typeof icons] || 'mdi-minus-circle';
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
    <v-card class="today-tasks-widget" :class="`widget-size-${size}`" elevation="2">
        <!-- Header -->
        <v-card-title class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
                <v-icon color="primary" size="large" class="mr-2">mdi-calendar-today</v-icon>
                <span class="text-h6">今日待办</span>
            </div>
            <v-chip color="primary" size="small">{{ taskStats.total }}</v-chip>
        </v-card-title>

        <v-divider />

        <!-- Loading State -->
        <v-card-text v-if="isLoading" class="d-flex flex-column align-center justify-center" style="min-height: 200px;">
            <v-progress-circular indeterminate color="primary" />
            <p class="text-caption text-grey mt-2">加载中...</p>
        </v-card-text>

        <!-- Empty State -->
        <v-card-text v-else-if="todayTasks.length === 0" class="d-flex flex-column align-center justify-center"
            style="min-height: 200px;">
            <v-icon color="success" size="64">mdi-check-circle</v-icon>
            <p class="text-body-2 text-grey mt-2">今天没有待办任务</p>
        </v-card-text>

        <!-- Task List -->
        <v-card-text v-else class="pa-3 task-list-container">
            <v-list lines="two" class="pa-0">
                <v-list-item v-for="task in todayTasks" :key="task.uuid" class="task-item mb-2" rounded>
                    <template #prepend>
                        <v-checkbox :model-value="false" hide-details color="success"
                            @click="toggleComplete(task.uuid)" />
                    </template>

                    <v-list-item-title class="d-flex align-center justify-space-between">
                        <span class="text-body-2">{{ task.title }}</span>
                        <v-icon :color="getPriorityColor(task.priority)" size="small" class="ml-2">
                            {{ getPriorityIcon(task.priority) }}
                        </v-icon>
                    </v-list-item-title>

                    <v-list-item-subtitle v-if="!isSmallSize" class="d-flex align-center mt-1">
                        <v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>
                        <span class="text-caption">{{ formatTime(task.scheduledTime || task.dueDate) }}</span>
                        <span v-if="task.templateTitle" class="text-caption ml-3">
                            {{ task.templateTitle }}
                        </span>
                    </v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </v-card-text>

        <!-- Footer Stats -->
        <template v-if="!isSmallSize && taskStats.total > 0">
            <v-divider />
            <v-card-actions class="justify-center pa-3">
                <v-chip v-if="taskStats.highPriority > 0" color="red" size="small" variant="outlined" class="mr-2">
                    <v-icon start size="small">mdi-arrow-up-circle</v-icon>
                    {{ taskStats.highPriority }}
                </v-chip>
                <v-chip v-if="taskStats.mediumPriority > 0" color="orange" size="small" variant="outlined" class="mr-2">
                    <v-icon start size="small">mdi-minus-circle</v-icon>
                    {{ taskStats.mediumPriority }}
                </v-chip>
                <v-chip v-if="taskStats.lowPriority > 0" color="blue" size="small" variant="outlined">
                    <v-icon start size="small">mdi-arrow-down-circle</v-icon>
                    {{ taskStats.lowPriority }}
                </v-chip>
            </v-card-actions>
        </template>
    </v-card>
</template>

<style scoped>
.today-tasks-widget {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.widget-size-small {
    max-height: 280px;
}

.widget-size-medium {
    max-height: 400px;
}

.widget-size-large {
    max-height: 600px;
}

.task-list-container {
    flex: 1;
    overflow-y: auto;
}

.task-item {
    transition: all 0.2s;
    background: rgba(var(--v-theme-surface-variant), 0.3);
}

.task-item:hover {
    background: rgba(var(--v-theme-surface-variant), 0.5);
    transform: translateX(4px);
}
</style>
