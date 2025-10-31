/**
 * Weight Snapshot Routes
 * 权重快照路由配置
 */

import { Router, type Router as ExpressRouter } from 'express';
import { WeightSnapshotController } from './WeightSnapshotController';
// import { authMiddleware } from '../../../../middleware/auth';

const router: ExpressRouter = Router();

/**
 * 更新 KeyResult 权重并创建快照
 * POST /api/goals/:goalUuid/key-results/:krUuid/weight
 *
 * Body:
 * - newWeight: number (0-100)
 * - reason?: string
 */
router.post(
  '/goals/:goalUuid/key-results/:krUuid/weight',
  // authMiddleware,
  WeightSnapshotController.updateKeyResultWeight,
);

/**
 * 查询 Goal 的所有权重快照
 * GET /api/goals/:goalUuid/weight-snapshots
 *
 * Query:
 * - page?: number (default: 1)
 * - pageSize?: number (default: 20, max: 100)
 */
router.get(
  '/goals/:goalUuid/weight-snapshots',
  // authMiddleware,
  WeightSnapshotController.getGoalSnapshots,
);

/**
 * 查询 KeyResult 的权重快照历史
 * GET /api/key-results/:krUuid/weight-snapshots
 *
 * Query: Same as Goal snapshots
 */
router.get(
  '/key-results/:krUuid/weight-snapshots',
  // authMiddleware,
  WeightSnapshotController.getKeyResultSnapshots,
);

/**
 * 查询权重趋势数据（用于 ECharts）
 * GET /api/goals/:goalUuid/weight-trend
 *
 * Query:
 * - startTime: number (timestamp in ms)
 * - endTime: number (timestamp in ms)
 */
router.get(
  '/goals/:goalUuid/weight-trend',
  // authMiddleware,
  WeightSnapshotController.getWeightTrend,
);

/**
 * 对比多个时间点的权重分配
 * GET /api/goals/:goalUuid/weight-comparison
 *
 * Query:
 * - timePoints: string (comma-separated timestamps, max 5)
 */
router.get(
  '/goals/:goalUuid/weight-comparison',
  // authMiddleware,
  WeightSnapshotController.getWeightComparison,
);

export default router;
