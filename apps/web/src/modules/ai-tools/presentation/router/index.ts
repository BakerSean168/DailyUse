/**
 * AI Tools 模块路由配置
 */

import type { RouteRecordRaw } from 'vue-router';

export const aiToolsRoutes: RouteRecordRaw[] = [
  {
    path: '/ai-tools',
    name: 'ai-tools',
    meta: {
      title: 'AI 工具',
      showInNav: true,
      icon: 'mdi-robot-outline',
      order: 50,
      requiresAuth: true,
    },
    children: [
      {
        path: 'summarizer',
        name: 'document-summarizer',
        component: () => import('../../components/DocumentSummarizer.vue'),
        meta: {
          title: '文档摘要',
          icon: 'mdi-file-document-edit-outline',
          requiresAuth: true,
        },
      },
    ],
  },
];
