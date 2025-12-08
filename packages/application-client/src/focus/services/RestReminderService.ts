/**
 * RestReminderService - Smart Rest and Health Reminders
 * 
 * Manages intelligent reminders for:
 * - Eye care (20-20-20 rule)
 * - Stretch exercises
 * - Water intake
 * - Smart scheduling (respects focus mode)
 */

import { pomodoroService } from './PomodoroService';

export type ReminderType = 'eye' | 'stretch' | 'water';
export type StretchCategory = 'neck' | 'shoulder' | 'back' | 'leg';
export type StretchIntensity = 'gentle' | 'standard' | 'strict';

export interface RestReminder {
  id: string;
  type: ReminderType;
  enabled: boolean;
  interval: number; // minutes
  duration: number; // seconds
  lastTriggeredAt?: Date;
  nextTriggerAt?: Date;
}

export interface ReminderSettings {
  globalEnabled: boolean;
  eyeCareEnabled: boolean;
  eyeCareInterval: number; // default 20
  eyeCareDuration: number; // default 20
  stretchEnabled: boolean;
  stretchInterval: number; // default 60
  stretchDuration: number; // default 300
  stretchIntensity: StretchIntensity;
  waterEnabled: boolean;
  waterInterval: number; // default 30
  waterAmount: number; // default 200ml
  dailyWaterGoal: number; // default 2000ml
  notificationType: 'system' | 'inApp' | 'both';
  soundEnabled: boolean;
  doNotDisturbPeriods: Array<{ start: string; end: string }>;
  pauseDuringPomodoro: boolean;
}

export interface RestRecord {
  id: string;
  type: ReminderType;
  triggeredAt: Date;
  completed: boolean;
  skipped: boolean;
  duration?: number;
}

export interface WaterRecord {
  id: string;
  timestamp: Date;
  amount: number; // ml
  note?: string;
}

export interface StretchExercise {
  id: string;
  name: string;
  category: StretchCategory;
  duration: number; // seconds
  description: string;
  imageUrl?: string;
  steps: string[];
  benefits: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CacheEntry<T> {
  result: T;
  timestamp: number;
}

/**
 * Built-in stretch exercises library
 */
const STRETCH_EXERCISES: StretchExercise[] = [
  {
    id: 'stretch_neck_1',
    name: '颈部转动 (Neck Rotation)',
    category: 'neck',
    duration: 30,
    description: '轻轻转动颈部，放松颈部肌肉',
    steps: ['坐直身体', '缓慢向左转头', '停留15秒', '向右转头', '停留15秒'],
    benefits: ['减少颈部压力', '改善血液循环'],
    difficulty: 'easy',
  },
  {
    id: 'stretch_shoulder_1',
    name: '肩部滚动 (Shoulder Rolls)',
    category: 'shoulder',
    duration: 30,
    description: '向后滚动肩膀以释放紧张感',
    steps: ['坐直或站立', '向后滚动肩膀10次', '向前滚动肩膀10次'],
    benefits: ['放松肩膀肌肉', '改善姿势'],
    difficulty: 'easy',
  },
  {
    id: 'stretch_back_1',
    name: '脊柱伸展 (Spinal Twist)',
    category: 'back',
    duration: 45,
    description: '转动脊柱以拉伸背部肌肉',
    steps: ['坐直', '左手放在右膝', '向右转动身体', '停留20秒', '切换另一侧'],
    benefits: ['改善脊柱灵活性', '缓解背部疼痛'],
    difficulty: 'medium',
  },
  {
    id: 'stretch_leg_1',
    name: '腿部伸展 (Leg Stretch)',
    category: 'leg',
    duration: 60,
    description: '伸展腿部肌肉以防止血栓',
    steps: ['站立', '一条腿向前迈步', '弯曲前膝', '感受后腿拉伸', '保持30秒', '切换腿'],
    benefits: ['改善腿部血液循环', '防止久坐疼痛'],
    difficulty: 'medium',
  },
];

/**
 * RestReminderService - Singleton service for rest reminders
 */
export class RestReminderService {
  private static instance: RestReminderService;
  private cacheExpiry: number = 30 * 60 * 1000; // 30 minutes
  private cache: Map<string, CacheEntry<any>> = new Map();

  private settings: ReminderSettings = {
    globalEnabled: true,
    eyeCareEnabled: true,
    eyeCareInterval: 20,
    eyeCareDuration: 20,
    stretchEnabled: true,
    stretchInterval: 60,
    stretchDuration: 300,
    stretchIntensity: 'standard',
    waterEnabled: true,
    waterInterval: 30,
    waterAmount: 200,
    dailyWaterGoal: 2000,
    notificationType: 'system',
    soundEnabled: true,
    doNotDisturbPeriods: [],
    pauseDuringPomodoro: true,
  };

  private reminders: Map<ReminderType, RestReminder> = new Map();
  private restRecords: RestRecord[] = [];
  private waterRecords: WaterRecord[] = [];
  private reminderIntervals: Map<ReminderType, NodeJS.Timeout> = new Map();
  private exercises: Map<string, StretchExercise> = new Map();

  // Events
  onReminderTriggered: (reminder: RestReminder) => void = () => {};
  onReminderCompleted: (record: RestRecord) => void = () => {};
  onReminderSkipped: (reminder: RestReminder) => void = () => {};
  onWaterRecorded: (record: WaterRecord) => void = () => {};

  private constructor() {
    this.initializeReminders();
    this.initializeExercises();
  }

  public static getInstance(): RestReminderService {
    if (!RestReminderService.instance) {
      RestReminderService.instance = new RestReminderService();
    }
    return RestReminderService.instance;
  }

  /**
   * Start reminders
   */
  public startReminders(): void {
    if (!this.settings.globalEnabled) {
      return;
    }

    // Setup reminder intervals
    this.reminders.forEach((reminder, type) => {
      if (reminder.enabled) {
        this.setupReminderInterval(type);
      }
    });
  }

  /**
   * Stop reminders
   */
  public stopReminders(): void {
    this.reminderIntervals.forEach((interval) => clearInterval(interval));
    this.reminderIntervals.clear();
  }

  /**
   * Pause reminders for a duration
   */
  public pauseReminders(durationMinutes: number): void {
    this.stopReminders();

    setTimeout(() => {
      this.startReminders();
    }, durationMinutes * 60 * 1000);
  }

  /**
   * Skip next reminder of a type
   */
  public skipNextReminder(type: ReminderType): void {
    const reminder = this.reminders.get(type);
    if (reminder) {
      this.onReminderSkipped(reminder);
      // Reschedule next reminder
      this.setupReminderInterval(type);
    }
  }

  /**
   * Get next reminder
   */
  public getNextReminder(): RestReminder | null {
    const reminders = Array.from(this.reminders.values());
    return (
      reminders
        .filter((r) => r.enabled && r.nextTriggerAt && r.nextTriggerAt > new Date())
        .sort((a, b) => (a.nextTriggerAt?.getTime() ?? 0) - (b.nextTriggerAt?.getTime() ?? 0))[0] || null
    );
  }

  /**
   * Get reminder status
   */
  public getReminderStatus(type: ReminderType): RestReminder | undefined {
    return this.reminders.get(type);
  }

  /**
   * Get today's rest records
   */
  public getTodayRestRecords(): RestRecord[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.restRecords.filter((r) => r.triggeredAt >= today);
  }

  /**
   * Record water intake
   */
  public recordWater(amount: number, note?: string): void {
    const record: WaterRecord = {
      id: `water_${Date.now()}`,
      timestamp: new Date(),
      amount,
      note,
    };

    this.waterRecords.push(record);
    this.onWaterRecorded(record);
    this.clearCache('waterRecords');
  }

  /**
   * Get today's water intake
   */
  public getTodayWaterIntake(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.waterRecords
      .filter((r) => r.timestamp >= today)
      .reduce((sum, r) => sum + r.amount, 0);
  }

  /**
   * Get water progress (percentage of daily goal)
   */
  public getWaterProgress(): number {
    const intake = this.getTodayWaterIntake();
    return Math.min(100, Math.round((intake / this.settings.dailyWaterGoal) * 100));
  }

  /**
   * Get stretch exercises
   */
  public getStretchExercises(category?: StretchCategory): StretchExercise[] {
    const exercises = Array.from(this.exercises.values());
    if (category) {
      return exercises.filter((e) => e.category === category);
    }
    return exercises;
  }

  /**
   * Get random stretch exercise
   */
  public getRandomExercise(): StretchExercise | undefined {
    const exercises = Array.from(this.exercises.values());
    if (exercises.length === 0) return undefined;

    return exercises[Math.floor(Math.random() * exercises.length)];
  }

  /**
   * Get settings
   */
  public getSettings(): ReminderSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  public updateSettings(settings: Partial<ReminderSettings>): void {
    this.settings = { ...this.settings, ...settings };

    // Restart reminders with new settings
    this.stopReminders();
    this.startReminders();

    this.clearCache('settings');
  }

  /**
   * Complete a reminder
   */
  public completeReminder(type: ReminderType): void {
    const reminder = this.reminders.get(type);
    if (!reminder) return;

    const record: RestRecord = {
      id: `rest_${Date.now()}`,
      type,
      triggeredAt: new Date(),
      completed: true,
      skipped: false,
      duration: reminder.duration,
    };

    this.restRecords.push(record);
    this.onReminderCompleted(record);
    this.clearCache('restRecords');
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

  private initializeReminders(): void {
    this.reminders.set('eye', {
      id: 'reminder_eye',
      type: 'eye',
      enabled: true,
      interval: 20,
      duration: 20,
    });

    this.reminders.set('stretch', {
      id: 'reminder_stretch',
      type: 'stretch',
      enabled: true,
      interval: 60,
      duration: 300,
    });

    this.reminders.set('water', {
      id: 'reminder_water',
      type: 'water',
      enabled: true,
      interval: 30,
      duration: 0,
    });
  }

  private initializeExercises(): void {
    STRETCH_EXERCISES.forEach((exercise) => {
      this.exercises.set(exercise.id, exercise);
    });
  }

  private setupReminderInterval(type: ReminderType): void {
    const reminder = this.reminders.get(type);
    if (!reminder) return;

    const interval = setInterval(() => {
      if (this.canTriggerReminder(type)) {
        this.onReminderTriggered(reminder);
        reminder.lastTriggeredAt = new Date();
      }
    }, reminder.interval * 60 * 1000);

    this.reminderIntervals.set(type, interval);
  }

  private canTriggerReminder(type: ReminderType): boolean {
    // Check if global enabled
    if (!this.settings.globalEnabled) return false;

    // Check if in do-not-disturb period
    if (this.isInDoNotDisturbPeriod()) return false;

    // Check if pausing during pomodoro
    if (this.settings.pauseDuringPomodoro && this.isPomodoroActive()) {
      return false;
    }

    return true;
  }

  private isInDoNotDisturbPeriod(): boolean {
    if (this.settings.doNotDisturbPeriods.length === 0) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return this.settings.doNotDisturbPeriods.some((period) => {
      return currentTime >= period.start && currentTime <= period.end;
    });
  }

  private isPomodoroActive(): boolean {
    const session = pomodoroService.getCurrentSession();
    return !!session && session.status === 'active';
  }
}

export const restReminderService = RestReminderService.getInstance();
