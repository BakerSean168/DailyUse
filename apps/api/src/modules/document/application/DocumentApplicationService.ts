// @ts-nocheck
import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Document } from '../domain/Document';
import type { DocumentRepository, PaginatedResult } from '../domain/DocumentRepository.interface';
import { DOCUMENT_REPOSITORY } from '../domain/DocumentRepository.interface';
import type { DocumentVersionRepository } from '../domain/DocumentVersionRepository.interface';
import { DocumentVersion } from '../domain/DocumentVersion';
import type { DocumentServerDTO, DocumentVersionServerDTO, DocumentLinkServerDTO } from '@dailyuse/contracts/editor';


@Injectable()
export class DocumentApplicationService {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly repository: DocumentRepository,
    private readonly versionRepository: DocumentVersionRepository,
    private readonly linkService?: any, // DocumentLinkApplicationService - optional for now
  ) {}

  async createDocument(dto: CreateDocumentDTO & { accountUuid: string }): Promise<DocumentClientDTO> {
    const document = Document.create({
      accountUuid: dto.accountUuid,
      title: dto.title,
      content: dto.content || '',
      folderPath: dto.folderPath || '/',
      tags: dto.tags || [],
    });

    if (document.isFailure) {
      throw new BadRequestException(document.error);
    }

    const doc = document.getValue();
    
    // Increment version to 1 (initial version)
    doc.incrementVersion();
    
    // Save document
    await this.repository.save(doc);
    
    // Create initial version
    const version = DocumentVersion.create({
      documentUuid: doc.uuid,
      versionNumber: 1,
      title: doc.title,
      content: doc.content,
      changedBy: dto.accountUuid,
    });
    
    await this.versionRepository.save(version);
    
    return doc.toClientDTO();
  }

  async findDocuments(
    accountUuid: string,
    query: FindDocumentsQueryDTO
  ): Promise<PaginatedResult<DocumentClientDTO>> {
    const result = await this.repository.findByAccountUuid(accountUuid, {
      page: query.page || 1,
      pageSize: query.pageSize || 20,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      folderPath: query.folderPath,
    });

    return {
      ...result,
      items: result.items.map((doc) => doc.toClientDTO()),
    };
  }

  async findDocumentByUuid(accountUuid: string, uuid: string): Promise<DocumentClientDTO> {
    const document = await this.repository.findByUuid(uuid);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.accountUuid !== accountUuid) {
      throw new ForbiddenException('You do not have access to this document');
    }

    return document.toClientDTO();
  }

  async updateDocument(
    accountUuid: string,
    uuid: string,
    dto: UpdateDocumentDTO
  ): Promise<DocumentClientDTO> {
    const document = await this.repository.findByUuid(uuid);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.accountUuid !== accountUuid) {
      throw new ForbiddenException('You do not have access to this document');
    }

    // Capture previous content for version creation
    const previousContent = document.content;
    const previousTitle = document.title;
    let contentChanged = false;

    if (dto.title !== undefined) {
      const result = document.updateTitle(dto.title);
      if (result.isFailure) throw new BadRequestException(result.error);
    }

    if (dto.content !== undefined) {
      const result = document.updateContent(dto.content);
      if (result.isFailure) throw new BadRequestException(result.error);
      contentChanged = true;
    }

    if (dto.folderPath !== undefined) {
      const result = document.moveTo(dto.folderPath);
      if (result.isFailure) throw new BadRequestException(result.error);
    }

    // Create new version if content changed
    if (contentChanged) {
      document.incrementVersion();
      
      const version = DocumentVersion.create({
        documentUuid: document.uuid,
        versionNumber: document.getCurrentVersionNumber(),
        title: document.title,
        content: document.content,
        changedBy: accountUuid,
        previousContent,
      });
      
      await this.versionRepository.save(version);
    }

    await this.repository.save(document);
    return document.toClientDTO();
  }

  async deleteDocument(accountUuid: string, uuid: string): Promise<void> {
    const document = await this.repository.findByUuid(uuid);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.accountUuid !== accountUuid) {
      throw new ForbiddenException('You do not have access to this document');
    }

    document.softDelete();
    await this.repository.save(document);
  }

  async saveDocumentWithConflictCheck(
    accountUuid: string,
    uuid: string,
    dto: SaveDocumentDTO
  ): Promise<SaveDocumentResponseDTO> {
    const document = await this.repository.findByUuid(uuid);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.accountUuid !== accountUuid) {
      throw new ForbiddenException('You do not have access to this document');
    }

    // Try to update with conflict check
    const result = document.updateWithConflictCheck(
      dto.content,
      dto.lastEditedAt,
      dto.sessionId
    );

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    const { updated, conflict } = result.getValue();

    if (conflict) {
      // Return conflict response
      return {
        success: false,
        conflict: true,
        document: document.toClientDTO(),
        message: 'Edit conflict detected. Another user has modified this document.',
      };
    }

    // Save document
    await this.repository.save(document);

    // Sync links if linkService is available
    if (this.linkService) {
      try {
        await this.linkService.syncLinksForDocument(uuid, dto.content);
      } catch (error) {
        console.error('Failed to sync links:', error);
        // Don't fail the save operation if link sync fails
      }
    }

    return {
      success: true,
      conflict: false,
      document: document.toClientDTO(),
    };
  }
}


