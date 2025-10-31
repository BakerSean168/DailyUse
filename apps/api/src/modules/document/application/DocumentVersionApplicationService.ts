// @ts-nocheck
/**
 * DocumentVersionApplicationService
 * 
 * 应用服务 - 文档版本管理
 * 处理版本历史、比较、恢复等业务用例
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { diff_match_patch } from 'diff-match-patch';
import type { DocumentVersionRepository } from '../domain/DocumentVersionRepository.interface';
import type { DocumentRepository } from '../domain/DocumentRepository.interface';
import { DocumentVersion } from '../domain/DocumentVersion';

export interface GetVersionHistoryParams {
  documentUuid: string;
  page?: number;
  pageSize?: number;
}

export interface CompareVersionsParams {
  documentUuid: string;
  fromVersion: number;
  toVersion: number;
}

export interface RestoreVersionParams {
  documentUuid: string;
  versionNumber: number;
  accountUuid: string;
}

export interface VersionDiff {
  lineNumber: number;
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

@Injectable()
export class DocumentVersionApplicationService {
  private dmp = new diff_match_patch();

  constructor(
    private readonly versionRepository: DocumentVersionRepository,
    private readonly documentRepository: DocumentRepository,
  ) {}

  /**
   * 获取文档版本历史 (分页)
   */
  async getVersionHistory(params: GetVersionHistoryParams) {
    const { documentUuid, page = 1, pageSize = 20 } = params;

    // 验证文档是否存在
    const document = await this.documentRepository.findByUuid(documentUuid);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const [versions, total] = await Promise.all([
      this.versionRepository.findByDocumentUuid(documentUuid, {
        page,
        pageSize,
        sortBy: 'versionNumber',
        sortOrder: 'desc',
      }),
      this.versionRepository.countByDocumentUuid(documentUuid),
    ]);

    return {
      items: versions.map((v) => v.toClientDTO()),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取单个版本详情 (包含完整内容)
   */
  async getVersionByUuid(versionUuid: string) {
    const version = await this.versionRepository.findByUuid(versionUuid);
    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return version.toServerDTO();
  }

  /**
   * 获取指定版本号的快照
   */
  async getVersionSnapshot(documentUuid: string, versionNumber: number) {
    const version = await this.versionRepository.findByVersionNumber(
      documentUuid,
      versionNumber,
    );
    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return version.toServerDTO();
  }

  /**
   * 比较两个版本的差异 (Git-style diff)
   */
  async compareVersions(params: CompareVersionsParams) {
    const { documentUuid, fromVersion, toVersion } = params;

    // 获取两个版本
    const [from, to] = await Promise.all([
      this.versionRepository.findByVersionNumber(documentUuid, fromVersion),
      this.versionRepository.findByVersionNumber(documentUuid, toVersion),
    ]);

    if (!from || !to) {
      throw new NotFoundException('One or both versions not found');
    }

    // 使用 diff-match-patch 生成 diff
    const diffs = this.dmp.diff_main(from.content, to.content);
    this.dmp.diff_cleanupSemantic(diffs);

    // 转换为行级 diff
    const lineDiffs = this.convertToLineDiffs(diffs);

    return {
      fromVersion: {
        versionNumber: from.versionNumber,
        title: from.title,
        createdAt: from.createdAt,
      },
      toVersion: {
        versionNumber: to.versionNumber,
        title: to.title,
        createdAt: to.createdAt,
      },
      diffs: lineDiffs,
      summary: {
        addedLines: lineDiffs.filter((d) => d.type === 'added').length,
        removedLines: lineDiffs.filter((d) => d.type === 'removed').length,
        unchangedLines: lineDiffs.filter((d) => d.type === 'unchanged').length,
      },
    };
  }

  /**
   * 恢复到历史版本 (创建新版本)
   */
  async restoreVersion(params: RestoreVersionParams) {
    const { documentUuid, versionNumber, accountUuid } = params;

    // 获取目标版本
    const targetVersion = await this.versionRepository.findByVersionNumber(
      documentUuid,
      versionNumber,
    );
    if (!targetVersion) {
      throw new NotFoundException('Target version not found');
    }

    // 获取当前文档
    const document = await this.documentRepository.findByUuid(documentUuid);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // 更新文档内容为目标版本的内容
    const updateResult = document.updateContent(targetVersion.content);
    if (updateResult.isFailure) {
      throw new Error(updateResult.error);
    }

    const titleUpdateResult = document.updateTitle(targetVersion.title);
    if (titleUpdateResult.isFailure) {
      throw new Error(titleUpdateResult.error);
    }

    // 增加版本号
    document.incrementVersion();

    // 保存文档
    await this.documentRepository.save(document);

    // 创建新版本记录 (标记为 restore)
    const newVersion = DocumentVersion.create({
      documentUuid,
      versionNumber: document.getCurrentVersionNumber(),
      title: targetVersion.title,
      content: targetVersion.content,
      changedBy: accountUuid,
      restoredFrom: targetVersion.uuid,
    });

    await this.versionRepository.save(newVersion);

    return newVersion.toServerDTO();
  }

  /**
   * 将 diff-match-patch 的 diffs 转换为行级 diff
   */
  private convertToLineDiffs(diffs: any[]): VersionDiff[] {
    const result: VersionDiff[] = [];
    let lineNumber = 1;

    for (const [operation, text] of diffs) {
      const lines = text.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        if (i === lines.length - 1 && lines[i] === '') {
          continue; // Skip empty last line
        }

        const type = operation === 1 ? 'added' : operation === -1 ? 'removed' : 'unchanged';
        result.push({
          lineNumber: lineNumber++,
          type,
          content: lines[i],
        });
      }
    }

    return result;
  }
}
