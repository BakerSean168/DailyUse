<!--
  Widget Settings Panel
  Widget 设置面板
  
  Sprint 3 - TASK-3.1.2: Widget Settings Panel
  
  Features:
  - Show/Hide Widget 切换
  - Widget Size 调整 (Small/Medium/Large)
  - Widget Order 调整 (拖拽排序)
  - Reset to Defaults
  - Save/Cancel 操作
  - 实时预览
-->
<template>
  <Teleport to="body">
    <Transition name="settings-panel">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <!-- 设置面板 Drawer -->
        <div
          class="settings-panel bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <!-- Header -->
          <header
            class="settings-header px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <div class="i-heroicons-cog-6-tooth w-6 h-6 text-primary-600 dark:text-primary-400" />
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Widget 设置</h2>
            </div>
            <button
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="handleCancel"
              title="关闭"
            >
              <div class="i-heroicons-x-mark w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </header>

          <!-- Body -->
          <div class="settings-body flex-1 overflow-y-auto px-6 py-4">
            <!-- Widget 列表 -->
            <div class="widget-list space-y-3">
              <div
                v-for="widget in sortedWidgets"
                :key="widget.id"
                class="widget-item bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <!-- Widget Header -->
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <!-- Drag Handle -->
                    <button
                      class="drag-handle cursor-move p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="拖拽排序"
                    >
                      <div class="i-heroicons-bars-3 w-5 h-5" />
                    </button>

                    <!-- Widget Icon & Name -->
                    <div :class="widget.icon" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    <div>
                      <h3 class="font-semibold text-gray-900 dark:text-white">
                        {{ widget.name }}
                      </h3>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ widget.description }}
                      </p>
                    </div>
                  </div>

                  <!-- Visibility Toggle -->
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      :checked="localConfig[widget.id]?.visible ?? widget.defaultVisible"
                      @change="toggleVisibility(widget.id, ($event.target as HTMLInputElement).checked)"
                      class="sr-only peer"
                    />
                    <div
                      class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"
                    />
                  </label>
                </div>

                <!-- Widget Settings (只在可见时显示) -->
                <div
                  v-if="localConfig[widget.id]?.visible ?? widget.defaultVisible"
                  class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                >
                  <div class="flex items-center justify-between">
                    <!-- Size Selector -->
                    <div class="flex items-center gap-2">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        尺寸:
                      </label>
                      <div class="flex gap-1">
                        <button
                          v-for="size in widgetSizes"
                          :key="size.value"
                          @click="changeSize(widget.id, size.value)"
                          :class="[
                            'px-3 py-1 rounded text-sm font-medium transition-colors',
                            (localConfig[widget.id]?.size ?? widget.defaultSize) === size.value
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600',
                          ]"
                          :title="size.label"
                        >
                          {{ size.label }}
                        </button>
                      </div>
                    </div>

                    <!-- Order Display -->
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      顺序: {{ localConfig[widget.id]?.order ?? widget.defaultOrder }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-if="sortedWidgets.length === 0"
              class="text-center py-12 text-gray-500 dark:text-gray-400"
            >
              <div class="i-heroicons-squares-plus w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无可用的 Widget</p>
            </div>
          </div>

          <!-- Footer -->
          <footer
            class="settings-footer px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between"
          >
            <button
              class="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              @click="handleReset"
              :disabled="isSaving"
            >
              <div class="i-heroicons-arrow-path w-4 h-4" />
              <span>重置默认</span>
            </button>

            <div class="flex gap-2">
              <button
                class="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                @click="handleCancel"
                :disabled="isSaving"
              >
                取消
              </button>
              <button
                class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="handleSave"
                :disabled="isSaving"
              >
                <div v-if="isSaving" class="i-heroicons-arrow-path w-4 h-4 animate-spin" />
                <span>{{ isSaving ? '保存中...' : '保存' }}</span>
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDashboardConfigStore } from '@/modules/dashboard/stores/dashboardConfigStore';
import { widgetRegistry } from '@/modules/dashboard/infrastructure/WidgetRegistry';
import { DashboardContracts } from '@dailyuse/contracts';

// ===== Props & Emits =====
interface Props {
  isOpen: boolean;
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void;
  (e: 'saved'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// ===== Store & Data =====
const configStore = useDashboardConfigStore();
const isSaving = ref(false);

// 本地配置（用于实时预览，保存前不影响全局）
const localConfig = ref<Record<string, DashboardContracts.WidgetConfigDTO>>({});

// Widget 尺寸选项
const widgetSizes = [
  { value: DashboardContracts.WidgetSize.SMALL, label: '小' },
  { value: DashboardContracts.WidgetSize.MEDIUM, label: '中' },
  { value: DashboardContracts.WidgetSize.LARGE, label: '大' },
];

// ===== Computed Properties =====

/**
 * 所有已注册的 Widgets（按 order 排序）
 */
const sortedWidgets = computed(() => {
  return widgetRegistry.getAllWidgets().sort((a, b) => {
    const orderA = localConfig.value[a.id]?.order ?? a.defaultOrder;
    const orderB = localConfig.value[b.id]?.order ?? b.defaultOrder;
    return orderA - orderB;
  });
});

// ===== Methods =====

/**
 * 初始化本地配置（从 Store 加载）
 */
const initializeLocalConfig = () => {
  const allWidgets = widgetRegistry.getAllWidgets();
  const newConfig: Record<string, DashboardContracts.WidgetConfigDTO> = {};

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
};

/**
 * 切换 Widget 可见性
 */
const toggleVisibility = (widgetId: string, visible: boolean) => {
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

/**
 * 修改 Widget 尺寸
 */
const changeSize = (widgetId: string, size: DashboardContracts.WidgetSize) => {
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
  localConfig.value[widgetId].size = size;
};

/**
 * 重置为默认配置
 */
const handleReset = async () => {
  if (!confirm('确定要重置为默认配置吗？')) {
    return;
  }

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

/**
 * 保存配置
 */
const handleSave = async () => {
  try {
    isSaving.value = true;
    console.log('[WidgetSettings] Saving configuration...');

    // 构建更新数据
    const updates: Partial<Record<string, Partial<DashboardContracts.WidgetConfigDTO>>> = {};
    Object.entries(localConfig.value).forEach(([widgetId, config]) => {
      updates[widgetId] = config;
    });

    // 批量更新到后端
    await configStore.updateConfig(updates);

    console.log('[WidgetSettings] Configuration saved successfully');
    emit('saved');
    emit('update:isOpen', false);
  } catch (error) {
    console.error('[WidgetSettings] Failed to save:', error);
    alert('保存失败：' + (error instanceof Error ? error.message : '未知错误'));
  } finally {
    isSaving.value = false;
  }
};

/**
 * 取消操作
 */
const handleCancel = () => {
  if (hasChanges()) {
    if (!confirm('有未保存的更改，确定要取消吗？')) {
      return;
    }
  }
  emit('update:isOpen', false);
};

/**
 * 检查是否有未保存的更改
 */
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

// ===== Watchers =====

/**
 * 监听面板打开状态，初始化本地配置
 */
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      console.log('[WidgetSettings] Panel opened, initializing local config...');
      initializeLocalConfig();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* 设置面板过渡动画 */
.settings-panel-enter-active,
.settings-panel-leave-active {
  transition: all 0.3s ease;
}

.settings-panel-enter-from,
.settings-panel-leave-to {
  opacity: 0;
}

.settings-panel-enter-from .settings-panel,
.settings-panel-leave-to .settings-panel {
  transform: scale(0.95) translateY(20px);
}

/* 滚动条样式 */
.settings-body::-webkit-scrollbar {
  width: 8px;
}

.settings-body::-webkit-scrollbar-track {
  background: transparent;
}

.settings-body::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.settings-body::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.dark .settings-body::-webkit-scrollbar-thumb {
  background: #4a5568;
}

.dark .settings-body::-webkit-scrollbar-thumb:hover {
  background: #718096;
}

/* Toggle Switch 动画 */
input[type='checkbox'] {
  transition: all 0.3s ease;
}
</style>
