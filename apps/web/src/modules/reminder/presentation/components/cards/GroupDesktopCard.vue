<template>
  <v-dialog v-model="visible" max-width="900px" fullscreen transition="dialog-bottom-transition">
    <v-card v-if="group">
      <!-- 顶部应用栏 -->
      <v-app-bar color="primary" dark flat>
        <v-btn icon @click="close">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-toolbar-title>
          <v-icon class="mr-2">mdi-folder</v-icon>
          {{ group.name }}
        </v-toolbar-title>
        <v-spacer />
        <!-- 启用/禁用开关 -->
        <v-switch
          v-model="localEnabled"
          :loading="isTogglingStatus"
          color="white"
          hide-details
          density="compact"
          @update:model-value="handleToggleStatus"
        >
          <template #label>
            <span class="text-white text-caption">{{ localEnabled ? '已启用' : '已禁用' }}</span>
          </template>
        </v-switch>
        <v-btn icon @click="handleEditGroup">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </v-app-bar>

      <!-- 分组信息摘要 -->
      <v-card class="ma-4" variant="tonal">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="8">
              <div class="text-h6 mb-2">{{ group.name }}</div>
              <div class="text-body-2 text-grey-darken-1">
                {{ group.description || '暂无描述' }}
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <v-row>
                <v-col cols="6">
                  <div class="text-center">
                    <div class="text-h5 text-primary">{{ templates.length }}</div>
                    <div class="text-caption">模板数量</div>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-center">
                    <div class="text-h5 text-success">{{ enabledCount }}</div>
                    <div class="text-caption">已启用</div>
                  </div>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 工具栏 -->
      <v-toolbar flat color="transparent">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          label="搜索模板"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="mr-4"
          style="max-width: 300px;"
        />
        <v-spacer />
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="handleCreateTemplate"
        >
          添加模板
        </v-btn>
      </v-toolbar>

      <!-- 模板网格 -->
      <v-card-text>
        <!-- 空状态 -->
        <div v-if="filteredTemplates.length === 0" class="text-center py-12">
          <v-icon size="64" color="grey-lighten-2">mdi-folder-open</v-icon>
          <div class="text-h6 text-grey mt-4">
            {{ templates.length === 0 ? '该分组暂无模板' : '没有匹配的模板' }}
          </div>
          <v-btn
            v-if="templates.length === 0"
            color="primary"
            class="mt-4"
            prepend-icon="mdi-plus"
            @click="handleCreateTemplate"
          >
            创建第一个模板
          </v-btn>
        </div>

        <!-- 模板网格布局 -->
        <div v-else class="templates-grid">
          <v-card
            v-for="template in filteredTemplates"
            :key="template.uuid"
            class="template-card"
            :class="{ disabled: !template.effectiveEnabled }"
            hover
            @click="handleTemplateClick(template)"
            @contextmenu.prevent="handleTemplateContextMenu(template, $event)"
          >
            <v-card-text class="d-flex flex-column align-center pa-4">
              <!-- 图标 -->
              <v-avatar
                :color="template.effectiveEnabled ? 'primary' : 'grey'"
                size="56"
                class="mb-3"
              >
                <v-icon size="32" color="white">mdi-bell</v-icon>
              </v-avatar>

              <!-- 标题 -->
              <div class="text-subtitle-1 text-center mb-2 template-title">
                {{ template.title }}
              </div>

              <!-- 触发器 -->
              <v-chip size="small" variant="outlined" class="mb-2">
                {{ template.triggerText }}
              </v-chip>

              <!-- 状态 -->
              <v-chip
                :color="template.effectiveEnabled ? 'success' : 'grey'"
                size="small"
                variant="flat"
              >
                {{ template.effectiveEnabled ? '运行中' : '已停用' }}
              </v-chip>
            </v-card-text>

            <!-- 快捷操作 -->
            <v-card-actions class="template-actions">
              <v-btn
                icon
                size="small"
                variant="text"
                @click.stop="handleEditTemplate(template)"
              >
                <v-icon size="20">mdi-pencil</v-icon>
              </v-btn>
              <v-spacer />
              <v-btn
                icon
                size="small"
                variant="text"
                :color="template.effectiveEnabled ? 'grey' : 'success'"
                @click.stop="handleToggleTemplate(template)"
              >
                <v-icon size="20">
                  {{ template.effectiveEnabled ? 'mdi-pause' : 'mdi-play' }}
                </v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>
      </v-card-text>

      <!-- 右键菜单 -->
      <v-menu
        v-model="contextMenu.show"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        location="bottom"
        absolute
      >
        <v-list density="compact">
          <v-list-item
            v-for="item in contextMenu.items"
            :key="item.text"
            @click="item.action"
          >
            <template #prepend>
              <v-icon size="small">{{ item.icon }}</v-icon>
            </template>
            <v-list-item-title>{{ item.text }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- 模板详情卡片 -->
      <TemplateDesktopCard
        ref="templateCardRef"
        @edit-template="handleEditTemplate"
        @status-changed="handleTemplateStatusChanged"
      />
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ReminderContracts } from '@dailyuse/contracts';
import { useReminder } from '../../composables/useReminder';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import TemplateDesktopCard from './TemplateDesktopCard.vue';

type ReminderTemplateGroup = ReminderContracts.ReminderGroupClientDTO;
type ReminderTemplate = ReminderContracts.ReminderTemplateClientDTO;

// Composables
const { reminderTemplates, toggleTemplateStatus, refreshAll } = useReminder();
const snackbar = useSnackbar();

// Emits
const emit = defineEmits<{
  'edit-group': [group: ReminderTemplateGroup];
  'edit-template': [template: ReminderTemplate];
  'create-template': [groupUuid: string];
  'status-changed': [group: ReminderTemplateGroup, enabled: boolean];
}>();

// 响应式状态
const visible = ref(false);
const group = ref<ReminderTemplateGroup | null>(null);
const localEnabled = ref(false);
const isTogglingStatus = ref(false);
const searchQuery = ref('');
const templateCardRef = ref<InstanceType<typeof TemplateDesktopCard>>();

// 右键菜单状态
const contextMenu = ref<{
  show: boolean;
  x: number;
  y: number;
  items: Array<{ text: string; icon: string; action: () => void }>;
}>({
  show: false,
  x: 0,
  y: 0,
  items: [],
});

// 计算属性

/**
 * 该分组下的所有模板
 */
const templates = computed(() => {
  if (!group.value) return [];
  return reminderTemplates.value.filter(t => t.groupUuid === group.value!.uuid);
});

/**
 * 过滤后的模板
 */
const filteredTemplates = computed(() => {
  if (!searchQuery.value) return templates.value;
  const query = searchQuery.value.toLowerCase();
  return templates.value.filter(t =>
    t.title.toLowerCase().includes(query) ||
    t.description?.toLowerCase().includes(query) ||
    t.triggerText.toLowerCase().includes(query)
  );
});

/**
 * 已启用的模板数量
 */
const enabledCount = computed(() => {
  return templates.value.filter(t => t.effectiveEnabled).length;
});

// 监听 group 变化，同步 localEnabled
watch(() => group.value?.enabled, (newValue) => {
  if (newValue !== undefined) {
    localEnabled.value = newValue;
  }
}, { immediate: true });

// ===== 方法 =====

/**
 * 打开对话框
 */
const open = async (groupData: ReminderTemplateGroup) => {
  group.value = groupData;
  localEnabled.value = groupData.enabled;
  visible.value = true;
  // 刷新模板列表以确保数据最新
  await refreshAll();
};

/**
 * 关闭对话框
 */
const close = () => {
  visible.value = false;
  searchQuery.value = '';
  setTimeout(() => {
    group.value = null;
  }, 300);
};

/**
 * 处理分组状态切换
 */
const handleToggleStatus = async (enabled: boolean | null) => {
  if (!group.value || enabled === null) return;

  isTogglingStatus.value = true;
  try {
    // TODO: 实现分组启用/禁用 API
    // await toggleGroupStatus(group.value.uuid, enabled);
    console.log('切换分组状态:', group.value.uuid, enabled);
    group.value = { ...group.value, enabled };
    emit('status-changed', group.value, enabled);
    snackbar.showSuccess(enabled ? '已启用分组' : '已禁用分组');
  } catch (error) {
    console.error('切换分组状态失败:', error);
    localEnabled.value = !enabled; // 回滚
    snackbar.showError('切换状态失败');
  } finally {
    isTogglingStatus.value = false;
  }
};

/**
 * 处理编辑分组
 */
const handleEditGroup = () => {
  if (!group.value) return;
  emit('edit-group', group.value);
  close();
};

/**
 * 处理创建模板
 */
const handleCreateTemplate = () => {
  if (!group.value) return;
  emit('create-template', group.value.uuid);
};

/**
 * 处理模板点击
 */
const handleTemplateClick = (template: ReminderTemplate) => {
  templateCardRef.value?.open(template);
};

/**
 * 处理编辑模板
 */
const handleEditTemplate = (template: ReminderTemplate) => {
  emit('edit-template', template);
};

/**
 * 处理切换模板状态
 */
const handleToggleTemplate = async (template: ReminderTemplate) => {
  try {
    await toggleTemplateStatus(template.uuid, !template.effectiveEnabled);
    await refreshAll();
    snackbar.showSuccess(template.effectiveEnabled ? '已禁用模板' : '已启用模板');
  } catch (error) {
    console.error('切换模板状态失败:', error);
    snackbar.showError('操作失败');
  }
};

/**
 * 处理模板状态变更（来自 TemplateDesktopCard）
 */
const handleTemplateStatusChanged = async () => {
  await refreshAll();
};

/**
 * 处理模板右键菜单
 */
const handleTemplateContextMenu = (template: ReminderTemplate, event: MouseEvent) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    items: [
      {
        text: '查看详情',
        icon: 'mdi-eye',
        action: () => {
          handleTemplateClick(template);
          contextMenu.value.show = false;
        },
      },
      {
        text: '编辑',
        icon: 'mdi-pencil',
        action: () => {
          handleEditTemplate(template);
          contextMenu.value.show = false;
        },
      },
      {
        text: template.effectiveEnabled ? '禁用' : '启用',
        icon: template.effectiveEnabled ? 'mdi-pause' : 'mdi-play',
        action: () => {
          handleToggleTemplate(template);
          contextMenu.value.show = false;
        },
      },
      {
        text: '移出分组',
        icon: 'mdi-folder-remove',
        action: () => {
          // TODO: 实现移出分组功能
          console.log('移出分组:', template.uuid);
          contextMenu.value.show = false;
        },
      },
      {
        text: '删除',
        icon: 'mdi-delete',
        action: () => {
          // TODO: 实现删除功能
          console.log('删除模板:', template.uuid);
          contextMenu.value.show = false;
        },
      },
    ],
  };
};

defineExpose({
  open,
  close,
});
</script>

<style scoped>
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.template-card {
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
}

.template-card.disabled {
  opacity: 0.6;
}

.template-title {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  height: 2.8em;
}

.template-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.template-card:hover .template-actions {
  opacity: 1;
}
</style>
