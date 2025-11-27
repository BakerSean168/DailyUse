/**
 * @dailyuse/contracts
 * 统一契约导出 - 根入口（极简版）
 *
 * 🎨 子路径导出架构（推荐使用子路径导入）
 *
 * ```typescript
 * // ✅ 推荐：从子路径导入（极致 Tree-Shaking）
 * import { GoalServerDTO, GoalStatus } from '@dailyuse/contracts/goal';
 * import { TaskTemplateServer, TaskType } from '@dailyuse/contracts/task';
 * import { ApiResponse, ResponseCode } from '@dailyuse/contracts/response';
 *
 * // ✅ 命名空间导入（避免命名冲突）
 * import * as GoalContracts from '@dailyuse/contracts/goal';
 * import * as TaskContracts from '@dailyuse/contracts/task';
 * ```
 *
 * 子路径列表：
 * - @dailyuse/contracts/task
 * - @dailyuse/contracts/goal
 * - @dailyuse/contracts/reminder
 * - @dailyuse/contracts/editor
 * - @dailyuse/contracts/repository
 * - @dailyuse/contracts/account
 * - @dailyuse/contracts/authentication
 * - @dailyuse/contracts/schedule
 * - @dailyuse/contracts/setting
 * - @dailyuse/contracts/notification
 * - @dailyuse/contracts/document
 * - @dailyuse/contracts/ai
 * - @dailyuse/contracts/dashboard
 * - @dailyuse/contracts/response
 * - @dailyuse/contracts/shared
 */

// ============================================================
// 响应系统（最常用，保留在根入口）
// ============================================================
export {
  ResponseCode,
  ResponseStatus,
  ResponseSeverity,
  ResponseBuilder,
  createResponseBuilder,
  getHttpStatusCode,
  isClientError,
  isServerError,
} from './response';

export type {
  ErrorDetail,
  PaginationInfo,
  BaseResponse,
  SuccessResponse,
  ErrorResponse,
  ApiErrorResponse,
  ApiResponse,
  TResponse,
  ResponseBuilderOptions,
  ListResponse,
  BatchResponse,
} from './response';

// ============================================================
// 共享基础类型
// ============================================================
export { ImportanceLevel } from './shared/importance';
export { UrgencyLevel } from './shared/urgency';

// ============================================================
// 通用调度生命周期事件（跨模块使用）
// ============================================================
export {
  ScheduleLifecycleAction,
  buildScheduleEventType,
  createScheduleLifecycleEvent,
  isScheduleLifecycleEvent,
  parseScheduleEventType,
} from './modules/common/schedule-lifecycle-events';

export type {
  IUnifiedEvent,
  EntityScheduleLifecyclePayload,
  EntityCreatedForScheduleEvent,
  EntityPausedForScheduleEvent,
  EntityResumedForScheduleEvent,
  EntityDeletedForScheduleEvent,
  EntityScheduleChangedEvent,
  ScheduleLifecycleEvent,
  ScheduleLifecycleActionType,
} from './modules/common/schedule-lifecycle-events';

// ============================================================
// Reminder 模块常量（运行时值，需直接导出）
// ============================================================
export {
  ROOT_GROUP_CONFIG,
  isRootGroup,
  getRootGroupUuid,
  isOnDesktop,
} from './modules/reminder/constants';
