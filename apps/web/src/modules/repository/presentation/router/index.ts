/**
 * Repository 模块路由配置
 */

import type { RouteRecordRaw } from 'vue-router';

export const repositoryRoutes: RouteRecordRaw[] = [
  {
    path: '/repositories',
    name: 'repositories',
    meta: {
      title: '知识仓库',
      showInNav: true, // ✅ 恢复显示在导航中
      icon: 'mdi-book-open-variant',
      order: 7,
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'repository-list',
        component: () => import('../views/RepositoryListView.vue'),
        meta: {
          title: '仓储列表',
          requiresAuth: true,
        },
      },
      {
        path: ':id',
        name: 'repository-detail',
        component: () => import('../views/RepositoryDetailView.vue'),
        meta: {
          title: '仓储详情',
          requiresAuth: true,
        },
        props: true,
      },
    ],
  },
];
