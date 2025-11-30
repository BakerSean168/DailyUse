/**
 * AI 模块路由配置
 * DDD Architecture: Presentation Layer - Router
 */

import type { RouteRecordRaw } from 'vue-router';

export const aiRoutes: RouteRecordRaw[] = [
  {
    path: '/ai',
    name: 'ai',
    redirect: '/ai/knowledge-generator',
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
        name: 'ai-document-summarizer',
        component: () => import('../components/summarizer/DocumentSummarizer.vue'),
        meta: {
          title: '文档摘要',
          icon: 'mdi-file-document-edit-outline',
          requiresAuth: true,
        },
      },
      {
        path: 'knowledge-generator',
        name: 'ai-knowledge-generator',
        component: () => import('../components/generation/KnowledgeGenerationWizard.vue'),
        meta: {
          title: '知识库生成',
          icon: 'mdi-brain',
          requiresAuth: true,
        },
      },
      {
        path: 'chat',
        name: 'ai-chat',
        component: () => import('../components/chat/AIChatWindow.vue'),
        meta: {
          title: 'AI 对话',
          icon: 'mdi-chat-outline',
          requiresAuth: true,
        },
      },
    ],
  },
];

// 兼容旧路由路径（重定向）
export const aiToolsCompatibilityRoutes: RouteRecordRaw[] = [
  {
    path: '/ai-tools',
    redirect: '/ai',
  },
  {
    path: '/ai-tools/summarizer',
    redirect: '/ai/summarizer',
  },
  {
    path: '/ai-tools/knowledge-generator',
    redirect: '/ai/knowledge-generator',
  },
];
