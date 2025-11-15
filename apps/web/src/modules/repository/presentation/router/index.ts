/**
 * Repository 模块路由配置
 * Epic 10 Story 11.x - Obsidian 风格知识仓库界面
 */

import type { RouteRecordRaw } from 'vue-router';

export const repositoryRoutes: RouteRecordRaw[] = [
  {
    path: '/repositories',
    name: 'repositories',
    component: () => import('../views/RepositoryView.vue'), // ✅ Obsidian 风格主界面
    meta: {
      title: '知识仓库',
      showInNav: true,
      icon: 'mdi-book-open-variant',
      order: 7,
      requiresAuth: true,
    },
  },
];
