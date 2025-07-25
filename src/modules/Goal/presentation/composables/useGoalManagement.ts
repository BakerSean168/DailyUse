import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { getGoalDomainApplicationService } from "../../application/services/goalDomainApplicationService";
import { useGoalStore } from "../stores/goalStore";
import type { IGoal } from "../../domain/types/goal";
import { Goal } from "../../domain/entities/goal";

/**
 * 目标管理组合式函数 - 新架构版本
 * 使用领域应用服务进行目标管理操作
 */
export function useGoalManagement() {
  const router = useRouter();

  // 使用新的 goalStore（从 presentation 层）
  const goalStore = useGoalStore();

  // 使用领域应用服务
  const goalDomainService = getGoalDomainApplicationService();

  // 选择的目标文件夹下的目标
  const selectedDirId = ref<string>("all");

  // 从 store 的 getters 获取目标
  const goalsInCurDir = computed(() => {
    if (selectedDirId.value === "all") {
      return goalStore.goals;
    }
    return goalStore.goals.filter(
      (goal: IGoal) => goal.dirId === selectedDirId.value
    );
  });

  const getGoalsCountByDirId = (dirId: string) => {
    if (dirId === "all") {
      return goalStore.goals.length;
    }
    return goalStore.goals.filter((goal: IGoal) => goal.dirId === dirId).length;
  };

  // 选择目标文件夹
  const selectDir = (dirId: string) => {
    selectedDirId.value = dirId;
  };

  // 根据标签筛选目标
  const statusTabs = [
    { label: "全部的", value: "all" },
    { label: "进行中", value: "in-progress" },
    { label: "已完成", value: "completed" },
    { label: "已过期", value: "expired" },
  ];

  const selectedStatus = ref(statusTabs[0].value);

  // 根据状态筛选目标
  const goalsInCurStatus = computed(() => {
    let goals = goalsInCurDir.value;

    if (selectedStatus.value === "all") {
      return goals;
    }

    const now = new Date();

    if (selectedStatus.value === "in-progress") {
      return goals.filter((goal: IGoal) => {
        const startDate = new Date(goal.startTime.timestamp);
        const endDate = new Date(goal.endTime.timestamp);
        return (
          goal.lifecycle.status === "active" &&
          startDate <= now &&
          endDate >= now
        );
      });
    }

    if (selectedStatus.value === "completed") {
      return goals.filter(
        (goal: IGoal) => goal.lifecycle.status === "completed"
      );
    }

    if (selectedStatus.value === "expired") {
      return goals.filter((goal: IGoal) => {
        const endDate = new Date(goal.endTime.timestamp);
        return goal.lifecycle.status === "active" && endDate < now;
      });
    }

    return goals;
  });

  // 获取每个类别的目标数量
  const getGoalCountByStatus = (status: string) => {
    const goals = goalsInCurDir.value;

    if (status === "all") {
      return goals.length;
    }

    const now = new Date();

    if (status === "in-progress") {
      return goals.filter((goal: IGoal) => {
        const startDate = new Date(goal.startTime.timestamp);
        const endDate = new Date(goal.endTime.timestamp);
        return (
          goal.lifecycle.status === "active" &&
          startDate <= now &&
          endDate >= now
        );
      }).length;
    }

    if (status === "completed") {
      return goals.filter(
        (goal: IGoal) => goal.lifecycle.status === "completed"
      ).length;
    }

    if (status === "expired") {
      return goals.filter((goal: IGoal) => {
        const endDate = new Date(goal.endTime.timestamp);
        return goal.lifecycle.status === "active" && endDate < now;
      }).length;
    }

    return 0;
  };

  // 目标相关业务
  const showGoalDialog = ref(false);
  const goalDialogMode = ref<"create" | "edit">("create");
  const goalData = ref<Goal | null>(null);

  const initGoalData = () => {
    goalData.value = new Goal();
  };

  /**
   * 创建或修改目标业务
   */
  const startCreateGoal = () => {
    goalDialogMode.value = "create";
    initGoalData();
    showGoalDialog.value = true;
  };
  
  const startEditGoal = (goal: Goal) => {
    goalDialogMode.value = "edit";
    goalData.value = goal.clone(); // 直接使用传入的目标数据
    showGoalDialog.value = true;
    };

  const handleSaveGoal = async (goal: Goal) => {
  try {
    let result;
    
    if (goalDialogMode.value === 'edit' && goalDialogMode.value) {
        if (!goalData.value) {
          console.error('❌ 编辑目标时未提供目标数据');
          return;
        }
      result = await goalDomainService.updateGoal(goalData.value.toDTO());
    } else {
        if (!goalData.value) {
            console.error('❌ 创建目标时未提供目标数据');
            return;
        }
      result = await goalDomainService.createGoal(goalData.value.toDTO());
    }
    
    if (result.success) {
      const action = goalDialogMode.value === 'edit' ? '更新' : '创建';
      console.log(`✅ 目标${action}成功`);
      // 关闭对话框
      showGoalDialog.value = false;
      // 刷新数据
      await goalDomainService.syncAllData();
    } else {
      console.error('❌ 目标保存失败:', result.message);
      alert('保存失败：' + result.message);
    }
  } catch (error) {
    console.error('❌ 保存目标时发生错误:', error);
    alert('保存目标时发生错误，请稍后重试');
  }
};

  /**
   * 删除目标业务
   */
  const showDeleteConfirmDialog = ref(false);
  const goalToDelete = ref<string>("");

  const startDeleteGoal = (goalUuid: string) => {
    goalToDelete.value = goalUuid;
    showDeleteConfirmDialog.value = true;
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete.value) return;

    try {
      const result = await goalDomainService.deleteGoal(goalToDelete.value);

      if (result.success) {
        console.log("✅ 目标删除成功");
        showDeleteConfirmDialog.value = false;
        goalToDelete.value = "";
        // Navigate back after successful deletion
        router.back();
      } else {
        console.error("❌ 目标删除失败:", result.message);
        // 可以在这里显示错误提示
      }
    } catch (error) {
      console.error("❌ 删除目标时发生错误:", error);
    }
  };

  const cancelDeleteGoal = () => {
    showDeleteConfirmDialog.value = false;
    goalToDelete.value = "";
  };

  // 刷新所有目标数据
  const refreshGoals = async () => {
    try {
      await goalDomainService.syncAllData();
      console.log("✅ 目标数据同步成功");
    } catch (error) {
      console.error("❌ 同步目标数据时发生错误:", error);
    }
  };

  return {
    // 目标文件夹相关
    selectedDirId,
    goalsInCurDir,
    getGoalsCountByDirId,
    selectDir,

    // 文件夹下的目标状态筛选
    statusTabs,
    selectedStatus,
    goalsInCurStatus,
    getGoalCountByStatus,

    // 目标相关业务
    /** 创建或编辑目标 */
    showGoalDialog,
    goalDialogMode,
    goalData,
    startCreateGoal,
    startEditGoal,
    handleSaveGoal,
    // 删除目标
    showDeleteConfirmDialog,
    goalToDelete,
    startDeleteGoal,
    handleDeleteGoal,
    cancelDeleteGoal,

    // 数据刷新
    refreshGoals,

    // 领域服务访问（供高级用例使用）
    goalDomainService,
  };
}
