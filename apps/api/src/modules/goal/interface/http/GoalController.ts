import type { Request, Response } from 'express';
import { GoalApplicationService } from '../../application/services/GoalApplicationService';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../shared/middlewares/authMiddleware';

const logger = createLogger('GoalController');

/**
 * Goal 控制器
 * 负责处理 HTTP 请求和响应，协调应用服务
 *
 * 职责：
 * - 解析 HTTP 请求参数
 * - 调用应用服务处理业务逻辑
 * - 格式化响应（统一使用 ResponseBuilder）
 * - 异常处理和错误响应
 */
export class GoalController {
  private static goalService: GoalApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化应用服务（延迟加载）
   */
  private static async getGoalService(): Promise<GoalApplicationService> {
    if (!GoalController.goalService) {
      GoalController.goalService = await GoalApplicationService.getInstance();
    }
    return GoalController.goalService;
  }

  /**
   * 创建目标
   * @route POST /api/goals
   */
  static async createGoal(req: Request, res: Response): Promise<Response> {
    try {
      const service = await GoalController.getGoalService();
      logger.info('Creating goal', { accountUuid: req.body.accountUuid });

      const goal = await service.createGoal(req.body);

      logger.info('Goal created successfully', { goalUuid: goal.uuid });
      return GoalController.responseBuilder.sendSuccess(
        res,
        goal,
        'Goal created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating goal', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取目标详情
   * @route GET /api/goals/:uuid
   */
  static async getGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const includeChildren = req.query.includeChildren === 'true';

      const service = await GoalController.getGoalService();
      const goal = await service.getGoal(uuid, { includeChildren });

      if (!goal) {
        logger.warn('Goal not found', { uuid });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Goal not found',
        });
      }

      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal retrieved successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving goal', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取当前用户的所有目标（从 token 中提取 accountUuid）
   * @route GET /api/goals
   */
  static async getUserGoalsByToken(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'User not authenticated',
        });
      }

      const includeChildren = req.query.includeChildren === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;

      const service = await GoalController.getGoalService();
      const goals = await service.getUserGoals(accountUuid, { includeChildren });

      // 实现简单的分页
      const total = goals.length;
      const paginatedGoals = limit ? goals.slice((page - 1) * limit, page * limit) : goals;

      return GoalController.responseBuilder.sendSuccess(
        res,
        {
          data: paginatedGoals,
          total,
          page,
          limit: limit || total,
          hasMore: limit ? page * limit < total : false,
        },
        'Goals retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving user goals by token', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取用户的所有目标
   * @route GET /api/goals/user/:accountUuid
   */
  static async getUserGoals(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;
      const includeChildren = req.query.includeChildren === 'true';

      const service = await GoalController.getGoalService();
      const goals = await service.getUserGoals(accountUuid, { includeChildren });

      return GoalController.responseBuilder.sendSuccess(res, goals, 'Goals retrieved successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving user goals', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新目标
   * @route PATCH /api/goals/:uuid
   */
  static async updateGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const service = await GoalController.getGoalService();

      logger.info('Updating goal', { uuid });
      const goal = await service.updateGoal(uuid, req.body);

      logger.info('Goal updated successfully', { uuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal updated successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating goal', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 激活目标
   * @route POST /api/goals/:uuid/activate
   */
  static async activateGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await GoalController.getGoalService();
      const goal = await service.activateGoal(uuid);

      logger.info('Goal activated successfully', { uuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal activated successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error activating goal', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 完成目标
   * @route POST /api/goals/:uuid/complete
   */
  static async completeGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await GoalController.getGoalService();
      const goal = await service.completeGoal(uuid);

      logger.info('Goal completed successfully', { uuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal completed successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error completing goal', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除目标
   * @route DELETE /api/goals/:uuid
   */
  static async deleteGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await GoalController.getGoalService();
      await service.deleteGoal(uuid);

      logger.info('Goal deleted successfully', { uuid });
      return GoalController.responseBuilder.sendSuccess(res, null, 'Goal deleted successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting goal', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 归档目标
   * @route POST /api/goals/:uuid/archive
   */
  static async archiveGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await GoalController.getGoalService();
      const goal = await service.archiveGoal(uuid);

      logger.info('Goal archived successfully', { uuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Goal archived successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error archiving goal', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 添加关键结果
   * @route POST /api/goals/:uuid/key-results
   */
  static async addKeyResult(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await GoalController.getGoalService();
      const goal = await service.addKeyResult(uuid, req.body);

      logger.info('Key result added successfully', { goalUuid: uuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Key result added', 201);
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error adding key result', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新关键结果进度
   * @route PATCH /api/goals/:uuid/key-results/:keyResultUuid/progress
   */
  static async updateKeyResultProgress(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid, keyResultUuid } = req.params;
      const { currentValue, note } = req.body;

      const service = await GoalController.getGoalService();
      const goal = await service.updateKeyResultProgress(uuid, keyResultUuid, currentValue, note);

      logger.info('Key result progress updated', { goalUuid: uuid, keyResultUuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Progress updated');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating key result progress', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除关键结果
   * @route DELETE /api/goals/:uuid/key-results/:keyResultUuid
   */
  static async deleteKeyResult(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid, keyResultUuid } = req.params;

      const service = await GoalController.getGoalService();
      const goal = await service.deleteKeyResult(uuid, keyResultUuid);

      logger.info('Key result deleted successfully', { goalUuid: uuid, keyResultUuid });
      return GoalController.responseBuilder.sendSuccess(
        res,
        goal,
        'Key result deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting key result', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 添加目标回顾
   * @route POST /api/goals/:uuid/reviews
   */
  static async addReview(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const service = await GoalController.getGoalService();
      const goal = await service.addReview(uuid, req.body);

      logger.info('Goal review added successfully', { goalUuid: uuid });
      return GoalController.responseBuilder.sendSuccess(
        res,
        goal,
        'Review added successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error adding goal review', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 搜索目标
   * @route GET /api/goals/search
   */
  static async searchGoals(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid, query } = req.query;

      if (!accountUuid || !query) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Missing required query params: accountUuid, query',
        });
      }

      const service = await GoalController.getGoalService();
      const goals = await service.searchGoals(accountUuid as string, query as string);

      return GoalController.responseBuilder.sendSuccess(res, goals, 'Goals searched successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error searching goals', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取目标统计
   * @route GET /api/goals/statistics/:accountUuid
   */
  static async getGoalStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const { accountUuid } = req.params;

      const service = await GoalController.getGoalService();
      const statistics = await service.getGoalStatistics(accountUuid);

      return GoalController.responseBuilder.sendSuccess(
        res,
        statistics,
        'Statistics retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error retrieving goal statistics', { error: error.message });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}
