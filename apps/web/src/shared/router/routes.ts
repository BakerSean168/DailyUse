/**
 * Route Definitions
 * 路由定义 - 统一管理所有路由配置
 */

import type { RouteRecordRaw } from 'vue-router';
import MainLayout from '@/modules/app/MainLayout.vue';

// 导入各模块路由
import { taskRoutes } from '@/modules/task/presentation/router';
import { goalRoutes } from '@/modules/goal/presentation/router';
import { reminderRoutes } from '@/modules/reminder/presentation/router';
import { scheduleRoutes } from '@/modules/schedule/presentation/router';
import { repositoryRoutes } from '@/modules/repository/presentation/router';
import { accountRoutes } from '@/modules/account/presentation/router';
import { settingRoutes } from '@/modules/setting/presentation/router';
import { notificationRoutes } from '@/modules/notification/presentation/router';

/**
 * 认证相关路由
 */
export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/auth',
    name: 'auth',
    component: () => import('@/views/AuthView.vue'),
    meta: {
      title: '登录',
      requiresAuth: false,
    },
  },
];

/**
 * 错误页面路由
 */
export const errorRoutes: RouteRecordRaw[] = [
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('@/shared/components/UnauthorizedPage.vue'),
    meta: {
      title: '无权限访问',
      requiresAuth: false,
    },
  },
  {
    path: '/error',
    name: 'error',
    component: () => import('@/shared/components/ErrorPage.vue'),
    meta: {
      title: '错误',
      requiresAuth: false,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/shared/components/NotFoundPage.vue'),
    meta: {
      title: '页面不存在',
      requiresAuth: false,
    },
  },
];

/**
 * 主应用路由
 */
export const appRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      // 首页/仪表盘
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/modules/dashboard/presentation/views/DashboardView.vue'),
        meta: {
          title: '仪表盘',
          showInNav: true,
          icon: 'mdi-view-dashboard',
          order: 1,
          requiresAuth: true,
        },
      },

      // 各模块路由（从模块内部导入）
      ...taskRoutes,
      ...goalRoutes,
      ...reminderRoutes,
      ...scheduleRoutes,

      // 知识仓库 (Epic 10: Obsidian 风格知识管理系统)
      // Story 10-2: Resource CRUD + Milkdown 编辑器 - 3列布局视图
      {
        path: '/repository',
        name: 'repository',
        component: () => import('@/modules/repository/presentation/views/RepositoryView.vue'),
        meta: {
          title: '知识仓库',
          showInNav: true,
          icon: 'mdi-book-open-variant',
          order: 6,
          requiresAuth: true,
        },
      },

      // 仓储管理路由（从模块内部导入）
      ...repositoryRoutes,

      // 账户设置路由（从模块内部导入）
      ...accountRoutes,

      // 应用设置路由（从模块内部导入）
      ...settingRoutes,

      // 通知中心路由（从模块内部导入）
      ...notificationRoutes,

      // Assets 资源演示 (开发环境)
      {
        path: '/assets-demo',
        name: 'assets-demo',
        component: () => import('@/components/AssetsDemo.vue'),
        meta: {
          title: '资源库演示',
          showInNav: import.meta.env.DEV,
          icon: 'mdi-folder-multiple-image',
          order: 1000,
          requiresAuth: true,
        },
      },
    ],
  },
];

/**
 * 所有路由配置
 */
export const routes: RouteRecordRaw[] = [...authRoutes, ...appRoutes, ...errorRoutes];

/**
 * 获取导航菜单项
 */
export const getNavigationRoutes = () => {
  return (
    appRoutes[0].children
      ?.filter((route) => route.meta?.showInNav)
      .sort((a, b) => (a.meta?.order || 0) - (b.meta?.order || 0))
      .map((route) => ({
        name: route.name,
        path: route.path,
        title: route.meta?.title,
        icon: route.meta?.icon,
        order: route.meta?.order,
      })) || []
  );
};
