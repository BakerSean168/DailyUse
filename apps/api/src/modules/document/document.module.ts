// @ts-nocheck
import { Module } from '@nestjs/common';
import { DocumentController } from './presentation/document.controller';
import { DocumentVersionController } from './api/DocumentVersionController';
import { DocumentApplicationService } from './application/DocumentApplicationService';
import { DocumentVersionApplicationService } from './application/DocumentVersionApplicationService';
import { PrismaDocumentRepository } from './infrastructure/PrismaDocumentRepository';
import { PrismaDocumentVersionRepository } from './infrastructure/PrismaDocumentVersionRepository';
import { DOCUMENT_REPOSITORY } from './domain/DocumentRepository.interface';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentController, DocumentVersionController],
  providers: [
    DocumentApplicationService,
    DocumentVersionApplicationService,
    {
      provide: DOCUMENT_REPOSITORY,
      useClass: PrismaDocumentRepository,
    },
    {
      provide: 'DocumentVersionRepository',
      useClass: PrismaDocumentVersionRepository,
    },
    PrismaDocumentVersionRepository,
  ],
  exports: [DocumentApplicationService, DocumentVersionApplicationService],
})
export class DocumentModule {}
