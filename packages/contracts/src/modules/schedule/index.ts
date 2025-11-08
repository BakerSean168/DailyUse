/**
 * Schedule Module - Contracts
 * 调度模块契约定义
 *
 * 统一导出所有 Schedule 模块的契约定义
 */

// ============ 枚举 ============
export * from './enums';

// ============ 值对象 ============
export * from './value-objects';

// ============ 实体 ============
export * from './entities/ScheduleExecutionServer';
export * from './entities/ScheduleExecutionClient';

// ============ 聚合根 ============
export * from './aggregates/ScheduleTaskServer';
export * from './aggregates/ScheduleTaskClient';
export * from './aggregates/ScheduleStatisticsServer';
export * from './aggregates/ScheduleStatisticsClient';
export * from './aggregates/ScheduleServer'; // Story 9.1 - User-facing schedules with conflict detection
export * from './aggregates/ScheduleClient'; // Story 9.1 - Client-side schedule DTO

// ============ 冲突检测 ============
// Story 9.1 (EPIC-SCHEDULE-001)
export * from './ConflictDetectionResult';

// ============ API 请求/响应 ============
// 所有 DTO 已合并到 api-requests.ts
export * from './api-requests';

