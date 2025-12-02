/**
 * Goal Application Services
 * 按业务领域拆分的应用服务
 * 
 * 服务划分：
 * - GoalManagementApplicationService: Goal CRUD 和状态管理
 * - GoalFolderApplicationService: GoalFolder 管理
 * - KeyResultApplicationService: KeyResult 管理
 * - GoalRecordApplicationService: GoalRecord 管理
 * - GoalReviewApplicationService: GoalReview 管理
 * - GoalSyncApplicationService: 数据同步
 */

export {
  GoalManagementApplicationService,
  goalManagementApplicationService,
} from './GoalManagementApplicationService';

export {
  GoalFolderApplicationService,
  goalFolderApplicationService,
} from './GoalFolderApplicationService';

export {
  KeyResultApplicationService,
  keyResultApplicationService,
} from './KeyResultApplicationService';

export {
  GoalRecordApplicationService,
  goalRecordApplicationService,
} from './GoalRecordApplicationService';

export {
  GoalReviewApplicationService,
  goalReviewApplicationService,
} from './GoalReviewApplicationService';

export {
  GoalSyncApplicationService,
  goalSyncApplicationService,
} from './GoalSyncApplicationService';

export {
  FocusModeApplicationService,
  focusModeApplicationService,
} from './FocusModeApplicationService';
