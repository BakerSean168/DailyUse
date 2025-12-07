/**
 * AI Module IPC Handlers
 * 
 * Handles: Conversation, Message, GenerationTask, Quota, Provider
 * 
 * EPIC-003: 使用懒加载模式，AI 模块在首次调用时才加载
 */

import { createLazyModule } from './lazy-ipc-handler';

// 创建 AI 模块的懒加载 handler 注册器
const aiModule = createLazyModule('ai');

/**
 * 注册 AI 模块的 IPC 处理器
 * 所有 handler 都是懒加载的，首次调用时才加载 AI 模块
 */
export function registerAiIpcHandlers(): void {
  // ============================================
  // Conversation Handlers
  // ============================================
  
  aiModule.handle('ai:conversation:create', async (_, request) => {
    return { uuid: 'todo', ...request };
  });

  aiModule.handle('ai:conversation:list', async (_, params) => {
    return { conversations: [], total: 0 };
  });

  aiModule.handle('ai:conversation:get', async (_, uuid) => {
    return null;
  });

  aiModule.handle('ai:conversation:update', async (_, uuid, request) => {
    return { uuid, ...request };
  });

  aiModule.handle('ai:conversation:delete', async (_, uuid) => {
    return { success: true };
  });

  aiModule.handle('ai:conversation:archive', async (_, uuid) => {
    return { success: true };
  });

  aiModule.handle('ai:conversation:search', async (_, query, params) => {
    return { conversations: [], total: 0 };
  });

  // ============================================
  // Message Handlers
  // ============================================

  aiModule.handle('ai:message:send', async (_, conversationUuid, content, role) => {
    return { uuid: 'todo', conversationUuid, content, role };
  });

  aiModule.handle('ai:message:list', async (_, conversationUuid, params) => {
    return { messages: [], total: 0 };
  });

  aiModule.handle('ai:message:get', async (_, uuid) => {
    return null;
  });

  aiModule.handle('ai:message:delete', async (_, uuid) => {
    return { success: true };
  });

  aiModule.handle('ai:message:regenerate', async (_, uuid) => {
    return { uuid: 'new-uuid' };
  });

  aiModule.handle('ai:message:edit', async (_, uuid, content) => {
    return { success: true };
  });

  aiModule.handle('ai:message:feedback', async (_, uuid, feedback) => {
    return { success: true };
  });

  // ============================================
  // Generation Task Handlers
  // ============================================

  aiModule.handle('ai:generation-task:create', async (_, request) => {
    return { uuid: 'todo', status: 'pending', ...request };
  });

  aiModule.handle('ai:generation-task:list', async (_, params) => {
    return { tasks: [], total: 0 };
  });

  aiModule.handle('ai:generation-task:get', async (_, uuid) => {
    return null;
  });

  aiModule.handle('ai:generation-task:cancel', async (_, uuid) => {
    return { success: true };
  });

  aiModule.handle('ai:generation-task:retry', async (_, uuid) => {
    return { success: true };
  });

  aiModule.handle('ai:generation-task:get-status', async (_, uuid) => {
    return { status: 'unknown', progress: 0 };
  });

  aiModule.handle('ai:generation-task:stream', async (_, uuid) => {
    // Note: Streaming requires special handling, may need different approach
    return { error: 'Streaming not yet implemented' };
  });

  // ============================================
  // Quota Handlers
  // ============================================

  aiModule.handle('ai:quota:get', async () => {
    return { used: 0, limit: 0, remaining: 0, resetDate: null };
  });

  aiModule.handle('ai:quota:get-usage-history', async (_, params) => {
    return { usages: [], total: 0 };
  });

  aiModule.handle('ai:quota:get-by-model', async (_, modelId) => {
    return { used: 0, limit: 0 };
  });

  // ============================================
  // Provider Handlers
  // ============================================

  aiModule.handle('ai:provider:list', async () => {
    return { providers: [], total: 0 };
  });

  aiModule.handle('ai:provider:get', async (_, providerId) => {
    return null;
  });

  aiModule.handle('ai:provider:get-models', async (_, providerId) => {
    return { models: [] };
  });

  aiModule.handle('ai:provider:set-default', async (_, providerId) => {
    return { success: true };
  });

  aiModule.handle('ai:provider:configure', async (_, providerId, config) => {
    return { success: true };
  });

  aiModule.handle('ai:provider:test-connection', async (_, providerId) => {
    return { success: true, latency: 0 };
  });

  console.log('[IPC] AI handlers registered (lazy-loaded)');
}
