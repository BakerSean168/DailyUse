/**
 * Story 11.5: 标签统计与过滤
 * 
 * 标签控制器 - 提供 Tag 相关的 HTTP 接口
 */

import type { Request, Response, NextFunction } from 'express';
import { TagsApplicationService } from '../../../application/services/TagsApplicationService';

export class TagsController {
  private tagsService: TagsApplicationService;

  constructor() {
    this.tagsService = TagsApplicationService.getInstance();
  }

  /**
   * 获取仓储的标签统计
   * AC #1: Tag 统计 API
   * 
   * GET /api/tags/statistics/:repositoryUuid
   * 
   * @param repositoryUuid 仓储 UUID
   * @returns 标签统计列表
   */
  getStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { repositoryUuid } = req.params;

      const statistics = await this.tagsService.getTagStatistics(repositoryUuid);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  };
}
