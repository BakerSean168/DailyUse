<template>
  <div class="task-list">
    <!-- 列表头部 -->
    <div class="list-header">
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <h2 class="text-h5 mr-4">{{ title }}</h2>
          <v-chip v-if="tasks.length > 0" size="small">
            {{ tasks.length }} 个任务
          </v-chip>
        </div>

        <div class="d-flex align-center gap-2">
          <!-- 视图切换 -->
          <v-btn-toggle
            v-model="viewMode"
            mandatory
            density="compact"
          >
            <v-btn value="card" icon size="small">
              <v-icon>mdi-view-grid</v-icon>
            </v-btn>
            <v-btn value="list" icon size="small">
              <v-icon>mdi-view-list</v-icon>
            </v-btn>
          </v-btn-toggle>

          <!-- 排序 -->
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                variant="outlined"
                v-bind="props"
                prepend-icon="mdi-sort"
              >
                排序
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="option in sortOptions"
                :key="option.value"
                @click="sortBy = option.value"
              >
                <v-list-item-title>
                  <v-icon v-if="sortBy === option.value" start>mdi-check</v-icon>
                  {{ option.label }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <!-- 筛选 -->
          <v-menu v-model="filterMenuOpen" :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-btn
                variant="outlined"
                v-bind="props"
                prepend-icon="mdi-filter"
              >
                筛选
                <v-badge
                  v-if="activeFiltersCount > 0"
                  :content="activeFiltersCount"
                  color="primary"
                  offset-x="8"
                  offset-y="8"
                />
              </v-btn>
            </template>
            <v-card min-width="300">
              <v-card-text>
                <div class="mb-4">
                  <v-label>状态</v-label>
                  <v-select
                    v-model="filters.status"
                    :items="statusOptions"
                    multiple
                    chips
                    clearable
                    density="compact"
                  />
                </div>

                <div class="mb-4">
                  <v-label>优先级</v-label>
                  <v-select
                    v-model="filters.priority"
                    :items="priorityOptions"
                    multiple
                    chips
                    clearable
                    density="compact"
                  />
                </div>

                <div class="mb-4">
                  <v-checkbox
                    v-model="filters.overdue"
                    label="仅显示逾期任务"
                    density="compact"
                    hide-details
                  />
                </div>

                <div class="mb-4">
                  <v-checkbox
                    v-model="filters.hasGoal"
                    label="仅显示关联目标的任务"
                    density="compact"
                    hide-details
                  />
                </div>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn @click="clearFilters" variant="text">清除</v-btn>
                <v-btn @click="filterMenuOpen = false" color="primary">确定</v-btn>
              </v-card-actions>
            </v-card>
          </v-menu>

          <!-- 批量操作 -->
          <v-menu v-if="selectable && selectedCount > 0">
            <template v-slot:activator="{ props }">
              <v-btn
                color="primary"
                v-bind="props"
                prepend-icon="mdi-checkbox-multiple-marked"
              >
                批量操作 ({{ selectedCount }})
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="$emit('batch-update-priority')">
                <template v-slot:prepend>
                  <v-icon>mdi-arrow-up-bold</v-icon>
                </template>
                <v-list-item-title>更新优先级</v-list-item-title>
              </v-list-item>
              <v-list-item @click="$emit('batch-cancel')">
                <template v-slot:prepend>
                  <v-icon>mdi-close-circle</v-icon>
                </template>
                <v-list-item-title>批量取消</v-list-item-title>
              </v-list-item>
              <v-divider />
              <v-list-item @click="$emit('batch-delete')" class="text-error">
                <template v-slot:prepend>
                  <v-icon color="error">mdi-delete</v-icon>
                </template>
                <v-list-item-title>批量删除</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>

      <!-- 批量选择工具栏 -->
      <v-expand-transition>
        <div v-if="selectable" class="selection-toolbar mb-4">
          <v-btn
            size="small"
            variant="text"
            @click="$emit('select-all')"
          >
            全选
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            @click="$emit('select-none')"
          >
            取消全选
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            @click="$emit('select-overdue')"
          >
            选择逾期
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            @click="$emit('select-high-priority')"
          >
            选择高优先级
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            @click="$emit('invert-selection')"
          >
            反选
          </v-btn>
        </div>
      </v-expand-transition>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-4 text-body-2">加载中...</p>
    </div>

    <!-- 空状态 -->
    <v-empty-state
      v-else-if="filteredTasks.length === 0"
      :title="emptyTitle"
      :text="emptyText"
      icon="mdi-clipboard-check-outline"
    >
      <template v-slot:actions>
        <v-btn
          v-if="filters.status.length > 0 || filters.priority.length > 0"
          color="primary"
          @click="clearFilters"
        >
          清除筛选
        </v-btn>
        <v-btn
          v-else
          color="primary"
          @click="$emit('create-task')"
        >
          创建任务
        </v-btn>
      </template>
    </v-empty-state>

    <!-- 任务列表 - 卡片视图 -->
    <div v-else-if="viewMode === 'card'" class="task-grid">
      <TaskCard
        v-for="task in sortedTasks"
        :key="task.uuid"
        :task="task"
        :selectable="selectable"
        :selected="isSelected(task.uuid)"
        :detail-expanded="expandedTasks.has(task.uuid)"
        :can-start="canStartTask(task)"
        :can-complete="canCompleteTask(task)"
        :can-cancel="canCancelTask(task)"
        @toggle-select="$emit('toggle-select', $event)"
        @toggle-detail="toggleExpanded(task.uuid)"
        @start="$emit('start-task', task.uuid)"
        @complete="$emit('complete-task', task.uuid)"
        @block="$emit('block-task', task.uuid)"
        @unblock="$emit('unblock-task', task.uuid)"
        @cancel="$emit('cancel-task', task.uuid)"
        @edit="$emit('edit-task', task)"
        @view-detail="$emit('view-detail', task)"
        @add-subtask="$emit('add-subtask', task.uuid)"
        @link-goal="$emit('link-goal', task.uuid)"
        @delete="$emit('delete-task', task.uuid)"
      />
    </div>

    <!-- 任务列表 - 列表视图 -->
    <v-list v-else class="task-list-view">
      <v-list-item
        v-for="task in sortedTasks"
        :key="task.uuid"
        :class="{ 'task-overdue': isTaskOverdue(task) }"
      >
        <template v-slot:prepend>
          <v-checkbox
            v-if="selectable"
            :model-value="isSelected(task.uuid)"
            @update:model-value="$emit('toggle-select', task.uuid)"
            hide-details
          />
        </template>

        <v-list-item-title>
          <div class="d-flex align-center gap-2">
            <v-chip :color="getStatusColor(task.status)" size="small" variant="flat">
              {{ getStatusText(task.status) }}
            </v-chip>
            <span :class="{ 'text-decoration-line-through': task.status === 'COMPLETED' }">
              {{ task.title }}
            </span>
          </div>
        </v-list-item-title>

        <v-list-item-subtitle>
          <div class="d-flex align-center gap-4 mt-1">
            <span v-if="task.dueDate">
              <v-icon size="small">mdi-calendar</v-icon>
              {{ formatDate(task.dueDate) }}
            </span>
            <span v-if="task.priority">
              <v-icon size="small" :color="getPriorityColor(task.priority)">
                {{ getPriorityIcon(task.priority) }}
              </v-icon>
              优先级 {{ task.priority }}
            </span>
            <span v-if="task.tags && task.tags.length > 0">
              <v-icon size="small">mdi-tag</v-icon>
              {{ task.tags.join(', ') }}
            </span>
          </div>
        </v-list-item-subtitle>

        <template v-slot:append>
          <div class="d-flex align-center gap-2">
            <v-btn
              v-if="task.status === 'PENDING'"
              icon="mdi-play"
              size="small"
              variant="text"
              color="primary"
              @click="$emit('start-task', task.uuid)"
            />
            <v-btn
              v-if="task.status === 'IN_PROGRESS'"
              icon="mdi-check"
              size="small"
              variant="text"
              color="success"
              @click="$emit('complete-task', task.uuid)"
            />
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              @click="$emit('view-detail', task)"
            />
            <v-btn
              icon="mdi-dots-vertical"
              size="small"
              variant="text"
            />
          </div>
        </template>
      </v-list-item>
    </v-list>

    <!-- 分页 -->
    <div v-if="showPagination && filteredTasks.length > pageSize" class="mt-4">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="7"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TaskTemplateDTO } from '@dailyuse/contracts';
import TaskCard from './TaskCard.vue';

interface Props {
  tasks: TaskTemplateDTO[];
  loading?: boolean;
  selectable?: boolean;
  selectedTasks?: Set<string>;
  title?: string;
  emptyTitle?: string;
  emptyText?: string;
  showPagination?: boolean;
  pageSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selectable: false,
  selectedTasks: () => new Set(),
  title: '任务列表',
  emptyTitle: '暂无任务',
  emptyText: '创建第一个任务开始吧！',
  showPagination: true,
  pageSize: 20,
});

defineEmits<{
  'toggle-select': [uuid: string];
  'select-all': [];
  'select-none': [];
  'select-overdue': [];
  'select-high-priority': [];
  'invert-selection': [];
  'batch-update-priority': [];
  'batch-cancel': [];
  'batch-delete': [];
  'start-task': [uuid: string];
  'complete-task': [uuid: string];
  'block-task': [uuid: string];
  'unblock-task': [uuid: string];
  'cancel-task': [uuid: string];
  'edit-task': [task: TaskTemplateDTO];
  'view-detail': [task: TaskTemplateDTO];
  'add-subtask': [parentUuid: string];
  'link-goal': [taskUuid: string];
  'delete-task': [uuid: string];
  'create-task': [];
}>();

// 视图模式
const viewMode = ref<'card' | 'list'>('card');

// 排序
const sortBy = ref('dueDate');
const sortOptions = [
  { label: '截止日期', value: 'dueDate' },
  { label: '优先级', value: 'priority' },
  { label: '创建时间', value: 'createdAt' },
  { label: '标题', value: 'title' },
];

// 筛选
const filterMenuOpen = ref(false);
const filters = ref({
  status: [] as string[],
  priority: [] as number[],
  overdue: false,
  hasGoal: false,
});

const statusOptions = [
  { title: '待执行', value: 'PENDING' },
  { title: '进行中', value: 'IN_PROGRESS' },
  { title: '已完成', value: 'COMPLETED' },
  { title: '被阻塞', value: 'BLOCKED' },
  { title: '已取消', value: 'CANCELED' },
];

const priorityOptions = [
  { title: '低优先级', value: 1 },
  { title: '普通', value: 2 },
  { title: '中优先级', value: 3 },
  { title: '高优先级', value: 4 },
  { title: '紧急', value: 5 },
];

// 展开的任务
const expandedTasks = ref(new Set<string>());

// 分页
const currentPage = ref(1);

// 计算属性
const selectedCount = computed(() => props.selectedTasks.size);

const activeFiltersCount = computed(() => {
  let count = 0;
  if (filters.value.status.length > 0) count++;
  if (filters.value.priority.length > 0) count++;
  if (filters.value.overdue) count++;
  if (filters.value.hasGoal) count++;
  return count;
});

const filteredTasks = computed(() => {
  let result = [...props.tasks];

  // 状态筛选
  if (filters.value.status.length > 0) {
    result = result.filter(task => filters.value.status.includes(task.status));
  }

  // 优先级筛选
  if (filters.value.priority.length > 0) {
    result = result.filter(task => 
      task.priority && filters.value.priority.includes(task.priority)
    );
  }

  // 逾期筛选
  if (filters.value.overdue) {
    result = result.filter(task => isTaskOverdue(task));
  }

  // 目标关联筛选
  if (filters.value.hasGoal) {
    result = result.filter(task => task.goalUuid);
  }

  return result;
});

const sortedTasks = computed(() => {
  const tasks = [...filteredTasks.value];
  
  tasks.sort((a, b) => {
    switch (sortBy.value) {
      case 'dueDate':
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      
      case 'priority':
        return (b.priority || 0) - (a.priority || 0);
      
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      
      case 'title':
        return a.title.localeCompare(b.title);
      
      default:
        return 0;
    }
  });

  // 分页
  if (props.showPagination) {
    const start = (currentPage.value - 1) * props.pageSize;
    const end = start + props.pageSize;
    return tasks.slice(start, end);
  }

  return tasks;
});

const totalPages = computed(() => 
  Math.ceil(filteredTasks.value.length / props.pageSize)
);

// 方法
function isSelected(uuid: string): boolean {
  return props.selectedTasks.has(uuid);
}

function toggleExpanded(uuid: string): void {
  if (expandedTasks.value.has(uuid)) {
    expandedTasks.value.delete(uuid);
  } else {
    expandedTasks.value.add(uuid);
  }
}

function isTaskOverdue(task: TaskTemplateDTO): boolean {
  if (!task.dueDate || task.status === 'COMPLETED') return false;
  return new Date(task.dueDate) < new Date();
}

function canStartTask(task: TaskTemplateDTO): boolean {
  return task.status === 'PENDING';
}

function canCompleteTask(task: TaskTemplateDTO): boolean {
  return task.status === 'IN_PROGRESS';
}

function canCancelTask(task: TaskTemplateDTO): boolean {
  return !['COMPLETED', 'CANCELED'].includes(task.status);
}

function clearFilters(): void {
  filters.value = {
    status: [],
    priority: [],
    overdue: false,
    hasGoal: false,
  };
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

function getPriorityIcon(priority: number): string {
  if (priority >= 4) return 'mdi-chevron-double-up';
  if (priority === 3) return 'mdi-chevron-up';
  if (priority === 2) return 'mdi-minus';
  return 'mdi-chevron-down';
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('zh-CN');
}
</script>

<style scoped lang="scss">
.task-list {
  .list-header {
    position: sticky;
    top: 0;
    background: rgb(var(--v-theme-surface));
    z-index: 10;
    padding: 16px 0;
  }

  .selection-toolbar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .task-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 16px;
  }

  .task-list-view {
    .task-overdue {
      border-left: 4px solid rgb(var(--v-theme-error));
    }
  }
}
</style>
