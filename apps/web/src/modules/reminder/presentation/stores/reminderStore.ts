import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ReminderContracts } from '@dailyuse/contracts';

// 使用 DTO 类型替代领域实体
type ReminderTemplate = ReminderContracts.ReminderTemplateClientDTO;
type ReminderGroup = ReminderContracts.ReminderGroupClientDTO;
type ReminderHistory = ReminderContracts.ReminderHistoryClientDTO;

/**
 * Reminder Store - 状态管理
 * 职责：纯数据存储和缓存管理，不执行业务逻辑
 */
export const useReminderStore = defineStore('reminder', () => {
  // ===== 状态 =====

  // 提醒模板 (存储 DTO 数据)
  const reminderTemplates = ref<ReminderTemplate[]>([]);

  // 提醒分组 (存储 DTO 数据)
  const reminderGroups = ref<ReminderGroup[]>([]);

  // 提醒历史记录 (存储 DTO 数据，替代原来的 instances)
  const reminderHistories = ref<ReminderHistory[]>([]);

  // 提醒统计数据 (DTO 数据)
  const statistics = ref<ReminderContracts.ReminderStatsClientDTO | null>(null);

  // 当前选中的模板 (DTO 数据)
  const selectedTemplate = ref<ReminderTemplate | null>(null);

  // 当前选中的分组 (DTO 数据)
  const selectedGroup = ref<ReminderGroup | null>(null);

  // UI状态
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 过滤器状态
  const filters = ref({
    groupUuid: '',
    priority: '',
    enabled: null as boolean | null,
    status: '',
  });

  // 启用状态控制状态
  const enableStatusOperation = ref({
    isProcessing: false,
    operationType: null as string | null,
    targetUuid: null as string | null,
  });

  // 即将到来的提醒缓存
  const upcomingReminders = ref<any>(null);
  const upcomingRemindersLastUpdate = ref<Date | null>(null);

  // ===== 计算属性 =====

  /**
   * 获取所有提醒模板
   */
  const getAllReminderTemplates = computed(() => reminderTemplates.value);

  /**
   * 获取启用的提醒模板
   */
  const getEnabledReminderTemplates = computed(() =>
    reminderTemplates.value.filter((template) => template.selfEnabled && template.effectiveEnabled),
  );

  /**
   * 获取所有提醒分组
   */
  const getAllReminderGroups = computed(() => reminderGroups.value);

  /**
   * 获取所有提醒模板分组 (别名)
   */
  const reminderTemplateGroups = computed(() => reminderGroups.value);

  /**
   * 获取所有提醒历史记录
   */
  const getAllReminderHistories = computed(() => reminderHistories.value);

  /**
   * 获取活跃的提醒历史记录
   */
  const getActiveReminderHistories = computed(() =>
    reminderHistories.value.filter(
      (history) => history.result === ReminderContracts.TriggerResult.SUCCESS,
    ),
  );

  /**
   * 根据模板分组的历史记录
   */
  const getHistoriesByTemplate = computed(() => {
    const grouped: Record<string, ReminderHistory[]> = {};
    reminderHistories.value.forEach((history) => {
      if (!grouped[history.templateUuid]) {
        grouped[history.templateUuid] = [];
      }
      grouped[history.templateUuid].push(history);
    });
    return grouped;
  });

  /**
   * 过滤后的模板列表
   */
  const getFilteredTemplates = computed(() => {
    let filtered = reminderTemplates.value;

    if (filters.value.groupUuid) {
      filtered = filtered.filter((template) => template.groupUuid === filters.value.groupUuid);
    }

    if (filters.value.priority) {
      filtered = filtered.filter((template) => template.importanceLevel === filters.value.priority);
    }

    if (filters.value.enabled !== null) {
      filtered = filtered.filter((template) => template.effectiveEnabled === filters.value.enabled);
    }

    return filtered;
  });

  // ===== 状态操作方法 =====

  /**
   * 设置加载状态
   */
  const setLoading = (loading: boolean) => {
    isLoading.value = loading;
  };

  /**
   * 设置错误信息
   */
  const setError = (errorMessage: string | null) => {
    error.value = errorMessage;
  };

  /**
   * 清除错误
   */
  const clearError = () => {
    error.value = null;
  };

  // ===== 提醒模板管理 =====

  /**
   * 设置提醒模板列表 (域实体对象)
   */
  const setReminderTemplates = (templates: ReminderTemplate[]) => {
    reminderTemplates.value = templates;
  };

  /**
   * 添加或更新提醒模板 (域实体对象)
   */
  const addOrUpdateReminderTemplate = (template: ReminderTemplate) => {
    const index = reminderTemplates.value.findIndex((t) => t.uuid === template.uuid);
    if (index >= 0) {
      reminderTemplates.value[index] = template;
    } else {
      reminderTemplates.value.push(template);
    }
  };

  /**
   * 删除提醒模板
   */
  const removeReminderTemplate = (uuid: string) => {
    const index = reminderTemplates.value.findIndex((t) => t.uuid === uuid);
    if (index >= 0) {
      reminderTemplates.value.splice(index, 1);
    }
  };

  /**
   * 根据UUID获取提醒模板 (返回域实体对象)
   */
  const getReminderTemplateByUuid = (uuid: string): ReminderTemplate | null => {
    return reminderTemplates.value.find((t) => t.uuid === uuid) || null;
  };

  /**
   * 设置选中的模板 (域实体对象)
   */
  const setSelectedTemplate = (template: ReminderTemplate | null) => {
    selectedTemplate.value = template;
  };

  // ===== 提醒分组管理 =====

  /**
   * 设置提醒分组列表 (DTO 数据)
   */
  const setReminderGroups = (groups: ReminderGroup[]) => {
    reminderGroups.value = groups;
  };

  /**
   * 设置提醒模板分组列表 (别名方法，兼容ReminderWebApplicationService) (DTO 数据)
   */
  const setReminderTemplateGroups = (groups: ReminderGroup[]) => {
    reminderGroups.value = groups;
  };

  /**
   * 添加或更新提醒分组 (DTO 数据)
   */
  const addOrUpdateReminderGroup = (group: ReminderGroup) => {
    const index = reminderGroups.value.findIndex((g) => g.uuid === group.uuid);
    if (index >= 0) {
      reminderGroups.value[index] = group;
    } else {
      reminderGroups.value.push(group);
    }
  };

  /**
   * 添加或更新提醒模板分组 (别名方法，兼容ReminderWebApplicationService) (DTO 数据)
   */
  const addOrUpdateReminderTemplateGroup = (group: ReminderGroup) => {
    const index = reminderGroups.value.findIndex((g) => g.uuid === group.uuid);
    if (index >= 0) {
      reminderGroups.value[index] = group;
    } else {
      reminderGroups.value.push(group);
    }
  };

  /**
   * 删除提醒分组
   */
  const removeReminderGroup = (uuid: string) => {
    const index = reminderGroups.value.findIndex((g) => g.uuid === uuid);
    if (index >= 0) {
      reminderGroups.value.splice(index, 1);
    }
  };

  /**
   * 删除提醒模板分组 (别名方法，兼容ReminderWebApplicationService)
   */
  const removeReminderTemplateGroup = (uuid: string) => {
    const index = reminderGroups.value.findIndex((g) => g.uuid === uuid);
    if (index >= 0) {
      reminderGroups.value.splice(index, 1);
    }
  };

  /**
   * 根据UUID获取提醒分组 (返回 DTO 数据)
   */
  const getReminderGroupByUuid = (uuid: string): ReminderGroup | null => {
    return reminderGroups.value.find((g) => g.uuid === uuid) || null;
  };

  /**
   * 根据UUID获取提醒模板分组 (别名方法，兼容ReminderWebApplicationService) (返回 DTO 数据)
   */
  const getReminderTemplateGroupByUuid = (uuid: string): ReminderGroup | null => {
    return reminderGroups.value.find((g) => g.uuid === uuid) || null;
  };

  /**
   * 设置选中的分组 (DTO 数据)
   */
  const setSelectedGroup = (group: ReminderGroup | null) => {
    selectedGroup.value = group;
  };

  // ===== 提醒历史记录管理 =====
  // 注意：使用 ReminderHistory 替代原来的 ReminderInstance

  /**
   * 设置提醒历史记录列表 (DTO 数据)
   */
  const setReminderHistories = (histories: ReminderHistory[]) => {
    reminderHistories.value = histories;
  };

  /**
   * @deprecated 兼容旧代码，实际使用 setReminderHistories
   */
  const setReminderInstances = (instances: any[]) => {
    console.warn('setReminderInstances is deprecated, use setReminderHistories instead');
    // 兼容处理，将 instances 当作 histories 处理
    reminderHistories.value = instances as ReminderHistory[];
  };

  /**
   * 添加或更新提醒历史记录 (DTO 数据)
   */
  const addOrUpdateReminderHistory = (history: ReminderHistory) => {
    const index = reminderHistories.value.findIndex((h) => h.uuid === history.uuid);
    if (index >= 0) {
      reminderHistories.value[index] = history;
    } else {
      reminderHistories.value.push(history);
    }
  };

  /**
   * @deprecated 兼容旧代码，实际使用 addOrUpdateReminderHistory
   */
  const addOrUpdateReminderInstance = (instance: any) => {
    console.warn('addOrUpdateReminderInstance is deprecated, use addOrUpdateReminderHistory instead');
    addOrUpdateReminderHistory(instance as ReminderHistory);
  };

  /**
   * 批量添加或更新提醒历史记录 (DTO 数据)
   */
  const addOrUpdateReminderHistories = (histories: ReminderHistory[]) => {
    histories.forEach((history) => {
      addOrUpdateReminderHistory(history);
    });
  };

  /**
   * @deprecated 兼容旧代码，实际使用 addOrUpdateReminderHistories
   */
  const addOrUpdateReminderInstances = (instances: any[]) => {
    console.warn('addOrUpdateReminderInstances is deprecated, use addOrUpdateReminderHistories instead');
    addOrUpdateReminderHistories(instances as ReminderHistory[]);
  };

  /**
   * 删除提醒历史记录
   */
  const removeReminderHistory = (uuid: string) => {
    const index = reminderHistories.value.findIndex((h) => h.uuid === uuid);
    if (index >= 0) {
      reminderHistories.value.splice(index, 1);
    }
  };

  /**
   * @deprecated 兼容旧代码，实际使用 removeReminderHistory
   */
  const removeReminderInstance = (uuid: string) => {
    console.warn('removeReminderInstance is deprecated, use removeReminderHistory instead');
    removeReminderHistory(uuid);
  };

  /**
   * 根据UUID获取提醒历史记录 (返回 DTO 数据)
   */
  const getReminderHistoryByUuid = (uuid: string): ReminderHistory | null => {
    return reminderHistories.value.find((h) => h.uuid === uuid) || null;
  };

  /**
   * @deprecated 兼容旧代码，实际使用 getReminderHistoryByUuid
   */
  const getReminderInstanceByUuid = (uuid: string): any => {
    console.warn('getReminderInstanceByUuid is deprecated, use getReminderHistoryByUuid instead');
    return getReminderHistoryByUuid(uuid);
  };

  /**
   * 根据模板UUID获取提醒历史记录列表 (返回 DTO 数据数组)
   */
  const getReminderHistoriesByTemplate = (templateUuid: string): ReminderHistory[] => {
    return reminderHistories.value.filter((h) => h.templateUuid === templateUuid);
  };

  /**
   * @deprecated 兼容旧代码，实际使用 getReminderHistoriesByTemplate
   */
  const getReminderInstancesByTemplate = (templateUuid: string): any[] => {
    console.warn('getReminderInstancesByTemplate is deprecated, use getReminderHistoriesByTemplate instead');
    return getReminderHistoriesByTemplate(templateUuid);
  };

  // ===== 过滤器管理 =====

  /**
   * 设置过滤器
   */
  const setFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  /**
   * 清除过滤器
   */
  const clearFilters = () => {
    filters.value = {
      groupUuid: '',
      priority: '',
      enabled: null,
      status: '',
    };
  };

  // ===== 启用状态控制管理 =====

  /**
   * 设置启用状态操作
   */
  const setEnableStatusOperation = (
    isProcessing: boolean,
    operationType?: string,
    targetUuid?: string,
  ) => {
    enableStatusOperation.value = {
      isProcessing,
      operationType: operationType || null,
      targetUuid: targetUuid || null,
    };
  };

  /**
   * 清除启用状态操作
   */
  const clearEnableStatusOperation = () => {
    enableStatusOperation.value = {
      isProcessing: false,
      operationType: null,
      targetUuid: null,
    };
  };

  /**
   * 设置即将到来的提醒缓存
   */
  const setUpcomingReminders = (data: any) => {
    upcomingReminders.value = data;
    upcomingRemindersLastUpdate.value = new Date();
  };

  /**
   * 清除即将到来的提醒缓存
   */
  const clearUpcomingReminders = () => {
    upcomingReminders.value = null;
    upcomingRemindersLastUpdate.value = null;
  };

  /**
   * 检查即将到来的提醒缓存是否有效
   */
  const isUpcomingRemindersCacheValid = (maxAgeMs: number = 60000): boolean => {
    if (!upcomingRemindersLastUpdate.value) return false;
    return Date.now() - upcomingRemindersLastUpdate.value.getTime() < maxAgeMs;
  };

  // ===== 缓存管理 =====

  /**
   * 清除所有缓存数据
   */
  const clearAll = () => {
    reminderTemplates.value = [];
    reminderGroups.value = [];
    reminderHistories.value = [];
    selectedTemplate.value = null;
    selectedGroup.value = null;
    error.value = null;
    clearFilters();
    clearEnableStatusOperation();
    clearUpcomingReminders();
  };

  /**
   * 刷新指定模板的历史记录数据
   */
  const refreshTemplateHistories = (templateUuid: string) => {
    // 移除该模板的所有历史记录，等待重新加载
    reminderHistories.value = reminderHistories.value.filter(
      (history) => history.templateUuid !== templateUuid,
    );
  };

  /**
   * @deprecated 兼容旧代码，实际使用 refreshTemplateHistories
   */
  const refreshTemplateInstances = (templateUuid: string) => {
    console.warn('refreshTemplateInstances is deprecated, use refreshTemplateHistories instead');
    refreshTemplateHistories(templateUuid);
  };

  /**
   * 初始化标识（用于判断是否已初始化）
   */
  const isInitialized = ref(false);

  /**
   * 初始化 store
   */
  const initialize = () => {
    isInitialized.value = true;
  };

  /**
   * 检查是否应该刷新缓存
   */
  const shouldRefreshCache = (): boolean => {
    // 简单的缓存策略，可以根据需要扩展
    return false;
  };

  /**
   * 获取所有模板（getter 的别名）
   */
  const getAllTemplates = computed(() => reminderTemplates.value);

  /**
   * 更新模板（addOrUpdateReminderTemplate 的别名）
   */
  const updateReminderTemplate = (template: ReminderTemplate) => {
    addOrUpdateReminderTemplate(template);
  };

  /**
   * 设置模板启用状态
   */
  const setTemplateEnabled = (templateUuid: string, enabled: boolean) => {
    const template = getReminderTemplateByUuid(templateUuid);
    if (template) {
      // 这里需要根据实际的 domain model 来更新状态
      // 假设 ReminderTemplate 有一个 setEnabled 方法
      (template as any).enabled = enabled;
      addOrUpdateReminderTemplate(template);
    }
  };

  /**
   * 设置分组启用状态
   */
  const setGroupEnabled = (groupUuid: string, enabled: boolean) => {
    const group = getReminderGroupByUuid(groupUuid);
    if (group) {
      // 这里需要根据实际的 domain model 来更新状态
      (group as any).enabled = enabled;
      addOrUpdateReminderGroup(group);
    }
  };

  /**
   * 设置分组启用模式
   */
  const setGroupEnableMode = (groupUuid: string, mode: 'group' | 'individual') => {
    const group = getReminderGroupByUuid(groupUuid);
    if (group) {
      // 这里需要根据实际的 domain model 来更新状态
      (group as any).enableMode = mode;
      addOrUpdateReminderGroup(group);
    }
  };

  /**
   * 设置统计数据
   */
  const setStatistics = (stats: ReminderContracts.ReminderStatsClientDTO) => {
    statistics.value = stats;
  };

  /**
   * 清除统计数据
   */
  const clearStatistics = () => {
    statistics.value = null;
  };

  return {
    // 状态
    reminderTemplates: getAllReminderTemplates,
    reminderGroups: getAllReminderGroups,
    reminderTemplateGroups, // 添加这个别名
    reminderHistories: getAllReminderHistories, // 使用历史记录替代实例
    statistics, // 统计数据
    selectedTemplate,
    selectedGroup,
    isLoading,
    error,
    filters,
    enableStatusOperation,
    upcomingReminders,
    upcomingRemindersLastUpdate,

    // 计算属性
    getEnabledReminderTemplates,
    getActiveReminderHistories, // 使用历史记录替代实例
    getHistoriesByTemplate, // 使用历史记录替代实例
    getFilteredTemplates,

    // 状态操作
    setLoading,
    setError,
    clearError,

    // 提醒模板操作
    setReminderTemplates,
    addOrUpdateReminderTemplate,
    removeReminderTemplate,
    getReminderTemplateByUuid,
    setSelectedTemplate,

    // 提醒分组操作
    setReminderGroups,
    setReminderTemplateGroups,
    addOrUpdateReminderGroup,
    addOrUpdateReminderTemplateGroup,
    removeReminderGroup,
    removeReminderTemplateGroup,
    getReminderGroupByUuid,
    getReminderTemplateGroupByUuid,
    setSelectedGroup,

    // 提醒历史记录操作（替代原来的实例操作）
    setReminderHistories,
    addOrUpdateReminderHistory,
    addOrUpdateReminderHistories,
    removeReminderHistory,
    getReminderHistoryByUuid,
    getReminderHistoriesByTemplate,

    // 统计数据操作
    setStatistics,
    clearStatistics,

    // @deprecated 兼容旧代码的别名方法
    setReminderInstances,
    addOrUpdateReminderInstance,
    addOrUpdateReminderInstances,
    removeReminderInstance,
    getReminderInstanceByUuid,
    getReminderInstancesByTemplate,

    // 过滤器操作
    setFilters,
    clearFilters,

    // 启用状态控制操作
    setEnableStatusOperation,
    clearEnableStatusOperation,

    // 即将到来的提醒操作
    setUpcomingReminders,
    clearUpcomingReminders,
    isUpcomingRemindersCacheValid,

    // 缓存管理
    clearAll,
    refreshTemplateHistories, // 新方法
    refreshTemplateInstances, // @deprecated 兼容旧代码的别名

    // 初始化相关
    isInitialized,
    initialize,
    shouldRefreshCache,

    // 额外的 getter 和操作方法
    getAllTemplates,
    updateReminderTemplate,
    setTemplateEnabled,
    setGroupEnabled,
    setGroupEnableMode,
  };
});

export type ReminderStore = ReturnType<typeof useReminderStore>;

/**
 * 获取 Reminder Store 实例的工厂函数
 * 供 ApplicationService 直接使用，不依赖 composable 上下文
 */
let _reminderStoreInstance: ReminderStore | null = null;

export function getReminderStore(): ReminderStore {
  if (!_reminderStoreInstance) {
    _reminderStoreInstance = useReminderStore();
  }
  return _reminderStoreInstance;
}
