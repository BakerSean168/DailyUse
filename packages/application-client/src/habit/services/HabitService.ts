/**
 * HabitService - Habit Management
 * 
 * Manages habit lifecycle:
 * - CRUD operations for habits
 * - Habit templates
 * - Habit archiving and restoration
 * - Habit ordering/sorting
 */

export type HabitCategory = 'health' | 'learning' | 'work' | 'life' | 'other';
export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon: string; // emoji
  color: string; // hex
  category: HabitCategory;
  frequency: HabitFrequency;
  targetDays?: number[]; // 0-6 for weekly (0=Sunday)
  reminderTime?: string; // HH:mm
  isArchived: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  lastCheckedInAt?: Date;
}

export interface HabitTemplate {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  description?: string;
  targetDays?: number[];
}

interface CacheEntry<T> {
  result: T;
  timestamp: number;
}

const HABIT_TEMPLATES: HabitTemplate[] = [
  { id: 't1', name: '早起', icon: '🌅', color: '#FF9500', category: 'health', frequency: 'daily' },
  { id: 't2', name: '运动30分钟', icon: '🏃', color: '#34C759', category: 'health', frequency: 'daily' },
  { id: 't3', name: '阅读', icon: '📖', color: '#5856D6', category: 'learning', frequency: 'daily' },
  { id: 't4', name: '冥想', icon: '🧘', color: '#AF52DE', category: 'health', frequency: 'daily' },
  { id: 't5', name: '喝8杯水', icon: '💧', color: '#007AFF', category: 'health', frequency: 'daily' },
  { id: 't6', name: '写日记', icon: '📝', color: '#FF2D55', category: 'life', frequency: 'daily' },
  { id: 't7', name: '整理房间', icon: '🧹', color: '#FF9500', category: 'life', frequency: 'weekly', targetDays: [6] },
  { id: 't8', name: '周总结', icon: '📊', color: '#5AC8FA', category: 'work', frequency: 'weekly', targetDays: [0] },
  { id: 't9', name: '学习编程', icon: '💻', color: '#007AFF', category: 'learning', frequency: 'daily' },
  { id: 't10', name: '跑步', icon: '🏅', color: '#34C759', category: 'health', frequency: 'daily' },
];

/**
 * HabitService - Singleton service for habit management
 */
export class HabitService {
  private static instance: HabitService;
  private cacheExpiry: number = 30 * 60 * 1000; // 30 minutes
  private cache: Map<string, CacheEntry<any>> = new Map();

  private habits: Map<string, Habit> = new Map();
  private userHabits: Map<string, Habit[]> = new Map(); // userId -> habits
  private nextId: number = 1;

  // Events
  onHabitCreate: (habit: Habit) => void = () => {};
  onHabitUpdate: (habit: Habit) => void = () => {};
  onHabitArchive: (habitId: string) => void = () => {};
  onHabitRestore: (habitId: string) => void = () => {};
  onHabitDelete: (habitId: string) => void = () => {};

  private constructor() {}

  public static getInstance(): HabitService {
    if (!HabitService.instance) {
      HabitService.instance = new HabitService();
    }
    return HabitService.instance;
  }

  /**
   * Create a new habit
   */
  public createHabit(userId: string, data: {
    name: string;
    icon: string;
    color: string;
    category: HabitCategory;
    frequency: HabitFrequency;
    description?: string;
    targetDays?: number[];
    reminderTime?: string;
  }): Habit {
    const habit: Habit = {
      id: `habit_${userId}_${this.nextId++}`,
      userId,
      name: data.name,
      icon: data.icon,
      color: data.color,
      category: data.category,
      frequency: data.frequency,
      description: data.description,
      targetDays: data.targetDays,
      reminderTime: data.reminderTime,
      isArchived: false,
      sortOrder: this.getNextSortOrder(userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.habits.set(habit.id, habit);

    if (!this.userHabits.has(userId)) {
      this.userHabits.set(userId, []);
    }
    this.userHabits.get(userId)!.push(habit);

    this.onHabitCreate(habit);
    this.clearCache(`habits_${userId}`);

    return habit;
  }

  /**
   * Update habit
   */
  public updateHabit(habitId: string, data: Partial<Habit>): Habit {
    const habit = this.habits.get(habitId);
    if (!habit) {
      throw new Error(`Habit not found: ${habitId}`);
    }

    const updated: Habit = {
      ...habit,
      ...data,
      id: habit.id, // don't allow changing ID
      userId: habit.userId, // don't allow changing user
      createdAt: habit.createdAt, // don't allow changing creation time
      updatedAt: new Date(),
    };

    this.habits.set(habitId, updated);
    this.onHabitUpdate(updated);
    this.clearCache(`habits_${habit.userId}`);

    return updated;
  }

  /**
   * Archive habit
   */
  public archiveHabit(habitId: string): void {
    const habit = this.habits.get(habitId);
    if (!habit) {
      throw new Error(`Habit not found: ${habitId}`);
    }

    habit.isArchived = true;
    habit.updatedAt = new Date();

    this.onHabitArchive(habitId);
    this.clearCache(`habits_${habit.userId}`);
  }

  /**
   * Restore habit
   */
  public restoreHabit(habitId: string): void {
    const habit = this.habits.get(habitId);
    if (!habit) {
      throw new Error(`Habit not found: ${habitId}`);
    }

    habit.isArchived = false;
    habit.updatedAt = new Date();

    this.onHabitRestore(habitId);
    this.clearCache(`habits_${habit.userId}`);
  }

  /**
   * Delete habit permanently
   */
  public deleteHabit(habitId: string): void {
    const habit = this.habits.get(habitId);
    if (!habit) {
      throw new Error(`Habit not found: ${habitId}`);
    }

    this.habits.delete(habitId);

    const userHabits = this.userHabits.get(habit.userId) || [];
    const index = userHabits.findIndex((h) => h.id === habitId);
    if (index > -1) {
      userHabits.splice(index, 1);
    }

    this.onHabitDelete(habitId);
    this.clearCache(`habits_${habit.userId}`);
  }

  /**
   * Get all habits for a user (excluding archived)
   */
  public getHabits(userId: string): Habit[] {
    const cacheKey = `habits_${userId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    const userHabits = this.userHabits.get(userId) || [];
    const active = userHabits
      .filter((h) => !h.isArchived)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    this.cache.set(cacheKey, { result: active, timestamp: Date.now() });
    return active;
  }

  /**
   * Get archived habits for a user
   */
  public getArchivedHabits(userId: string): Habit[] {
    const userHabits = this.userHabits.get(userId) || [];
    return userHabits
      .filter((h) => h.isArchived)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get habit by ID
   */
  public getHabitById(habitId: string): Habit | undefined {
    return this.habits.get(habitId);
  }

  /**
   * Get habits by category
   */
  public getHabitsByCategory(userId: string, category: HabitCategory): Habit[] {
    return this.getHabits(userId).filter((h) => h.category === category);
  }

  /**
   * Reorder habits
   */
  public reorderHabits(userId: string, habitIds: string[]): void {
    habitIds.forEach((id, index) => {
      const habit = this.habits.get(id);
      if (habit && habit.userId === userId) {
        habit.sortOrder = index;
        habit.updatedAt = new Date();
      }
    });

    this.clearCache(`habits_${userId}`);
  }

  /**
   * Create habit from template
   */
  public createFromTemplate(userId: string, templateId: string): Habit | undefined {
    const template = HABIT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return undefined;
    }

    return this.createHabit(userId, {
      name: template.name,
      icon: template.icon,
      color: template.color,
      category: template.category,
      frequency: template.frequency,
      description: template.description,
      targetDays: template.targetDays,
    });
  }

  /**
   * Get all habit templates
   */
  public getTemplates(): HabitTemplate[] {
    return [...HABIT_TEMPLATES];
  }

  /**
   * Clear cache
   */
  public clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Set cache expiry (in minutes)
   */
  public setCacheExpiry(minutes: number): void {
    this.cacheExpiry = minutes * 60 * 1000;
  }

  // ==================== Private Methods ====================

  private getNextSortOrder(userId: string): number {
    const userHabits = this.userHabits.get(userId) || [];
    return userHabits.length;
  }
}

export const habitService = HabitService.getInstance();
