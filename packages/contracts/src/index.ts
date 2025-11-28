/**
 * @dailyuse/contracts
 * 统一契约导出 - 根入口（极简版）
 *
 * ⚠️ 此根入口仅导出最核心的响应系统类型。
 * 所有业务模块请使用子路径导入以获得最佳 Tree-Shaking 效果。
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
 * - @dailyuse/contracts/task       - 任务模块
 * - @dailyuse/contracts/goal       - 目标模块
 * - @dailyuse/contracts/reminder   - 提醒模块
 * - @dailyuse/contracts/editor     - 编辑器模块
 * - @dailyuse/contracts/repository - 仓库模块
 * - @dailyuse/contracts/account    - 账户模块
 * - @dailyuse/contracts/authentication - 认证模块
 * - @dailyuse/contracts/schedule   - 调度模块
 * - @dailyuse/contracts/setting    - 设置模块
 * - @dailyuse/contracts/notification - 通知模块
 * - @dailyuse/contracts/document   - 文档模块
 * - @dailyuse/contracts/ai         - AI模块
 * - @dailyuse/contracts/dashboard  - 仪表盘模块
 * - @dailyuse/contracts/response   - 响应系统
 * - @dailyuse/contracts/shared     - 共享类型
 */

// ============================================================
// 响应系统（最常用，保留在根入口以便快速访问）
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
