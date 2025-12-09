/**
 * Schedule Module - Renderer
 *
 * 日程模块 - 渲染进程
 * 遵循 DDD 分层架构
 */

// ===== Application Layer =====
export { ScheduleApplicationService, scheduleApplicationService } from './application/services';

// ===== Presentation Layer =====
export {
  useSchedule,
  type ScheduleState,
  type UseScheduleReturn,
} from './presentation/hooks';

// ===== Initialization =====
export { registerScheduleModule, initializeScheduleModule } from './initialization';
