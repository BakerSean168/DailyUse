# STORY-012: Editor 模块实现

> **EPIC**: EPIC-010 Desktop 全面 DDD 模块化重构  
> **Sprint**: Sprint 4  
> **预估**: 6 小时  
> **优先级**: P2  
> **依赖**: STORY-001

---

## 📋 概述

Editor 模块负责富文本编辑功能，支持：
- Markdown 编辑和预览
- 文件附件管理
- 编辑器配置

目前 Desktop 没有专门的 Editor IPC handlers，需要新建。

---

## 🎯 目标

1. 创建 Editor 模块支持富文本编辑
2. 实现文件附件的本地存储和管理
3. 提供编辑器配置管理

---

## ✅ 验收标准 (AC)

### AC-1: Markdown 处理
```gherkin
Given Editor IPC channels
When 调用以下 channels:
  - editor:markdown:parse
  - editor:markdown:render
  - editor:markdown:export
Then 应正确处理 Markdown 内容
```

### AC-2: 附件管理
```gherkin
Given 用户添加附件
When 调用 editor:attachment:upload
Then 应将附件保存到本地存储
And 返回本地引用路径
```

### AC-3: 编辑器配置
```gherkin
Given 编辑器设置
When 调用 editor:config:get/update
Then 应返回/更新编辑器配置（字体、主题等）
```

---

## 📁 任务清单

### Task 12.1: 创建 EditorDesktopApplicationService

**文件**: `apps/desktop/src/main/modules/editor/application/EditorDesktopApplicationService.ts`

```typescript
/**
 * Editor Desktop Application Service
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '@dailyuse/utils';
import { marked } from 'marked';

const logger = createLogger('EditorDesktopAppService');

export interface EditorConfig {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  theme: 'light' | 'dark' | 'auto';
  wordWrap: boolean;
  showLineNumbers: boolean;
  spellCheck: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
}

export interface AttachmentInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: number;
}

const defaultConfig: EditorConfig = {
  fontSize: 14,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  lineHeight: 1.6,
  tabSize: 2,
  theme: 'auto',
  wordWrap: true,
  showLineNumbers: false,
  spellCheck: true,
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
};

export class EditorDesktopApplicationService {
  private readonly attachmentsDir: string;
  private readonly configPath: string;
  private config: EditorConfig;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.attachmentsDir = path.join(userDataPath, 'attachments');
    this.configPath = path.join(userDataPath, 'editor-config.json');
    
    // 确保附件目录存在
    if (!fs.existsSync(this.attachmentsDir)) {
      fs.mkdirSync(this.attachmentsDir, { recursive: true });
    }

    this.config = this.loadConfig();
  }

  private loadConfig(): EditorConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        return { ...defaultConfig, ...JSON.parse(data) };
      }
    } catch (error) {
      logger.error('Failed to load editor config', error);
    }
    return { ...defaultConfig };
  }

  private saveConfig(): boolean {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      return true;
    } catch (error) {
      logger.error('Failed to save editor config', error);
      return false;
    }
  }

  // ===== Markdown =====

  async parseMarkdown(content: string): Promise<{
    html: string;
    toc: Array<{ level: number; text: string; id: string }>;
    wordCount: number;
  }> {
    const toc: Array<{ level: number; text: string; id: string }> = [];
    
    // 自定义 renderer 收集 TOC
    const renderer = new marked.Renderer();
    renderer.heading = (text, level) => {
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');
      toc.push({ level, text, id });
      return `<h${level} id="${id}">${text}</h${level}>`;
    };

    const html = marked(content, { renderer });
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    return { html, toc, wordCount };
  }

  async renderMarkdown(content: string, options?: {
    sanitize?: boolean;
    gfm?: boolean;
    breaks?: boolean;
  }): Promise<string> {
    return marked(content, {
      gfm: options?.gfm ?? true,
      breaks: options?.breaks ?? true,
    });
  }

  async exportMarkdown(content: string, format: 'html' | 'pdf'): Promise<{
    success: boolean;
    data?: string | Buffer;
    error?: string;
  }> {
    try {
      if (format === 'html') {
        const html = await this.renderMarkdown(content);
        const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Export</title>
  <style>
    body { font-family: ${this.config.fontFamily}; line-height: ${this.config.lineHeight}; max-width: 800px; margin: 0 auto; padding: 20px; }
    pre { background: #f4f4f4; padding: 10px; overflow-x: auto; }
    code { font-family: monospace; }
    blockquote { border-left: 3px solid #ddd; margin-left: 0; padding-left: 20px; color: #666; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
        return { success: true, data: fullHtml };
      }

      // PDF 导出需要 puppeteer 或其他库
      return { success: false, error: 'PDF export not yet implemented' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ===== Attachments =====

  async uploadAttachment(data: Buffer | string, fileName: string, mimeType: string): Promise<{
    success: boolean;
    attachment?: AttachmentInfo;
    error?: string;
  }> {
    try {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const ext = path.extname(fileName) || this.getExtensionFromMime(mimeType);
      const storedName = `${id}${ext}`;
      const filePath = path.join(this.attachmentsDir, storedName);

      if (typeof data === 'string') {
        // Base64 数据
        const base64Data = data.replace(/^data:[^;]+;base64,/, '');
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      } else {
        fs.writeFileSync(filePath, data);
      }

      const stats = fs.statSync(filePath);
      const attachment: AttachmentInfo = {
        id,
        name: fileName,
        path: filePath,
        size: stats.size,
        mimeType,
        createdAt: Date.now(),
      };

      logger.info('Attachment uploaded', { id, fileName });
      return { success: true, attachment };
    } catch (error) {
      logger.error('Failed to upload attachment', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private getExtensionFromMime(mimeType: string): string {
    const map: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
    };
    return map[mimeType] || '';
  }

  async getAttachment(id: string): Promise<AttachmentInfo | null> {
    try {
      const files = fs.readdirSync(this.attachmentsDir);
      const file = files.find(f => f.startsWith(id));
      
      if (file) {
        const filePath = path.join(this.attachmentsDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          id,
          name: file,
          path: filePath,
          size: stats.size,
          mimeType: this.getMimeFromExtension(path.extname(file)),
          createdAt: stats.mtimeMs,
        };
      }
      return null;
    } catch (error) {
      logger.error('Failed to get attachment', error);
      return null;
    }
  }

  private getMimeFromExtension(ext: string): string {
    const map: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
    };
    return map[ext.toLowerCase()] || 'application/octet-stream';
  }

  async deleteAttachment(id: string): Promise<{ success: boolean }> {
    try {
      const files = fs.readdirSync(this.attachmentsDir);
      const file = files.find(f => f.startsWith(id));
      
      if (file) {
        fs.unlinkSync(path.join(this.attachmentsDir, file));
        logger.info('Attachment deleted', { id });
      }
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete attachment', error);
      return { success: false };
    }
  }

  async listAttachments(): Promise<{
    attachments: AttachmentInfo[];
    totalSize: number;
  }> {
    try {
      const files = fs.readdirSync(this.attachmentsDir);
      const attachments: AttachmentInfo[] = [];
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(this.attachmentsDir, file);
        const stats = fs.statSync(filePath);
        const id = file.split('-')[0] + '-' + file.split('-')[1];

        attachments.push({
          id,
          name: file,
          path: filePath,
          size: stats.size,
          mimeType: this.getMimeFromExtension(path.extname(file)),
          createdAt: stats.mtimeMs,
        });
        totalSize += stats.size;
      }

      return { attachments, totalSize };
    } catch (error) {
      logger.error('Failed to list attachments', error);
      return { attachments: [], totalSize: 0 };
    }
  }

  async cleanupOrphanedAttachments(usedIds: string[]): Promise<{
    deleted: number;
    freedSpace: number;
  }> {
    const { attachments } = await this.listAttachments();
    let deleted = 0;
    let freedSpace = 0;

    for (const attachment of attachments) {
      if (!usedIds.includes(attachment.id)) {
        try {
          fs.unlinkSync(attachment.path);
          deleted++;
          freedSpace += attachment.size;
        } catch (error) {
          logger.error('Failed to delete orphaned attachment', { id: attachment.id, error });
        }
      }
    }

    logger.info('Cleaned up orphaned attachments', { deleted, freedSpace });
    return { deleted, freedSpace };
  }

  // ===== Config =====

  getConfig(): EditorConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<EditorConfig>): EditorConfig {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    return this.config;
  }

  resetConfig(): EditorConfig {
    this.config = { ...defaultConfig };
    this.saveConfig();
    return this.config;
  }
}
```

### Task 12.2: 创建 Editor IPC Handlers

**文件**: `apps/desktop/src/main/modules/editor/ipc/editor.ipc-handlers.ts`

```typescript
/**
 * Editor IPC Handlers
 */

import { ipcMain } from 'electron';
import { EditorDesktopApplicationService } from '../application/EditorDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('EditorIPC');

let appService: EditorDesktopApplicationService | null = null;

function getAppService(): EditorDesktopApplicationService {
  if (!appService) {
    appService = new EditorDesktopApplicationService();
  }
  return appService;
}

export function registerEditorIpcHandlers(): void {
  // ===== Markdown =====

  ipcMain.handle('editor:markdown:parse', async (_, content) => {
    try {
      return await getAppService().parseMarkdown(content);
    } catch (error) {
      logger.error('Failed to parse markdown', error);
      throw error;
    }
  });

  ipcMain.handle('editor:markdown:render', async (_, content, options) => {
    try {
      return await getAppService().renderMarkdown(content, options);
    } catch (error) {
      logger.error('Failed to render markdown', error);
      throw error;
    }
  });

  ipcMain.handle('editor:markdown:export', async (_, content, format) => {
    try {
      return await getAppService().exportMarkdown(content, format);
    } catch (error) {
      logger.error('Failed to export markdown', error);
      throw error;
    }
  });

  // ===== Attachments =====

  ipcMain.handle('editor:attachment:upload', async (_, data, fileName, mimeType) => {
    try {
      return await getAppService().uploadAttachment(data, fileName, mimeType);
    } catch (error) {
      logger.error('Failed to upload attachment', error);
      throw error;
    }
  });

  ipcMain.handle('editor:attachment:get', async (_, id) => {
    try {
      return await getAppService().getAttachment(id);
    } catch (error) {
      logger.error('Failed to get attachment', error);
      throw error;
    }
  });

  ipcMain.handle('editor:attachment:delete', async (_, id) => {
    try {
      return await getAppService().deleteAttachment(id);
    } catch (error) {
      logger.error('Failed to delete attachment', error);
      throw error;
    }
  });

  ipcMain.handle('editor:attachment:list', async () => {
    try {
      return await getAppService().listAttachments();
    } catch (error) {
      logger.error('Failed to list attachments', error);
      throw error;
    }
  });

  ipcMain.handle('editor:attachment:cleanup', async (_, usedIds) => {
    try {
      return await getAppService().cleanupOrphanedAttachments(usedIds);
    } catch (error) {
      logger.error('Failed to cleanup attachments', error);
      throw error;
    }
  });

  // ===== Config =====

  ipcMain.handle('editor:config:get', async () => {
    return getAppService().getConfig();
  });

  ipcMain.handle('editor:config:update', async (_, updates) => {
    return getAppService().updateConfig(updates);
  });

  ipcMain.handle('editor:config:reset', async () => {
    return getAppService().resetConfig();
  });

  logger.info('Editor IPC handlers registered');
}
```

### Task 12.3: 创建模块入口

**文件**: `apps/desktop/src/main/modules/editor/index.ts`

```typescript
/**
 * Editor Module - Desktop Main Process
 */

import { registerEditorIpcHandlers } from './ipc/editor.ipc-handlers';
import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('EditorModule');

export function registerEditorModule(): void {
  InitializationManager.getInstance().registerModule(
    'editor',
    InitializationPhase.FEATURE_MODULES,
    async () => {
      registerEditorIpcHandlers();
      logger.info('Editor module initialized');
    }
  );
}

export { EditorDesktopApplicationService, EditorConfig, AttachmentInfo } from './application/EditorDesktopApplicationService';
```

---

## 📚 技术上下文

### Markdown 处理

- 使用 `marked` 库解析 Markdown
- 支持 GFM (GitHub Flavored Markdown)
- 自动生成 TOC

### 附件存储

- 附件存储在 `userData/attachments/` 目录
- 文件名格式: `{timestamp}-{random}.{ext}`
- 提供清理孤立附件功能

---

## 🔗 依赖关系

- **依赖**: STORY-001 (基础设施)
- **被依赖**: 无直接依赖

---

## 📝 备注

- 需要安装 `marked` 依赖
- PDF 导出功能可后续实现（需要 puppeteer）
- 图片附件考虑添加压缩功能
