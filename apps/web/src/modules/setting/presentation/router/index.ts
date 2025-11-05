/**
 * Setting 模块路由配置
 */

import type { RouteRecordRaw } from 'vue-router';

export const settingRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/UserSettingsView.vue'),
    meta: {
      title: '应用设置',
      showInNav: true,
      icon: 'mdi-cog',
      order: 9,
      requiresAuth: true,
    },
    // 新版本使用内部标签导航，不需要子路由
  },
];
