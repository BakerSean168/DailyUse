/**
 * Search Controller
 * Story 11.2: Obsidian 风格搜索
 */

import { Request, Response, NextFunction } from 'express';
import { SearchApplicationService } from '../../../application/services';
import type { SearchRequest } from '@dailyuse/contracts/repository';
import { SearchMode } from '@dailyuse/contracts/repository';

export class SearchController {
  private searchService: SearchApplicationService;

  constructor() {
    this.searchService = SearchApplicationService.getInstance();
  }

  /**
   * GET /api/v1/repositories/:repositoryUuid/search
   * Query params: query, mode, caseSensitive, useRegex, page, pageSize
   */
  search = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { repositoryUuid } = req.params;
      const {
        query,
        mode = 'all',
        caseSensitive = 'false',
        useRegex = 'false',
        page = '1',
        pageSize = '50',
      } = req.query;

      // 验证参数
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Query parameter is required',
        });
        return;
      }

      const validModes: SearchMode[] = ['all', 'file', 'tag', 'line', 'section', 'path'];
      if (!validModes.includes(mode as SearchMode)) {
        res.status(400).json({
          success: false,
          error: `Invalid search mode. Must be one of: ${validModes.join(', ')}`,
        });
        return;
      }

      // 构建搜索请求
      const searchRequest: SearchRequest = {
        repositoryUuid,
        query: query as string,
        mode: mode as SearchMode,
        caseSensitive: caseSensitive === 'true',
        useRegex: useRegex === 'true',
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
      };

      // 执行搜索
      const result = await this.searchService.search(searchRequest);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}




