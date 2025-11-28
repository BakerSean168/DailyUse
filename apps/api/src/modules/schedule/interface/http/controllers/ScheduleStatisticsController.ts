import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ScheduleStatisticsApplicationService } from '../../../application/services/ScheduleStatisticsApplicationService';
import { ResponseCode, createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

// 创建 logger 实例
const logger = createLogger('ScheduleStatisticsController');

export class ScheduleStatisticsController {
  private static statisticsService: ScheduleStatisticsApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取应用服务实例（懒加载）
   */
  private static async getStatisticsService(): Promise<ScheduleStatisticsApplicationService> {
    if (!ScheduleStatisticsController.statisticsService) {
      ScheduleStatisticsController.statisticsService =
        await ScheduleStatisticsApplicationService.getInstance();
    }
    return ScheduleStatisticsController.statisticsService;
  }

  /**
   * 从请求中提取用户账户UUID
   */
  private static extractAccountUuid(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      logger.warn('Authentication attempt without Bearer token');
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;

    if (!decoded?.accountUuid) {
      logger.warn('Invalid token: missing accountUuid');
      throw new Error('Invalid token: missing accountUuid');
    }

    return decoded.accountUuid;
  }

  /**
   * 获取账户的统计信息
   * @route GET /api/schedules/statistics
   */
  static async getStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleStatisticsController.extractAccountUuid(req);
      const service = await ScheduleStatisticsController.getStatisticsService();

      logger.info('Getting schedule statistics', { accountUuid });

      // 获取或创建统计（如果不存在则自动初始化）
      const statistics = await service.getOrCreateStatistics(accountUuid);

      logger.info('Statistics retrieved successfully', { accountUuid });

      return ScheduleStatisticsController.responseBuilder.sendSuccess(
        res,
        statistics,
        'Statistics retrieved successfully',
        200,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error getting statistics');
          return ScheduleStatisticsController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        logger.error('Error getting schedule statistics', {
          error: error.message,
        });
        return ScheduleStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to retrieve statistics',
          debug: error.message,
        });
      }

      logger.error('Unknown error getting schedule statistics');
      return ScheduleStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * 获取模块级别的统计数据
   * @route GET /api/schedules/statistics/module/:module
   */
  static async getModuleStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleStatisticsController.extractAccountUuid(req);
      const service = await ScheduleStatisticsController.getStatisticsService();
      const { module } = req.params;

      logger.info('Getting module statistics', { accountUuid, module });

      const statistics = await service.getModuleStatistics(accountUuid, module as any);

      if (!statistics) {
        logger.warn('Module statistics not found', { accountUuid, module });
        return ScheduleStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Module statistics not found',
        });
      }

      logger.info('Module statistics retrieved successfully', { accountUuid, module });

      return ScheduleStatisticsController.responseBuilder.sendSuccess(
        res,
        statistics,
        'Module statistics retrieved successfully',
        200,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error getting module statistics');
          return ScheduleStatisticsController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        logger.error('Error getting module statistics', {
          error: error.message,
        });
        return ScheduleStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to retrieve module statistics',
          debug: error.message,
        });
      }

      logger.error('Unknown error getting module statistics');
      return ScheduleStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * 获取所有模块的统计数据
   * @route GET /api/schedules/statistics/modules
   */
  static async getAllModuleStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleStatisticsController.extractAccountUuid(req);
      const service = await ScheduleStatisticsController.getStatisticsService();

      logger.info('Getting all module statistics', { accountUuid });

      const statistics = await service.getAllModuleStatistics(accountUuid);

      logger.info('All module statistics retrieved successfully', { accountUuid });

      return ScheduleStatisticsController.responseBuilder.sendSuccess(
        res,
        statistics,
        'All module statistics retrieved successfully',
        200,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error getting all module statistics');
          return ScheduleStatisticsController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        logger.error('Error getting all module statistics', {
          error: error.message,
        });
        return ScheduleStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to retrieve all module statistics',
          debug: error.message,
        });
      }

      logger.error('Unknown error getting all module statistics');
      return ScheduleStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * 重新计算账户的统计信息
   * @route POST /api/schedules/statistics/recalculate
   */
  static async recalculateStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleStatisticsController.extractAccountUuid(req);
      const service = await ScheduleStatisticsController.getStatisticsService();

      logger.info('Recalculating schedule statistics', { accountUuid });

      const statistics = await service.recalculateStatistics(accountUuid);

      logger.info('Statistics recalculated successfully', { accountUuid });

      return ScheduleStatisticsController.responseBuilder.sendSuccess(
        res,
        statistics,
        'Statistics recalculated successfully',
        200,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error recalculating statistics');
          return ScheduleStatisticsController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        logger.error('Error recalculating schedule statistics', {
          error: error.message,
        });
        return ScheduleStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to recalculate statistics',
          debug: error.message,
        });
      }

      logger.error('Unknown error recalculating schedule statistics');
      return ScheduleStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * 重置账户的统计信息
   * @route POST /api/schedules/statistics/reset
   */
  static async resetStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleStatisticsController.extractAccountUuid(req);
      const service = await ScheduleStatisticsController.getStatisticsService();

      logger.info('Resetting schedule statistics', { accountUuid });

      await service.resetStatistics(accountUuid);

      logger.info('Statistics reset successfully', { accountUuid });

      return ScheduleStatisticsController.responseBuilder.sendSuccess(
        res,
        null,
        'Statistics reset successfully',
        200,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error resetting statistics');
          return ScheduleStatisticsController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        logger.error('Error resetting schedule statistics', {
          error: error.message,
        });
        return ScheduleStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to reset statistics',
          debug: error.message,
        });
      }

      logger.error('Unknown error resetting schedule statistics');
      return ScheduleStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * 删除账户的统计信息
   * @route DELETE /api/schedules/statistics
   */
  static async deleteStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleStatisticsController.extractAccountUuid(req);
      const service = await ScheduleStatisticsController.getStatisticsService();

      logger.info('Deleting schedule statistics', { accountUuid });

      await service.deleteStatistics(accountUuid);

      logger.info('Statistics deleted successfully', { accountUuid });

      return ScheduleStatisticsController.responseBuilder.sendSuccess(
        res,
        null,
        'Statistics deleted successfully',
        200,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error deleting statistics');
          return ScheduleStatisticsController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        logger.error('Error deleting schedule statistics', {
          error: error.message,
        });
        return ScheduleStatisticsController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to delete statistics',
          debug: error.message,
        });
      }

      logger.error('Unknown error deleting schedule statistics');
      return ScheduleStatisticsController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    }
  }
}
