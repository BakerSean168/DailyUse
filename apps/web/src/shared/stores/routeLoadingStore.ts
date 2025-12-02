/**
 * Route Loading Store
 * 路由加载状态管理 - 用于显示页面切换时的骨架屏
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useRouteLoadingStore = defineStore('routeLoading', () => {
  // 是否正在加载路由
  const isLoading = ref(false);
  
  // 目标路由路径（用于调试）
  const targetPath = ref('');

  /**
   * 开始加载
   */
  const startLoading = (path: string) => {
    isLoading.value = true;
    targetPath.value = path;
  };

  /**
   * 结束加载
   */
  const finishLoading = () => {
    isLoading.value = false;
    targetPath.value = '';
  };

  return {
    isLoading,
    targetPath,
    startLoading,
    finishLoading,
  };
});
