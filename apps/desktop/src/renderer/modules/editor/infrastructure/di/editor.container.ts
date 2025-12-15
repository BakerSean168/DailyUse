/**
 * Editor DI Container - 编辑器模块依赖注入容器
 * 
 * @module renderer/modules/editor/infrastructure/di
 */

import {
  RendererContainer,
  createServiceToken,
  ModuleName,
} from '@/renderer/shared/infrastructure/di';

import {
  EditorIPCClient,
  editorIPCClient,
} from '../ipc/editor.ipc-client';

// ============ Service Tokens ============

export const EditorTokens = {
  EditorIPCClient: createServiceToken<EditorIPCClient>('editor:ipc-client'),
} as const;

// ============ Container ============

/**
 * Editor Container - 编辑器模块容器
 */
export class EditorContainer extends RendererContainer {
  readonly moduleName = ModuleName.Editor;

  protected registerServices(): void {
    // Register IPC Clients
    this.registerInstance(EditorTokens.EditorIPCClient, editorIPCClient);
  }

  // ============ Service Accessors ============

  get editorIPCClient(): EditorIPCClient {
    return this.get(EditorTokens.EditorIPCClient);
  }
}
