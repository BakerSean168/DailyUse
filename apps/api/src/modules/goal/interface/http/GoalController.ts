import type { Request, Response } from 'express';
import { GoalApplicationService } from '../../application/services/GoalApplicationService';
import { GoalKeyResultApplicationService } from '../../application/services/GoalKeyResultApplicationService';
import { GoalRecordApplicationService } from '../../application/services/GoalRecordApplicationService';
import { GoalReviewApplicationService } from '../../application/services/GoalReviewApplicationService';
import { WeightSnapshotApplicationService } from '../../application/services/WeightSnapshotApplicationService';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import type { GoalServerDTO, GoalClientDTO, GoalAggregateViewResponse } from '@dailyuse/contracts/goal';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../shared/middlewares/authMiddleware';
import { PrismaGoalRepository } from '../../infrastructure/repositories/PrismaGoalRepository';
import { PrismaWeightSnapshotRepository } from '../../infrastructure/repositories/PrismaWeightSnapshotRepository';
import prisma from '../../../../shared/db/prisma';

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
  private static keyResultService: GoalKeyResultApplicationService | null = null;
  private static recordService: GoalRecordApplicationService | null = null;
  private static reviewService: GoalReviewApplicationService | null = null;
  private static weightSnapshotService: WeightSnapshotApplicationService | null = null;
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

  private static async getKeyResultService(): Promise<GoalKeyResultApplicationService> {
    if (!GoalController.keyResultService) {
      GoalController.keyResultService = await GoalKeyResultApplicationService.getInstance();
    }
    return GoalController.keyResultService;
  }

  private static async getRecordService(): Promise<GoalRecordApplicationService> {
    if (!GoalController.recordService) {
      GoalController.recordService = await GoalRecordApplicationService.getInstance();
    }
    return GoalController.recordService;
  }

  private static async getReviewService(): Promise<GoalReviewApplicationService> {
    if (!GoalController.reviewService) {
      GoalController.reviewService = await GoalReviewApplicationService.getInstance();
    }
    return GoalController.reviewService;
  }

  private static async getWeightSnapshotService(): Promise<WeightSnapshotApplicationService> {
    if (!GoalController.weightSnapshotService) {
      const goalRepo = new PrismaGoalRepository(prisma);
      const snapshotRepo = new PrismaWeightSnapshotRepository(prisma);
      GoalController.weightSnapshotService = WeightSnapshotApplicationService.getInstance(
        goalRepo,
        snapshotRepo,
      );
    }
    return GoalController.weightSnapshotService;
  }

  /**
   * 验证目标归属权限
   * @param goalUuid 目标UUID
   * @param accountUuid 用户UUID
   * @returns {goal, error} goal存在且有权限时返回goal，否则返回error响应
   */
  private static async verifyGoalOwnership(
    goalUuid: string,
    accountUuid: string,
  ): Promise<
    | { goal: any; error: null }
    | { goal: null; error: { code: ResponseCode; message: string } }
  > {
    const service = await GoalController.getGoalService();
    const goal = await service.getGoal(goalUuid);

    if (!goal) {
      return {
        goal: null,
        error: {
          code: ResponseCode.NOT_FOUND,
          message: 'Goal not found',
        },
      };
    }

    if (goal.accountUuid !== accountUuid) {
      return {
        goal: null,
        error: {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to access this goal',
        },
      };
    }

    return { goal, error: null };
  }

  /**
   * 创建目标
   * @route POST /api/goals
   */
  static async createGoal(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = await GoalController.getGoalService();
      
      // 从认证中间件获取 accountUuid（安全可靠）
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('Creating goal', { accountUuid });

      // 将 accountUuid 合并到请求体中
      const goal = await service.createGoal({
        ...req.body,
        accountUuid,
      });

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
      console.log('[GoalController.getUserGoalsByToken] includeChildren:', includeChildren);
      console.log('[GoalController.getUserGoalsByToken] query:', req.query);
      
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;

      const service = await GoalController.getGoalService();
      const goals = await service.getUserGoals(accountUuid, { includeChildren });
      
      console.log('[GoalController.getUserGoalsByToken] 返回Goals数量:', goals.length);
      console.log('[GoalController.getUserGoalsByToken] 第一个Goal:', goals[0]);

      // 实现简单的分页
      const total = goals.length;
      const paginatedGoals = limit ? goals.slice((page - 1) * limit, page * limit) : goals;

      return GoalController.responseBuilder.sendSuccess(
        res,
        {
          goals: paginatedGoals,  // 修改字段名从 data 到 goals，与前端 GoalsResponse 类型匹配
          total,
          page,
          pageSize: limit || total,  // 修改字段名从 limit 到 pageSize，与前端类型匹配
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

      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const verification = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (verification.error) {
        logger.warn('Unauthorized goal update attempt', { uuid, accountUuid });
        return GoalController.responseBuilder.sendError(res, verification.error);
      }

      const service = await GoalController.getGoalService();
      logger.info('Updating goal', { uuid, accountUuid });
      logger.info('Updating goal', { uuid, accountUuid });
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
  /**
   * 检查目标依赖关系
   * @route GET /api/goals/:uuid/dependencies
   */
  static async checkGoalDependencies(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const verification = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (verification.error) {
        logger.warn('Unauthorized goal dependency check attempt', { uuid, accountUuid });
        return GoalController.responseBuilder.sendError(res, verification.error);
      }

      const service = await GoalController.getGoalService();
      const dependencies = await service.checkGoalDependencies(uuid);

      logger.info('Goal dependencies checked', { uuid, accountUuid, dependencies });
      return GoalController.responseBuilder.sendSuccess(res, dependencies, 'Dependencies checked successfully');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error checking goal dependencies', { error: error.message });
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
   * 删除目标（软删除）
   * @route DELETE /api/goals/:uuid
   */
  static async deleteGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;

      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const verification = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (verification.error) {
        logger.warn('Unauthorized goal deletion attempt', { uuid, accountUuid });
        return GoalController.responseBuilder.sendError(res, verification.error);
      }

      const service = await GoalController.getGoalService();
      await service.deleteGoal(uuid);

      logger.info('Goal deleted successfully', { uuid, accountUuid });
      logger.info('Goal deleted successfully', { uuid, accountUuid });
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
  static async addKeyResult(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const { goal: existingGoal, error } = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const service = await GoalController.getKeyResultService();
      const goal = await service.addKeyResult(uuid, req.body);

      logger.info('Key result added successfully', { goalUuid: uuid, accountUuid });
      logger.info('Key result added successfully', { goalUuid: uuid, accountUuid });
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
  static async updateKeyResultProgress(req: AuthenticatedRequest, res: Response): Promise<Response> {

    try {
      const { uuid, keyResultUuid } = req.params;
      const { currentValue, note } = req.body;

      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const { goal: existingGoal, error } = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const service = await GoalController.getKeyResultService();
      const goal = await service.updateKeyResultProgress(uuid, keyResultUuid, currentValue, note);

      logger.info('Key result progress updated', { goalUuid: uuid, keyResultUuid, accountUuid });
      logger.info('Key result progress updated', { goalUuid: uuid, keyResultUuid, accountUuid });
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
    /**
   * 删除关键结果
   * @route DELETE /api/goals/:uuid/key-results/:keyResultUuid
   */
  static async deleteKeyResult(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid, keyResultUuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const { goal: existingGoal, error } = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const service = await GoalController.getKeyResultService();
      const goal = await service.deleteKeyResult(uuid, keyResultUuid);

      logger.info('Key result deleted', { goalUuid: uuid, keyResultUuid, accountUuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Key result deleted');
      logger.info('Key result deleted', { goalUuid: uuid, keyResultUuid, accountUuid });
      return GoalController.responseBuilder.sendSuccess(res, goal, 'Key result deleted');
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

      const service = await GoalController.getReviewService();
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

  /**
   * 获取目标进度分解详情
   * @route GET /api/goals/:uuid/progress-breakdown
   */
  /**
   * 获取目标的聚合视图（权重分布）
   * @route GET /api/goals/:uuid/aggregate
   * 
   * 返回目标及其所有关键结果的权重分布信息
   */
  static async getGoalAggregateView(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证所有权
      const { error } = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const service = await GoalController.getGoalService();
      // 需要传递 includeChildren: true 以获取 keyResults
      const goal = await service.getGoal(uuid, { includeChildren: true });

      if (!goal) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Goal not found',
        });
      }

      // 获取权重分布信息
      const snapshotService = await GoalController.getWeightSnapshotService();
      const weightInfo = await snapshotService.getWeightSumInfo(uuid);

      // 构建聚合视图响应
      // 注意：goal 是 GoalClientDTO，keyResults 也是 DTO，不是实体对象
      const keyResultsData = goal.keyResults || [];
      
      const response: GoalAggregateViewResponse = {
        goal: goal as GoalClientDTO,
        keyResults: keyResultsData.map((kr: any) => ({
          ...kr,
          weight: kr.weight || 0,
          weightPercentage: weightInfo.keyResults.find((w: any) => w.uuid === kr.uuid)?.percentage || 0,
        })),
        statistics: {
          totalKeyResults: keyResultsData.length,
          // DTO 的 isCompleted 是布尔值，不是方法
          completedKeyResults: keyResultsData.filter((kr: any) => kr.isCompleted === true).length,
          totalRecords: keyResultsData.reduce((sum: number, kr: any) => sum + (kr.records?.length || 0), 0),
          totalReviews: goal.reviews?.length || 0,
          overallProgress: Math.round(
            keyResultsData.reduce((sum: number, kr: any) => {
              const totalWeight = weightInfo.totalWeight;
              if (totalWeight === 0) return sum;
              const progressPercentage = kr.progress?.targetValue !== 0
                ? ((kr.progress?.currentValue || 0) / kr.progress.targetValue) * 100
                : 0;
              return sum + (progressPercentage * ((kr.weight || 0) / totalWeight));
            }, 0)
          ),
        },
      };

      return GoalController.responseBuilder.sendSuccess(
        res,
        response,
        'Goal aggregate view retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting goal aggregate view', { 
          error: error.message, 
          goalUuid: req.params.uuid 
        });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to get goal aggregate view',
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  static async getProgressBreakdown(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证所有权
      const { error } = await GoalController.verifyGoalOwnership(uuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const service = await GoalController.getRecordService();
      const breakdown = await service.getGoalProgressBreakdown(uuid);

      return GoalController.responseBuilder.sendSuccess(
        res,
        breakdown,
        'Progress breakdown retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting progress breakdown', { 
          error: error.message, 
          goalUuid: req.params.uuid 
        });
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: 'Failed to get progress breakdown',
        });
      }
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  // ===== GoalRecord 管理 =====

  /**
   * 创建目标记录
   * @route POST /api/goals/:uuid/key-results/:keyResultUuid/records
   */
  static async createGoalRecord(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { goalUuid, keyResultUuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const { error } = await GoalController.verifyGoalOwnership(goalUuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const service = await GoalController.getRecordService();
      const record = await service.createGoalRecord(goalUuid, keyResultUuid, req.body);

      logger.info('Goal record created successfully', { goalUuid, keyResultUuid, accountUuid });
      return GoalController.responseBuilder.sendSuccess(res, record, 'Goal record created', 201);
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating goal record', { error: error.message });
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
   * 获取关键结果的所有记录
   * @route GET /api/goals/:uuid/key-results/:keyResultUuid/records
   */
  static async getGoalRecordsByKeyResult(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { goalUuid, keyResultUuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const { error } = await GoalController.verifyGoalOwnership(goalUuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const service = await GoalController.getRecordService();
      const result = await service.getGoalRecordsByKeyResult(goalUuid, keyResultUuid, {
        page,
        limit,
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : undefined,
      });

      return GoalController.responseBuilder.sendSuccess(
        res,
        result,
        'Goal records retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting goal records', { error: error.message });
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
   * 获取目标的所有记录
   * @route GET /api/goals/:uuid/records
   */
  static async getGoalRecordsByGoal(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { goalUuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const { error } = await GoalController.verifyGoalOwnership(goalUuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const service = await GoalController.getRecordService();
      const result = await service.getGoalRecordsByGoal(goalUuid, { page, limit });

      return GoalController.responseBuilder.sendSuccess(
        res,
        result,
        'Goal records retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting goal records', { error: error.message });
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
   * 删除目标记录
   * @route DELETE /api/goals/:uuid/key-results/:keyResultUuid/records/:recordUuid
   */
  static async deleteGoalRecord(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { goalUuid, keyResultUuid, recordUuid } = req.params;
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return GoalController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // 验证目标归属权限
      const { error } = await GoalController.verifyGoalOwnership(goalUuid, accountUuid);
      if (error) {
        return GoalController.responseBuilder.sendError(res, error);
      }

      const service = await GoalController.getRecordService();
      await service.deleteGoalRecord(goalUuid, keyResultUuid, recordUuid);

      logger.info('Goal record deleted successfully', { goalUuid, keyResultUuid, recordUuid, accountUuid });
      return GoalController.responseBuilder.sendSuccess(res, null, 'Goal record deleted');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting goal record', { error: error.message });
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




