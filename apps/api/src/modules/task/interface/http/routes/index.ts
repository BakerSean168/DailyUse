import { Router, type Router as ExpressRouter } from 'express';
import taskTemplateRoutes from './taskTemplateRoutes';
import taskDependencyRoutes from './taskDependencyRoutes';
import taskStatisticsRoutes from './taskStatisticsRoutes';

/**
 * Task Module Main Router
 * 任务模块主路由器
 *
 * 路由结构 (基于 DDD 聚合根控制模式):
 * - /tasks/templates/*              - 任务模板管理 (TaskTemplate 聚合根)
 * - /tasks/statistics/*             - 任务统计管理 (TaskStatistics 聚合根)
 * - /tasks/:taskUuid/dependencies   - 任务依赖管理 (TaskDependency 实体)
 * - /tasks/dependencies/*           - 依赖关系操作
 *
 * 使用说明:
 * 此路由器挂载在 /tasks 路径下 (见 app.ts)
 * 实际访问路径为:
 * - POST   /tasks/templates
 * - GET    /tasks/templates
 * - GET    /tasks/statistics/:accountUuid
 * - POST   /tasks/statistics/:accountUuid/recalculate
 * - POST   /tasks/:taskUuid/dependencies
 * - GET    /tasks/:taskUuid/dependencies
 * 等等
 */
const router: ExpressRouter = Router();

// ============ 任务模板路由 (TaskTemplate 聚合根) ============
// 挂载到 /templates 路径 - 用于 RECURRING 任务模板
// 实际访问: /tasks/templates/*
router.use('/templates', taskTemplateRoutes);

// ============ 一次性任务路由 (ONE_TIME Tasks) ============
// 挂载到根路径 - 用于 ONE_TIME 任务的所有操作
// 实际访问: /tasks/* (如 /tasks/one-time, /tasks/today, /tasks/:uuid/start)
// 注意: 这个必须放在最后,避免覆盖其他特定路径
// router.use('/', taskTemplateRoutes); // 暂时复用 taskTemplateRoutes,后续可拆分

// ============ 任务统计路由 (TaskStatistics 聚合根) ============
// 挂载到 /statistics 路径
// 实际访问: /tasks/statistics/*
router.use('/statistics', taskStatisticsRoutes);

// ============ 任务依赖路由 (TaskDependency 实体) ============
// 挂载到根路径，这样可以支持:
// - /tasks/:taskUuid/dependencies (创建/获取某任务的依赖)
// - /tasks/dependencies/:uuid (更新/删除特定依赖关系)
router.use('/', taskDependencyRoutes);

// ============ 任务通用路由 (ONE_TIME + 共享操作) ============
// 必须放在最后，作为通用任务操作的兜底路由
// 实际访问: /tasks/one-time, /tasks/today, /tasks/:uuid/start 等
router.use('/', taskTemplateRoutes);

export default router;
