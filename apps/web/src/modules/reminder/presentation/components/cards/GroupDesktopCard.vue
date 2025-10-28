<template>
  <v-dialog v-model="visible" max-width="1200px" fullscreen>
    <v-card>
      <v-toolbar>
        <v-toolbar-title>
          <div class="d-flex align-center">
            <v-icon :color="group?.color || 'primary'" class="mr-2">
              {{ group?.icon || 'mdi-folder' }}
            </v-icon>
            <span>{{ group?.name || '模板组' }}</span>
          </div>
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <!-- 组信息 -->
        <v-card v-if="group" class="mb-4" variant="outlined">
          <v-card-text>
            <div class="d-flex justify-space-between align-start">
              <div>
                <h3 class="mb-2">{{ group.name }}</h3>
                <p v-if="group.description" class="text-body-2 mb-2">{{ group.description }}</p>
                <div class="d-flex align-center">
                  <v-chip size="small" class="mr-2">
                    {{ group.templates?.length || 0 }} 个模板
                  </v-chip>
                  <v-chip v-if="group.enableMode" size="small" class="mr-2">
                    {{ enableModeText }}
                  </v-chip>
                </div>
              </div>
              <div class="text-right">
                <v-switch
                  v-model="groupEnabled"
                  :color="group.color || 'primary'"
                  label="启用组"
                  hide-details
                  @change="toggleGroupEnabled"
                />
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- 模板桌面 -->
        <div class="templates-desktop">
          <h4 class="mb-3">模板桌面</h4>
          <div class="desktop-area" @contextmenu.prevent="showDesktopContextMenu">
            <div
              v-for="template in templates"
              :key="template.uuid"
              class="template-item"
              @click="openTemplateCard(template)"
              @contextmenu.prevent="showTemplateContextMenu($event, template)"
            >
              <v-card
                :color="template.color || 'primary'"
                :class="{ 'template-disabled': !template.enabled }"
                elevation="2"
                hover
              >
                <v-card-text class="text-center pa-3">
                  <v-icon :color="template.enabled ? 'white' : 'grey'" size="32" class="mb-2">
                    {{ template.icon || 'mdi-bell' }}
                  </v-icon>
                  <div
                    class="template-name"
                    :class="{ 'text-white': template.enabled, 'text-grey': !template.enabled }"
                  >
                    {{ template.name }}
                  </div>
                  <v-chip v-if="!template.enabled" size="x-small" color="grey" class="mt-1">
                    已禁用
                  </v-chip>
                </v-card-text>
              </v-card>
            </div>

            <!-- 空状态 -->
            <div v-if="!templates.length" class="empty-state">
              <v-icon size="64" color="grey-lighten-2">mdi-folder-open</v-icon>
              <p class="text-grey mt-2">该组中暂无模板</p>
              <v-btn color="primary" @click="createTemplate"> 创建第一个模板 </v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 右键菜单 -->
    <v-menu
      v-model="contextMenu.show"
      :position-x="contextMenu.x"
      :position-y="contextMenu.y"
      absolute
      offset-y
    >
      <v-list>
        <v-list-item v-for="item in contextMenu.items" :key="item.text" @click="item.action">
          <v-list-item-title>
            <v-icon class="mr-2">{{ item.icon }}</v-icon>
            {{ item.text }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- TemplateCard 组件 -->
    <TemplateCard ref="templateCardRef" />
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ReminderTemplateGroup, ReminderTemplate } from '@dailyuse/domain-client';
import { ReminderContracts, ImportanceLevel } from '@dailyuse/contracts';
import { reminderService } from '../../../application/services/ReminderWebApplicationService';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import TemplateCard from './TemplateDesktopCard.vue';

// 组件状态
const visible = ref(false);
const group = ref<ReminderTemplateGroup | null>(null);
const groupEnabled = ref(false);
const templateCardRef = ref<InstanceType<typeof TemplateCard>>();

// 右键菜单
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  items: [] as Array<{ text: string; icon: string; action: () => void }>,
});

// 服务
const snackbar = useSnackbar();

// 计算属性
const templates = computed(() => {
  return group.value?.templates || [];
});

const enableModeText = computed(() => {
  switch (group.value?.enableMode) {
    case 'group':
      return '按组启用';
    case 'individual':
      return '独立启用';
    default:
      return '未知模式';
  }
});

// 监听组启用状态
watch(
  () => group.value?.enabled,
  (newVal) => {
    groupEnabled.value = newVal || false;
  },
  { immediate: true },
);

// 方法
const open = (groupData: ReminderTemplateGroup) => {
  group.value = groupData;
  groupEnabled.value = groupData.enabled;
  visible.value = true;
};

const close = () => {
  visible.value = false;
  group.value = null;
};

const toggleGroupEnabled = async () => {
  if (!group.value) return;

  const previousValue = groupEnabled.value;

  try {
    // 调用 API 更新分组启用状态
    await reminderService.toggleReminderTemplateGroupEnabled(group.value.uuid, groupEnabled.value);
    snackbar.showSuccess(`模板组已${groupEnabled.value ? '启用' : '禁用'}`);

    // 刷新分组数据以获取最新状态（包括子模板的状态更新）
    const refreshedGroup = await reminderService.getReminderTemplateGroup(group.value.uuid);
    if (refreshedGroup) {
      group.value = refreshedGroup;
    }
  } catch (error) {
    // 回滚状态
    groupEnabled.value = previousValue;
    snackbar.showError('操作失败：' + (error instanceof Error ? error.message : '未知错误'));
  }
};

const openTemplateCard = (template: ReminderTemplate) => {
  templateCardRef.value?.open(template);
};

// 右键菜单相关
const showDesktopContextMenu = (event: MouseEvent) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    items: [
      {
        text: '创建模板',
        icon: 'mdi-plus',
        action: createTemplate,
      },
      {
        text: '刷新',
        icon: 'mdi-refresh',
        action: refreshTemplates,
      },
    ],
  };
};

const showTemplateContextMenu = (event: MouseEvent, template: ReminderTemplate) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    items: [
      {
        text: '查看详情',
        icon: 'mdi-eye',
        action: () => openTemplateCard(template),
      },
      {
        text: '编辑',
        icon: 'mdi-pencil',
        action: () => editTemplate(template),
      },
      {
        text: '复制',
        icon: 'mdi-content-copy',
        action: () => duplicateTemplate(template),
      },
      {
        text: template.enabled ? '禁用' : '启用',
        icon: template.enabled ? 'mdi-pause' : 'mdi-play',
        action: () => toggleTemplateEnabled(template),
      },
      {
        text: '删除',
        icon: 'mdi-delete',
        action: () => deleteTemplate(template),
      },
    ],
  };
};

// 模板操作方法
const createTemplate = async () => {
  if (!group.value) return;

  try {
    const templateResponse = await reminderService.createReminderTemplate({
      uuid: crypto.randomUUID(), // 前端生成 UUID
      name: '新建模板',
      description: '',
      message: '提醒消息',
      groupUuid: group.value.uuid,
      timeConfig: {
        type: ReminderContracts.ReminderTimeConfigType.DAILY,
        times: ['09:00'],
      },
      importanceLevel: ImportanceLevel.Moderate,
      category: '默认',
      tags: [],
    });

    // 转换为客户端实体
    const newTemplate = ReminderTemplate.fromApiResponse(templateResponse);

    // 添加到当前组
    if (group.value.templates) {
      group.value.templates.push(newTemplate);
    } else {
      group.value.templates = [newTemplate];
    }

    snackbar.showSuccess('模板创建成功');
  } catch (error) {
    snackbar.showError('创建失败：' + (error instanceof Error ? error.message : '未知错误'));
  }
};

const editTemplate = (template: ReminderTemplate) => {
  snackbar.showInfo('编辑功能待实现');
};

const duplicateTemplate = async (template: ReminderTemplate) => {
  if (!group.value) return;

  try {
    // 创建一个复制的模板，转换timeConfig类型
    let timeConfig: any;

    if (
      template.timeConfig.type === ReminderContracts.ReminderTimeConfigType.DAILY ||
      template.timeConfig.type === ReminderContracts.ReminderTimeConfigType.WEEKLY ||
      template.timeConfig.type === ReminderContracts.ReminderTimeConfigType.MONTHLY ||
      template.timeConfig.type === ReminderContracts.ReminderTimeConfigType.CUSTOM
    ) {
      timeConfig = template.timeConfig;
    } else {
      // 对于不支持的类型，使用默认的daily配置
      timeConfig = {
        type: ReminderContracts.ReminderTimeConfigType.DAILY,
        times: ['09:00'],
      };
    }

    const duplicatedTemplateResponse = await reminderService.createReminderTemplate({
      uuid: crypto.randomUUID(), // 前端生成 UUID
      name: `${template.name} (副本)`,
      description: template.description || '',
      message: template.message,
      groupUuid: group.value.uuid,
      timeConfig,
      priority: template.priority,
      category: template.category,
      tags: [...template.tags],
    });

    // 转换为客户端实体
    const duplicatedTemplate = ReminderTemplate.fromApiResponse(duplicatedTemplateResponse);

    // 添加到当前组
    if (group.value.templates) {
      group.value.templates.push(duplicatedTemplate);
    } else {
      group.value.templates = [duplicatedTemplate];
    }

    snackbar.showSuccess('模板复制成功');
  } catch (error) {
    snackbar.showError('复制失败：' + (error instanceof Error ? error.message : '未知错误'));
  }
};

const toggleTemplateEnabled = async (template: ReminderTemplate) => {
  const newEnabled = !template.enabled;

  try {
    // 调用 toggle API 更新模板启用状态
    await reminderService.toggleTemplateEnabled(template.uuid, newEnabled);
    snackbar.showSuccess(`模板已${newEnabled ? '启用' : '禁用'}`);

    // 刷新分组数据以获取最新状态
    if (group.value) {
      const refreshedGroup = await reminderService.getReminderTemplateGroup(group.value.uuid);
      if (refreshedGroup) {
        group.value = refreshedGroup;
      }
    }
  } catch (error) {
    snackbar.showError('操作失败：' + (error instanceof Error ? error.message : '未知错误'));
  }
};

const deleteTemplate = async (template: ReminderTemplate) => {
  if (!confirm(`确定要删除模板"${template.name}"吗？`)) {
    return;
  }

  try {
    await reminderService.deleteReminderTemplate(template.uuid);

    // 从当前组中移除
    if (group.value?.templates) {
      const index = group.value.templates.findIndex((t) => t.uuid === template.uuid);
      if (index > -1) {
        group.value.templates.splice(index, 1);
      }
    }

    snackbar.showSuccess('模板删除成功');
  } catch (error) {
    snackbar.showError('删除失败：' + (error instanceof Error ? error.message : '未知错误'));
  }
};

const refreshTemplates = async () => {
  if (!group.value) return;

  try {
    const refreshedGroup = await reminderService.getReminderTemplateGroup(group.value.uuid);
    group.value = refreshedGroup;
    snackbar.showSuccess('刷新成功');
  } catch (error) {
    snackbar.showError('刷新失败：' + (error instanceof Error ? error.message : '未知错误'));
  }
};

// 暴露方法给父组件
defineExpose({
  open,
  close,
});
</script>

<style scoped>
.templates-desktop {
  min-height: 400px;
}

.desktop-area {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  min-height: 300px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  position: relative;
}

.template-item {
  width: 150px;
  height: 120px;
  cursor: pointer;
  transition: transform 0.2s;
}

.template-item:hover {
  transform: translateY(-2px);
}

.template-disabled {
  opacity: 0.6;
}

.template-name {
  font-size: 0.875rem;
  line-height: 1.2;
  word-break: break-word;
  max-height: 2.4em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}
</style>
