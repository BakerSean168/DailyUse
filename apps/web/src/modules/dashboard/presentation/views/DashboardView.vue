<!--
  Dashboard View - Widget System
  仪表盘页面 - Widget 系统集成
  
  Sprint 3 - TASK-3.1: Dashboard Page Layout
  
  Features:
  - 动态 Widget 渲染
  - 响应式网格布局
  - Widget 配置集成
  - 加载状态管理
  - 错误处理
-->
<template>
  <div class="dashboard-page min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
    <!-- Widget 设置面板 -->
    <WidgetSettingsPanel v-model:isOpen="isSettingsPanelOpen" @saved="handleSettingsSaved" />

    <!-- 页面标题与操作栏 -->
    <header class="dashboard-header mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="i-heroicons-squares-2x2 w-8 h-8 text-primary-600 dark:text-primary-400" />
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">仪表盘</h1>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center gap-2">
        <button v-if="!isLoading && !hasError"
          class="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          @click="refreshWidgets" :disabled="isRefreshing">
          <div class="i-heroicons-arrow-path w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
          <span class="hidden sm:inline">刷新</span>
        </button>

        <button
          class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors flex items-center gap-2"
          @click="openSettings">
          <div class="i-heroicons-cog-6-tooth w-4 h-4" />
          <span class="hidden sm:inline">设置</span>
        </button>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-skeleton">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i"
          class="skeleton-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error-state bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
      <div class="i-heroicons-exclamation-triangle w-16 h-16 mx-auto mb-4 text-red-500" />
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">加载失败</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">{{ errorMessage }}</p>
      <button class="px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        @click="retryLoad">
        重试
      </button>
    </div>

    <!-- Widget 网格布局 -->
    <div v-else-if="visibleWidgets.length > 0" class="dashboard-grid">
      <!-- 动态渲染 Widgets -->
      <TransitionGroup name="widget-grid" tag="div" class="grid gap-4 widget-grid-container">
        <div v-for="widget in visibleWidgets" :key="widget.id" :class="getWidgetGridClasses(widget.config.size)"
          class="widget-container">
          <component :is="widget.component" :size="widget.config.size"
            :class="getWidgetSizeClasses(widget.config.size)" />
        </div>
      </TransitionGroup>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
      <div class="i-heroicons-squares-plus w-16 h-16 mx-auto mb-4 text-gray-400" />
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">暂无 Widget</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">点击右上角设置按钮添加 Widget</p>
      <button class="px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        @click="openSettings">
        打开设置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useDashboardConfigStore } from '@/modules/dashboard/stores/dashboardConfigStore';
import { widgetRegistry } from '@/modules/dashboard/infrastructure/WidgetRegistry';
import { registerDashboardWidgets } from '@/modules/dashboard/infrastructure/registerWidgets';
import { DashboardContracts } from '@dailyuse/contracts';
import WidgetSettingsPanel from '../components/WidgetSettingsPanel.vue';

// ===== Store & Data =====
const configStore = useDashboardConfigStore();
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');
const isRefreshing = ref(false);
const isSettingsPanelOpen = ref(false);

// ===== Computed Properties =====

/**
 * 可见的 Widgets 列表（从 store 获取，已排序）
 */
const visibleWidgets = computed(() => configStore.visibleWidgets);

// ===== Methods =====

/**
 * 获取 Widget 网格布局类名（基于尺寸）
 */
const getWidgetGridClasses = (size: DashboardContracts.WidgetSize): string => {
  switch (size) {
    case DashboardContracts.WidgetSize.SMALL:
      return 'col-span-1';
    case DashboardContracts.WidgetSize.MEDIUM:
      return 'col-span-1 md:col-span-2';
    case DashboardContracts.WidgetSize.LARGE:
      return 'col-span-1 md:col-span-2 lg:col-span-3';
    default:
      return 'col-span-1';
  }
};

/**
 * 获取 Widget 尺寸类名（传递给组件）
 */
const getWidgetSizeClasses = (size: DashboardContracts.WidgetSize): string => {
  return `widget-size-${size}`;
};

/**
 * 初始化加载
 */
const loadDashboard = async () => {
  performance.mark('dashboard-load-start');

  try {
    isLoading.value = true;
    hasError.value = false;
    errorMessage.value = '';

    console.log('[Dashboard] Registering widgets...');
    performance.mark('widget-registration-start');
    registerDashboardWidgets();
    performance.mark('widget-registration-end');
    performance.measure('widget-registration', 'widget-registration-start', 'widget-registration-end');
    console.log(`[Dashboard] ${widgetRegistry.count} widget(s) registered`);

    // 如果已经初始化过，直接使用缓存的配置
    if (configStore.initialized) {
      console.log('[Dashboard] Using cached widget configurations');
      performance.mark('dashboard-load-end');
      performance.measure('dashboard-load-total', 'dashboard-load-start', 'dashboard-load-end');

      // 打印性能报告
      const measures = performance.getEntriesByType('measure');
      console.log('📊 Dashboard 加载性能:');
      measures.forEach(measure => {
        console.log(`  ${measure.name}: ${measure.duration.toFixed(2)}ms`);
      });

      isLoading.value = false;
      return;
    }

    console.log('[Dashboard] Loading widget configurations...');
    performance.mark('config-load-start');

    await Promise.race([
      configStore.loadConfig(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('配置加载超时（5秒）')), 5000)
      )
    ]);

    performance.mark('config-load-end');
    performance.measure('config-load', 'config-load-start', 'config-load-end');
    console.log('[Dashboard] Widget configurations loaded successfully');

    performance.mark('dashboard-load-end');
    performance.measure('dashboard-load-total', 'dashboard-load-start', 'dashboard-load-end');

    // 打印性能报告
    const measures = performance.getEntriesByType('measure');
    console.log('📊 Dashboard 加载性能:');
    measures.forEach(measure => {
      console.log(`  ${measure.name}: ${measure.duration.toFixed(2)}ms`);
    });

    isLoading.value = false;
  } catch (error) {
    performance.mark('dashboard-load-end');
    performance.measure('dashboard-load-total', 'dashboard-load-start', 'dashboard-load-end');

    console.error('[Dashboard] Failed to load dashboard:', error);
    hasError.value = true;
    errorMessage.value = error instanceof Error ? error.message : '未知错误';
    isLoading.value = false;
  }
};

/**
 * 刷新 Widgets
 */
const refreshWidgets = async () => {
  try {
    isRefreshing.value = true;
    console.log('[Dashboard] Refreshing widgets...');
    await configStore.loadConfig();
    console.log('[Dashboard] Widgets refreshed successfully');
  } catch (error) {
    console.error('[Dashboard] Failed to refresh widgets:', error);
  } finally {
    isRefreshing.value = false;
  }
};

/**
 * 重试加载
 */
const retryLoad = () => {
  loadDashboard();
};

/**
 * 打开设置面板
 */
const openSettings = () => {
  console.log('[Dashboard] Opening settings panel...');
  isSettingsPanelOpen.value = true;
};

/**
 * 设置保存成功回调
 */
const handleSettingsSaved = () => {
  console.log('[Dashboard] Settings saved, refreshing widgets...');
  // 配置已保存，无需额外刷新（Store 已更新）
};

// ===== Lifecycle =====
onMounted(() => {
  console.log('[Dashboard] DashboardView mounted, initializing...');
  loadDashboard();
});
</script>

<style scoped>
/* Widget 网格容器 */
.widget-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

/* 响应式网格 */
@media (min-width: 768px) {
  .widget-grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .widget-grid-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .widget-grid-container {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Widget 过渡动画 */
.widget-grid-move,
.widget-grid-enter-active,
.widget-grid-leave-active {
  transition: all 0.3s ease;
}

.widget-grid-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.widget-grid-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.widget-grid-leave-active {
  position: absolute;
}

/* Widget 容器样式 */
.widget-container {
  transition: all 0.3s ease;
}

.widget-container:hover {
  transform: translateY(-2px);
}

/* 加载骨架屏动画 */
@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* 旋转动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
