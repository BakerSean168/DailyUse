import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { DocumentLink } from '../domain/DocumentLink';
import { DocumentLinkRepository } from '../domain/DocumentLinkRepository.interface';

@Injectable()
export class PrismaDocumentLinkRepository implements DocumentLinkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(link: DocumentLink): Promise<void> {
    const data = link.toPersistence();
    await this.prisma.documentLink.upsert({
      where: { uuid: data.uuid },
      create: data,
      update: {
        targetDocumentUuid: data.targetDocumentUuid,
        linkText: data.linkText,
        linkPosition: data.linkPosition,
        isBroken: data.isBroken,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findBySourceDocument(sourceDocumentUuid: string): Promise<DocumentLink[]> {
    const raw = await this.prisma.documentLink.findMany({
      where: { sourceDocumentUuid },
      orderBy: { linkPosition: 'asc' },
    });

    const links: DocumentLink[] = [];
    for (const item of raw) {
      const result = DocumentLink.fromPersistence({
        uuid: item.uuid,
        sourceDocumentUuid: item.sourceDocumentUuid,
        targetDocumentUuid: item.targetDocumentUuid,
        linkText: item.linkText,
        linkPosition: item.linkPosition,
        isBroken: item.isBroken,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      if (result.isSuccess) {
        links.push(result.getValue());
      }
    }
    return links;
  }

  async findByTargetDocument(targetDocumentUuid: string): Promise<DocumentLink[]> {
    const raw = await this.prisma.documentLink.findMany({
      where: { 
        targetDocumentUuid,
        isBroken: false, // Only return non-broken backlinks
      },
      orderBy: { createdAt: 'desc' },
    });

    const links: DocumentLink[] = [];
    for (const item of raw) {
      const result = DocumentLink.fromPersistence({
        uuid: item.uuid,
        sourceDocumentUuid: item.sourceDocumentUuid,
        targetDocumentUuid: item.targetDocumentUuid,
        linkText: item.linkText,
        linkPosition: item.linkPosition,
        isBroken: item.isBroken,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      if (result.isSuccess) {
        links.push(result.getValue());
      }
    }
    return links;
  }

  async findBrokenLinks(): Promise<DocumentLink[]> {
    const raw = await this.prisma.documentLink.findMany({
      where: { isBroken: true },
      orderBy: { updatedAt: 'desc' },
    });

    const links: DocumentLink[] = [];
    for (const item of raw) {
      const result = DocumentLink.fromPersistence({
        uuid: item.uuid,
        sourceDocumentUuid: item.sourceDocumentUuid,
        targetDocumentUuid: item.targetDocumentUuid,
        linkText: item.linkText,
        linkPosition: item.linkPosition,
        isBroken: item.isBroken,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      if (result.isSuccess) {
        links.push(result.getValue());
      }
    }
    return links;
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.documentLink.delete({ where: { uuid } });
  }

  async deleteBySourceDocument(sourceDocumentUuid: string): Promise<void> {
    await this.prisma.documentLink.deleteMany({ where: { sourceDocumentUuid } });
  }

  async markLinksAsBroken(targetDocumentUuid: string): Promise<void> {
    await this.prisma.documentLink.updateMany({
      where: { targetDocumentUuid },
      data: {
        isBroken: true,
        targetDocumentUuid: null,
        updatedAt: Math.floor(Date.now() / 1000),
      },
    });
  }
}
