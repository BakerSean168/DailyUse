// @ts-nocheck
/**
 * PrismaDocumentVersionRepository
 * 
 * Prisma 实现 - 文档版本仓储
 * 使用 Prisma ORM 实现版本数据持久化
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type {
  DocumentVersionRepository,
  FindVersionsOptions,
} from '../domain/DocumentVersionRepository.interface';
import { DocumentVersion } from '../domain/DocumentVersion';

@Injectable()
export class PrismaDocumentVersionRepository implements DocumentVersionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(version: DocumentVersion): Promise<void> {
    const data = version.toPersistence();
    
    await this.prisma.document_version.create({
      data,
    });
  }

  async findByDocumentUuid(
    documentUuid: string,
    options: FindVersionsOptions = {},
  ): Promise<DocumentVersion[]> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'versionNumber',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * pageSize;
    const orderBy = sortBy === 'versionNumber' 
      ? { version_number: sortOrder }
      : { created_at: sortOrder };

    const records = await this.prisma.document_version.findMany({
      where: {
        document_uuid: documentUuid,
      },
      orderBy,
      skip,
      take: pageSize,
    });

    return records.map((record) =>
      DocumentVersion.fromPersistence({
        uuid: record.uuid,
        documentUuid: record.document_uuid,
        versionNumber: record.version_number,
        title: record.title,
        content: record.content,
        changeType: record.change_type,
        changeDescription: record.change_description,
        changedBy: record.changed_by,
        restoredFrom: record.restored_from,
        metadata: record.metadata,
        createdAt: record.created_at,
      }),
    );
  }

  async findByUuid(uuid: string): Promise<DocumentVersion | null> {
    const record = await this.prisma.document_version.findUnique({
      where: { uuid },
    });

    if (!record) {
      return null;
    }

    return DocumentVersion.fromPersistence({
      uuid: record.uuid,
      documentUuid: record.document_uuid,
      versionNumber: record.version_number,
      title: record.title,
      content: record.content,
      changeType: record.change_type,
      changeDescription: record.change_description,
      changedBy: record.changed_by,
      restoredFrom: record.restored_from,
      metadata: record.metadata,
      createdAt: record.created_at,
    });
  }

  async findByVersionNumber(
    documentUuid: string,
    versionNumber: number,
  ): Promise<DocumentVersion | null> {
    const record = await this.prisma.document_version.findUnique({
      where: {
        document_uuid_version_number: {
          document_uuid: documentUuid,
          version_number: versionNumber,
        },
      },
    });

    if (!record) {
      return null;
    }

    return DocumentVersion.fromPersistence({
      uuid: record.uuid,
      documentUuid: record.document_uuid,
      versionNumber: record.version_number,
      title: record.title,
      content: record.content,
      changeType: record.change_type,
      changeDescription: record.change_description,
      changedBy: record.changed_by,
      restoredFrom: record.restored_from,
      metadata: record.metadata,
      createdAt: record.created_at,
    });
  }

  async countByDocumentUuid(documentUuid: string): Promise<number> {
    return this.prisma.document_version.count({
      where: {
        document_uuid: documentUuid,
      },
    });
  }
}
