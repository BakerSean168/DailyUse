/**
 * Route Definitions
 * 路由定义 - 统一管理所有路由配置
 */

import type { RouteRecordRaw } from 'vue-router';
import MainLayout from '@/modules/app/MainLayout.vue';

// 导入各业务模块的路由（只是路由配置，不会加载组件代码）
import { goalRoutes } from '@/modules/goal/presentation/router';
import { taskRoutes } from '@/modules/task/presentation/router';
import { reminderRoutes } from '@/modules/reminder/presentation/router';
import { scheduleRoutes } from '@/modules/schedule/presentation/router';
import { settingRoutes } from '@/modules/setting/presentation/router';
import { accountRoutes } from '@/modules/account/presentation/router';
import { notificationRoutes } from '@/modules/notification/presentation/router';
import { repositoryRoutes } from '@/modules/repository/presentation/router';
import { aiToolsRoutes } from '@/modules/ai-tools/presentation/router';

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
    name: 'app',
    component: MainLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      // 📊 仪表盘（默认首页）
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

      // 业务模块路由（组件使用懒加载，不会在首屏打包）
      // ...

      // 🎯 Goal 模块路由
      ...goalRoutes,

      // ✅ Task 模块路由
      ...taskRoutes,

      // 🔔 Reminder 模块路由
      ...reminderRoutes,

      // 📅 Schedule 模块路由
      ...scheduleRoutes,

      // 👤 Account 模块路由
      ...accountRoutes,

      // 🔔 Notification 模块路由
      ...notificationRoutes,

      // 📚 Repository 模块路由
      ...repositoryRoutes,

      // 🤖 AI Tools 模块路由
      ...aiToolsRoutes,

      // ⚙️ Setting 模块路由
      ...settingRoutes,

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
