/**
 * Global Search Service
 *
 * Provides unified search across Goals, Tasks, and Reminders
 * with fuzzy matching and recent items tracking.
 *
 * @module GlobalSearchService
 */

import { GoalStatus } from '@dailyuse/contracts/goal';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import type { ReminderStatsClientDTO } from '@dailyuse/contracts/reminder';
import { fuzzyMatch, fuzzyMatchMultiField, type TextMatch } from '@/shared/utils/fuzzySearch';

// Generic search item interface
interface SearchableItem {
  uuid: string;
  title: string;
  description?: string | null;
  status: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Search result type
 */
export type SearchResultType = 'goal' | 'task' | 'reminder';

/**
 * Search result metadata
 */
export interface SearchResultMetadata {
  // Goal metadata
  progress?: number;
  dueDate?: string;
  taskCount?: number;

  // Task metadata
  goalTitle?: string;
  estimatedMinutes?: number;
  completedAt?: string;

  // Reminder metadata
  scheduledTime?: string;
  recurrence?: string;
  isRecurring?: boolean;
}

/**
 * Unified search result
 */
export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  status: string;
  metadata: SearchResultMetadata;
  score: number; // Relevance score (0-100)
  matches: TextMatch[]; // Highlighted text positions
  url: string; // Navigation path
}

/**
 * Recent item for quick access
 */
export interface RecentItem {
  id: string;
  type: SearchResultType;
  title: string;
  accessedAt: number; // Timestamp (ms)
  url: string;
}

/**
 * Recent items storage structure
 */
export interface RecentItemsStorage {
  goals: RecentItem[];
  tasks: RecentItem[];
  reminders: RecentItem[];
}

/**
 * Search options
 */
export interface SearchOptions {
  type?: SearchResultType; // Filter by type
  threshold?: number; // Minimum score (default: 60)
  limit?: number; // Maximum results (default: 50)
  includeCompleted?: boolean; // Include completed items (default: true)
}

/**
 * Command definition for quick actions
 */
export interface Command {
  id: string;
  label: string;
  description: string;
  icon: string;
  handler: () => void | Promise<void>;
  keywords: string[]; // For fuzzy matching
  category: 'create' | 'navigate' | 'action' | 'settings';
}

/**
 * Global Search Service
 *
 * Singleton service for searching across all modules
 */
export class GlobalSearchService {
  private static instance: GlobalSearchService;
  private recentItems: RecentItemsStorage = {
    goals: [],
    tasks: [],
    reminders: [],
  };
  private commands: Command[] = [];
  private readonly RECENT_ITEMS_KEY = 'command-palette-recent-items';
  private readonly MAX_RECENT_ITEMS = 10;

  private constructor() {
    this.loadRecentItems();
    this.initializeCommands();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GlobalSearchService {
    if (!GlobalSearchService.instance) {
      GlobalSearchService.instance = new GlobalSearchService();
    }
    return GlobalSearchService.instance;
  }

  /**
   * Search across all modules
   *
   * @param query Search query
   * @param goals Array of goals
   * @param tasks Array of task templates
   * @param reminders Array of reminders
   * @param options Search options
   * @returns Sorted array of search results
   */
  public async search(
    query: string,
    goals: GoalClientDTO[],
    tasks: TaskTemplateClientDTO[],
    reminders: SearchableItem[],
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    const { type, threshold = 60, limit = 50, includeCompleted = true } = options;

    // Trim query
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      return [];
    }

    const results: SearchResult[] = [];

    // Search Goals
    if (!type || type === 'goal') {
      results.push(...this.searchGoals(goals, trimmedQuery, includeCompleted));
    }

    // Search Tasks
    if (!type || type === 'task') {
      results.push(...this.searchTasks(tasks, trimmedQuery, includeCompleted));
    }

    // Search Reminders
    if (!type || type === 'reminder') {
      results.push(...this.searchReminders(reminders, trimmedQuery));
    }

    // Filter by threshold and sort by score
    return results
      .filter((r) => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Search in goals
   */
  private searchGoals(
    goals: GoalClientDTO[],
    query: string,
    includeCompleted: boolean,
  ): SearchResult[] {
    return goals
      .filter((goal) => includeCompleted || goal.status !== GoalStatus.COMPLETED)
      .map((goal) => {
        // Search in multiple fields with weights
        const result = fuzzyMatchMultiField(
          query,
          {
            title: goal.title,
            description: goal.description || '',
          },
          {
            title: 1.0,
            description: 0.5,
          },
        );

        return {
          id: goal.uuid,
          type: 'goal' as const,
          title: goal.title,
          description: goal.description || undefined,
          status: goal.status,
          metadata: {
            progress: goal.overallProgress,
            dueDate: goal.targetDate ? new Date(goal.targetDate).toISOString() : undefined,
            taskCount: goal.keyResults?.length || 0,
          },
          score: result.score,
          matches: result.matches,
          url: `/goals/${goal.uuid}`,
        };
      })
      .filter((r) => r.score > 0);
  }

  /**
   * Search in tasks
   */
  private searchTasks(
    tasks: TaskTemplateClientDTO[],
    query: string,
    includeCompleted: boolean,
  ): SearchResult[] {
    return tasks
      .filter(
        (task) => includeCompleted || task.status !== TaskTemplateStatus.ARCHIVED,
      )
      .map((task) => {
        // Search in multiple fields
        const result = fuzzyMatchMultiField(
          query,
          {
            title: task.title,
            description: task.description || '',
          },
          {
            title: 1.0,
            description: 0.5,
          },
        );

        return {
          id: task.uuid,
          type: 'task' as const,
          title: task.title,
          description: task.description || undefined,
          status: task.status,
          metadata: {},
          score: result.score,
          matches: result.matches,
          url: `/tasks/${task.uuid}`,
        };
      })
      .filter((r) => r.score > 0);
  }

  /**
   * Search in reminders (generic searchable items)
   */
  private searchReminders(reminders: SearchableItem[], query: string): SearchResult[] {
    return reminders
      .map((reminder) => {
        const result = fuzzyMatchMultiField(
          query,
          {
            title: reminder.title,
            description: reminder.description || '',
          },
          {
            title: 1.0,
            description: 0.5,
          },
        );

        return {
          id: reminder.uuid,
          type: 'reminder' as const,
          title: reminder.title,
          description: reminder.description || undefined,
          status: reminder.status,
          metadata: {},
          score: result.score,
          matches: result.matches,
          url: `/reminders/${reminder.uuid}`,
        };
      })
      .filter((r) => r.score > 0);
  }

  /**
   * Search commands
   *
   * @param query Search query
   * @returns Matching commands
   */
  public searchCommands(query: string): Command[] {
    if (query.trim().length === 0) {
      return this.commands;
    }

    return this.commands
      .map((command) => {
        // Search in label, description, and keywords
        const labelResult = fuzzyMatch(query, command.label);
        const keywordResults = command.keywords.map((kw) => fuzzyMatch(query, kw));
        const bestKeywordScore = Math.max(...keywordResults.map((r) => r.score), 0);

        const score = Math.max(labelResult.score, bestKeywordScore);

        return { ...command, _score: score };
      })
      .filter((c) => c._score >= 60)
      .sort((a, b) => b._score - a._score);
  }

  /**
   * Get recent items
   *
   * @param limit Maximum items to return
   * @returns Array of recent items sorted by access time
   */
  public getRecentItems(limit = 10): RecentItem[] {
    const allItems = [
      ...this.recentItems.goals,
      ...this.recentItems.tasks,
      ...this.recentItems.reminders,
    ];

    return allItems.sort((a, b) => b.accessedAt - a.accessedAt).slice(0, limit);
  }

  /**
   * Add item to recent history
   *
   * @param item Recent item to add
   */
  public addRecentItem(item: RecentItem): void {
    const listKey = `${item.type}s` as keyof RecentItemsStorage;
    const list = this.recentItems[listKey];

    // Remove if already exists
    const existingIndex = list.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      list.splice(existingIndex, 1);
    }

    // Add to beginning
    list.unshift(item);

    // Keep only MAX_RECENT_ITEMS
    if (list.length > this.MAX_RECENT_ITEMS) {
      list.splice(this.MAX_RECENT_ITEMS);
    }

    this.saveRecentItems();
  }

  /**
   * Clear recent items
   *
   * @param type Optional type to clear (clears all if not specified)
   */
  public clearRecentItems(type?: SearchResultType): void {
    if (type) {
      const listKey = `${type}s` as keyof RecentItemsStorage;
      this.recentItems[listKey] = [];
    } else {
      this.recentItems = {
        goals: [],
        tasks: [],
        reminders: [],
      };
    }

    this.saveRecentItems();
  }

  /**
   * Register a custom command
   *
   * @param command Command to register
   */
  public registerCommand(command: Command): void {
    // Remove existing command with same ID
    this.commands = this.commands.filter((c) => c.id !== command.id);

    // Add new command
    this.commands.push(command);
  }

  /**
   * Unregister a command
   *
   * @param commandId Command ID to remove
   */
  public unregisterCommand(commandId: string): void {
    this.commands = this.commands.filter((c) => c.id !== commandId);
  }

  /**
   * Initialize built-in commands
   */
  private initializeCommands(): void {
    this.commands = [
      {
        id: 'create-goal',
        label: 'Create New Goal',
        description: 'Create a new goal',
        icon: 'mdi-target',
        handler: () => {
          // This will be implemented in the component
        },
        keywords: ['new', 'goal', 'create', 'add'],
        category: 'create',
      },
      {
        id: 'create-task',
        label: 'Create New Task',
        description: 'Create a new task',
        icon: 'mdi-checkbox-marked-outline',
        handler: () => {},
        keywords: ['new', 'task', 'create', 'add', 'todo'],
        category: 'create',
      },
      {
        id: 'create-reminder',
        label: 'Create New Reminder',
        description: 'Create a new reminder',
        icon: 'mdi-bell-outline',
        handler: () => {},
        keywords: ['new', 'reminder', 'create', 'add', 'notification'],
        category: 'create',
      },
      {
        id: 'navigate-dashboard',
        label: 'Go to Dashboard',
        description: 'Navigate to dashboard',
        icon: 'mdi-view-dashboard',
        handler: () => {},
        keywords: ['dashboard', 'home', 'main', 'overview'],
        category: 'navigate',
      },
      {
        id: 'navigate-goals',
        label: 'Go to Goals',
        description: 'Navigate to goals page',
        icon: 'mdi-target',
        handler: () => {},
        keywords: ['goals', 'objectives', 'targets'],
        category: 'navigate',
      },
      {
        id: 'navigate-tasks',
        label: 'Go to Tasks',
        description: 'Navigate to tasks page',
        icon: 'mdi-format-list-checks',
        handler: () => {},
        keywords: ['tasks', 'todos', 'checklist'],
        category: 'navigate',
      },
      {
        id: 'navigate-reminders',
        label: 'Go to Reminders',
        description: 'Navigate to reminders page',
        icon: 'mdi-bell',
        handler: () => {},
        keywords: ['reminders', 'notifications', 'alerts'],
        category: 'navigate',
      },
      {
        id: 'navigate-settings',
        label: 'Go to Settings',
        description: 'Navigate to settings page',
        icon: 'mdi-cog',
        handler: () => {},
        keywords: ['settings', 'preferences', 'config'],
        category: 'settings',
      },
    ];
  }

  /**
   * Load recent items from LocalStorage
   */
  private loadRecentItems(): void {
    try {
      const stored = localStorage.getItem(this.RECENT_ITEMS_KEY);
      if (stored) {
        this.recentItems = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load recent items:', error);
      this.recentItems = {
        goals: [],
        tasks: [],
        reminders: [],
      };
    }
  }

  /**
   * Save recent items to LocalStorage
   */
  private saveRecentItems(): void {
    try {
      localStorage.setItem(this.RECENT_ITEMS_KEY, JSON.stringify(this.recentItems));
    } catch (error) {
      console.error('Failed to save recent items:', error);
    }
  }
}

// Export singleton instance
export const globalSearchService = GlobalSearchService.getInstance();

