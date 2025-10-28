<template>
  <v-dialog v-model="visible" max-width="600px" persistent>
    <v-card>
      <v-card-title>
        <div class="d-flex justify-space-between align-center w-100">
          <div class="d-flex align-center">
            <v-icon :color="template?.color || 'primary'" class="mr-2">
              {{ template?.icon || 'mdi-bell' }}
            </v-icon>
            <span>{{ template?.name || '提醒模板' }}</span>
          </div>
          <v-switch
            v-model="enabled"
            :color="template?.color || 'primary'"
            hide-details
            @change="toggleEnabled"
          />
        </div>
      </v-card-title>

      <v-card-text>
        <div class="template-info">
          <!-- 基础信息 -->
          <div class="info-section">
            <h4 class="mb-2">基础信息</h4>
            <v-row dense>
              <v-col cols="12" md="6">
                <div class="info-item">
                  <strong>分类：</strong>{{ template?.category || '未分类' }}
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="info-item">
                  <strong>优先级：</strong>
                  <v-chip :color="priorityColor" size="small">
                    {{ priorityText }}
                  </v-chip>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="info-item">
                  <strong>描述：</strong>{{ template?.description || '暂无描述' }}
                </div>
              </v-col>
              <v-col cols="12">
                <div class="info-item">
                  <strong>提醒消息：</strong>{{ template?.message || '暂无消息' }}
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- 时间配置 -->
          <div class="info-section">
            <h4 class="mb-2">时间配置</h4>
            <div class="info-item"><strong>类型：</strong>{{ timeConfigText }}</div>
            <div v-if="template?.timeConfig?.times" class="info-item">
              <strong>时间：</strong>
              <v-chip
                v-for="time in template.timeConfig.times"
                :key="time"
                size="small"
                class="mr-1"
              >
                {{ time }}
              </v-chip>
            </div>
          </div>

          <!-- 标签 -->
          <div v-if="template?.tags?.length" class="info-section">
            <h4 class="mb-2">标签</h4>
            <v-chip v-for="tag in template.tags" :key="tag" size="small" class="mr-1 mb-1">
              {{ tag }}
            </v-chip>
          </div>

          <!-- 统计信息 -->
          <div class="info-section">
            <h4 class="mb-2">统计信息</h4>
            <v-row dense>
              <v-col cols="6" sm="3">
                <div class="stat-item">
                  <div class="stat-value">{{ template?.analytics?.totalTriggers || 0 }}</div>
                  <div class="stat-label">总触发次数</div>
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="stat-item">
                  <div class="stat-value">{{ template?.analytics?.acknowledgedCount || 0 }}</div>
                  <div class="stat-label">已确认</div>
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="stat-item">
                  <div class="stat-value">{{ template?.analytics?.dismissedCount || 0 }}</div>
                  <div class="stat-label">已忽略</div>
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="stat-item">
                  <div class="stat-value">{{ effectivenessScore }}%</div>
                  <div class="stat-label">有效性</div>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- 最近实例 -->
          <div v-if="template?.instances?.length" class="info-section">
            <h4 class="mb-2">最近实例</h4>
            <div class="instance-list">
              <div v-for="instance in recentInstances" :key="instance.uuid" class="instance-item">
                <v-chip :color="instance.statusColor" size="small" class="mr-2">
                  {{ instance.statusText }}
                </v-chip>
                <span class="instance-time">
                  {{ format(instance.scheduledTime, 'yyyy-MM-dd HH:mm:ss') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <!-- 关闭按钮 -->
        <v-btn variant="text" size="small" color="grey" @click="close">
          <v-icon left size="16">mdi-close</v-icon>
          关闭
        </v-btn>

        <!-- 编辑按钮 -->
        <v-btn
          variant="text"
          size="small"
          :color="template?.color || 'primary'"
          @click="handleEdit"
        >
          <v-icon left size="16">mdi-pencil</v-icon>
          编辑
        </v-btn>

        <!-- 删除按钮 -->
        <v-btn variant="text" size="small" color="error" @click="handleDelete">
          <v-icon left size="16">mdi-delete</v-icon>
          删除
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ReminderTemplate } from '@dailyuse/domain-client';
import { ReminderContracts, ImportanceLevel } from '@dailyuse/contracts';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { useReminder } from '../../composables/useReminder';
import { format } from 'date-fns';

// 定义 emits
const emit = defineEmits<{
  close: [];
  'edit-template': [template: ReminderTemplate];
}>();

// 组件状态
const visible = ref(false);
const template = ref<ReminderTemplate | null>(null);
const enabled = ref(false);

// 服务
const snackbar = useSnackbar();
const {
  deleteTemplate: deleteTemplateAction,
  updateTemplate,
  toggleTemplateEnabled: toggleTemplateEnabledAction,
} = useReminder();

// 计算属性
const priorityColor = computed(() => {
  switch (template.value?.importanceLevel) {
    case ImportanceLevel.Trivial:
    case ImportanceLevel.Minor:
      return 'success';
    case ImportanceLevel.Moderate:
      return 'primary';
    case ImportanceLevel.Important:
      return 'warning';
    case ImportanceLevel.Vital:
      return 'error';
    default:
      return 'grey';
  }
});

const priorityText = computed(() => {
  switch (template.value?.importanceLevel) {
    case ImportanceLevel.Trivial:
      return '无关紧要';
    case ImportanceLevel.Minor:
      return '不太重要';
    case ImportanceLevel.Moderate:
      return '中等重要';
    case ImportanceLevel.Important:
      return '非常重要';
    case ImportanceLevel.Vital:
      return '极其重要';
    default:
      return '未知';
  }
});

const timeConfigText = computed(() => {
  switch (template.value?.timeConfig?.type) {
    case 'daily':
      return '每日';
    case 'weekly':
      return '每周';
    case 'monthly':
      return '每月';
    case 'custom':
      return '自定义';
    case 'absolute':
      return '绝对时间';
    case 'relative':
      return '相对时间';
    default:
      return '未知';
  }
});

const effectivenessScore = computed(() => {
  if (!template.value?.analytics) return 0;
  const total = template.value.analytics.totalTriggers || 0;
  const acknowledged = template.value.analytics.acknowledgedCount || 0;
  return total > 0 ? Math.round((acknowledged / total) * 100) : 0;
});

const recentInstances = computed(() => {
  if (!template.value?.instances) return [];
  return template.value.instances
    .slice(0, 5) // 只显示最近5个
    .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());
});

// 监听 enabled 变化，同步到模板
watch(
  () => template.value?.enabled,
  (newVal) => {
    enabled.value = newVal || false;
  },
  { immediate: true },
);

// 方法
const open = (templateData: ReminderTemplate) => {
  template.value = templateData;
  enabled.value = templateData.enabled;
  visible.value = true;
};

const close = () => {
  visible.value = false;
  template.value = null;
};

const toggleEnabled = async () => {
  if (!template.value) return;

  const previousValue = enabled.value;

  try {
    // 调用 toggle API 更新模板启用状态（修改 selfEnabled）
    const updatedTemplate = await toggleTemplateEnabledAction(template.value.uuid, enabled.value);

    // 更新本地模板数据
    if (updatedTemplate) {
      template.value = updatedTemplate;
      enabled.value = template.value.enabled;
    }

    snackbar.showSuccess(`提醒模板已${enabled.value ? '启用' : '禁用'}`);
  } catch (error) {
    // 回滚状态
    enabled.value = previousValue;
    snackbar.showError('操作失败：' + (error instanceof Error ? error.message : '未知错误'));
  }
};

// 编辑模板
const handleEdit = () => {
  if (!template.value) return;
  // TODO: 打开编辑对话框 - 需要实现 TemplateEditDialog 或通过 emit 通知父组件
  emit('edit-template', template.value);
  close();
};

// 删除模板
const handleDelete = async () => {
  if (!template.value) return;

  const confirmMessage = `确定要删除提醒模板 "${template.value.name}" 吗？\n\n此操作将同时删除该模板下的所有提醒实例，且无法撤销。`;

  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    await deleteTemplateAction(template.value.uuid);
    snackbar.showSuccess('提醒模板已删除');
    close();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    snackbar.showError(`删除失败：${errorMessage}`);
  }
};

// 暴露方法给父组件
defineExpose({
  open,
  close,
});
</script>

<style scoped>
.template-info {
  max-height: 500px;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.info-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.info-item {
  margin-bottom: 8px;
  line-height: 1.5;
}

.stat-item {
  text-align: center;
  padding: 8px;
}

.stat-value {
  font-size: 1.5em;
  font-weight: bold;
  color: var(--v-primary-base);
}

.stat-label {
  font-size: 0.875em;
  color: rgba(0, 0, 0, 0.6);
}

.instance-list {
  max-height: 200px;
  overflow-y: auto;
}

.instance-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.instance-time {
  font-size: 0.875em;
  color: rgba(0, 0, 0, 0.6);
}
</style>
