<!--
  Widget Settings Panel
  Widget 设置面板
-->
<template>
  <v-dialog v-model="dialogOpen" max-width="900" persistent scrollable>
    <v-card class="settings-panel">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center">
          <v-icon color="primary" class="mr-3">mdi-cog</v-icon>
          <span class="text-h6">Widget 设置</span>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="handleCancel" />
      </v-card-title>

      <v-divider />

      <!-- Body -->
      <v-card-text class="settings-body pa-6" style="max-height: 60vh;">
        <!-- Widget 列表 -->
        <div v-if="sortedWidgets.length > 0" class="widget-list">
          <v-card
            v-for="widget in sortedWidgets"
            :key="widget.id"
            class="widget-item mb-4"
            variant="outlined"
          >
            <!-- Widget Header -->
            <v-card-text class="pb-0">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center flex-grow-1">
                  <v-icon class="drag-handle mr-3" size="small" color="grey">mdi-drag</v-icon>
                  <v-icon :icon="getVuetifyIcon(widget.icon || '')" color="primary" class="mr-3" />
                  <div class="flex-grow-1">
                    <div class="text-subtitle-1 font-weight-medium">{{ widget.name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ widget.description }}</div>
                  </div>
                </div>
                <v-switch
                  :model-value="localConfig[widget.id]?.visible ?? widget.defaultVisible"
                  @update:model-value="widget.id && toggleVisibility(widget.id, $event)"
                  color="primary"
                  hide-details
                  density="compact"
                />
              </div>
            </v-card-text>

            <!-- Widget Settings -->
            <v-card-text v-if="localConfig[widget.id]?.visible ?? widget.defaultVisible" class="pt-2">
              <v-divider class="mb-4" />
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <span class="text-body-2 mr-3">尺寸:</span>
                  <v-btn-toggle
                    :model-value="localConfig[widget.id]?.size ?? widget.defaultSize"
                    @update:model-value="widget.id && changeSize(widget.id, $event)"
                    mandatory
                    density="compact"
                    color="primary"
                  >
                    <v-btn
                      v-for="size in widgetSizes"
                      :key="size.value"
                      :value="size.value"
                      size="small"
                    >
                      {{ size.label }}
                    </v-btn>
                  </v-btn-toggle>
                </div>
                <v-chip size="small" variant="outlined">
                  顺序: {{ localConfig[widget.id]?.order ?? widget.defaultOrder }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- Empty State -->
        <v-empty-state
          v-else
          icon="mdi-widgets-outline"
          title="暂无可用的 Widget"
          text="请等待模块加载完成"
        />
      </v-card-text>

      <v-divider />

      <!-- Footer -->
      <v-card-actions class="pa-4 justify-space-between">
        <v-btn
          variant="text"
          prepend-icon="mdi-refresh"
          @click="handleReset"
          :disabled="isSaving"
        >
          重置默认
        </v-btn>
        <div class="d-flex gap-2">
          <v-btn variant="text" @click="handleCancel" :disabled="isSaving">取消</v-btn>
          <v-btn color="primary" @click="handleSave" :loading="isSaving">保存</v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDashboardConfigStore } from '@/modules/dashboard/stores/dashboardConfigStore';
import { widgetRegistry } from '@/modules/dashboard/infrastructure/WidgetRegistry';
import { WidgetType, WidgetSize } from '@dailyuse/contracts/dashboard';
import type { WidgetConfigDTO, DashboardConfigClientDTO } from '@dailyuse/contracts/dashboard';

interface Props {
  isOpen: boolean;
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void;
  (e: 'saved'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const configStore = useDashboardConfigStore();
const isSaving = ref(false);
const dialogOpen = ref(false);
const localConfig = ref<Record<string, WidgetConfigDTO>>({});

const widgetSizes = [
  { value: WidgetSize.SMALL, label: '小' },
  { value: WidgetSize.MEDIUM, label: '中' },
  { value: WidgetSize.LARGE, label: '大' },
];

const sortedWidgets = computed(() => {
  const widgets = widgetRegistry.getAllWidgets();
  console.log('[WidgetSettings] All registered widgets:', widgets.length, widgets);
  return widgets.sort((a, b) => {
    const orderA = localConfig.value[a.id]?.order ?? a.defaultOrder;
    const orderB = localConfig.value[b.id]?.order ?? b.defaultOrder;
    return orderA - orderB;
  });
});

const getVuetifyIcon = (icon: string): string => {
  const iconMap: Record<string, string> = {
    'i-heroicons-flag': 'mdi-flag',
    'i-heroicons-calendar': 'mdi-calendar',
    'i-heroicons-check-circle': 'mdi-check-circle',
    'i-heroicons-bell': 'mdi-bell',
    'i-heroicons-clock': 'mdi-clock',
  };
  return iconMap[icon] || 'mdi-widgets';
};

const waitForWidgetRegistration = async (maxWaitTime = 2000): Promise<void> => {
  const startTime = Date.now();
  const checkInterval = 100;

  while (widgetRegistry.count === 0) {
    if (Date.now() - startTime > maxWaitTime) {
      console.warn('[WidgetSettings] Widget registration timeout');
      break;
    }
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
};

const initializeLocalConfig = async () => {
  console.log('[WidgetSettings] Initializing local config...');
  
  // 等待 widget 注册
  await waitForWidgetRegistration();
  
  const allWidgets = widgetRegistry.getAllWidgets();
  console.log('[WidgetSettings] Found widgets in registry:', allWidgets.length);
  
  const newConfig: Record<string, WidgetConfigDTO> = {};
  allWidgets.forEach((widget) => {
    const storeConfig = configStore.getWidgetConfig(widget.id);
    newConfig[widget.id] = storeConfig
      ? { ...storeConfig }
      : {
          visible: widget.defaultVisible,
          order: widget.defaultOrder,
          size: widget.defaultSize,
        };
  });
  localConfig.value = newConfig;
  console.log('[WidgetSettings] Local config initialized:', newConfig);
};

const toggleVisibility = (widgetId: string, visible: boolean | null) => {
  console.log(`[WidgetSettings] Toggling visibility for ${widgetId}:`, visible);
  if (visible === null) return;
  if (!localConfig.value[widgetId]) {
    const widget = widgetRegistry.getWidget(widgetId);
    if (widget) {
      localConfig.value[widgetId] = {
        visible: widget.defaultVisible,
        order: widget.defaultOrder,
        size: widget.defaultSize,
      };
    }
  }
  localConfig.value[widgetId].visible = visible;
};

const changeSize = (widgetId: string, size: WidgetSize | string | undefined) => {
  console.log(`[WidgetSettings] Changing size for ${widgetId}:`, size);
  if (size === undefined || typeof size !== 'string') return;
  if (!localConfig.value[widgetId]) {
    const widget = widgetRegistry.getWidget(widgetId);
    if (widget) {
      localConfig.value[widgetId] = {
        visible: widget.defaultVisible,
        order: widget.defaultOrder,
        size: widget.defaultSize,
      };
    }
  }
  localConfig.value[widgetId].size = size as WidgetSize;
};

const handleReset = async () => {
  if (!confirm('确定要重置为默认配置吗？')) return;
  try {
    isSaving.value = true;
    console.log('[WidgetSettings] Resetting to defaults...');
    await configStore.resetConfig();
    initializeLocalConfig();
    console.log('[WidgetSettings] Reset successfully');
  } catch (error) {
    console.error('[WidgetSettings] Failed to reset:', error);
    alert('重置失败：' + (error instanceof Error ? error.message : '未知错误'));
  } finally {
    isSaving.value = false;
  }
};

const handleSave = async () => {
  try {
    isSaving.value = true;
    console.log('[WidgetSettings] Saving configuration...', localConfig.value);
    const updates: Partial<Record<string, Partial<WidgetConfigDTO>>> = {};
    Object.entries(localConfig.value).forEach(([widgetId, config]) => {
      updates[widgetId] = config;
    });
    await configStore.updateConfig(updates);
    console.log('[WidgetSettings] Configuration saved successfully');
    emit('saved');
    dialogOpen.value = false;
  } catch (error) {
    console.error('[WidgetSettings] Failed to save:', error);
    alert('保存失败：' + (error instanceof Error ? error.message : '未知错误'));
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  if (hasChanges() && !confirm('有未保存的更改，确定要取消吗？')) return;
  dialogOpen.value = false;
};

const hasChanges = (): boolean => {
  return Object.entries(localConfig.value).some(([widgetId, config]) => {
    const storeConfig = configStore.getWidgetConfig(widgetId);
    if (!storeConfig) return true;
    return (
      config.visible !== storeConfig.visible ||
      config.size !== storeConfig.size ||
      config.order !== storeConfig.order
    );
  });
};

watch(
  () => props.isOpen,
  async (isOpen) => {
    dialogOpen.value = isOpen;
    if (isOpen) {
      console.log('[WidgetSettings] Panel opened, initializing local config...');
      await initializeLocalConfig();
    }
  },
  { immediate: true }
);

watch(dialogOpen, (newValue) => {
  if (!newValue && props.isOpen) {
    emit('update:isOpen', false);
  }
});
</script>

<style scoped>
.settings-body {
  overflow-y: auto;
}

.drag-handle {
  cursor: move;
}

.widget-item {
  transition: all 0.2s ease;
}

.widget-item:hover {
  box-shadow: 0 2px 8px rgba(var(--v-theme-on-surface), 0.1);
}
</style>

