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
  <div class="dashboard-page">
    <!-- Widget 设置面板 -->
    <WidgetSettingsPanel v-model:isOpen="isSettingsPanelOpen" @saved="handleSettingsSaved" />

    <!-- 页面标题与操作栏 -->
    <header class="dashboard-header">
      <div class="flex items-center gap-3">
        <v-icon icon="mdi-view-dashboard" size="32" color="primary" />
        <h1 class="text-h4">仪表盘</h1>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center gap-2">
        <v-btn
          v-if="!isLoading && !hasError"
          variant="text"
          @click="refreshWidgets"
          :disabled="isRefreshing"
        >
          <v-icon :class="{ 'rotate-animation': isRefreshing }">mdi-refresh</v-icon>
          <span class="ml-2 hidden sm:inline">刷新</span>
        </v-btn>

        <v-btn color="primary" @click="openSettings">
          <v-icon>mdi-cog</v-icon>
          <span class="ml-2 hidden sm:inline">设置</span>
        </v-btn>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-skeleton">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <v-skeleton-loader
          v-for="i in 4"
          :key="i"
          type="card"
          class="skeleton-card"
        />
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error-state">
      <v-icon size="64" color="error">mdi-alert-circle</v-icon>
      <h2 class="text-h5 mt-4 mb-2">加载失败</h2>
      <p class="text-body-1 text-medium-emphasis mb-6">{{ errorMessage }}</p>
      <v-btn color="primary" @click="retryLoad">重试</v-btn>
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
    <div v-else class="empty-state">
      <v-icon size="64" color="grey-lighten-1">mdi-view-dashboard-outline</v-icon>
      <h2 class="text-h5 mt-4 mb-2">暂无 Widget</h2>
      <p class="text-body-1 text-medium-emphasis mb-6">点击右上角设置按钮添加 Widget</p>
      <v-btn color="primary" @click="openSettings">打开设置</v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useDashboardConfigStore } from '@/modules/dashboard/stores/dashboardConfigStore';
import { widgetRegistry } from '@/modules/dashboard/infrastructure/WidgetRegistry';
// ✅ Widget 注册现在由各业务模块初始化时完成，不需要在这里导入
import { WidgetType } from '@dailyuse/contracts/dashboard';
import type { WidgetConfig, DashboardConfigClientDTO, WidgetDefinition } from '@dailyuse/contracts/dashboard';
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
const getWidgetGridClasses = (size: WidgetSize): string => {
  switch (size) {
    case WidgetSize.SMALL:
      return 'col-span-1';
    case WidgetSize.MEDIUM:
      return 'col-span-1 md:col-span-2';
    case WidgetSize.LARGE:
      return 'col-span-1 md:col-span-2 lg:col-span-3';
    default:
      return 'col-span-1';
  }
};

/**
 * 获取 Widget 尺寸类名（传递给组件）
 */
const getWidgetSizeClasses = (size: WidgetSize): string => {
  return `widget-size-${size}`;
};

/**
 * 等待 Widget 注册完成
 */
const waitForWidgetRegistration = async (maxWaitTime = 3000): Promise<void> => {
  const startTime = Date.now();
  const checkInterval = 100;

  while (widgetRegistry.count === 0) {
    if (Date.now() - startTime > maxWaitTime) {
      console.warn('[Dashboard] Widget registration timeout, continuing anyway');
      break;
    }
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  console.log(`[Dashboard] Widget registration check completed: ${widgetRegistry.count} widgets found`);
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

    // ✅ 等待业务模块初始化并注册 widgets
    console.log('[Dashboard] Waiting for widget registration...');
    performance.mark('widget-wait-start');
    
    await waitForWidgetRegistration();
    
    performance.mark('widget-wait-end');
    performance.measure('widget-wait', 'widget-wait-start', 'widget-wait-end');
    
    const widgetCount = widgetRegistry.count;
    console.log(`[Dashboard] ${widgetCount} widget(s) registered by modules`);

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
.dashboard-page {
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-surface), 1),
    rgba(var(--v-theme-background), 1)
  );
  padding: 1rem;
}

@media (min-width: 640px) {
  .dashboard-page {
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .dashboard-page {
    padding: 2rem;
  }
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

.error-state,
.empty-state {
  background: rgb(var(--v-theme-surface));
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(var(--v-theme-on-surface), 0.12);
  padding: 3rem;
  text-align: center;
}

.skeleton-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(var(--v-theme-on-surface), 0.12);
  padding: 1.5rem;
}

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

/* 旋转动画 */
.rotate-animation {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>

