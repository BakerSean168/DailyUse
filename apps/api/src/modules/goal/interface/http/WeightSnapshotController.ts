/**
 * Weight Snapshot Controller
 * 权重快照控制器
 *
 * 负责处理权重快照相关的 HTTP 请求和响应。
 */

import type { Request, Response } from 'express';
import { WeightSnapshotApplicationService } from '../../application/services/WeightSnapshotApplicationService';
import { GoalApplicationService } from '../../application/services/GoalApplicationService';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import { PrismaWeightSnapshotRepository } from '../../infrastructure/repositories/PrismaWeightSnapshotRepository';
import { PrismaGoalRepository } from '../../infrastructure/repositories/PrismaGoalRepository';
import prisma from '../../../../shared/db/prisma';
import {
  InvalidWeightSumError,
  GoalNotFoundError,
  KeyResultNotFoundError,
} from '../../application/errors/WeightSnapshotErrors';

const logger = createLogger('WeightSnapshotController');

/**
 * Weight Snapshot Controller
 *
 * **职责**:
 * - 解析 HTTP 请求参数
 * - 调用 Application Service 处理业务逻辑
 * - 格式化响应（使用 ResponseBuilder）
 * - 异常处理和错误响应
 */
export class WeightSnapshotController {
  private static snapshotService: WeightSnapshotApplicationService | null = null;
  private static goalService: GoalApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 初始化服务（延迟加载）
   */
  private static async getSnapshotService(): Promise<WeightSnapshotApplicationService> {
    if (!WeightSnapshotController.snapshotService) {
      const goalRepo = new PrismaGoalRepository(prisma);
      const snapshotRepo = new PrismaWeightSnapshotRepository(prisma);
      WeightSnapshotController.snapshotService = WeightSnapshotApplicationService.getInstance(
        goalRepo,
        snapshotRepo,
      );
    }
    return WeightSnapshotController.snapshotService;
  }

  private static async getGoalService(): Promise<GoalApplicationService> {
    if (!WeightSnapshotController.goalService) {
      WeightSnapshotController.goalService = await GoalApplicationService.getInstance();
    }
    return WeightSnapshotController.goalService;
  }

  /**
   * 更新 KR 权重
   * @route POST /api/goals/:goalUuid/key-results/:krUuid/weight
   *
   * **Request Body**:
   * ```json
   * {
   *   "newWeight": 50,
   *   "reason": "季度中期调整"
   * }
   * ```
   *
   * **Response**:
   * ```json
   * {
   *   "success": true,
   *   "message": "Weight updated successfully",
   *   "data": { ... KeyResult DTO ... }
   * }
   * ```
   */
  static async updateKeyResultWeight(req: Request, res: Response): Promise<Response> {
    try {
      const { goalUuid, krUuid } = req.params;
      const { newWeight, reason } = req.body;

      // 参数验证
      if (typeof newWeight !== 'number' || newWeight < 0 || newWeight > 100) {
        return WeightSnapshotController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'newWeight must be a number between 0 and 100',
        });
      }

      logger.info('Updating KR weight', { goalUuid, krUuid, newWeight });

      const service = await WeightSnapshotController.getSnapshotService();
      const goalService = await WeightSnapshotController.getGoalService();

      // TODO: 获取当前用户 UUID（从 auth middleware）
      const operatorUuid = 'system'; // Placeholder

      // 1. 验证 Goal 存在
      const goal = await goalService.getGoal(goalUuid, { includeChildren: false });
      if (!goal) {
        throw new GoalNotFoundError(goalUuid);
      }

      // 2. 查询 KR 和当前权重（从数据库获取准确的 weight 值）
      const krData = await prisma.keyResult.findUnique({
        where: { uuid: krUuid },
        select: { uuid: true, goalUuid: true, weight: true, title: true },
      });

      if (!krData || krData.goalUuid !== goalUuid) {
        throw new KeyResultNotFoundError(krUuid);
      }

      const oldWeight = krData.weight;

      // 3. 创建快照
      await service.createSnapshot({
        goalUuid,
        krUuid,
        oldWeight,
        newWeight,
        trigger: 'manual',
        operatorUuid,
        reason,
      });

      // 4. 更新 KR 权重
      await prisma.keyResult.update({
        where: { uuid: krUuid },
        data: { weight: newWeight },
      });

      // 5. 校验权重总和（查询 Goal 的所有 KR）
      const allKRs = await prisma.keyResult.findMany({
        where: { goalUuid },
        select: { uuid: true, weight: true },
      });

      const weights: Record<string, number> = {};
      allKRs.forEach((k) => {
        weights[k.uuid] = k.uuid === krUuid ? newWeight : k.weight;
      });

      const isValid = await service.validateWeightSum(goalUuid, weights);
      if (!isValid) {
        const { weights: currentWeights, total } = await service.getWeightDistribution(
          goalUuid,
          weights,
        );
        throw new InvalidWeightSumError(goalUuid, total, currentWeights);
      }

      logger.info('KR weight updated successfully', { krUuid, oldWeight, newWeight });
      return WeightSnapshotController.responseBuilder.sendSuccess(
        res,
        {
          keyResult: { uuid: krData.uuid, title: krData.title, oldWeight, newWeight },
          snapshot: { oldWeight, newWeight, delta: newWeight - oldWeight },
        },
        'Weight updated successfully',
      );
    } catch (error) {
      return WeightSnapshotController.handleError(error, res);
    }
  }

  /**
   * 查询 Goal 的所有权重快照
   * @route GET /api/goals/:goalUuid/weight-snapshots
   *
   * **Query Parameters**:
   * - page: number (default: 1)
   * - pageSize: number (default: 20, max: 100)
   *
   * **Response**:
   * ```json
   * {
   *   "success": true,
   *   "data": {
   *     "snapshots": [...],
   *     "pagination": {
   *       "total": 50,
   *       "page": 1,
   *       "pageSize": 20,
   *       "totalPages": 3
   *     }
   *   }
   * }
   * ```
   */
  static async getGoalSnapshots(req: Request, res: Response): Promise<Response> {
    try {
      const { goalUuid } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

      logger.info('Fetching Goal snapshots', { goalUuid, page, pageSize });

      const service = await WeightSnapshotController.getSnapshotService();
      const result = await service.getSnapshotsByGoal(goalUuid, { page, pageSize });

      const snapshots = result.snapshots.map((s) => s.toServerDTO());

      return WeightSnapshotController.responseBuilder.sendSuccess(
        res,
        {
          snapshots,
          pagination: {
            total: result.total,
            page,
            pageSize,
            totalPages: Math.ceil(result.total / pageSize),
          },
        },
        'Snapshots retrieved successfully',
      );
    } catch (error) {
      return WeightSnapshotController.handleError(error, res);
    }
  }

  /**
   * 查询 KeyResult 的权重快照历史
   * @route GET /api/key-results/:krUuid/weight-snapshots
   *
   * **Query Parameters**: Same as getGoalSnapshots
   */
  static async getKeyResultSnapshots(req: Request, res: Response): Promise<Response> {
    try {
      const { krUuid } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

      logger.info('Fetching KeyResult snapshots', { krUuid, page, pageSize });

      const service = await WeightSnapshotController.getSnapshotService();
      const result = await service.getSnapshotsByKeyResult(krUuid, { page, pageSize });

      const snapshots = result.snapshots.map((s) => s.toServerDTO());

      return WeightSnapshotController.responseBuilder.sendSuccess(
        res,
        {
          snapshots,
          pagination: {
            total: result.total,
            page,
            pageSize,
            totalPages: Math.ceil(result.total / pageSize),
          },
        },
        'KeyResult snapshots retrieved successfully',
      );
    } catch (error) {
      return WeightSnapshotController.handleError(error, res);
    }
  }

  /**
   * 查询权重趋势数据（用于 ECharts）
   * @route GET /api/goals/:goalUuid/weight-trend
   *
   * **Query Parameters**:
   * - startTime: number (timestamp in ms)
   * - endTime: number (timestamp in ms)
   *
   * **Response**:
   * ```json
   * {
   *   "success": true,
   *   "data": {
   *     "timePoints": [1640000000000, ...],
   *     "keyResults": [
   *       {
   *         "uuid": "kr-1",
   *         "title": "KR 1",
   *         "data": [{ time: 1640000000000, weight: 30 }, ...]
   *       }
   *     ]
   *   }
   * }
   * ```
   */
  static async getWeightTrend(req: Request, res: Response): Promise<Response> {
    try {
      const { goalUuid } = req.params;
      const startTime = parseInt(req.query.startTime as string);
      const endTime = parseInt(req.query.endTime as string);

      if (!startTime || !endTime || startTime >= endTime) {
        return WeightSnapshotController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Invalid time range: startTime must be less than endTime',
        });
      }

      logger.info('Fetching weight trend', { goalUuid, startTime, endTime });

      const service = await WeightSnapshotController.getSnapshotService();
      const goalService = await WeightSnapshotController.getGoalService();

      // 查询快照（最多 1000 个点）
      const { snapshots } = await service.getSnapshotsByTimeRange(startTime, endTime, {
        page: 1,
        pageSize: 1000,
      });

      // 查询 Goal 及其 KeyResults
      const goal = await goalService.getGoal(goalUuid, { includeChildren: true });
      if (!goal) {
        throw new GoalNotFoundError(goalUuid);
      }

      // 按 KR 分组快照数据
      const krTrends: Record<string, Array<{ time: number; weight: number }>> = {};
      goal.keyResults?.forEach((kr) => {
        krTrends[kr.uuid] = [];
      });

      snapshots.forEach((snapshot) => {
        if (krTrends[snapshot.keyResultUuid]) {
          krTrends[snapshot.keyResultUuid].push({
            time: snapshot.snapshotTime,
            weight: snapshot.newWeight,
          });
        }
      });

      // 格式化为 ECharts 数据格式
      const data = {
        timePoints: [...new Set(snapshots.map((s) => s.snapshotTime))].sort(),
        keyResults: goal.keyResults?.map((kr) => ({
          uuid: kr.uuid,
          title: kr.title,
          data: krTrends[kr.uuid].sort((a, b) => a.time - b.time),
        })),
      };

      return WeightSnapshotController.responseBuilder.sendSuccess(
        res,
        data,
        'Weight trend data retrieved successfully',
      );
    } catch (error) {
      return WeightSnapshotController.handleError(error, res);
    }
  }

  /**
   * 对比多个时间点的权重分配
   * @route GET /api/goals/:goalUuid/weight-comparison
   *
   * **Query Parameters**:
   * - timePoints: string (comma-separated timestamps, max 5)
   *
   * **Response**:
   * ```json
   * {
   *   "success": true,
   *   "data": {
   *     "keyResults": [...],
   *     "comparisons": {
   *       "kr-1": [30, 35, 40],
   *       "kr-2": [40, 35, 30],
   *       "kr-3": [30, 30, 30]
   *     },
   *     "deltas": {
   *       "kr-1": [5, 5],
   *       "kr-2": [-5, -5],
   *       "kr-3": [0, 0]
   *     }
   *   }
   * }
   * ```
   */
  static async getWeightComparison(req: Request, res: Response): Promise<Response> {
    try {
      const { goalUuid } = req.params;
      const timePointsStr = req.query.timePoints as string;

      if (!timePointsStr) {
        return WeightSnapshotController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'timePoints query parameter is required',
        });
      }

      const timePoints = timePointsStr.split(',').map((t) => parseInt(t.trim()));

      if (timePoints.length > 5) {
        return WeightSnapshotController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Maximum 5 time points allowed for comparison',
        });
      }

      if (timePoints.some((t) => isNaN(t) || t <= 0)) {
        return WeightSnapshotController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Invalid time points: must be positive integers',
        });
      }

      logger.info('Comparing weight at multiple time points', { goalUuid, timePoints });

      const service = await WeightSnapshotController.getSnapshotService();
      const goalService = await WeightSnapshotController.getGoalService();

      // 查询 Goal
      const goal = await goalService.getGoal(goalUuid, { includeChildren: true });
      if (!goal) {
        throw new GoalNotFoundError(goalUuid);
      }

      // 查询所有 KR 的当前权重（从数据库）
      const allKRs = await prisma.keyResult.findMany({
        where: { goalUuid },
        select: { uuid: true, title: true, weight: true },
      });

      // 为每个时间点查询快照
      const comparisons: Record<string, number[]> = {};
      const deltas: Record<string, number[]> = {};

      allKRs.forEach((kr) => {
        comparisons[kr.uuid] = [];
        deltas[kr.uuid] = [];
      });

      // 查询所有相关快照（简化：查询整个时间范围）
      const minTime = Math.min(...timePoints);
      const maxTime = Math.max(...timePoints);
      const { snapshots } = await service.getSnapshotsByTimeRange(minTime, maxTime, {
        page: 1,
        pageSize: 1000,
      });

      // 为每个时间点找到最接近的快照
      for (const timePoint of timePoints) {
        allKRs.forEach((kr) => {
          // 找到该 KR 在该时间点之前的最新快照
          const relevantSnapshots = snapshots.filter(
            (s) => s.keyResultUuid === kr.uuid && s.snapshotTime <= timePoint,
          );

          if (relevantSnapshots.length > 0) {
            const latestSnapshot = relevantSnapshots.sort(
              (a, b) => b.snapshotTime - a.snapshotTime,
            )[0];
            comparisons[kr.uuid].push(latestSnapshot.newWeight);
          } else {
            // 使用当前权重作为默认值
            comparisons[kr.uuid].push(kr.weight);
          }
        });
      }

      // 计算权重变化量（delta）
      allKRs.forEach((kr) => {
        const weights = comparisons[kr.uuid];
        for (let i = 1; i < weights.length; i++) {
          deltas[kr.uuid].push(weights[i] - weights[i - 1]);
        }
      });

      const data = {
        keyResults: allKRs.map((kr) => ({
          uuid: kr.uuid,
          title: kr.title,
        })),
        timePoints,
        comparisons,
        deltas,
      };

      return WeightSnapshotController.responseBuilder.sendSuccess(
        res,
        data,
        'Weight comparison retrieved successfully',
      );
    } catch (error) {
      return WeightSnapshotController.handleError(error, res);
    }
  }

  /**
   * 统一错误处理
   */
  private static handleError(error: unknown, res: Response): Response {
    if (error instanceof InvalidWeightSumError) {
      logger.warn('Invalid weight sum', { error: error.message });
      return WeightSnapshotController.responseBuilder.sendError(res, {
        code: ResponseCode.VALIDATION_ERROR,
        message: error.message,
        debug: error.context,
      });
    }

    if (error instanceof GoalNotFoundError || error instanceof KeyResultNotFoundError) {
      logger.warn('Resource not found', { error: error.message });
      return WeightSnapshotController.responseBuilder.sendError(res, {
        code: ResponseCode.NOT_FOUND,
        message: error.message,
      });
    }

    if (error instanceof Error) {
      logger.error('Unexpected error', { error: error.message, stack: error.stack });
      return WeightSnapshotController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message,
      });
    }

    logger.error('Unknown error', { error });
    return WeightSnapshotController.responseBuilder.sendError(res, {
      code: ResponseCode.INTERNAL_ERROR,
      message: 'Unknown error occurred',
    });
  }
}
