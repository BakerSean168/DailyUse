/**
 * Cross-Module API Routes
 * 跨模块查询 API 路由
 */

import { Router, type Request, type Response } from 'express';
import { GoalCrossModuleQueryService } from '../../modules/goal/application/services/GoalCrossModuleQueryService';

const router: Router = Router();

const goalQueryService = GoalCrossModuleQueryService.getInstance();

/**
 * GET /api/v1/cross-module/goals/for-task-binding
 * 获取可用于任务绑定的目标列表
 */
router.get('/goals/for-task-binding', async (req: Request, res: Response) => {
  try {
    // accountUuid 可以从 query 参数获取，或从认证 token 中获取（如果使用了 authMiddleware）
    const accountUuid = (req.query.accountUuid as string) || (req as any).user?.accountUuid;
    const status = req.query.status
      ? (req.query.status as string).split(',')
      : undefined;

    if (!accountUuid) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: 'accountUuid is required or authentication is missing',
      });
    }

    const goals = await goalQueryService.getGoalsForTaskBinding({
      accountUuid,
      status: status as any,
    });

    return res.json({
      code: 200,
      success: true,
      data: goals,
      message: 'Success',
    });
  } catch (error) {
    console.error('[CrossModuleAPI] Failed to get goals for task binding:', error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/v1/cross-module/goals/:goalUuid/key-results/for-task-binding
 * 获取目标的关键结果列表（用于任务绑定）
 */
router.get('/goals/:goalUuid/key-results/for-task-binding', async (req: Request, res: Response) => {
  try {
    const { goalUuid } = req.params;

    const keyResults = await goalQueryService.getKeyResultsForTaskBinding(goalUuid);

    return res.json({
      code: 200,
      success: true,
      data: keyResults,
      message: 'Success',
    });
  } catch (error) {
    console.error('[CrossModuleAPI] Failed to get key results for task binding:', error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/v1/cross-module/goals/validate-binding
 * 验证目标和关键结果的绑定是否有效
 */
router.post('/goals/validate-binding', async (req: Request, res: Response) => {
  try {
    const { goalUuid, keyResultUuid } = req.body;

    if (!goalUuid || !keyResultUuid) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: 'goalUuid and keyResultUuid are required',
      });
    }

    const result = await goalQueryService.validateGoalBinding(goalUuid, keyResultUuid);

    if (result.valid) {
      return res.json({
        code: 200,
        success: true,
        data: { valid: true },
        message: 'Valid binding',
      });
    } else {
      return res.status(400).json({
        code: 400,
        success: false,
        data: { valid: false },
        message: result.error || 'Invalid binding',
      });
    }
  } catch (error) {
    console.error('[CrossModuleAPI] Failed to validate goal binding:', error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;
