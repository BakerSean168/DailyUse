import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DocumentApplicationService } from '../application/DocumentApplicationService';
import type { DocumentContracts } from '@dailyuse/contracts';

type CreateDocumentDTO = DocumentContracts.CreateDocumentDTO;
type UpdateDocumentDTO = DocumentContracts.UpdateDocumentDTO;
type FindDocumentsQueryDTO = DocumentContracts.FindDocumentsQueryDTO;
type SaveDocumentDTO = DocumentContracts.SaveDocumentDTO;

interface AuthRequest extends Request {
  user: { accountUuid: string };
}

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly service: DocumentApplicationService) {}

  @Post()
  async createDocument(@Req() req: AuthRequest, @Body() dto: CreateDocumentDTO) {
    const result = await this.service.createDocument({
      ...dto,
      accountUuid: req.user.accountUuid,
    });
    return { success: true, data: result };
  }

  @Get()
  async findDocuments(@Req() req: AuthRequest, @Query() query: FindDocumentsQueryDTO) {
    const result = await this.service.findDocuments(req.user.accountUuid, query);
    return { success: true, data: result };
  }

  @Get(':uuid')
  async findDocumentByUuid(@Req() req: AuthRequest, @Param('uuid') uuid: string) {
    const result = await this.service.findDocumentByUuid(req.user.accountUuid, uuid);
    return { success: true, data: result };
  }

  @Put(':uuid')
  async updateDocument(
    @Req() req: AuthRequest,
    @Param('uuid') uuid: string,
    @Body() dto: UpdateDocumentDTO
  ) {
    const result = await this.service.updateDocument(req.user.accountUuid, uuid, dto);
    return { success: true, data: result };
  }

  @Delete(':uuid')
  async deleteDocument(@Req() req: AuthRequest, @Param('uuid') uuid: string) {
    await this.service.deleteDocument(req.user.accountUuid, uuid);
    return { success: true, message: 'Document deleted successfully' };
  }

  @Put(':uuid/save')
  async saveDocument(
    @Req() req: AuthRequest,
    @Param('uuid') uuid: string,
    @Body() dto: SaveDocumentDTO
  ) {
    const result = await this.service.saveDocumentWithConflictCheck(
      req.user.accountUuid,
      uuid,
      dto
    );
    return result;
  }
}
