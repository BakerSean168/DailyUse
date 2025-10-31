// @ts-nocheck
/**
 * DocumentVersionController
 * 
 * API 控制器 - 文档版本管理
 * 提供版本历史、比较、恢复等 REST API
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../infrastructure/auth/JwtAuthGuard';
import { DocumentVersionApplicationService } from '../application/DocumentVersionApplicationService';

@Controller('documents/:documentUuid/versions')
@UseGuards(JwtAuthGuard)
export class DocumentVersionController {
  constructor(
    private readonly versionService: DocumentVersionApplicationService,
  ) {}

  /**
   * GET /documents/:documentUuid/versions
   * 获取文档版本历史 (分页列表)
   */
  @Get()
  async getVersionHistory(
    @Param('documentUuid') documentUuid: string,
    @Query('page', ParseIntPipe) page = 1,
    @Query('pageSize', ParseIntPipe) pageSize = 20,
  ) {
    return this.versionService.getVersionHistory({
      documentUuid,
      page,
      pageSize,
    });
  }

  /**
   * GET /documents/:documentUuid/versions/:versionUuid
   * 获取单个版本详情 (包含完整内容)
   */
  @Get(':versionUuid')
  async getVersion(@Param('versionUuid') versionUuid: string) {
    return this.versionService.getVersionByUuid(versionUuid);
  }

  /**
   * GET /documents/:documentUuid/versions/snapshot/:versionNumber
   * 获取指定版本号的快照
   */
  @Get('snapshot/:versionNumber')
  async getVersionSnapshot(
    @Param('documentUuid') documentUuid: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
  ) {
    return this.versionService.getVersionSnapshot(documentUuid, versionNumber);
  }

  /**
   * POST /documents/:documentUuid/versions/compare
   * 比较两个版本的差异
   */
  @Post('compare')
  async compareVersions(
    @Param('documentUuid') documentUuid: string,
    @Body() body: { fromVersion: number; toVersion: number },
  ) {
    return this.versionService.compareVersions({
      documentUuid,
      fromVersion: body.fromVersion,
      toVersion: body.toVersion,
    });
  }

  /**
   * POST /documents/:documentUuid/versions/:versionNumber/restore
   * 恢复到指定版本 (创建新版本)
   */
  @Post(':versionNumber/restore')
  async restoreVersion(
    @Request() req: any,
    @Param('documentUuid') documentUuid: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
  ) {
    return this.versionService.restoreVersion({
      documentUuid,
      versionNumber,
      accountUuid: req.user.accountUuid,
    });
  }
}
