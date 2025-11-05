/**
 * Account 模块路由配置
 */

import type { RouteRecordRaw } from 'vue-router';

export const accountRoutes: RouteRecordRaw[] = [
  {
    path: '/account',
    name: 'account',
    meta: {
      title: '账户设置',
      showInNav: true,
      icon: 'mdi-account-cog',
      order: 8,
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'account-profile',
        component: () => import('../views/ProfileView.vue'),
        meta: {
          title: '个人资料',
          requiresAuth: true,
        },
      },
      {
        path: 'settings',
        name: 'account-settings',
        component: () => import('../views/SettingsView.vue'),
        meta: {
          title: '账户设置',
          requiresAuth: true,
        },
      },
      {
        path: 'security',
        name: 'account-security',
        component: () => import('../views/SecurityView.vue'),
        meta: {
          title: '安全设置',
          requiresAuth: true,
          permissions: ['account:security'],
        },
      },
    ],
  },
];
