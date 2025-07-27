import { getGoalDomainApplicationService } from "../../application/services/goalDomainApplicationService";

// Composables
import { useSnackbar } from "@/shared/composables/useSnackbar";
// Domain entities
import { Goal } from "../../domain/aggregates/goal";
import { GoalDir } from "../../domain/aggregates/goalDir";
import { Record } from "../../domain/entities/record";
import { GoalReview } from "../../domain/entities/goalReview";

/**
 * useGoalServices
 * 
 * This composable encapsulates all goal-related business operations (CRUD, etc.),
 * and provides unified error handling and user feedback through snackbar.
 * 
 * Responsibilities:
 * - Call application services (goalService) to perform business operations
 * - Handle operation results and exceptions uniformly
 * - Provide feedback via snackbar
 */
export function useGoalServices() {
  // Get the domain application service instance (responsible for IPC communication and local state sync)
  const goalService = getGoalDomainApplicationService();
  // Get global snackbar methods
  const { snackbar, showError, showSuccess } = useSnackbar();

  /**
   * Create a goal
   * @param goal - The new goal instance to create
   */
  const handleCreateGoal = async (goal: Goal) => {
    console.log('[useGoalServices] Creating goal with data:', goal);
    try {
      const result = await goalService.createGoal(goal);
      if (result.success && result.data) {
        const name = result.data.name || '（无名称）';
        showSuccess(`目标创建成功：${name}`);
      } else {
        showError(`创建目标失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      showError("创建目标时发生未知错误");
    }
  };

  /**
   * Update a goal
   * @param goal - The goal instance to update
   */
  const handleUpdateGoal = async (goal: Goal) => {
    console.log('[useGoalServices] Updating goal with data:', goal);
    try {
      const result = await goalService.updateGoal(goal);
      if (result.success && result.data) {
        showSuccess(`目标更新成功：${result.data.goal.name}`);
      } else {
        showError(`更新目标失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error updating goal:", error);
      showError("更新目标时发生未知错误");
    }
  };

  /**
   * Delete a goal
   * @param goalUuid - The UUID of the goal to delete
   */
  const handleDeleteGoal = async (goalUuid: string) => {
    console.log('[useGoalServices] Deleting goal:', goalUuid);
    try {
      const result = await goalService.deleteGoal(goalUuid);
      if (result.success) {
        showSuccess(`目标已删除：${goalUuid}`);
      } else {
        showError(`删除目标失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      showError("删除目标时发生未知错误");
    }
  };

  /**
   * Delete all goals
   */
  const handleDeleteAllGoals = async () => {
    console.log('[useGoalServices] Deleting all goals');
    try {
      const result = await goalService.deleteAllGoals();
      if (result.success) {
        showSuccess(`所有目标已删除`);
      } else {
        showError(`删除所有目标失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting all goals:", error);
      showError("删除所有目标时发生未知错误");
    }
  };

  /**
   * Create a goal directory
   * @param goalDir - The new goal directory instance to create
   */
  const handleCreateGoalDir = async (goalDir: GoalDir) => {
    console.log('[useGoalServices] Creating goal directory:', goalDir);
    try {
      const result = await goalService.createGoalDir(goalDir);
      if (result.success && result.data) {
        showSuccess(`目标目录创建成功：${result.data.goalDir.name}`);
      } else {
        showError(`创建目标目录失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error creating goal directory:", error);
      showError("创建目标目录时发生未知错误");
    }
  };

  /**
   * Update a goal directory
   * @param goalDir - The goal directory instance to update
   */
  const handleUpdateGoalDir = async (goalDir: GoalDir) => {
    console.log('[useGoalServices] Updating goal directory:', goalDir);
    try {
      const result = await goalService.updateGoalDir(goalDir);
      if (result.success && result.data) {
        showSuccess(`目标目录更新成功：${result.data.goalDir.name}`);
      } else {
        showError(`更新目标目录失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error updating goal directory:", error);
      showError("更新目标目录时发生未知错误");
    }
  };

  /**
   * Delete a goal directory
   * @param goalDirId - The UUID of the goal directory to delete
   */
  const handleDeleteGoalDir = async (goalDirId: string) => {
    console.log('[useGoalServices] Deleting goal directory:', goalDirId);
    try {
      const result = await goalService.deleteGoalDir(goalDirId);
      if (result.success) {
        showSuccess(`目标目录已删除：${goalDirId}`);
      } else {
        showError(`删除目标目录失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting goal directory:", error);
      showError("删除目标目录时发生未知错误");
    }
  };

  /**
   * Add a record to a goal
   * @param record - The record to add
   */
  const handleAddRecordToGoal = async (record: Record) => {
    console.log('[useGoalServices] Adding record to goal:', record);
    try {
      const result = await goalService.addRecordToGoal(record);
      if (result.success && result.data) {
        showSuccess(`记录添加成功`);
      } else {
        showError(`添加记录失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error adding record to goal:", error);
      showError("添加记录时发生未知错误");
    }
  };

  /**
   * Remove a record from a goal
   * @param record - The record to remove
   */
  const handleRemoveRecordFromGoal = async (record: Record) => {
    console.log('[useGoalServices] Removing record from goal:', record);
    try {
      const result = await goalService.removeRecordFromGoal(record);
      if (result.success && result.data) {
        showSuccess(`记录删除成功`);
      } else {
        showError(`删除记录失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error removing record from goal:", error);
      showError("删除记录时发生未知错误");
    }
  };

  /**
   * Add a review to a goal
   * @param goalReview - The review to add
   */
  const handleAddReviewToGoal = async (goalReview: GoalReview) => {
    console.log('[useGoalServices] Adding review to goal:', goalReview);
    try {
      const result = await goalService.addReviewToGoal(goalReview);
      if (result.success && result.data) {
        showSuccess(`复盘添加成功`);
      } else {
        showError(`添加复盘失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error adding review to goal:", error);
      showError("添加复盘时发生未知错误");
    }
  };

  /**
   * Update a goal review
   * @param goalReview - The review to update
   */
  const handleUpdateReviewInGoal = async (goalReview: GoalReview) => {
    console.log('[useGoalServices] Updating review in goal:', goalReview);
    try {
      const result = await goalService.updateReviewInGoal(goalReview);
      if (result.success && result.data) {
        showSuccess(`复盘更新成功`);
      } else {
        showError(`更新复盘失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error updating review in goal:", error);
      showError("更新复盘时发生未知错误");
    }
  };

  /**
   * Remove a review from a goal
   * @param goalUuid - The UUID of the goal
   * @param reviewId - The UUID of the review to remove
   */
  const handleRemoveReviewFromGoal = async (goalUuid: string, reviewId: string) => {
    console.log('[useGoalServices] Removing review from goal:', { goalUuid, reviewId });
    try {
      const result = await goalService.removeReviewFromGoal(goalUuid, reviewId);
      if (result.success && result.data) {
        showSuccess(`复盘移除成功`);
      } else {
        showError(`移除复盘失败：${result.message}`);
      }
    } catch (error) {
      console.error("Error removing review from goal:", error);
      showError("移除复盘时发生未知错误");
    }
  };

  /**
   * Sync all goal data
   */
  const handleSyncAllGoalData = async () => {
    console.log('[useGoalServices] Syncing all goal data');
    try {
      await goalService.syncAllData();
      showSuccess(`数据同步完成`);
    } catch (error) {
      console.error("Error syncing all goal data:", error);
      showError("数据同步时发生未知错误");
    }
  };

  // Export all business operations and snackbar
  return {
    snackbar,
    goalService,
    handleCreateGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    handleDeleteAllGoals,
    handleCreateGoalDir,
    handleUpdateGoalDir,
    handleDeleteGoalDir,
    handleAddRecordToGoal,
    handleRemoveRecordFromGoal,
    handleAddReviewToGoal,
    handleUpdateReviewInGoal,
    handleRemoveReviewFromGoal,
    handleSyncAllGoalData,
  };
}