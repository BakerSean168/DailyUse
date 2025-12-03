import type { Request, Response } from 'express';
import { FolderApplicationService } from '../../../application/services';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../../shared/infrastructure/http/middlewares/authMiddleware';

const logger = createLogger('FolderController');

/**
 * Folder 控制器
 * 使用单例模式获取应用服务
 */
export class FolderController {
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取应用服务单例
   */
  private static getFolderService(): FolderApplicationService {
    return FolderApplicationService.getInstance();
  }

  /**
   * 创建文件夹
   * @route POST /api/repositories/:repositoryUuid/folders
   */
  static async createFolder(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = FolderController.getFolderService();
      const { repositoryUuid } = req.params;

      logger.info('Creating folder', { repositoryUuid });

      const folder = await service.createFolder({
        ...req.body,
        repositoryUuid,
      });

      logger.info('Folder created successfully', { folderUuid: folder.uuid });
      return FolderController.responseBuilder.sendSuccess(
        res,
        folder,
        'Folder created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating folder', { error: error.message });
        return FolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取文件夹树
   * @route GET /api/repositories/:repositoryUuid/folders/tree
   */
  static async getFolderTree(req: Request, res: Response): Promise<Response> {
    try {
      const service = FolderController.getFolderService();
      const { repositoryUuid } = req.params;

      logger.info('Getting folder tree', { repositoryUuid });

      const tree = await service.getFolderTree(repositoryUuid);

      return FolderController.responseBuilder.sendSuccess(
        res,
        tree,
        'Folder tree retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting folder tree', { error: error.message });
        return FolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取文件夹详情
   * @route GET /api/folders/:uuid
   */
  static async getFolder(req: Request, res: Response): Promise<Response> {
    try {
      const service = FolderController.getFolderService();
      const { uuid } = req.params;

      logger.info('Getting folder', { uuid });

      const folder = await service.getFolder(uuid);

      if (!folder) {
        return FolderController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Folder not found',
        });
      }

      return FolderController.responseBuilder.sendSuccess(
        res,
        folder,
        'Folder retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting folder', { error: error.message });
        return FolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 重命名文件夹
   * @route PATCH /api/folders/:uuid/rename
   */
  static async renameFolder(req: Request, res: Response): Promise<Response> {
    try {
      const service = FolderController.getFolderService();
      const { uuid } = req.params;
      const { name } = req.body;

      if (!name) {
        return FolderController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'Name is required',
        });
      }

      logger.info('Renaming folder', { uuid, name });

      const folder = await service.renameFolder(uuid, name);

      return FolderController.responseBuilder.sendSuccess(
        res,
        folder,
        'Folder renamed successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error renaming folder', { error: error.message });
        return FolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 移动文件夹
   * @route PATCH /api/folders/:uuid/move
   */
  static async moveFolder(req: Request, res: Response): Promise<Response> {
    try {
      const service = FolderController.getFolderService();
      const { uuid } = req.params;
      const { newParentUuid } = req.body;

      logger.info('Moving folder', { uuid, newParentUuid });

      const folder = await service.moveFolder(uuid, newParentUuid ?? null);

      return FolderController.responseBuilder.sendSuccess(
        res,
        folder,
        'Folder moved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error moving folder', { error: error.message });

        // 循环引用错误返回 409
        if (error.message.includes('Circular reference detected')) {
          return FolderController.responseBuilder.sendError(res, {
            code: ResponseCode.CONFLICT,
            message: error.message,
          });
        }

        return FolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除文件夹
   * @route DELETE /api/folders/:uuid
   */
  static async deleteFolder(req: Request, res: Response): Promise<Response> {
    try {
      const service = FolderController.getFolderService();
      const { uuid } = req.params;

      logger.info('Deleting folder', { uuid });

      await service.deleteFolder(uuid);

      return FolderController.responseBuilder.sendSuccess(
        res,
        null,
        'Folder deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting folder', { error: error.message });
        return FolderController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FolderController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}


