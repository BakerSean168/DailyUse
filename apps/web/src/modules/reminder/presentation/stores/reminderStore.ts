import { defineStore } from 'pinia';
import { ReminderTemplate, ReminderGroup, ReminderStatistics } from '@dailyuse/domain-client';
import { ReminderContracts } from '@dailyuse/contracts';

type ReminderHistory = ReminderContracts.ReminderHistoryClientDTO;

// 类型定义
interface ReminderStoreState {
  reminderTemplates: any[];
  reminderGroups: any[];
  reminderHistories: ReminderHistory[];
  statistics: any | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  filters: {
    groupUuid: string;
    priority: string;
    enabled: boolean | null;
    status: string;
  };
  selectedTemplateUuid: string | null;
  selectedGroupUuid: string | null;
  enableStatusOperation: {
    isProcessing: boolean;
    operationType: string | null;
    targetUuid: string | null;
  };
  upcomingReminders: any | null;
  upcomingRemindersLastUpdate: Date | null;
}

/**
 * Reminder Store - 纯缓存存储
 * 职责：缓存提醒模板、分组和历史记录数据，提供响应式查询接口
 */
export const useReminderStore = defineStore('reminder', {
  state: (): ReminderStoreState => ({
    // ===== 缓存数据 =====
    reminderTemplates: [],
    reminderGroups: [],
    reminderHistories: [],
    statistics: null,

    // ===== 状态管理 =====
    isLoading: false,
    isInitialized: false,
    error: null,
    lastSyncTime: null,

    // ===== UI状态 =====
    filters: {
      groupUuid: '',
      priority: '',
      enabled: null,
      status: '',
    },

    selectedTemplateUuid: null,
    selectedGroupUuid: null,

    enableStatusOperation: {
      isProcessing: false,
      operationType: null,
      targetUuid: null,
    },

    // 即将到来的提醒缓存
    upcomingReminders: null,
    upcomingRemindersLastUpdate: null,
  }),

  getters: {
    // ===== 模板查询 =====

    /**
     * 获取所有提醒模板
     */
    getAllReminderTemplates(): any[] {
      return this.reminderTemplates;
    },

    /**
     * 获取启用的提醒模板
     */
    getEnabledReminderTemplates(): any[] {
      return this.reminderTemplates.filter(
        (template) => template.selfEnabled && template.effectiveEnabled,
      );
    },

    /**
     * 根据UUID获取提醒模板
     */
    getReminderTemplateByUuid:
      (state) =>
      (uuid: string): any | null => {
        return state.reminderTemplates.find((t) => t.uuid === uuid) || null;
      },

    /**
     * 根据分组UUID获取模板
     */
    getTemplatesByGroup:
      (state) =>
      (groupUuid: string): any[] => {
        return state.reminderTemplates.filter((t) => t.groupUuid === groupUuid);
      },

    /**
     * 过滤后的模板列表
     */
    getFilteredTemplates(): any[] {
      let filtered = this.reminderTemplates;

      if (this.filters.groupUuid) {
        filtered = filtered.filter((template) => template.groupUuid === this.filters.groupUuid);
      }

      if (this.filters.priority) {
        filtered = filtered.filter(
          (template) => template.importanceLevel === this.filters.priority,
        );
      }

      if (this.filters.enabled !== null) {
        filtered = filtered.filter(
          (template) => template.effectiveEnabled === this.filters.enabled,
        );
      }

      return filtered;
    },

    // ===== 分组查询 =====

    /**
     * 获取所有提醒分组
     */
    getAllReminderGroups(): any[] {
      return this.reminderGroups;
    },

    /**
     * 根据UUID获取提醒分组
     */
    getReminderGroupByUuid:
      (state) =>
      (uuid: string): any | null => {
        return state.reminderGroups.find((g) => g.uuid === uuid) || null;
      },

    /**
     * 获取启用的分组
     */
    getEnabledGroups(): any[] {
      return this.reminderGroups.filter((group) => group.enabled);
    },

    // ===== 历史记录查询 =====

    /**
     * 获取所有提醒历史记录
     */
    getAllReminderHistories(): ReminderHistory[] {
      return this.reminderHistories;
    },

    /**
     * 获取活跃的提醒历史记录
     */
    getActiveReminderHistories(): ReminderHistory[] {
      return this.reminderHistories.filter(
        (history) => history.result === ReminderContracts.TriggerResult.SUCCESS,
      );
    },

    /**
     * 根据模板UUID获取历史记录
     */
    getHistoriesByTemplate:
      (state) =>
      (templateUuid: string): ReminderHistory[] => {
        return state.reminderHistories.filter((h) => h.templateUuid === templateUuid);
      },

    /**
     * 根据UUID获取历史记录
     */
    getReminderHistoryByUuid:
      (state) =>
      (uuid: string): ReminderHistory | null => {
        return state.reminderHistories.find((h) => h.uuid === uuid) || null;
      },

    // ===== 选中状态 =====

    /**
     * 获取选中的模板
     */
    selectedTemplate(): any | null {
      if (!this.selectedTemplateUuid) return null;
      return this.getReminderTemplateByUuid(this.selectedTemplateUuid);
    },

    /**
     * 获取选中的分组
     */
    selectedGroup(): any | null {
      if (!this.selectedGroupUuid) return null;
      return this.getReminderGroupByUuid(this.selectedGroupUuid);
    },
  },

  actions: {
    // ===== 初始化 =====

    /**
     * 初始化 store
     */
    initialize() {
      this.isInitialized = true;
      console.log('📦 [ReminderStore] Store 已初始化');
    },

    /**
     * 更新同步时间
     */
    updateSyncTime() {
      this.lastSyncTime = new Date();
    },

    /**
     * 检查是否应该刷新缓存
     */
    shouldRefreshCache(): boolean {
      if (!this.lastSyncTime) return true;
      // 如果超过30分钟未同步，则需要刷新
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      return this.lastSyncTime < thirtyMinutesAgo;
    },

    // ===== 状态操作 =====

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    /**
     * 设置错误信息
     */
    setError(errorMessage: string | null) {
      this.error = errorMessage;
    },

    /**
     * 清除错误
     */
    clearError() {
      this.error = null;
    },

    // ===== 模板管理 =====

    /**
     * 批量设置提醒模板
     */
    setReminderTemplates(templates: Array<ReminderTemplate | ReminderContracts.ReminderTemplateClientDTO>) {
      this.reminderTemplates = templates.map((template) =>
        template instanceof ReminderTemplate ? template : ReminderTemplate.fromClientDTO(template),
      );
      this.updateSyncTime();
      console.log('📦 [ReminderStore] 已设置模板:', this.reminderTemplates.length, '个');
    },

    /**
     * 添加或更新提醒模板
     */
    addOrUpdateReminderTemplate(template: ReminderTemplate | ReminderContracts.ReminderTemplateClientDTO) {
      const entity = template instanceof ReminderTemplate ? template : ReminderTemplate.fromClientDTO(template);
      const index = this.reminderTemplates.findIndex((t) => t.uuid === entity.uuid);
      if (index >= 0) {
        this.reminderTemplates[index] = entity;
      } else {
        this.reminderTemplates.push(entity);
      }
      console.log('📦 [ReminderStore] 已添加/更新模板:', entity.uuid);
    },

    /**
     * 删除提醒模板
     */
    removeReminderTemplate(uuid: string) {
      const index = this.reminderTemplates.findIndex((t) => t.uuid === uuid);
      if (index >= 0) {
        this.reminderTemplates.splice(index, 1);
        console.log('📦 [ReminderStore] 已删除模板:', uuid);
      }
    },

    /**
     * 设置选中的模板UUID
     */
    setSelectedTemplate(uuid: string | null) {
      this.selectedTemplateUuid = uuid;
    },

    // ===== 分组管理 =====

    /**
     * 批量设置提醒分组
     */
    setReminderGroups(groups: Array<ReminderGroup | ReminderContracts.ReminderGroupClientDTO>) {
      this.reminderGroups = groups.map((group) =>
        group instanceof ReminderGroup ? group : ReminderGroup.fromClientDTO(group),
      );
      this.updateSyncTime();
      console.log('📦 [ReminderStore] 已设置分组:', this.reminderGroups.length, '个');
    },

    /**
     * 添加或更新提醒分组
     */
    addOrUpdateReminderGroup(group: ReminderGroup | ReminderContracts.ReminderGroupClientDTO) {
      const entity = group instanceof ReminderGroup ? group : ReminderGroup.fromClientDTO(group);
      const index = this.reminderGroups.findIndex((g) => g.uuid === entity.uuid);
      if (index >= 0) {
        this.reminderGroups[index] = entity;
      } else {
        this.reminderGroups.push(entity);
      }
      console.log('📦 [ReminderStore] 已添加/更新分组:', entity.uuid);
    },

    /**
     * 删除提醒分组
     */
    removeReminderGroup(uuid: string) {
      const index = this.reminderGroups.findIndex((g) => g.uuid === uuid);
      if (index >= 0) {
        this.reminderGroups.splice(index, 1);
        console.log('📦 [ReminderStore] 已删除分组:', uuid);
      }
    },

    /**
     * 设置选中的分组UUID
     */
    setSelectedGroup(uuid: string | null) {
      this.selectedGroupUuid = uuid;
    },

    // ===== 历史记录管理 =====

    /**
     * 批量设置提醒历史记录
     */
    setReminderHistories(histories: ReminderHistory[]) {
      this.reminderHistories = histories;
      console.log('📦 [ReminderStore] 已设置历史记录:', histories.length, '条');
    },

    /**
     * 添加或更新提醒历史记录
     */
    addOrUpdateReminderHistory(history: ReminderHistory) {
      const index = this.reminderHistories.findIndex((h) => h.uuid === history.uuid);
      if (index >= 0) {
        this.reminderHistories[index] = history;
      } else {
        this.reminderHistories.push(history);
      }
    },

    /**
     * 删除提醒历史记录
     */
    removeReminderHistory(uuid: string) {
      const index = this.reminderHistories.findIndex((h) => h.uuid === uuid);
      if (index >= 0) {
        this.reminderHistories.splice(index, 1);
      }
    },

    // ===== 统计数据管理 =====

    /**
     * 设置统计数据
     */
    setStatistics(stats: ReminderStatistics | ReminderContracts.ReminderStatisticsClientDTO) {
      this.statistics = stats instanceof ReminderStatistics ? stats : ReminderStatistics.fromClientDTO(stats);
    },

    /**
     * 清除统计数据
     */
    clearStatistics() {
      this.statistics = null;
    },

    // ===== 过滤器管理 =====

    /**
     * 设置过滤器
     */
    setFilters(newFilters: Partial<ReminderStoreState['filters']>) {
      this.filters = { ...this.filters, ...newFilters };
    },

    /**
     * 清除过滤器
     */
    clearFilters() {
      this.filters = {
        groupUuid: '',
        priority: '',
        enabled: null,
        status: '',
      };
    },

    // ===== 启用状态控制 =====

    /**
     * 设置启用状态操作
     */
    setEnableStatusOperation(isProcessing: boolean, operationType?: string, targetUuid?: string) {
      this.enableStatusOperation = {
        isProcessing,
        operationType: operationType || null,
        targetUuid: targetUuid || null,
      };
    },

    /**
     * 清除启用状态操作
     */
    clearEnableStatusOperation() {
      this.enableStatusOperation = {
        isProcessing: false,
        operationType: null,
        targetUuid: null,
      };
    },

    // ===== 即将到来的提醒 =====

    /**
     * 设置即将到来的提醒缓存
     */
    setUpcomingReminders(data: any) {
      this.upcomingReminders = data;
      this.upcomingRemindersLastUpdate = new Date();
    },

    /**
     * 清除即将到来的提醒缓存
     */
    clearUpcomingReminders() {
      this.upcomingReminders = null;
      this.upcomingRemindersLastUpdate = null;
    },

    /**
     * 检查即将到来的提醒缓存是否有效
     */
    isUpcomingRemindersCacheValid(maxAgeMs: number = 60000): boolean {
      if (!this.upcomingRemindersLastUpdate) return false;
      return Date.now() - this.upcomingRemindersLastUpdate.getTime() < maxAgeMs;
    },

    // ===== 缓存管理 =====

    /**
     * 清除所有缓存数据
     */
    clearAll() {
      this.reminderTemplates = [];
      this.reminderGroups = [];
      this.reminderHistories = [];
      this.statistics = null;
      this.selectedTemplateUuid = null;
      this.selectedGroupUuid = null;
      this.error = null;
      this.clearFilters();
      this.clearEnableStatusOperation();
      this.clearUpcomingReminders();
      this.lastSyncTime = null;
      console.log('📦 [ReminderStore] 已清除所有缓存');
    },
  },

  // ===== 持久化配置 =====
  persist: {
    key: 'reminder-store',
    storage: localStorage,
    // 选择性持久化关键数据，避免持久化 loading 状态
    pick: [
      'reminderTemplates',
      'reminderGroups',
      'selectedTemplateUuid',
      'selectedGroupUuid',
      'lastSyncTime',
      'isInitialized',
    ],
    // 自定义序列化器，确保实体类的正确序列化
    serializer: {
      serialize: (state: any) => {
        console.log('📦 [ReminderStore] 开始序列化 Store 数据', {
          templatesCount: state.reminderTemplates?.length || 0,
          groupsCount: state.reminderGroups?.length || 0,
        });

        const serialized = {
          ...state,
          reminderTemplates: state.reminderTemplates.map((template: any) => {
            // ✅ 传入 includeChildren=true 确保序列化所有子对象
            const dto =
              template && typeof template.toClientDTO === 'function'
                ? template.toClientDTO(true) // 🔥 includeChildren=true
                : template;

            console.log('📦 [ReminderStore] 序列化 Template:', {
              uuid: dto.uuid,
              title: dto.title,
            });

            return dto;
          }),
          reminderGroups: state.reminderGroups.map((group: any) =>
            group && typeof group.toClientDTO === 'function' ? group.toClientDTO(true) : group,
          ),
          lastSyncTime: state.lastSyncTime?.getTime ? state.lastSyncTime.getTime() : state.lastSyncTime,
        };

        console.log('📦 [ReminderStore] 序列化完成:', {
          templatesCount: serialized.reminderTemplates.length,
          groupsCount: serialized.reminderGroups.length,
        });

        return JSON.stringify(serialized);
      },
      deserialize: (serialized: string) => {
        const state = JSON.parse(serialized);
        console.log('📦 [ReminderStore] 开始反序列化 Store 数据', {
          templatesCount: state.reminderTemplates?.length || 0,
          groupsCount: state.reminderGroups?.length || 0,
          isInitialized: state.isInitialized,
        });

        const deserialized = {
          ...state,
          reminderTemplates: (state.reminderTemplates || []).map((templateData: any) => {
            try {
              const template = ReminderTemplate.fromClientDTO(templateData);
              console.log('📦 [ReminderStore] 反序列化 Template:', {
                uuid: template.uuid,
                title: template.title,
              });
              return template;
            } catch (e) {
              console.warn('Failed to deserialize template:', templateData, e);
              return templateData; // 保持原始数据
            }
          }),
          reminderGroups: (state.reminderGroups || []).map((groupData: any) => {
            try {
              return ReminderGroup.fromClientDTO(groupData);
            } catch (e) {
              console.warn('Failed to deserialize group:', groupData, e);
              return groupData; // 保持原始数据
            }
          }),
          lastSyncTime: state.lastSyncTime ? new Date(state.lastSyncTime) : null,
        };

        console.log('📦 [ReminderStore] 反序列化完成:', {
          templatesCount: deserialized.reminderTemplates.length,
          groupsCount: deserialized.reminderGroups.length,
        });

        return deserialized;
      },
    },
  },
});

// 导出 store 类型
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
