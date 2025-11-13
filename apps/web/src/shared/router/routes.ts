/**
 * Route Definitions
 * 路由定义 - 统一管理所有路由配置
 */

import type { RouteRecordRaw } from 'vue-router';
import MainLayout from '@/modules/app/MainLayout.vue';



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
      // 🏠 欢迎页（新的默认首页，轻量级，无业务模块依赖）
      {
        path: '',
        name: 'welcome',
        component: () => import('@/views/WelcomeView.vue'),
        meta: {
          title: '首页',
          showInNav: true,
          icon: 'mdi-home',
          order: 0,
          requiresAuth: true,
        },
      },

      // 📊 仪表盘（改为 /dashboard，懒加载）
      {
        path: 'dashboard',
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

      // 各模块路由将通过编程方式动态添加
      // ...


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
