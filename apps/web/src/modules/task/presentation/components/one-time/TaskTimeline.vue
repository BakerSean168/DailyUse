<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-timeline-clock</v-icon>
        <span>任务时间线</span>
      </div>

      <v-btn-toggle
        v-model="viewMode"
        mandatory
        density="compact"
        variant="outlined"
      >
        <v-btn value="all" size="small">
          <v-icon start>mdi-view-list</v-icon>
          全部
        </v-btn>
        <v-btn value="important" size="small">
          <v-icon start>mdi-star</v-icon>
          重要
        </v-btn>
      </v-btn-toggle>
    </v-card-title>

    <v-divider />

    <v-card-text>
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-4 text-body-2">加载时间线...</p>
      </div>

      <!-- 空状态 -->
      <v-empty-state
        v-else-if="filteredEvents.length === 0"
        title="暂无活动记录"
        text="任务的所有变更和活动都会显示在这里"
        icon="mdi-timeline-clock-outline"
        class="my-8"
      />

      <!-- 时间线 -->
      <v-timeline
        v-else
        side="end"
        density="compact"
        truncate-line="both"
      >
        <v-timeline-item
          v-for="(event, index) in filteredEvents"
          :key="index"
          :dot-color="event.color"
          :icon="event.icon"
          size="small"
        >
          <!-- 时间戳 -->
          <template v-slot:opposite>
            <div class="text-caption text-grey">
              {{ formatTimestamp(event.timestamp) }}
            </div>
          </template>

          <!-- 事件内容 -->
          <div class="timeline-content">
            <div class="d-flex align-center justify-space-between mb-1">
              <div class="font-weight-medium">{{ event.title }}</div>
              <v-chip
                v-if="event.type"
                size="x-small"
                :color="getEventTypeColor(event.type)"
                variant="flat"
              >
                {{ getEventTypeLabel(event.type) }}
              </v-chip>
            </div>

            <div v-if="event.description" class="text-body-2 text-grey mb-2">
              {{ event.description }}
            </div>

            <!-- 事件详情 -->
            <div v-if="event.details" class="event-details">
              <!-- 状态变更 -->
              <div v-if="event.details.statusChange" class="mb-2">
                <v-chip size="x-small" :color="getStatusColor(event.details.statusChange.from)">
                  {{ getStatusText(event.details.statusChange.from) }}
                </v-chip>
                <v-icon size="small" class="mx-2">mdi-arrow-right</v-icon>
                <v-chip size="x-small" :color="getStatusColor(event.details.statusChange.to)">
                  {{ getStatusText(event.details.statusChange.to) }}
                </v-chip>
              </div>

              <!-- 优先级变更 -->
              <div v-if="event.details.priorityChange" class="mb-2">
                <span class="text-caption">优先级: </span>
                <v-chip size="x-small" :color="getPriorityColor(event.details.priorityChange.from)">
                  {{ event.details.priorityChange.from }}
                </v-chip>
                <v-icon size="small" class="mx-2">mdi-arrow-right</v-icon>
                <v-chip size="x-small" :color="getPriorityColor(event.details.priorityChange.to)">
                  {{ event.details.priorityChange.to }}
                </v-chip>
              </div>

              <!-- 截止日期变更 -->
              <div v-if="event.details.dueDateChange" class="mb-2">
                <span class="text-caption">截止日期: </span>
                <span>{{ formatDate(event.details.dueDateChange.from) }}</span>
                <v-icon size="small" class="mx-2">mdi-arrow-right</v-icon>
                <span>{{ formatDate(event.details.dueDateChange.to) }}</span>
              </div>

              <!-- 标签变更 -->
              <div v-if="event.details.tagsChange" class="mb-2">
                <div v-if="event.details.tagsChange.added.length > 0" class="mb-1">
                  <span class="text-caption text-success">添加标签: </span>
                  <v-chip
                    v-for="tag in event.details.tagsChange.added"
                    :key="tag"
                    size="x-small"
                    color="success"
                    variant="outlined"
                    class="mr-1"
                  >
                    {{ tag }}
                  </v-chip>
                </div>
                <div v-if="event.details.tagsChange.removed.length > 0">
                  <span class="text-caption text-error">移除标签: </span>
                  <v-chip
                    v-for="tag in event.details.tagsChange.removed"
                    :key="tag"
                    size="x-small"
                    color="error"
                    variant="outlined"
                    class="mr-1"
                  >
                    {{ tag }}
                  </v-chip>
                </div>
              </div>

              <!-- 关联目标 -->
              <div v-if="event.details.goalLinked" class="mb-2">
                <v-chip size="x-small" color="primary" prepend-icon="mdi-target">
                  关联到目标
                </v-chip>
              </div>

              <!-- 子任务 -->
              <div v-if="event.details.subtaskAdded" class="mb-2">
                <v-chip size="x-small" color="info" prepend-icon="mdi-plus">
                  添加子任务: {{ event.details.subtaskAdded.title }}
                </v-chip>
              </div>

              <!-- 评论 -->
              <div v-if="event.details.comment" class="comment-box pa-2 mt-2">
                <v-icon size="small" class="mr-1">mdi-comment-text</v-icon>
                <span class="text-body-2">{{ event.details.comment }}</span>
              </div>
            </div>

            <!-- 操作者 -->
            <div class="d-flex align-center mt-2 text-caption text-grey">
              <v-avatar size="20" class="mr-1">
                <v-img
                  v-if="event.actor?.avatar"
                  :src="event.actor.avatar"
                  :alt="event.actor.name"
                />
                <v-icon v-else size="small">mdi-account</v-icon>
              </v-avatar>
              <span>{{ event.actor?.name || '系统' }}</span>
            </div>
          </div>
        </v-timeline-item>
      </v-timeline>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Actor {
  name: string;
  avatar?: string;
}

interface EventDetails {
  statusChange?: { from: string; to: string };
  priorityChange?: { from: number; to: number };
  dueDateChange?: { from: string; to: string };
  tagsChange?: { added: string[]; removed: string[] };
  goalLinked?: { goalId: string; goalTitle: string };
  subtaskAdded?: { uuid: string; title: string };
  comment?: string;
}

interface TimelineEvent {
  timestamp: string;
  title: string;
  description?: string;
  type?: 'create' | 'update' | 'status' | 'comment' | 'system';
  color: string;
  icon: string;
  details?: EventDetails;
  actor?: Actor;
  important?: boolean;
}

interface Props {
  events: TimelineEvent[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// 本地状态
const viewMode = ref<'all' | 'important'>('all');

// 计算属性
const filteredEvents = computed(() => {
  if (viewMode.value === 'important') {
    return props.events.filter(event => event.important);
  }
  return props.events;
});

// 方法
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });
}

function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    create: 'success',
    update: 'info',
    status: 'primary',
    comment: 'grey',
    system: 'grey-lighten-2',
  };
  return colors[type] || 'grey';
}

function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    create: '创建',
    update: '更新',
    status: '状态',
    comment: '评论',
    system: '系统',
  };
  return labels[type] || type;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'grey',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    BLOCKED: 'warning',
    CANCELED: 'error',
  };
  return colors[status] || 'grey';
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    PENDING: '待执行',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    BLOCKED: '被阻塞',
    CANCELED: '已取消',
  };
  return texts[status] || status;
}

function getPriorityColor(priority: number): string {
  if (priority >= 4) return 'error';
  if (priority === 3) return 'warning';
  if (priority === 2) return 'info';
  return 'grey';
}
</script>

<style scoped lang="scss">
.timeline-content {
  padding: 8px 0;
}

.event-details {
  margin-top: 8px;
  padding: 8px;
  background-color: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 4px;
}

.comment-box {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
  border-left: 3px solid rgb(var(--v-theme-primary));
}
</style>
