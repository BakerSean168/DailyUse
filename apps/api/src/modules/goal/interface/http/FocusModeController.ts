import type { Response } from 'express';
import { FocusModeApplicationService } from '../../application/services/FocusModeApplicationService';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';

const logger = createLogger('FocusModeController');

/**
 * FocusMode Controller
 * 专注周期模式控制器
 *
 * 职责：
 * - 解析 HTTP 请求参数
 * - 调用 FocusModeApplicationService 处理业务逻辑
 * - 格式化响应（统一使用 ResponseBuilder）
 * - 异常处理和错误响应
 */
export class FocusModeController {
  private static focusModeService: FocusModeApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化应用服务（延迟加载）
   */
  private static async getFocusModeService(): Promise<FocusModeApplicationService> {
    if (!FocusModeController.focusModeService) {
      FocusModeController.focusModeService = await FocusModeApplicationService.getInstance();
    }
    return FocusModeController.focusModeService;
  }

  /**
   * 启用专注模式
   * @route POST /api/goals/focus-mode
   *
   * Request Body:
   * {
   *   focusedGoalUuids: string[],  // 1-3 个目标 UUID
   *   startTime: number,            // 开始时间戳
   *   endTime: number,              // 结束时间戳
   *   hiddenGoalsMode: 'hide_all' | 'hide_folder' | 'hide_none'
   * }
   *
   * Response: FocusModeClientDTO
   */
  static async activateFocusMode(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      const { focusedGoalUuids, startTime, endTime, hiddenGoalsMode } = req.body;

      // 参数校验
      if (!focusedGoalUuids || !Array.isArray(focusedGoalUuids)) {
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'focusedGoalUuids is required and must be an array',
        });
      }

      if (!startTime || !endTime) {
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'startTime and endTime are required',
        });
      }

      if (!hiddenGoalsMode) {
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'hiddenGoalsMode is required',
        });
      }

      logger.info('Activating focus mode', { accountUuid, goalCount: focusedGoalUuids.length });

      const service = await FocusModeController.getFocusModeService();
      const focusMode = await service.activateFocusMode({
        accountUuid,
        focusedGoalUuids,
        startTime,
        endTime,
        hiddenGoalsMode,
      });

      logger.info('Focus mode activated successfully', { focusModeUuid: focusMode.uuid });
      return FocusModeController.responseBuilder.sendSuccess(
        res,
        focusMode,
        'Focus mode activated successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error activating focus mode', { error: error.message });
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: error.message,
        });
      }
      return FocusModeController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 关闭专注模式（手动失效）
   * @route DELETE /api/goals/focus-mode/:uuid
   *
   * Response: FocusModeClientDTO
   */
  static async deactivateFocusMode(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      const { uuid } = req.params;

      logger.info('Deactivating focus mode', { uuid, accountUuid });

      const service = await FocusModeController.getFocusModeService();
      const focusMode = await service.deactivateFocusMode(uuid);

      // 校验归属权限
      if (focusMode.accountUuid !== accountUuid) {
        logger.warn('Unauthorized focus mode deactivation attempt', { uuid, accountUuid });
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to deactivate this focus mode',
        });
      }

      logger.info('Focus mode deactivated successfully', { uuid });
      return FocusModeController.responseBuilder.sendSuccess(
        res,
        focusMode,
        'Focus mode deactivated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deactivating focus mode', { error: error.message });
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: error.message,
        });
      }
      return FocusModeController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 延期专注模式
   * @route PATCH /api/goals/focus-mode/:uuid/extend
   *
   * Request Body:
   * {
   *   newEndTime: number  // 新的结束时间戳
   * }
   *
   * Response: FocusModeClientDTO
   */
  static async extendFocusMode(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      const { uuid } = req.params;
      const { newEndTime } = req.body;

      if (!newEndTime) {
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: 'newEndTime is required',
        });
      }

      logger.info('Extending focus mode', { uuid, newEndTime });

      const service = await FocusModeController.getFocusModeService();
      const focusMode = await service.extendFocusMode({ uuid, newEndTime });

      // 校验归属权限
      if (focusMode.accountUuid !== accountUuid) {
        logger.warn('Unauthorized focus mode extension attempt', { uuid, accountUuid });
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to extend this focus mode',
        });
      }

      logger.info('Focus mode extended successfully', { uuid });
      return FocusModeController.responseBuilder.sendSuccess(
        res,
        focusMode,
        'Focus mode extended successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error extending focus mode', { error: error.message });
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.BAD_REQUEST,
          message: error.message,
        });
      }
      return FocusModeController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取账户当前活跃的专注周期
   * @route GET /api/goals/focus-mode/active
   *
   * Response: FocusModeClientDTO | null
   */
  static async getActiveFocusMode(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('Getting active focus mode', { accountUuid });

      const service = await FocusModeController.getFocusModeService();
      const focusMode = await service.getActiveFocusMode(accountUuid);

      if (!focusMode) {
        logger.info('No active focus mode found', { accountUuid });
        return FocusModeController.responseBuilder.sendSuccess(
          res,
          null,
          'No active focus mode',
        );
      }

      logger.info('Active focus mode retrieved', { focusModeUuid: focusMode.uuid });
      return FocusModeController.responseBuilder.sendSuccess(
        res,
        focusMode,
        'Active focus mode retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting active focus mode', { error: error.message });
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FocusModeController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取账户的专注周期历史
   * @route GET /api/goals/focus-mode/history
   *
   * Response: FocusModeClientDTO[]
   */
  static async getFocusModeHistory(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('Getting focus mode history', { accountUuid });

      const service = await FocusModeController.getFocusModeService();
      const history = await service.getFocusModeHistory(accountUuid);

      logger.info('Focus mode history retrieved', { count: history.length });
      return FocusModeController.responseBuilder.sendSuccess(
        res,
        history,
        'Focus mode history retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting focus mode history', { error: error.message });
        return FocusModeController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FocusModeController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}


