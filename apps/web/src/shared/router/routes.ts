/**
 * Route Definitions
 * 路由定义 - 统一管理所有路由配置
 */

import type { RouteRecordRaw } from 'vue-router';
import MainLayout from '@/modules/app/MainLayout.vue';
import { scheduleRoutes } from '@/modules/schedule';

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

      // 任务管理
      {
        path: '/tasks',
        name: 'tasks',
        meta: {
          title: '任务管理',
          showInNav: true,
          icon: 'mdi-check-circle',
          order: 2,
          requiresAuth: true,
        },
        children: [
          {
            path: '',
            name: 'task-list',
            component: () => import('@/modules/task/presentation/views/TaskManagementView.vue'),
            meta: {
              title: '任务管理',
              requiresAuth: true,
            },
          },
          // TODO: OneTimeTaskListView 已废弃，需要重写或使用 TaskManagementView
          // {
          //   path: 'one-time',
          //   name: 'task-one-time-list',
          //   component: () => import('@/modules/task/presentation/views/OneTimeTaskListView.vue'),
          //   meta: {
          //     title: '一次性任务',
          //     requiresAuth: true,
          //   },
          // },
          {
            path: 'dependency-validation-demo',
            name: 'task-dependency-demo',
            component: () =>
              import('@/modules/task/presentation/views/DependencyValidationDemoView.vue'),
            meta: {
              title: '依赖验证演示 (STORY-024)',
              requiresAuth: true,
              showInNav: import.meta.env.DEV, // 仅开发环境显示
            },
          },
          {
            path: ':id',
            name: 'task-detail',
            component: () => import('@/modules/task/presentation/views/TaskDetailView.vue'),
            meta: {
              title: '任务详情',
              requiresAuth: true,
            },
            props: true,
          },
        ],
      },

      // 目标管理
      {
        path: '/goals',
        name: 'goals',
        meta: {
          title: '目标管理',
          showInNav: true,
          icon: 'mdi-target',
          order: 3,
          requiresAuth: true,
        },
        children: [
          {
            path: '',
            name: 'goal-list',
            component: () => import('@/modules/goal/presentation/views/GoalListView.vue'),
            meta: {
              title: '目标列表',
              requiresAuth: true,
            },
          },
          {
            path: 'compare',
            name: 'goal-comparison',
            component: () =>
              import('@/modules/goal/presentation/views/MultiGoalComparisonView.vue'),
            meta: {
              title: '多目标对比',
              requiresAuth: true,
            },
          },
          {
            path: 'rules-demo',
            name: 'goal-rules-demo',
            component: () => import('@/modules/goal/presentation/views/StatusRulesDemoView.vue'),
            meta: {
              title: '规则测试器',
              requiresAuth: true,
            },
          },
          {
            path: ':id',
            name: 'goal-detail',
            component: () => import('@/modules/goal/presentation/views/GoalDetailView.vue'),
            meta: {
              title: '目标详情',
              requiresAuth: true,
            },
            props: true,
          },
          {
            path: ':goalUuid/review/create',
            name: 'goal-review-create',
            component: () => import('@/modules/goal/presentation/views/GoalReviewCreationView.vue'),
            meta: {
              title: '创建目标复盘',
              requiresAuth: true,
            },
            props: true,
          },
          {
            path: ':goalUuid/review/:reviewUuid',
            name: 'goal-review-detail',
            component: () => import('@/modules/goal/presentation/views/GoalReviewDetailView.vue'),
            meta: {
              title: '目标复盘记录',
              requiresAuth: true,
            },
            props: true,
          },
          {
            path: ':goalUuid/key-results/:keyResultUuid',
            name: 'key-result-detail',
            component: () => import('@/modules/goal/presentation/views/KeyResultDetailView.vue'),
            meta: {
              title: '关键结果详情',
              requiresAuth: true,
            },
            props: true,
          },
        ],
      },

      // 提醒管理
      {
        path: '/reminders',
        name: 'reminders',
        meta: {
          title: '提醒管理',
          showInNav: true,
          icon: 'mdi-bell',
          order: 4,
          requiresAuth: true,
        },
        children: [
          {
            path: '',
            name: 'reminder-desktop',
            component: () =>
              import('@/modules/reminder/presentation/views/ReminderDesktopView.vue'),
            meta: {
              title: '提醒列表',
              requiresAuth: true,
            },
          },
        ],
      },

      ...scheduleRoutes,

      // 知识仓库 (Knowledge Repository - Document Management)
      {
        path: '/repository',
        name: 'repository',
        component: () => import('@/modules/document/views/RepositoryPage.vue'),
        meta: {
          title: '知识仓库',
          showInNav: true,
          icon: 'mdi-book-open-variant',
          order: 6,
          requiresAuth: true,
        },
      },

      // 仓储管理 (Legacy)
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
            component: () =>
              import('@/modules/repository/presentation/views/RepositoryListView.vue'),
            meta: {
              title: '仓储列表',
              requiresAuth: true,
            },
          },
          {
            path: ':id',
            name: 'repository-detail',
            component: () =>
              import('@/modules/repository/presentation/views/RepositoryDetailView.vue'),
            meta: {
              title: '仓储详情',
              requiresAuth: true,
            },
            props: true,
          },
        ],
      },

      // 账户设置
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
            component: () => import('@/modules/account/presentation/views/ProfileView.vue'),
            meta: {
              title: '个人资料',
              requiresAuth: true,
            },
          },
          {
            path: 'settings',
            name: 'account-settings',
            component: () => import('@/modules/account/presentation/views/SettingsView.vue'),
            meta: {
              title: '账户设置',
              requiresAuth: true,
            },
          },
          {
            path: 'security',
            name: 'account-security',
            component: () => import('@/modules/account/presentation/views/SecurityView.vue'),
            meta: {
              title: '安全设置',
              requiresAuth: true,
              permissions: ['account:security'],
            },
          },
        ],
      },

      // 应用设置 - 使用新的 Vuetify 组件系统
      {
        path: '/settings',
        name: 'settings',
        component: () => import('@/modules/setting/presentation/views/UserSettingsView.vue'),
        meta: {
          title: '应用设置',
          showInNav: true,
          icon: 'mdi-cog',
          order: 9,
          requiresAuth: true,
        },
        // 新版本使用内部标签导航，不需要子路由
      },

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
