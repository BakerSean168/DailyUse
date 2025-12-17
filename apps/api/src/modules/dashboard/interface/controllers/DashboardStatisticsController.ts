/**
 * @file DashboardStatisticsController.ts
 * @description Dashboard 统计控制器，处理 Dashboard 统计相关的 HTTP 请求。
 * @date 2025-01-22
 */

import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { DashboardStatisticsApplicationService } from '../../application/services/DashboardStatisticsApplicationService';

/**
 * Dashboard 统计控制器。
 *
 * @remarks
 * **职责**:
 * - 处理 HTTP 请求
 * - 参数验证
 * - 错误处理
 * - 响应格式化
 *
 * 架构层次：Interface Layer
 */
export class DashboardStatisticsController {
  /**
   * 获取 Dashboard 统计数据。
   *
   * @route GET /api/dashboard/statistics
   *
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   */
  static async getStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 从认证中间件获取 accountUuid
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Account UUID not found in request',
          },
        });
        return;
      }

      // 调用应用服务
      const service = await DashboardStatisticsApplicationService.getInstance();
      const statistics = await service.getDashboardStatistics(accountUuid);

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error('[DashboardController] 获取统计数据失败:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      });
    }
  }

  /**
   * 手动失效缓存。
   *
   * @route POST /api/dashboard/statistics/invalidate
   *
   * @param req - AuthenticatedRequest
   * @param res - Express 响应对象
   */
  static async invalidateCache(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Account UUID not found in request',
          },
        });
        return;
      }

      const service = await DashboardStatisticsApplicationService.getInstance();
      await service.invalidateCache(accountUuid);

      res.status(200).json({
        success: true,
        message: 'Cache invalidated successfully',
      });
    } catch (error) {
      console.error('[DashboardController] 失效缓存失败:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      });
    }
  }

  /**
   * 获取缓存统计信息（管理员）。
   *
   * @route GET /api/dashboard/cache/stats
   *
   * @param req - Express 请求对象
   * @param res - Express 响应对象
   */
  static async getCacheStats(req: Request, res: Response): Promise<void> {
    try {
      const service = await DashboardStatisticsApplicationService.getInstance();
      const cacheService = (service as any).cacheService;

      if (!cacheService) {
        res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Cache service not available',
          },
        });
        return;
      }

      const stats = await cacheService.getStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('[DashboardController] 获取缓存统计失败:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      });
    }
  }
}
