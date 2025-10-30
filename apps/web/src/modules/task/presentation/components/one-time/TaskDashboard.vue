<template>
  <div class="task-dashboard">
    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="mt-4 text-h6">加载仪表板数据...</p>
    </div>

    <!-- 仪表板内容 -->
    <div v-else>
      <!-- 统计卡片 -->
      <v-row class="mb-6">
        <!-- 今日任务 -->
        <v-col cols="12" sm="6" md="3">
          <v-card
            :color="todayTasksCount > 0 ? 'primary' : 'grey-lighten-3'"
            :variant="todayTasksCount > 0 ? 'flat' : 'outlined'"
            class="stat-card"
          >
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-h3 font-weight-bold mb-2">
                    {{ todayTasksCount }}
                  </div>
                  <div class="text-subtitle-1">今日任务</div>
                </div>
                <v-icon size="48" :color="todayTasksCount > 0 ? 'white' : 'grey'">
                  mdi-calendar-today
                </v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 逾期任务 -->
        <v-col cols="12" sm="6" md="3">
          <v-card
            :color="overdueTasksCount > 0 ? 'error' : 'grey-lighten-3'"
            :variant="overdueTasksCount > 0 ? 'flat' : 'outlined'"
            class="stat-card"
            @click="$emit('view-overdue')"
            style="cursor: pointer;"
          >
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-h3 font-weight-bold mb-2">
                    {{ overdueTasksCount }}
                  </div>
                  <div class="text-subtitle-1">逾期任务</div>
                </div>
                <v-icon size="48" :color="overdueTasksCount > 0 ? 'white' : 'grey'">
                  mdi-alert-circle
                </v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 即将到期 -->
        <v-col cols="12" sm="6" md="3">
          <v-card
            :color="upcomingTasksCount > 0 ? 'warning' : 'grey-lighten-3'"
            :variant="upcomingTasksCount > 0 ? 'flat' : 'outlined'"
            class="stat-card"
            @click="$emit('view-upcoming')"
            style="cursor: pointer;"
          >
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-h3 font-weight-bold mb-2">
                    {{ upcomingTasksCount }}
                  </div>
                  <div class="text-subtitle-1">即将到期</div>
                </div>
                <v-icon size="48" :color="upcomingTasksCount > 0 ? 'white' : 'grey'">
                  mdi-clock-alert
                </v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 高优先级 -->
        <v-col cols="12" sm="6" md="3">
          <v-card
            :color="highPriorityTasksCount > 0 ? 'deep-orange' : 'grey-lighten-3'"
            :variant="highPriorityTasksCount > 0 ? 'flat' : 'outlined'"
            class="stat-card"
            @click="$emit('view-high-priority')"
            style="cursor: pointer;"
          >
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-h3 font-weight-bold mb-2">
                    {{ highPriorityTasksCount }}
                  </div>
                  <div class="text-subtitle-1">高优先级</div>
                </div>
                <v-icon size="48" :color="highPriorityTasksCount > 0 ? 'white' : 'grey'">
                  mdi-fire
                </v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 进度和状态 -->
      <v-row class="mb-6">
        <!-- 完成率 -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>今日完成率</v-card-title>
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-4">
                <div>
                  <div class="text-h4 font-weight-bold">
                    {{ completionRate }}%
                  </div>
                  <div class="text-body-2 text-grey">
                    {{ completedTodayCount }} / {{ todayTasksCount }} 已完成
                  </div>
                </div>
                <v-progress-circular
                  :model-value="completionRate"
                  :size="100"
                  :width="12"
                  :color="getCompletionRateColor(completionRate)"
                >
                  <span class="text-h6">{{ completionRate }}%</span>
                </v-progress-circular>
              </div>
              
              <v-progress-linear
                :model-value="completionRate"
                :color="getCompletionRateColor(completionRate)"
                height="8"
                rounded
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 状态分布 -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>任务状态分布</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item
                  v-for="status in statusList"
                  :key="status.key"
                  @click="$emit('view-status', status.key)"
                  style="cursor: pointer;"
                >
                  <template v-slot:prepend>
                    <v-chip :color="status.color" size="small">
                      {{ status.label }}
                    </v-chip>
                  </template>
                  
                  <v-list-item-title class="text-h6">
                    {{ getStatusCount(status.key) }}
                  </v-list-item-title>

                  <template v-slot:append>
                    <v-progress-linear
                      :model-value="getStatusPercentage(status.key)"
                      :color="status.color"
                      height="6"
                      class="status-progress"
                    />
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 警告和提示 -->
      <v-row v-if="needsAttention" class="mb-6">
        <v-col cols="12">
          <v-alert
            v-if="hasOverdueTasks"
            type="error"
            variant="tonal"
            prominent
            closable
          >
            <v-alert-title>有 {{ overdueTasksCount }} 个任务已逾期</v-alert-title>
            <div class="mt-2">
              请尽快处理逾期任务，或调整截止日期。
              <v-btn
                color="error"
                variant="text"
                @click="$emit('view-overdue')"
                class="ml-2"
              >
                查看逾期任务
              </v-btn>
            </div>
          </v-alert>

          <v-alert
            v-if="hasHighPriorityTasks"
            type="warning"
            variant="tonal"
            prominent
            closable
            class="mt-2"
          >
            <v-alert-title>有 {{ highPriorityTasksCount }} 个高优先级任务</v-alert-title>
            <div class="mt-2">
              建议优先处理高优先级任务。
              <v-btn
                color="warning"
                variant="text"
                @click="$emit('view-high-priority')"
                class="ml-2"
              >
                查看高优先级任务
              </v-btn>
            </div>
          </v-alert>
        </v-col>
      </v-row>

      <!-- 快速操作 -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card>
            <v-card-title>快速操作</v-card-title>
            <v-card-text>
              <div class="d-flex flex-wrap gap-2">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-plus"
                  @click="$emit('create-task')"
                >
                  创建任务
                </v-btn>
                <v-btn
                  variant="outlined"
                  prepend-icon="mdi-calendar-today"
                  @click="$emit('view-today')"
                >
                  今日任务
                </v-btn>
                <v-btn
                  variant="outlined"
                  prepend-icon="mdi-chart-line"
                  @click="$emit('view-progress')"
                >
                  进度追踪
                </v-btn>
                <v-btn
                  variant="outlined"
                  prepend-icon="mdi-refresh"
                  @click="$emit('refresh')"
                  :loading="refreshing"
                >
                  刷新数据
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 自动刷新信息 -->
      <v-row>
        <v-col cols="12">
          <div class="text-center text-caption text-grey">
            <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
            上次更新: {{ lastUpdateText }}
            <span v-if="autoRefreshEnabled">
              · 自动刷新已启用 ({{ autoRefreshInterval }}秒)
            </span>
          </div>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  todayTasksCount?: number;
  overdueTasksCount?: number;
  upcomingTasksCount?: number;
  highPriorityTasksCount?: number;
  totalTasksCount?: number;
  completedTodayCount?: number;
  completionRate?: number;
  statusSummary?: Record<string, number>;
  hasOverdueTasks?: boolean;
  hasHighPriorityTasks?: boolean;
  needsAttention?: boolean;
  secondsSinceUpdate?: number;
  autoRefreshEnabled?: boolean;
  autoRefreshInterval?: number;
  loading?: boolean;
  refreshing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  todayTasksCount: 0,
  overdueTasksCount: 0,
  upcomingTasksCount: 0,
  highPriorityTasksCount: 0,
  totalTasksCount: 0,
  completedTodayCount: 0,
  completionRate: 0,
  statusSummary: () => ({}),
  hasOverdueTasks: false,
  hasHighPriorityTasks: false,
  needsAttention: false,
  secondsSinceUpdate: 0,
  autoRefreshEnabled: false,
  autoRefreshInterval: 60,
  loading: false,
  refreshing: false,
});

defineEmits<{
  'view-today': [];
  'view-overdue': [];
  'view-upcoming': [];
  'view-high-priority': [];
  'view-status': [status: string];
  'view-progress': [];
  'create-task': [];
  'refresh': [];
}>();

// 状态列表
const statusList = [
  { key: 'PENDING', label: '待执行', color: 'grey' },
  { key: 'IN_PROGRESS', label: '进行中', color: 'primary' },
  { key: 'COMPLETED', label: '已完成', color: 'success' },
  { key: 'BLOCKED', label: '被阻塞', color: 'warning' },
  { key: 'CANCELED', label: '已取消', color: 'error' },
];

// 计算属性
const lastUpdateText = computed(() => {
  const seconds = props.secondsSinceUpdate;
  
  if (seconds < 60) {
    return '刚刚';
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} 分钟前`;
  } else {
    const hours = Math.floor(seconds / 3600);
    return `${hours} 小时前`;
  }
});

// 方法
function getCompletionRateColor(rate: number): string {
  if (rate >= 80) return 'success';
  if (rate >= 50) return 'primary';
  if (rate >= 30) return 'warning';
  return 'error';
}

function getStatusCount(status: string): number {
  return props.statusSummary[status] || 0;
}

function getStatusPercentage(status: string): number {
  if (props.totalTasksCount === 0) return 0;
  return (getStatusCount(status) / props.totalTasksCount) * 100;
}
</script>

<style scoped lang="scss">
.task-dashboard {
  .stat-card {
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }
  }

  .status-progress {
    width: 120px;
    margin-left: 16px;
  }
}
</style>
