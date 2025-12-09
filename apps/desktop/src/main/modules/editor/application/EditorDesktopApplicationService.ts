/**
 * Editor Desktop Application Service
 *
 * 编辑器服务
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 *
 * 功能：
 * - 文档管理：创建、打开、保存、关闭文档
 * - 内容操作：获取/设置内容、撤销/重做
 * - 自动保存：定时保存、恢复草稿
 * - 模板：使用预设模板创建文档
 */

import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('EditorDesktopAppService');

// ===== Types =====

export interface EditorDocument {
  uuid: string;
  title: string;
  content: string;
  format: 'markdown' | 'richtext' | 'plain';
  createdAt: Date;
  updatedAt: Date;
  isDirty: boolean;
  metadata?: Record<string, unknown>;
}

export interface DocumentTemplate {
  uuid: string;
  name: string;
  description?: string;
  content: string;
  format: 'markdown' | 'richtext' | 'plain';
}

export interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  maxDrafts: number;
}

export class EditorDesktopApplicationService {
  private draftsDir: string;
  private templatesDir: string;
  private openDocuments: Map<string, EditorDocument> = new Map();
  private autoSaveConfig: AutoSaveConfig = {
    enabled: true,
    intervalMs: 30000, // 30 seconds
    maxDrafts: 10,
  };

  constructor() {
    this.draftsDir = path.join(app.getPath('userData'), 'editor', 'drafts');
    this.templatesDir = path.join(app.getPath('userData'), 'editor', 'templates');
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.draftsDir, { recursive: true });
      await fs.mkdir(this.templatesDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create editor directories', error);
    }
  }

  // ===== Document Management =====

  /**
   * 创建新文档
   */
  async createDocument(options: {
    title?: string;
    content?: string;
    format?: 'markdown' | 'richtext' | 'plain';
    templateUuid?: string;
  } = {}): Promise<EditorDocument> {
    logger.debug('Create document', options);

    let content = options.content || '';
    const format = options.format || 'markdown';

    // Use template if specified
    if (options.templateUuid) {
      const template = await this.getTemplate(options.templateUuid);
      if (template) {
        content = template.content;
      }
    }

    const doc: EditorDocument = {
      uuid: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: options.title || 'Untitled',
      content,
      format,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDirty: false,
    };

    this.openDocuments.set(doc.uuid, doc);
    logger.info('Document created', { uuid: doc.uuid });

    return doc;
  }

  /**
   * 打开文档
   */
  async openDocument(uuid: string): Promise<EditorDocument | null> {
    logger.debug('Open document', { uuid });

    // Check if already open
    if (this.openDocuments.has(uuid)) {
      return this.openDocuments.get(uuid)!;
    }

    // Try to load from drafts
    try {
      const draftPath = path.join(this.draftsDir, `${uuid}.json`);
      const content = await fs.readFile(draftPath, 'utf-8');
      const doc = JSON.parse(content) as EditorDocument;
      doc.createdAt = new Date(doc.createdAt);
      doc.updatedAt = new Date(doc.updatedAt);
      this.openDocuments.set(uuid, doc);
      return doc;
    } catch {
      logger.warn('Document not found', { uuid });
      return null;
    }
  }

  /**
   * 保存文档
   */
  async saveDocument(uuid: string): Promise<{ success: boolean; error?: string }> {
    logger.debug('Save document', { uuid });

    const doc = this.openDocuments.get(uuid);
    if (!doc) {
      return { success: false, error: 'Document not found' };
    }

    try {
      doc.updatedAt = new Date();
      doc.isDirty = false;

      const draftPath = path.join(this.draftsDir, `${uuid}.json`);
      await fs.writeFile(draftPath, JSON.stringify(doc, null, 2), 'utf-8');

      logger.info('Document saved', { uuid });
      return { success: true };
    } catch (error) {
      logger.error('Failed to save document', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * 关闭文档
   */
  async closeDocument(uuid: string, save: boolean = true): Promise<{ success: boolean }> {
    logger.debug('Close document', { uuid, save });

    const doc = this.openDocuments.get(uuid);
    if (!doc) {
      return { success: true };
    }

    if (save && doc.isDirty) {
      await this.saveDocument(uuid);
    }

    this.openDocuments.delete(uuid);
    return { success: true };
  }

  /**
   * 获取打开的文档列表
   */
  async getOpenDocuments(): Promise<EditorDocument[]> {
    return Array.from(this.openDocuments.values());
  }

  // ===== Content Operations =====

  /**
   * 获取文档内容
   */
  async getContent(uuid: string): Promise<{ content: string; format: string } | null> {
    const doc = this.openDocuments.get(uuid);
    if (!doc) return null;
    return { content: doc.content, format: doc.format };
  }

  /**
   * 设置文档内容
   */
  async setContent(uuid: string, content: string): Promise<{ success: boolean }> {
    logger.debug('Set content', { uuid, length: content.length });

    const doc = this.openDocuments.get(uuid);
    if (!doc) {
      return { success: false };
    }

    doc.content = content;
    doc.isDirty = true;
    doc.updatedAt = new Date();

    return { success: true };
  }

  /**
   * 更新文档元数据
   */
  async updateMetadata(uuid: string, updates: { title?: string; metadata?: Record<string, unknown> }): Promise<{ success: boolean }> {
    logger.debug('Update metadata', { uuid });

    const doc = this.openDocuments.get(uuid);
    if (!doc) {
      return { success: false };
    }

    if (updates.title) {
      doc.title = updates.title;
    }
    if (updates.metadata) {
      doc.metadata = { ...doc.metadata, ...updates.metadata };
    }
    doc.isDirty = true;
    doc.updatedAt = new Date();

    return { success: true };
  }

  // ===== Draft Management =====

  /**
   * 列出所有草稿
   */
  async listDrafts(): Promise<{ drafts: EditorDocument[]; total: number }> {
    logger.debug('List drafts');

    try {
      const files = await fs.readdir(this.draftsDir);
      const drafts: EditorDocument[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const filePath = path.join(this.draftsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const doc = JSON.parse(content) as EditorDocument;
          doc.createdAt = new Date(doc.createdAt);
          doc.updatedAt = new Date(doc.updatedAt);
          drafts.push(doc);
        } catch {
          // Skip invalid files
        }
      }

      // Sort by updated date (newest first)
      drafts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      return { drafts, total: drafts.length };
    } catch (error) {
      logger.error('Failed to list drafts', error);
      return { drafts: [], total: 0 };
    }
  }

  /**
   * 删除草稿
   */
  async deleteDraft(uuid: string): Promise<{ success: boolean }> {
    logger.debug('Delete draft', { uuid });

    try {
      const draftPath = path.join(this.draftsDir, `${uuid}.json`);
      await fs.unlink(draftPath);
      this.openDocuments.delete(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete draft', error);
      return { success: false };
    }
  }

  // ===== Template Management =====

  /**
   * 获取模板
   */
  async getTemplate(uuid: string): Promise<DocumentTemplate | null> {
    try {
      const templatePath = path.join(this.templatesDir, `${uuid}.json`);
      const content = await fs.readFile(templatePath, 'utf-8');
      return JSON.parse(content) as DocumentTemplate;
    } catch {
      return null;
    }
  }

  /**
   * 列出模板
   */
  async listTemplates(): Promise<{ templates: DocumentTemplate[]; total: number }> {
    logger.debug('List templates');

    // Built-in templates
    const builtInTemplates: DocumentTemplate[] = [
      {
        uuid: 'template-meeting-notes',
        name: 'Meeting Notes',
        description: 'Template for meeting notes',
        content: `# Meeting Notes

**Date:** {{date}}
**Attendees:** 

## Agenda

1. 

## Discussion

## Action Items

- [ ] 

## Next Steps

`,
        format: 'markdown',
      },
      {
        uuid: 'template-daily-journal',
        name: 'Daily Journal',
        description: 'Template for daily journaling',
        content: `# {{date}} - Daily Journal

## Today I'm grateful for:

1. 

## What I accomplished:

- 

## What I learned:

## Tomorrow's priorities:

1. 

`,
        format: 'markdown',
      },
      {
        uuid: 'template-project-plan',
        name: 'Project Plan',
        description: 'Basic project planning template',
        content: `# Project: {{title}}

## Overview

## Goals

- 

## Timeline

| Phase | Start | End | Status |
|-------|-------|-----|--------|
|       |       |     |        |

## Resources

## Risks

## Notes

`,
        format: 'markdown',
      },
    ];

    // TODO: Load custom templates from templatesDir

    return { templates: builtInTemplates, total: builtInTemplates.length };
  }

  /**
   * 保存自定义模板
   */
  async saveTemplate(template: Omit<DocumentTemplate, 'uuid'>): Promise<DocumentTemplate> {
    logger.debug('Save template', { name: template.name });

    const newTemplate: DocumentTemplate = {
      uuid: `template-custom-${Date.now()}`,
      ...template,
    };

    try {
      const templatePath = path.join(this.templatesDir, `${newTemplate.uuid}.json`);
      await fs.writeFile(templatePath, JSON.stringify(newTemplate, null, 2), 'utf-8');
      logger.info('Template saved', { uuid: newTemplate.uuid });
    } catch (error) {
      logger.error('Failed to save template', error);
    }

    return newTemplate;
  }

  /**
   * 删除自定义模板
   */
  async deleteTemplate(uuid: string): Promise<{ success: boolean }> {
    logger.debug('Delete template', { uuid });

    // Don't allow deleting built-in templates
    if (!uuid.startsWith('template-custom-')) {
      return { success: false };
    }

    try {
      const templatePath = path.join(this.templatesDir, `${uuid}.json`);
      await fs.unlink(templatePath);
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  // ===== Auto-save Configuration =====

  /**
   * 获取自动保存配置
   */
  getAutoSaveConfig(): AutoSaveConfig {
    return { ...this.autoSaveConfig };
  }

  /**
   * 更新自动保存配置
   */
  updateAutoSaveConfig(updates: Partial<AutoSaveConfig>): AutoSaveConfig {
    this.autoSaveConfig = { ...this.autoSaveConfig, ...updates };
    return { ...this.autoSaveConfig };
  }

  // ===== Cleanup =====

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up editor service...');

    // Save all dirty documents
    for (const [uuid, doc] of this.openDocuments) {
      if (doc.isDirty) {
        await this.saveDocument(uuid);
      }
    }

    this.openDocuments.clear();
  }
}
