/**
 * Search Data Provider
 *
 * Provides data for global search by aggregating data from all modules.
 * Uses singleton pattern to cache data and reduce API calls.
 *
 * @module SearchDataProvider
 */

import { ref } from 'vue';
import type { GoalContracts, TaskContracts, ReminderContracts } from '@dailyuse/contracts';
import { GoalWebApplicationService } from '@/modules/goal/application/services/GoalWebApplicationService';
import { TaskTemplateApplicationService } from '@/modules/task/application/services/TaskTemplateApplicationService';
import { reminderTemplateApplicationService } from '@/modules/reminder/application/services';

/**
 * Searchable item with minimal fields
 * Used for Reminder templates that don't have all the fields
 */
export interface SearchableItem {
  uuid: string;
  title: string;
  description?: string | null;
  status: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Search data cache
 */
interface SearchDataCache {
  goals: GoalContracts.GoalClientDTO[];
  tasks: TaskContracts.TaskTemplateClientDTO[];
  reminders: SearchableItem[];
  lastUpdated: number;
}

/**
 * Search Data Provider Service
 *
 * Singleton service that provides data for global search.
 * Implements caching with TTL (Time To Live) to reduce API calls.
 */
export class SearchDataProvider {
  private static instance: SearchDataProvider;

  private goalService = new GoalWebApplicationService();
  private taskTemplateService = TaskTemplateApplicationService.getInstance();
  private reminderTemplateService = reminderTemplateApplicationService;

  private cache = ref<SearchDataCache | null>(null);
  private isLoading = ref(false);
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SearchDataProvider {
    if (!SearchDataProvider.instance) {
      SearchDataProvider.instance = new SearchDataProvider();
    }
    return SearchDataProvider.instance;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.cache.value) return false;
    const now = Date.now();
    return now - this.cache.value.lastUpdated < this.cacheTTL;
  }

  /**
   * Load all data for search
   *
   * @param forceRefresh Force refresh even if cache is valid
   * @returns Promise that resolves when data is loaded
   */
  public async loadData(forceRefresh = false): Promise<void> {
    // Return cached data if valid
    if (!forceRefresh && this.isCacheValid()) {
      return;
    }

    // Prevent concurrent loads
    if (this.isLoading.value) {
      return;
    }

    try {
      this.isLoading.value = true;

      // Load data from all modules in parallel
      const [goalsResponse, tasksResponse, remindersResponse] = await Promise.all([
        this.loadGoals(),
        this.loadTasks(),
        this.loadReminders(),
      ]);

      // Update cache
      this.cache.value = {
        goals: goalsResponse,
        tasks: tasksResponse,
        reminders: remindersResponse,
        lastUpdated: Date.now(),
      };

      console.log('Search data loaded:', {
        goals: goalsResponse.length,
        tasks: tasksResponse.length,
        reminders: remindersResponse.length,
      });
    } catch (error) {
      console.error('Failed to load search data:', error);
      // Don't throw, just log error and return empty cache
      if (!this.cache.value) {
        this.cache.value = {
          goals: [],
          tasks: [],
          reminders: [],
          lastUpdated: Date.now(),
        };
      }
    } finally {
      this.isLoading.value = false;
    }
  }

  /**
   * Load goals from API
   */
  private async loadGoals(): Promise<GoalContracts.GoalClientDTO[]> {
    try {
      const response = await this.goalService.getGoals({
        limit: 1000, // Get all goals (reasonable limit)
      });

      // Response is GoalsResponse: { goals: GoalClientDTO[], total, page, limit, hasMore }
      return (response.goals || []) as GoalContracts.GoalClientDTO[];
    } catch (error) {
      console.error('Failed to load goals:', error);
      return [];
    }
  }

  /**
   * Load tasks from API
   */
  private async loadTasks(): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    try {
      const templates = await this.taskTemplateService.getTaskTemplates({
        limit: 1000, // Get all tasks
      });

      // getTaskTemplates returns TaskTemplateClientDTO[] directly
      return templates || [];
    } catch (error) {
      console.error('Failed to load tasks:', error);
      return [];
    }
  }

  /**
   * Load reminders from API
   */
  private async loadReminders(): Promise<SearchableItem[]> {
    try {
      // getReminderTemplates updates the store and returns void
      await this.reminderTemplateService.getReminderTemplates({
        limit: 1000, // Get all reminders
        forceRefresh: true,
      });

      // Get reminders from store (需要导入 reminderStore)
      const { useReminderStore } = await import('@/modules/reminder/presentation/stores/reminderStore');
      const reminderStore = useReminderStore();
      const reminders = reminderStore.reminderTemplates || [];

      // Convert to searchable items
      return reminders.map((reminder: ReminderContracts.ReminderTemplateClientDTO) => ({
        uuid: reminder.uuid,
        title: reminder.title,
        description: reminder.description,
        status: reminder.selfEnabled && reminder.effectiveEnabled ? 'ACTIVE' : 'DISABLED',
        createdAt: reminder.createdAt,
        updatedAt: reminder.updatedAt,
      }));
    } catch (error) {
      console.error('Failed to load reminders:', error);
      return [];
    }
  }

  /**
   * Get goals (from cache)
   */
  public getGoals(): GoalContracts.GoalClientDTO[] {
    return this.cache.value?.goals || [];
  }

  /**
   * Get tasks (from cache)
   */
  public getTasks(): TaskContracts.TaskTemplateClientDTO[] {
    return this.cache.value?.tasks || [];
  }

  /**
   * Get reminders (from cache)
   */
  public getReminders(): SearchableItem[] {
    return this.cache.value?.reminders || [];
  }

  /**
   * Get loading state
   */
  public get loading(): boolean {
    return this.isLoading.value;
  }

  /**
   * Get cache status
   */
  public getCacheStatus(): {
    isValid: boolean;
    lastUpdated: number | null;
    itemCounts: {
      goals: number;
      tasks: number;
      reminders: number;
    };
  } {
    return {
      isValid: this.isCacheValid(),
      lastUpdated: this.cache.value?.lastUpdated || null,
      itemCounts: {
        goals: this.cache.value?.goals.length || 0,
        tasks: this.cache.value?.tasks.length || 0,
        reminders: this.cache.value?.reminders.length || 0,
      },
    };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.value = null;
  }

  /**
   * Refresh data
   */
  public async refresh(): Promise<void> {
    await this.loadData(true);
  }
}

// Export singleton instance
export const searchDataProvider = SearchDataProvider.getInstance();
