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
          {
            path: 'create',
            name: 'task-create',
            component: () => import('@/modules/task/presentation/views/TaskCreateView.vue'),
            meta: {
              title: '创建任务',
              requiresAuth: true,
            },
          },
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
          {
            path: ':id/edit',
            name: 'task-edit',
            component: () => import('@/modules/task/presentation/views/TaskEditView.vue'),
            meta: {
              title: '编辑任务',
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

      // 仓储管理
      {
        path: '/repositories',
        name: 'repositories',
        meta: {
          title: '仓储管理',
          showInNav: true,
          icon: 'mdi-source-repository',
          order: 6,
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
          order: 7,
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
          order: 8,
          requiresAuth: true,
        },
        // 新版本使用内部标签导航，不需要子路由
      },

      // 测试页面 (开发环境)
      {
        path: '/test',
        name: 'test',
        component: () => import('@/modules/account/presentation/views/TestView.vue'),
        meta: {
          title: '测试页面',
          showInNav: import.meta.env.DEV,
          icon: 'mdi-test-tube',
          order: 999,
          requiresAuth: true,
        },
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
