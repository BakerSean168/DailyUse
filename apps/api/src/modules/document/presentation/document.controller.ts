// @ts-nocheck
import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DocumentApplicationService } from '../application/DocumentApplicationService';
import type { DocumentServerDTO, DocumentVersionServerDTO, DocumentLinkServerDTO } from '@dailyuse/contracts/editor';

type CreateDocumentDTO = CreateDocumentDTO;
type UpdateDocumentDTO = UpdateDocumentDTO;
type FindDocumentsQueryDTO = FindDocumentsQueryDTO;
type SaveDocumentDTO = SaveDocumentDTO;

interface AuthRequest extends Request {
  user: { accountUuid: string };
}

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(
    private readonly service: DocumentApplicationService,
    private readonly linkService?: any, // DocumentLinkApplicationService - optional for now
  ) {}

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

  // ==================== Link Endpoints ====================

  @Get(':uuid/backlinks')
  async getBacklinks(@Req() req: AuthRequest, @Param('uuid') uuid: string) {
    if (!this.linkService) {
      return { success: false, message: 'Link service not available' };
    }
    
    const result = await this.linkService.getBacklinks(uuid);
    return { success: true, data: result };
  }

  @Get(':uuid/link-graph')
  async getLinkGraph(
    @Req() req: AuthRequest,
    @Param('uuid') uuid: string,
    @Query('depth') depth?: string
  ) {
    if (!this.linkService) {
      return { success: false, message: 'Link service not available' };
    }
    
    const depthNum = depth ? parseInt(depth, 10) : 2;
    const result = await this.linkService.getLinkGraph(uuid, depthNum);
    return { success: true, data: result };
  }

  @Get('links/broken')
  async getBrokenLinks(@Req() req: AuthRequest) {
    if (!this.linkService) {
      return { success: false, message: 'Link service not available' };
    }
    
    const result = await this.linkService.findBrokenLinks();
    return { success: true, data: result };
  }

  @Put('links/:linkUuid/repair')
  async repairBrokenLink(
    @Req() req: AuthRequest,
    @Param('linkUuid') linkUuid: string,
    @Body() dto: { newTargetUuid: string }
  ) {
    if (!this.linkService) {
      return { success: false, message: 'Link service not available' };
    }
    
    await this.linkService.repairBrokenLink(linkUuid, dto.newTargetUuid);
    return { success: true, message: 'Link repaired successfully' };
  }
}


