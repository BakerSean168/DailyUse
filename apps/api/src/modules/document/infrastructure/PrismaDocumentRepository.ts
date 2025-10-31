// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Document } from '../domain/Document';
import { DocumentRepository, FindOptions, PaginatedResult } from '../domain/DocumentRepository.interface';

@Injectable()
export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(document: Document): Promise<void> {
    const data = document.toPersistence();
    await this.prisma.document.upsert({
      where: { uuid: data.uuid },
      create: data,
      update: {
        title: data.title,
        content: data.content,
        folderPath: data.folderPath,
        tags: data.tags,
        status: data.status,
        currentVersion: data.currentVersion,
        lastVersionedAt: data.lastVersionedAt,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt,
      },
    });
  }

  async findByUuid(uuid: string): Promise<Document | null> {
    const raw = await this.prisma.document.findUnique({ where: { uuid } });
    if (!raw) return null;
    
    const result = Document.fromPersistence({
      uuid: raw.uuid,
      accountUuid: raw.accountUuid,
      title: raw.title,
      content: raw.content,
      folderPath: raw.folderPath,
      tags: raw.tags,
      status: raw.status as any,
      currentVersion: raw.currentVersion,
      lastVersionedAt: raw.lastVersionedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
    
    return result.isSuccess ? result.getValue() : null;
  }

  async findByAccountUuid(accountUuid: string, options: FindOptions): Promise<PaginatedResult<Document>> {
    const { page, pageSize, sortBy = 'updatedAt', sortOrder = 'desc', folderPath } = options;
    const where = { accountUuid, deletedAt: null, ...(folderPath && { folderPath }) };

    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.document.count({ where }),
    ]);

    const documents = items
      .map((item) => Document.fromPersistence({
        uuid: item.uuid,
        accountUuid: item.accountUuid,
        title: item.title,
        content: item.content,
        folderPath: item.folderPath,
        tags: item.tags,
        status: item.status as any,
        currentVersion: item.currentVersion,
        lastVersionedAt: item.lastVersionedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        deletedAt: item.deletedAt,
      }))
      .filter((result) => result.isSuccess)
      .map((result) => result.getValue());

    return {
      items: documents,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.document.delete({ where: { uuid } });
  }
}
