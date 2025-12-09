/**
 * Goal Application Services
 *
 * Named exports for all goal-related application services.
 */

// ===== Goal Management 用例 =====
export { CreateGoal, createGoal } from './create-goal';
export type { CreateGoalInput } from './create-goal';

export { GetGoal, getGoal } from './get-goal';

export { ListGoals, listGoals } from './list-goals';
export type { ListGoalsInput, ListGoalsOutput } from './list-goals';

export { UpdateGoal, updateGoal } from './update-goal';
export type { UpdateGoalInput } from './update-goal';

export { DeleteGoal, deleteGoal } from './delete-goal';

export { ActivateGoal, activateGoal } from './activate-goal';

export { PauseGoal, pauseGoal } from './pause-goal';

export { CompleteGoal, completeGoal } from './complete-goal';

export { ArchiveGoal, archiveGoal } from './archive-goal';

export { SearchGoals, searchGoals } from './search-goals';
export type { SearchGoalsInput, SearchGoalsOutput } from './search-goals';

export { GetGoalAggregateView, getGoalAggregateView } from './get-goal-aggregate-view';
export type { GetGoalAggregateViewOutput } from './get-goal-aggregate-view';

export { CloneGoal, cloneGoal } from './clone-goal';
export type { CloneGoalInput } from './clone-goal';

// ===== Key Result 用例 =====
export { CreateKeyResult, createKeyResult } from './create-key-result';
export type { CreateKeyResultInput } from './create-key-result';

export { GetKeyResults, getKeyResults } from './get-key-results';

export { UpdateKeyResult, updateKeyResult } from './update-key-result';
export type { UpdateKeyResultInput } from './update-key-result';

export { DeleteKeyResult, deleteKeyResult } from './delete-key-result';
export type { DeleteKeyResultInput } from './delete-key-result';

export { BatchUpdateKeyResultWeights, batchUpdateKeyResultWeights } from './batch-update-key-result-weights';
export type { BatchUpdateKeyResultWeightsInput } from './batch-update-key-result-weights';

export { GetProgressBreakdown, getProgressBreakdown } from './get-progress-breakdown';

export { GenerateKeyResults, generateKeyResults } from './generate-key-results';
export type { GenerateKeyResultsInput, GenerateKeyResultsOutput } from './generate-key-results';

// ===== Task Decomposition (AI) 用例 =====
export { TaskDecompositionService, decomposeGoal } from './task-decomposition';

// ===== Goal Record 用例 =====
export { CreateGoalRecord, createGoalRecord } from './create-goal-record';
export type { CreateGoalRecordInput } from './create-goal-record';

export { GetGoalRecordsByKeyResult, getGoalRecordsByKeyResult } from './get-goal-records-by-key-result';
export type { GetGoalRecordsByKeyResultInput } from './get-goal-records-by-key-result';

export { GetGoalRecordsByGoal, getGoalRecordsByGoal } from './get-goal-records-by-goal';
export type { GetGoalRecordsByGoalInput } from './get-goal-records-by-goal';

export { DeleteGoalRecord, deleteGoalRecord } from './delete-goal-record';
export type { DeleteGoalRecordInput } from './delete-goal-record';

// ===== Goal Review 用例 =====
export { CreateGoalReview, createGoalReview } from './create-goal-review';
export type { CreateGoalReviewInput } from './create-goal-review';

export { GetGoalReviews, getGoalReviews } from './get-goal-reviews';

export { UpdateGoalReview, updateGoalReview } from './update-goal-review';
export type { UpdateGoalReviewInput } from './update-goal-review';

export { DeleteGoalReview, deleteGoalReview } from './delete-goal-review';
export type { DeleteGoalReviewInput } from './delete-goal-review';

// ===== Goal Folder 用例 =====
export { CreateGoalFolder, createGoalFolder } from './create-goal-folder';
export type { CreateGoalFolderInput } from './create-goal-folder';

export { ListGoalFolders, listGoalFolders } from './list-goal-folders';
export type { ListGoalFoldersInput } from './list-goal-folders';

export { GetGoalFolder, getGoalFolder } from './get-goal-folder';

export { UpdateGoalFolder, updateGoalFolder } from './update-goal-folder';
export type { UpdateGoalFolderInput } from './update-goal-folder';

export { DeleteGoalFolder, deleteGoalFolder } from './delete-goal-folder';

// ===== AI Services (additional exports from task-time-estimation and priority-analysis) =====
export { TaskTimeEstimationService } from './task-time-estimation';
export { PriorityAnalysisService } from './priority-analysis';
export type {
  PriorityScore,
  PriorityFactor,
  PriorityBatchResult,
  PriorityLevel,
  EisenhowerQuadrant,
} from './priority-analysis';
