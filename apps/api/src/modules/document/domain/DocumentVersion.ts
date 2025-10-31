/**
 * DocumentVersion Aggregate Root
 * 
 * DDD 聚合根 - 文档版本
 * 负责文档版本的业务逻辑和生命周期管理
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  DocumentVersionServerDTO,
  DocumentVersionClientDTO,
} from '@dailyuse/contracts';

export type ChangeType = 'initial' | 'major' | 'minor' | 'patch' | 'restore';

export interface DocumentVersionMetadata {
  addedChars: number;
  deletedChars: number;
  modifiedSections: number;
}

export interface DocumentVersionProps {
  uuid: string;
  documentUuid: string;
  versionNumber: number;
  title: string;
  content: string;
  changeType: ChangeType;
  changeDescription?: string;
  changedBy: string;
  restoredFrom?: string;
  metadata?: DocumentVersionMetadata;
  createdAt: number;
}

export class DocumentVersion {
  private constructor(private readonly props: DocumentVersionProps) {}

  // ==================== Getters ====================

  get uuid(): string {
    return this.props.uuid;
  }

  get documentUuid(): string {
    return this.props.documentUuid;
  }

  get versionNumber(): number {
    return this.props.versionNumber;
  }

  get title(): string {
    return this.props.title;
  }

  get content(): string {
    return this.props.content;
  }

  get changeType(): ChangeType {
    return this.props.changeType;
  }

  get changeDescription(): string | undefined {
    return this.props.changeDescription;
  }

  get changedBy(): string {
    return this.props.changedBy;
  }

  get restoredFrom(): string | undefined {
    return this.props.restoredFrom;
  }

  get metadata(): DocumentVersionMetadata | undefined {
    return this.props.metadata;
  }

  get createdAt(): number {
    return this.props.createdAt;
  }

  // ==================== Factory Methods ====================

  /**
   * 创建新版本 (从文档内容创建)
   */
  static create(params: {
    documentUuid: string;
    versionNumber: number;
    title: string;
    content: string;
    changedBy: string;
    previousContent?: string;
    restoredFrom?: string;
  }): DocumentVersion {
    const { documentUuid, versionNumber, title, content, changedBy, previousContent, restoredFrom } = params;

    // 自动判断变更类型
    const changeType = restoredFrom 
      ? 'restore' 
      : versionNumber === 1 
      ? 'initial' 
      : DocumentVersion.detectChangeType(previousContent || '', content);

    // 计算变更统计
    const metadata = previousContent 
      ? DocumentVersion.calculateMetadata(previousContent, content)
      : { addedChars: content.length, deletedChars: 0, modifiedSections: 0 };

    // 生成变更描述
    const changeDescription = DocumentVersion.generateChangeDescription(
      changeType,
      metadata,
      restoredFrom,
    );

    return new DocumentVersion({
      uuid: uuidv4(),
      documentUuid,
      versionNumber,
      title,
      content,
      changeType,
      changeDescription,
      changedBy,
      restoredFrom,
      metadata,
      createdAt: Date.now(),
    });
  }

  /**
   * 从持久化数据恢复
   */
  static fromPersistence(data: {
    uuid: string;
    documentUuid: string;
    versionNumber: number;
    title: string;
    content: string;
    changeType: string;
    changeDescription?: string | null;
    changedBy: string;
    restoredFrom?: string | null;
    metadata?: any;
    createdAt: number;
  }): DocumentVersion {
    return new DocumentVersion({
      uuid: data.uuid,
      documentUuid: data.documentUuid,
      versionNumber: data.versionNumber,
      title: data.title,
      content: data.content,
      changeType: data.changeType as ChangeType,
      changeDescription: data.changeDescription || undefined,
      changedBy: data.changedBy,
      restoredFrom: data.restoredFrom || undefined,
      metadata: data.metadata as DocumentVersionMetadata | undefined,
      createdAt: data.createdAt,
    });
  }

  // ==================== Business Logic ====================

  /**
   * 检测变更类型 (基于内容长度变化)
   */
  private static detectChangeType(oldContent: string, newContent: string): ChangeType {
    const lengthDiff = Math.abs(newContent.length - oldContent.length);

    if (lengthDiff > 100) return 'major';  // 主要修改
    if (lengthDiff > 20) return 'minor';   // 次要修改
    return 'patch';                        // 小修改
  }

  /**
   * 计算变更统计元数据
   */
  private static calculateMetadata(
    oldContent: string,
    newContent: string,
  ): DocumentVersionMetadata {
    const oldLength = oldContent.length;
    const newLength = newContent.length;

    const addedChars = Math.max(0, newLength - oldLength);
    const deletedChars = Math.max(0, oldLength - newLength);

    // 简单计算修改的段落数 (按换行符分割)
    const oldSections = oldContent.split('\n').filter((s) => s.trim()).length;
    const newSections = newContent.split('\n').filter((s) => s.trim()).length;
    const modifiedSections = Math.abs(newSections - oldSections);

    return {
      addedChars,
      deletedChars,
      modifiedSections,
    };
  }

  /**
   * 生成变更描述
   */
  private static generateChangeDescription(
    changeType: ChangeType,
    metadata: DocumentVersionMetadata,
    restoredFrom?: string,
  ): string {
    if (changeType === 'restore') {
      return restoredFrom 
        ? `恢复到历史版本` 
        : '版本恢复';
    }

    if (changeType === 'initial') {
      return '初始版本';
    }

    const { addedChars, deletedChars } = metadata;
    const parts: string[] = [];

    if (addedChars > 0) {
      parts.push(`新增 ${addedChars} 字符`);
    }
    if (deletedChars > 0) {
      parts.push(`删除 ${deletedChars} 字符`);
    }

    return parts.length > 0 ? parts.join(', ') : '内容更新';
  }

  /**
   * 生成摘要 (前 200 字符)
   */
  getExcerpt(): string {
    const maxLength = 200;
    if (this.content.length <= maxLength) {
      return this.content;
    }
    return this.content.substring(0, maxLength) + '...';
  }

  // ==================== DTO Conversions ====================

  /**
   * 转换为 Server DTO (完整数据)
   */
  toServerDTO(): DocumentVersionServerDTO {
    return {
      uuid: this.uuid,
      documentUuid: this.documentUuid,
      versionNumber: this.versionNumber,
      title: this.title,
      content: this.content,
      changeType: this.changeType,
      changeDescription: this.changeDescription,
      changedBy: this.changedBy,
      restoredFrom: this.restoredFrom,
      metadata: this.metadata,
      createdAt: this.createdAt,
    };
  }

  /**
   * 转换为 Client DTO (简化数据，用于列表显示)
   */
  toClientDTO(): DocumentVersionClientDTO {
    return {
      uuid: this.uuid,
      versionNumber: this.versionNumber,
      title: this.title,
      changeType: this.changeType,
      changeDescription: this.changeDescription,
      changedBy: this.changedBy,
      createdAt: this.createdAt,
      excerpt: this.getExcerpt(),
    };
  }

  /**
   * 转换为持久化格式
   */
  toPersistence(): {
    uuid: string;
    document_uuid: string;
    version_number: number;
    title: string;
    content: string;
    change_type: string;
    change_description: string | null;
    changed_by: string;
    restored_from: string | null;
    metadata: any;
    created_at: number;
  } {
    return {
      uuid: this.uuid,
      document_uuid: this.documentUuid,
      version_number: this.versionNumber,
      title: this.title,
      content: this.content,
      change_type: this.changeType,
      change_description: this.changeDescription || null,
      changed_by: this.changedBy,
      restored_from: this.restoredFrom || null,
      metadata: this.metadata || null,
      created_at: this.createdAt,
    };
  }
}
