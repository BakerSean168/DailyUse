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
      {
        path: 'knowledge-generator',
        name: 'knowledge-generator',
        component: () => import('../../components/KnowledgeGenerationWizard.vue'),
        meta: {
          title: '知识库生成',
          icon: 'mdi-brain',
          requiresAuth: true,
        },
      },
    ],
  },
];
