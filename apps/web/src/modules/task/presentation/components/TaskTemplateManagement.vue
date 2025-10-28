<template>
  <div id="task-template-management">
    <!-- 筛选和操作栏 -->
    <div class="template-controls">
      <!-- 状态筛选器 -->
      <div class="template-filters">
        <v-btn-toggle
          v-model="currentStatus"
          mandatory
          variant="outlined"
          divided
          class="filter-group"
        >
          <v-btn
            v-for="status in statusFilters"
            :key="status.value"
            :value="status.value"
            class="filter-button"
            size="large"
          >
            <v-icon :icon="status.icon" start />
            {{ status.label }}
            <v-chip
              size="small"
              :color="getStatusChipColor(status.value)"
              variant="elevated"
              class="ml-2"
            >
              {{ getTemplateCountByStatus(status.value) }}
            </v-chip>
          </v-btn>
        </v-btn-toggle>
      </div>

      <!-- 操作按钮组 -->
      <div class="action-buttons">
        <!-- 查看依赖关系图按钮 -->
        <v-btn
          v-if="taskStore.getAllTaskTemplates.length > 0"
          color="info"
          variant="outlined"
          size="large"
          prepend-icon="mdi-graph-outline"
          @click="showDependencyDialog = true"
          class="view-dag-button"
        >
          查看依赖关系图
        </v-btn>

        <!-- 删除所有模板按钮 -->
        <v-btn
          v-if="taskStore.getAllTaskTemplates.length > 0"
          color="error"
          variant="outlined"
          size="large"
          prepend-icon="mdi-delete-sweep"
          @click="showDeleteAllDialog = true"
          class="delete-all-button"
        >
          删除所有模板
        </v-btn>

        <!-- 创建按钮 -->
        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          prepend-icon="mdi-plus"
          @click="taskTemplateDialogRef?.openForCreation()"
          class="create-button"
        >
          创建新模板
        </v-btn>
      </div>
    </div>

    <!-- 模板列表 -->
    <div class="template-grid">
      <!-- 空状态 -->
      <v-card v-if="filteredTemplates.length === 0" class="empty-state-card" elevation="2">
        <v-card-text class="text-center pa-8">
          <v-icon :color="getEmptyStateIconColor()" size="64" class="mb-4">
            {{ getEmptyStateIcon() }}
          </v-icon>
          <h3 class="text-h5 mb-2">
            {{ getEmptyStateText() }}
          </h3>
          <p class="text-body-1 text-medium-emphasis">
            {{ getEmptyStateDescription() }}
          </p>
          <v-btn
            v-if="currentStatus === 'active'"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-plus"
            @click="taskTemplateDialogRef?.openForCreation()"
            class="mt-4"
          >
            创建第一个模板
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- 使用 DraggableTaskCard 组件 (支持拖放创建依赖关系) -->
      <DraggableTaskCard
        v-for="template in filteredTemplates"
        :key="template.uuid"
        :template="template"
        :enable-drag="true"
        @dependency-created="handleDependencyCreated"
      />
    </div>

    <!-- 删除所有模板确认对话框 -->
    <!-- <v-dialog v-model="showDeleteAllDialog" max-width="500">
            <v-card>
                <v-card-title class="text-h6">
                    <v-icon color="error" class="mr-2">mdi-delete-sweep</v-icon>
                    删除所有任务模板
                </v-card-title>
                <v-card-text>
                    <v-alert color="error" variant="tonal" class="mb-4">
                        <template v-slot:prepend>
                            <v-icon>mdi-alert-circle</v-icon>
                        </template>
                        <strong>警告：此操作将永久删除所有任务模板！</strong>
                    </v-alert>

                    <p class="mb-2">
                        您即将删除 <strong>{{ taskStore.getAllTaskTemplates.length }}</strong> 个任务模板，包括：
                    </p>

                    <ul class="mb-3">
                        <li v-for="status in statusFilters" :key="status.value" class="mb-1">
                            <v-chip :color="getStatusChipColor(status.value)" size="small" variant="flat" class="mr-2">
                                {{ getTemplateCountByStatus(status.value) }}
                            </v-chip>
                            {{ status.label }}模板
                        </li>
                    </ul>

                    <v-alert color="warning" variant="tonal" density="compact">
                        所有相关的任务实例和提醒也会被删除，此操作不可恢复。
                    </v-alert>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="showDeleteAllDialog = false">
                        取消
                    </v-btn>
                    <v-btn color="error" variant="elevated" @click="confirmDeleteAll">
                        确认删除所有
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog> -->

    <!-- 模板选择对话框 -->
    <TemplateSelectionDialog ref="templateSelectionDialogRef" />

    <!-- 任务模板编辑对话框 -->
    <TaskTemplateDialog ref="taskTemplateDialogRef" />

    <!-- 依赖关系图对话框 -->
    <v-dialog v-model="showDependencyDialog" max-width="1400px" max-height="800px">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h6">
            <v-icon>mdi-graph-outline</v-icon>
            任务依赖关系图
          </span>
          <v-btn icon variant="text" @click="showDependencyDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text style="height: 600px">
          <TaskDAGVisualization
            v-if="showDependencyDialog"
            :tasks="taskStore.getAllTaskTemplates"
            :dependencies="allDependencies"
            :compact="false"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDependencyDialog = false"> 关闭 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import DraggableTaskCard from './cards/DraggableTaskCard.vue';
import TaskDAGVisualization from './dag/TaskDAGVisualization.vue';
import TaskTemplateDialog from './dialogs/TaskTemplateDialog.vue';
import TemplateSelectionDialog from './dialogs/TemplateSelectionDialog.vue';
import type { TaskContracts } from '@dailyuse/contracts';
// composables
import { taskDependencyApiClient } from '../../infrastructure/api/taskApiClient';

type TaskDependencyClientDTO = TaskContracts.TaskDependencyClientDTO;
type TaskTemplateClientDTO = TaskContracts.TaskTemplateClientDTO;

const taskStore = useTaskStore();
const currentStatus = ref('active'); // 设置为 active，因为新创建的模板现在直接激活
const showDeleteDialog = ref(false);
const showDeleteAllDialog = ref(false);
const selectedTemplate = ref<TaskTemplateClientDTO | null>(null);
const showDependencyDialog = ref(false);
const allDependencies = ref<TaskDependencyClientDTO[]>([]);

// component refs
const taskTemplateDialogRef = ref<InstanceType<typeof TaskTemplateDialog> | null>(null);
const templateSelectionDialogRef = ref<InstanceType<typeof TemplateSelectionDialog> | null>(null);

// 状态筛选器配置
const statusFilters = [
  { label: '进行中', value: 'active', icon: 'mdi-play-circle' },
  { label: '草稿', value: 'draft', icon: 'mdi-file-document-outline' },
  { label: '已暂停', value: 'paused', icon: 'mdi-pause-circle' },
  { label: '已归档', value: 'archived', icon: 'mdi-archive' },
];

// 计算属性
const filteredTemplates = computed(() => {
  const allTemplates = taskStore.getAllTaskTemplates;
  console.log('🔍 [filteredTemplates] 计算筛选结果...');
  console.log('📊 所有模板:', allTemplates.length);
  console.log('🎯 筛选状态:', currentStatus.value);

  const filtered = allTemplates.filter((template) => {
    const status = template.lifecycle?.status;
    console.log(
      `📋 模板 ${template.title}: status=${status}, 匹配=${status === currentStatus.value}`,
    );
    return status === currentStatus.value;
  });

  console.log('✅ 筛选结果:', filtered.length);
  return filtered;
});

// 调试信息 - 监听数据变化
watchEffect(() => {
  console.log('🔍 [TaskTemplateManagement] 数据变化检测:');
  console.log('📊 模板总数:', taskStore.getAllTaskTemplates.length);

  // 详细检查每个模板的状态结构
  const templates = taskStore.getAllTaskTemplates;
  console.log(
    '📋 模板详情:',
    templates.map((t) => ({
      uuid: t.uuid,
      title: t.title,
      status: t.lifecycle?.status,
      lifecycleObj: t.lifecycle,
    })),
  );

  console.log('🎯 当前筛选状态:', currentStatus.value);

  // 检查状态分布
  const statusDistribution: Record<string, number> = templates.reduce(
    (acc, t) => {
      const status = t.lifecycle?.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  console.log('📊 状态分布:', statusDistribution);

  console.log('📈 筛选后模板数:', filteredTemplates.value.length);
  console.log(
    '🔍 筛选后的模板:',
    filteredTemplates.value.map((t) => ({
      uuid: t.uuid,
      title: t.title,
      status: t.lifecycle?.status,
    })),
  );
});

// 工具方法
const getTemplateCountByStatus = (status: string) => {
  return taskStore.getAllTaskTemplates.filter((template) => template.lifecycle.status === status)
    .length;
};

const getStatusChipColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'draft':
      return 'info';
    case 'paused':
      return 'warning';
    case 'archived':
      return 'info';
    default:
      return 'default';
  }
};

const getEmptyStateText = () => {
  switch (currentStatus.value) {
    case 'active':
      return '暂无进行中的模板';
    case 'draft':
      return '暂无草稿模板';
    case 'paused':
      return '暂无暂停的模板';
    case 'archived':
      return '暂无归档的模板';
    default:
      return '暂无模板';
  }
};

const getEmptyStateDescription = () => {
  switch (currentStatus.value) {
    case 'active':
      return '创建任务模板来安排你的日常工作，或者为目标的关键结果创建任务';
    case 'draft':
      return '草稿模板需要激活后才能使用';
    case 'paused':
      return '暂停的模板可以随时恢复使用';
    case 'archived':
      return '过期的任务模板';
    default:
      return '';
  }
};

const getEmptyStateIcon = () => {
  return statusFilters.find((s) => s.value === currentStatus.value)?.icon || 'mdi-circle';
};

const getEmptyStateIconColor = () => {
  return getStatusChipColor(currentStatus.value);
};

/**
 * Handle dependency created event from DraggableTaskCard
 * Refresh the dependencies list for DAG visualization
 */
const handleDependencyCreated = async (sourceUuid: string, targetUuid: string) => {
  console.log('✅ [TaskTemplateManagement] 依赖关系已创建:', {
    source: sourceUuid,
    target: targetUuid,
  });

  // Refresh dependencies list
  await loadAllDependencies();

  // Optionally show success message or open DAG dialog
  // showDependencyDialog.value = true;
};

/**
 * Load all task dependencies for DAG visualization
 */
const loadAllDependencies = async () => {
  try {
    // Get all template UUIDs
    const templateUuids = taskStore.getAllTaskTemplates.map((t) => t.uuid);

    // Load dependencies for each template
    const dependenciesPromises = templateUuids.map((uuid) =>
      taskDependencyApiClient.getDependencies(uuid),
    );

    const results = await Promise.all(dependenciesPromises);

    // Flatten and deduplicate dependencies
    const allDeps: TaskDependencyClientDTO[] = results.flat();
    const uniqueDeps = Array.from(
      new Map(allDeps.map((dep: TaskDependencyClientDTO) => [dep.uuid, dep])).values(),
    );

    allDependencies.value = uniqueDeps;

    console.log('📊 [TaskTemplateManagement] 加载依赖关系:', {
      totalTemplates: templateUuids.length,
      totalDependencies: uniqueDeps.length,
    });
  } catch (error) {
    console.error('❌ [TaskTemplateManagement] 加载依赖关系失败:', error);
  }
};

// Load dependencies on mount
loadAllDependencies();

// const pauseTemplate = (template: TaskTemplate) => {
//     handlePauseTaskTemplate(template.uuid)
//         .then(() => {
//             console.log('模板已暂停:', template.title);
//         })
//         .catch((error: Error) => {
//             console.error('暂停模板失败:', error);
//         });
// }

// const resumeTemplate = (template: TaskTemplate) => {
//     handleResumeTaskTemplate(template.uuid)
//         .then(() => {
//             console.log('模板已恢复:', template.title);
//         })
//         .catch((error: Error) => {
//             console.error('恢复模板失败:', error);
//         });
// };
</script>

<style scoped>
#task-template-management {
  padding: 1.5rem;
}

/* 控制栏样式 */
.template-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

/* 操作按钮组样式 */
.action-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.delete-all-button {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.filter-group {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-button {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.create-button {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.view-dag-button {
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 模板网格 */
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;
}

/* 空状态样式 */
.empty-state-card {
  grid-column: 1 / -1;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-surface), 0.8),
    rgba(var(--v-theme-background), 0.95)
  );
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .template-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  #task-template-management {
    padding: 1rem;
  }

  .template-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .template-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
