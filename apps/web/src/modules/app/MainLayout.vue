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
          <Transition name="skeleton-fade" mode="out-in">
            <PageSkeleton v-if="isRouteLoading" key="skeleton" />
            <router-view v-else v-slot="{ Component }" key="content">
              <Transition name="page-fade" mode="out-in">
                <component :is="Component" />
              </Transition>
            </router-view>
          </Transition>
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
}

/* 骨架屏切换动画 */
.skeleton-fade-enter-active,
.skeleton-fade-leave-active {
  transition: opacity 0.2s ease;
}

.skeleton-fade-enter-from,
.skeleton-fade-leave-to {
  opacity: 0;
}

/* 页面切换过渡动画 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
