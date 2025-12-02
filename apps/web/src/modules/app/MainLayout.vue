<template>
  <v-app>
    <div class="app-layout">
      <div class="sidebar">
        <sidebar />
      </div>
      <!-- 主内容区 -->
      <div class="content">
        <v-main class="main-content">
          <!-- 路由加载时显示骨架屏 -->
          <PageSkeleton v-if="isRouteLoading" class="page-skeleton-overlay" />
          <!-- 路由视图 -->
          <router-view v-slot="{ Component, route }">
            <div class="route-wrapper" :key="route.path">
              <component :is="Component" />
            </div>
          </router-view>
        </v-main>
      </div>
    </div>
  </v-app>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
// components
import Sidebar from './components/Sidebar.vue';
import PageSkeleton from '@/shared/components/PageSkeleton.vue';
import { useRouteLoadingStore } from '@/shared/stores/routeLoadingStore';

// 路由加载状态
const routeLoadingStore = useRouteLoadingStore();
const { isLoading } = storeToRefs(routeLoadingStore);
const isRouteLoading = computed(() => isLoading.value);
</script>
<style scoped>
.app-layout {
  display: grid;
  grid-template-columns: 60px 1fr;
  grid-template-rows: 1fr;
  height: 100vh;
}

.sidebar {
  grid-column: 1;
  grid-row: 1;
}

.content {
  grid-column: 2;
  grid-row: 1;
  height: 100%;
  overflow: hidden;
}

.main-content {
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 路由包装器 - 确保每个路由组件都有一个容器 */
.route-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 骨架屏覆盖层 */
.page-skeleton-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
