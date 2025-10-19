import type { Response } from 'express';
import type { AuthenticatedRequest } from '@/shared/middlewares/authMiddleware';
import { FocusSessionApplicationService } from '../../application/services/FocusSessionApplicationService';
import { createResponseBuilder, ResponseCode, GoalContracts } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('FocusSessionController');

type FocusSessionStatus = GoalContracts.FocusSessionStatus;

/**
 * FocusSession 控制器
 * 负责处理专注周期相关的 HTTP 请求和响应
 *
 * 职责：
 * - 解析 HTTP 请求参数
 * - 调用 FocusSessionApplicationService 处理业务逻辑
 * - 格式化响应（统一使用 ResponseBuilder）
 * - 异常处理和错误响应
 */
export class FocusSessionController {
  private static sessionService: FocusSessionApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化应用服务（延迟加载）
   */
  private static async getSessionService(): Promise<FocusSessionApplicationService> {
    if (!FocusSessionController.sessionService) {
      FocusSessionController.sessionService = await FocusSessionApplicationService.getInstance();
    }
    return FocusSessionController.sessionService;
  }

  /**
   * 创建并开始专注周期
   * @route POST /api/focus-sessions
   */
  static async createAndStartSession(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = await FocusSessionController.getSessionService();
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      logger.info('Creating focus session', { accountUuid, request: req.body });

      const session = await service.createAndStartSession(accountUuid, {
        goalUuid: req.body.goalUuid,
        durationMinutes: req.body.durationMinutes,
        description: req.body.description,
        startImmediately: req.body.startImmediately !== false, // 默认 true
      });

      logger.info('Focus session created successfully', { sessionUuid: session.uuid });
      return FocusSessionController.responseBuilder.sendSuccess(
        res,
        session,
        '专注周期已创建',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating focus session', { error: error.message });
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FocusSessionController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 暂停专注周期
   * @route POST /api/focus-sessions/:uuid/pause
   */
  static async pauseSession(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const service = await FocusSessionController.getSessionService();
      logger.info('Pausing focus session', { sessionUuid: uuid, accountUuid });

      const session = await service.pauseSession(uuid, accountUuid);

      logger.info('Focus session paused successfully', { sessionUuid: uuid });
      return FocusSessionController.responseBuilder.sendSuccess(res, session, '专注周期已暂停');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error pausing focus session', { error: error.message });
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FocusSessionController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 恢复专注周期
   * @route POST /api/focus-sessions/:uuid/resume
   */
  static async resumeSession(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const service = await FocusSessionController.getSessionService();
      logger.info('Resuming focus session', { sessionUuid: uuid, accountUuid });

      const session = await service.resumeSession(uuid, accountUuid);

      logger.info('Focus session resumed successfully', { sessionUuid: uuid });
      return FocusSessionController.responseBuilder.sendSuccess(res, session, '专注周期已恢复');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error resuming focus session', { error: error.message });
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FocusSessionController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 完成专注周期
   * @route POST /api/focus-sessions/:uuid/complete
   */
  static async completeSession(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const service = await FocusSessionController.getSessionService();
      logger.info('Completing focus session', { sessionUuid: uuid, accountUuid });

      const session = await service.completeSession(uuid, accountUuid);

      logger.info('Focus session completed successfully', { sessionUuid: uuid });
      return FocusSessionController.responseBuilder.sendSuccess(res, session, '专注周期已完成');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error completing focus session', { error: error.message });
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FocusSessionController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 取消专注周期
   * @route POST /api/focus-sessions/:uuid/cancel
   */
  static async cancelSession(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const service = await FocusSessionController.getSessionService();
      logger.info('Cancelling focus session', { sessionUuid: uuid, accountUuid });

      await service.cancelSession(uuid, accountUuid);

      logger.info('Focus session cancelled successfully', { sessionUuid: uuid });
      return FocusSessionController.responseBuilder.sendSuccess(res, null, '专注周期已取消');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error cancelling focus session', { error: error.message });
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FocusSessionController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取活跃会话
   * @route GET /api/focus-sessions/active
   */
  static async getActiveSession(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const service = await FocusSessionController.getSessionService();
      const session = await service.getActiveSession(accountUuid);

      return FocusSessionController.responseBuilder.sendSuccess(res, session, '获取成功');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting active session', { error: error.message });
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FocusSessionController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取会话历史
   * @route GET /api/focus-sessions/history
   */
  static async getSessionHistory(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      // 解析查询参数
      const filters = {
        goalUuid: req.query.goalUuid as string | undefined,
        status: req.query.status
          ? (req.query.status as string).split(',').map((s) => s.trim() as FocusSessionStatus)
          : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
        orderBy: (req.query.orderBy as 'createdAt' | 'startedAt' | 'completedAt') || 'createdAt',
        orderDirection: (req.query.orderDirection as 'asc' | 'desc') || 'desc',
      };

      const service = await FocusSessionController.getSessionService();
      const sessions = await service.getSessionHistory(accountUuid, filters);

      return FocusSessionController.responseBuilder.sendSuccess(res, sessions, '获取历史记录成功');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting session history', { error: error.message });
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FocusSessionController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取会话统计
   * @route GET /api/focus-sessions/statistics
   */
  static async getSessionStatistics(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const options = {
        startDate: req.query.startDate ? parseInt(req.query.startDate as string, 10) : undefined,
        endDate: req.query.endDate ? parseInt(req.query.endDate as string, 10) : undefined,
        goalUuid: req.query.goalUuid as string | undefined,
      };

      const service = await FocusSessionController.getSessionService();
      const statistics = await service.getSessionStatistics(accountUuid, options);

      return FocusSessionController.responseBuilder.sendSuccess(
        res,
        statistics,
        '获取统计信息成功',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting session statistics', { error: error.message });
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FocusSessionController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取会话详情
   * @route GET /api/focus-sessions/:uuid
   */
  static async getSession(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const service = await FocusSessionController.getSessionService();
      const session = await service.getSession(uuid, accountUuid);

      return FocusSessionController.responseBuilder.sendSuccess(res, session, '获取成功');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting session', { error: error.message });
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FocusSessionController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除会话
   * @route DELETE /api/focus-sessions/:uuid
   */
  static async deleteSession(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const service = await FocusSessionController.getSessionService();
      logger.info('Deleting focus session', { sessionUuid: uuid, accountUuid });

      await service.deleteSession(uuid, accountUuid);

      logger.info('Focus session deleted successfully', { sessionUuid: uuid });
      return FocusSessionController.responseBuilder.sendSuccess(res, null, '专注周期已删除');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting focus session', { error: error.message });
        return FocusSessionController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return FocusSessionController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}
