<!--
  Dependency Validation Demo View
  依赖验证功能演示页面 - STORY-024
-->
<template>
  <v-container fluid class="dependency-demo-view">
    <v-row>
      <v-col cols="12">
        <!-- 页面标题 -->
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <h1 class="text-h4 mb-2">
              <v-icon class="mr-2">mdi-check-decagram</v-icon>
              STORY-024: 依赖验证演示
            </h1>
            <p class="text-body-2 text-medium-emphasis">循环依赖检测、依赖规则验证、自动状态更新</p>
          </div>

          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-graph-outline"
            @click="showDAG = true"
          >
            查看依赖图
          </v-btn>
        </div>

        <!-- 功能卡片 -->
        <v-row>
          <v-col cols="12" md="4">
            <v-card>
              <v-card-text class="text-center pa-6">
                <v-icon size="48" color="error" class="mb-3"> mdi-alert-octagon </v-icon>
                <div class="text-h6 mb-2">循环依赖检测</div>
                <div class="text-body-2 text-medium-emphasis">
                  DFS算法检测依赖循环<br />
                  时间复杂度 O(V+E)
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card>
              <v-card-text class="text-center pa-6">
                <v-icon size="48" color="warning" class="mb-3"> mdi-shield-check </v-icon>
                <div class="text-h6 mb-2">依赖规则验证</div>
                <div class="text-body-2 text-medium-emphasis">
                  防止自依赖、重复依赖<br />
                  链深度警告（>5层）
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card>
              <v-card-text class="text-center pa-6">
                <v-icon size="48" color="success" class="mb-3"> mdi-auto-fix </v-icon>
                <div class="text-h6 mb-2">自动状态更新</div>
                <div class="text-body-2 text-medium-emphasis">
                  基于依赖状态计算<br />
                  BFS级联更新
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- 主内容区域 -->
        <v-row class="mt-4">
          <!-- 任务列表 -->
          <v-col cols="12" md="4">
            <v-card>
              <v-card-title>
                <div class="d-flex justify-space-between align-center w-100">
                  <span>演示任务列表</span>
                  <v-btn size="small" variant="text" @click="loadDemoData">
                    <v-icon start>mdi-refresh</v-icon>
                    重置
                  </v-btn>
                </div>
              </v-card-title>

              <v-card-text>
                <v-list density="compact">
                  <v-list-item
                    v-for="task in tasks"
                    :key="task.uuid"
                    :class="{ 'bg-blue-lighten-5': selectedTaskUuid === task.uuid }"
                    @click="selectedTaskUuid = task.uuid"
                  >
                    <template #prepend>
                      <v-icon :color="getStatusColor(task.status)" size="small">
                        {{ getStatusIcon(task.status) }}
                      </v-icon>
                    </template>

                    <v-list-item-title>
                      {{ task.title }}
                    </v-list-item-title>

                    <v-list-item-subtitle>
                      <v-chip :color="getStatusColor(task.status)" size="x-small" variant="flat">
                        {{ task.status }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- 状态事件日志 -->
            <v-card class="mt-4">
              <v-card-title>
                <div class="d-flex justify-space-between align-center w-100">
                  <span>
                    <v-icon class="mr-2" size="small">mdi-timeline-text</v-icon>
                    事件日志
                  </span>
                  <v-btn size="x-small" variant="text" @click="eventLog = []"> 清空 </v-btn>
                </div>
              </v-card-title>

              <v-card-text style="max-height: 300px; overflow-y: auto">
                <div v-if="eventLog.length === 0" class="text-center text-medium-emphasis py-4">
                  暂无事件
                </div>
                <v-timeline v-else density="compact" side="end" align="start">
                  <v-timeline-item
                    v-for="(event, index) in eventLog"
                    :key="index"
                    :dot-color="event.color"
                    size="x-small"
                  >
                    <div class="text-caption">{{ event.time }}</div>
                    <div class="text-body-2">{{ event.message }}</div>
                  </v-timeline-item>
                </v-timeline>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 依赖管理器 -->
          <v-col cols="12" md="8">
            <DependencyManager
              :current-task-uuid="selectedTaskUuid"
              :all-tasks="tasks"
              :dependencies="dependencies"
              @dependency-added="handleDependencyAdded"
              @dependency-deleted="handleDependencyDeleted"
              @view-graph="showDAG = true"
            />

            <!-- 使用说明 -->
            <v-card class="mt-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-information</v-icon>
                使用说明
              </v-card-title>
              <v-card-text>
                <ol class="pl-4">
                  <li class="mb-2">
                    <strong>选择任务：</strong>从左侧列表选择一个任务作为当前任务
                  </li>
                  <li class="mb-2">
                    <strong>添加依赖：</strong>选择前置任务和依赖类型，点击"添加依赖"
                  </li>
                  <li class="mb-2">
                    <strong>循环检测：</strong>尝试添加会形成循环的依赖（如 A→B→C→A）
                  </li>
                  <li class="mb-2">
                    <strong>查看事件：</strong>观察左下方的事件日志，查看状态变化
                  </li>
                  <li class="mb-2"><strong>可视化：</strong>点击右上角"查看依赖图"按钮查看 DAG</li>
                </ol>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- DAG 对话框 -->
    <v-dialog v-model="showDAG" max-width="1200px" scrollable>
      <v-card>
        <v-card-title>
          <div class="d-flex justify-space-between align-center w-100">
            <span>任务依赖关系图</span>
            <v-btn icon="mdi-close" variant="text" @click="showDAG = false" />
          </div>
        </v-card-title>
        <v-card-text style="height: 600px">
          <TaskDAGVisualization :tasks="tasks" :dependencies="dependencies" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { DependencyType } from '@dailyuse/contracts/task';
import type { TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import type { TaskForDAG } from '@/modules/task/types/task-dag.types';
import DependencyManager from '@/modules/task/presentation/components/dependency/DependencyManager.vue';
import TaskDAGVisualization from '@/modules/task/presentation/components/dag/TaskDAGVisualization.vue';
import { taskAutoStatusService } from '@/modules/task/application/services/TaskAutoStatusService';


interface EventLogEntry {
  time: string;
  message: string;
  color: string;
}

// State
const tasks = ref<TaskForDAG[]>([]);
const dependencies = ref<TaskDependencyClientDTO[]>([]);
const selectedTaskUuid = ref<string>();
const showDAG = ref(false);
const eventLog = ref<EventLogEntry[]>([]);

// Event subscriptions
let unsubscribeStatus: (() => void) | null = null;
let unsubscribeReady: (() => void) | null = null;
let unsubscribeBlocked: (() => void) | null = null;

// Methods
const loadDemoData = () => {
  // 创建演示任务数据
  tasks.value = [
    {
      uuid: 'task-1',
      title: '需求分析',
      description: '收集和分析项目需求',
      status: 'COMPLETED',
      priority: 'HIGH',
      estimatedMinutes: 240,
    },
    {
      uuid: 'task-2',
      title: '系统设计',
      description: '设计系统架构和数据库',
      status: 'COMPLETED',
      priority: 'HIGH',
      estimatedMinutes: 480,
    },
    {
      uuid: 'task-3',
      title: '前端开发',
      description: '开发用户界面',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      estimatedMinutes: 960,
    },
    {
      uuid: 'task-4',
      title: '后端开发',
      description: '开发API和业务逻辑',
      status: 'READY',
      priority: 'MEDIUM',
      estimatedMinutes: 960,
    },
    {
      uuid: 'task-5',
      title: '测试',
      description: '单元测试和集成测试',
      status: 'BLOCKED',
      priority: 'HIGH',
      estimatedMinutes: 480,
    },
    {
      uuid: 'task-6',
      title: '部署',
      description: '部署到生产环境',
      status: 'BLOCKED',
      priority: 'CRITICAL',
      estimatedMinutes: 120,
    },
  ] as TaskForDAG[];

  // 创建演示依赖数据
  const now = new Date();
  dependencies.value = [
    {
      uuid: 'dep-1',
      predecessorTaskUuid: 'task-1',
      successorTaskUuid: 'task-2',
      dependencyType: DependencyType.FINISH_TO_START,
      createdAt: now,
      updatedAt: now,
    },
    {
      uuid: 'dep-2',
      predecessorTaskUuid: 'task-2',
      successorTaskUuid: 'task-3',
      dependencyType: DependencyType.FINISH_TO_START,
      createdAt: now,
      updatedAt: now,
    },
    {
      uuid: 'dep-3',
      predecessorTaskUuid: 'task-2',
      successorTaskUuid: 'task-4',
      dependencyType: DependencyType.FINISH_TO_START,
      createdAt: now,
      updatedAt: now,
    },
    {
      uuid: 'dep-4',
      predecessorTaskUuid: 'task-3',
      successorTaskUuid: 'task-5',
      dependencyType: DependencyType.FINISH_TO_START,
      createdAt: now,
      updatedAt: now,
    },
    {
      uuid: 'dep-5',
      predecessorTaskUuid: 'task-4',
      successorTaskUuid: 'task-5',
      dependencyType: DependencyType.FINISH_TO_START,
      createdAt: now,
      updatedAt: now,
    },
    {
      uuid: 'dep-6',
      predecessorTaskUuid: 'task-5',
      successorTaskUuid: 'task-6',
      dependencyType: DependencyType.FINISH_TO_START,
      createdAt: now,
      updatedAt: now,
    },
  ] as TaskDependencyClientDTO[];

  // 选中第一个任务
  selectedTaskUuid.value = 'task-3';

  // 清空日志
  eventLog.value = [];
  addEventLog('演示数据已加载', 'info');
};

const handleDependencyAdded = (dep: TaskDependencyClientDTO) => {
  dependencies.value.push(dep);
  addEventLog(
    `依赖已添加: ${getTaskTitle(dep.predecessorTaskUuid)} → ${getTaskTitle(dep.successorTaskUuid)}`,
    'success',
  );
};

const handleDependencyDeleted = (depUuid: string) => {
  const dep = dependencies.value.find((d) => d.uuid === depUuid);
  dependencies.value = dependencies.value.filter((d) => d.uuid !== depUuid);

  if (dep) {
    addEventLog(
      `依赖已删除: ${getTaskTitle(dep.predecessorTaskUuid)} → ${getTaskTitle(dep.successorTaskUuid)}`,
      'warning',
    );
  }
};

const getTaskTitle = (uuid: string): string => {
  const task = tasks.value.find((t) => t.uuid === uuid);
  return task?.title || uuid;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    COMPLETED: 'success',
    IN_PROGRESS: 'primary',
    READY: 'info',
    BLOCKED: 'error',
    PENDING: 'grey',
  };
  return colors[status] || 'grey';
};

const getStatusIcon = (status: string): string => {
  const icons: Record<string, string> = {
    COMPLETED: 'mdi-check-circle',
    IN_PROGRESS: 'mdi-progress-clock',
    READY: 'mdi-play-circle',
    BLOCKED: 'mdi-lock',
    PENDING: 'mdi-clock-outline',
  };
  return icons[status] || 'mdi-help-circle';
};

const addEventLog = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
  const colors = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'error',
  };

  eventLog.value.unshift({
    time: new Date().toLocaleTimeString('zh-CN'),
    message,
    color: colors[type],
  });

  // 只保留最近 20 条
  if (eventLog.value.length > 20) {
    eventLog.value = eventLog.value.slice(0, 20);
  }
};

// Setup event listeners
const setupEventListeners = () => {
  // Status change events
  unsubscribeStatus = taskAutoStatusService.onStatusChanged((event) => {
    addEventLog(
      `状态变更: ${getTaskTitle(event.taskUuid)} ${event.oldStatus} → ${event.newStatus}`,
      'info',
    );

    // Update local task status
    const task = tasks.value.find((t) => t.uuid === event.taskUuid);
    if (task) {
      task.status = event.newStatus;
    }
  });

  // Task ready events
  unsubscribeReady = taskAutoStatusService.onTaskReady((event) => {
    addEventLog(`✅ 任务已就绪: ${getTaskTitle(event.taskUuid)} 可以开始执行`, 'success');
  });

  // Task blocked events
  unsubscribeBlocked = taskAutoStatusService.onTaskBlocked((event) => {
    addEventLog(
      `🔒 任务被阻塞: ${getTaskTitle(event.taskUuid)} (等待 ${event.blockingTasks.length} 个前置任务)`,
      'warning',
    );
  });
};

// Lifecycle
onMounted(() => {
  loadDemoData();
  setupEventListeners();
});

onUnmounted(() => {
  // Cleanup event listeners
  if (unsubscribeStatus) unsubscribeStatus();
  if (unsubscribeReady) unsubscribeReady();
  if (unsubscribeBlocked) unsubscribeBlocked();
});
</script>

<style scoped>
.dependency-demo-view {
  max-width: 1400px;
  margin: 0 auto;
}
</style>

