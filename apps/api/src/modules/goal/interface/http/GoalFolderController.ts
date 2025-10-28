import type { Response } from 'express';
import type { AuthenticatedRequest } from '@/shared/middlewares/authMiddleware';
import { GoalFolderApplicationService } from '../../application/services/GoalFolderApplicationService';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalFolderController');

/**
 * GoalFolder 控制器
 * 负责处理文件夹相关的 HTTP 请求和响应
 *
 * 职责：
 * - 解析 HTTP 请求参数
 * - 调用应用服务处理业务逻辑
 * - 格式化响应（统一使用 ResponseBuilder）
 * - 异常处理和错误响应
 */
export class GoalFolderController {
  private static folderService: GoalFolderApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化应用服务（延迟加载）
   */
  private static async getFolderService(): Promise<GoalFolderApplicationService> {
    if (!GoalFolderController.folderService) {
      GoalFolderController.folderService = await GoalFolderApplicationService.getInstance();
    }
    return GoalFolderController.folderService;
  }

  /**
   * 创建文件夹
   * @route POST /api/goal-folders
   */
  static async createFolder(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = await GoalFolderController.getFolderService();
      const { accountUuid, ...params } = req.body;

      logger.info('Creating goal folder', { accountUuid });

      const folder = await service.createFolder(accountUuid, params);

      logger.info('Goal folder created successfully', { folderUuid: folder.uuid });
      return GoalFolderController.responseBuilder.sendSuccess(
        res,
        folder,
        'Goal folder created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating goal folder', { error: error.message });
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalFolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取文件夹详情
   * @route GET /api/goal-folders/:uuid
   */
  static async getFolder(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await GoalFolderController.getFolderService();
      const folder = await service.getFolder(uuid);

      if (!folder) {
        logger.warn('Goal folder not found', { uuid });
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Goal folder not found',
        });
      }

      return GoalFolderController.responseBuilder.sendSuccess(
        res,
        folder,
        'Goal folder retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving goal folder', { error: error.message });
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalFolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 查询文件夹列表
   * @route GET /api/goal-folders
   */
  static async queryFolders(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = await GoalFolderController.getFolderService();

      // 从认证中间件注入的 user 对象中获取 accountUuid
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      const folders = await service.getFoldersByAccount(accountUuid);

      return GoalFolderController.responseBuilder.sendSuccess(
        res,
        { folders, total: folders.length },
        'Goal folders retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error querying goal folders', { error: error.message });
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalFolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新文件夹
   * @route PATCH /api/goal-folders/:uuid
   */
  static async updateFolder(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await GoalFolderController.getFolderService();

      logger.info('Updating goal folder', { folderUuid: uuid });

      const folder = await service.updateFolder(uuid, req.body);

      logger.info('Goal folder updated successfully', { folderUuid: uuid });
      return GoalFolderController.responseBuilder.sendSuccess(
        res,
        folder,
        'Goal folder updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating goal folder', { error: error.message });
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalFolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除文件夹
   * @route DELETE /api/goal-folders/:uuid
   */
  static async deleteFolder(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await GoalFolderController.getFolderService();

      logger.info('Deleting goal folder', { folderUuid: uuid });

      await service.deleteFolder(uuid);

      logger.info('Goal folder deleted successfully', { folderUuid: uuid });
      return GoalFolderController.responseBuilder.sendSuccess(
        res,
        { success: true },
        'Goal folder deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting goal folder', { error: error.message });
        return GoalFolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalFolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}
