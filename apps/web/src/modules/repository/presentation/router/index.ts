/**
 * Repository 模块路由配置
 */

import type { RouteRecordRaw } from 'vue-router';

export const repositoryRoutes: RouteRecordRaw[] = [
  {
    path: '/repositories',
    name: 'repositories',
    meta: {
      title: '仓储管理',
      showInNav: false, // 隐藏旧的仓储管理，使用新的知识仓库
      icon: 'mdi-source-repository',
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
