/**
 * HabitReminderService - Smart Scheduling & Notifications
 * 
 * Manages habit reminders:
 * - Smart scheduling based on user patterns
 * - Time-based and location-based reminders
 * - Custom notification preferences
 */

export interface HabitReminder {
  id: string;
  habitId: string;
  userId: string;
  time: string; // HH:MM format
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  type: 'notification' | 'email' | 'sms';
  enabled: boolean;
  smart: boolean; // Use smart scheduling
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderSchedule {
  habitId: string;
  upcomingReminders: ScheduledReminder[];
  lastReminder?: Date;
  nextReminder?: Date;
}

export interface ScheduledReminder {
  habitId: string;
  scheduledTime: string; // ISO string
  type: 'notification' | 'email' | 'sms';
  message: string;
}

interface CacheEntry<T> {
  result: T;
  timestamp: number;
}

/**
 * HabitReminderService - Singleton service for reminder management
 */
export class HabitReminderService {
  private static instance: HabitReminderService;
  private cacheExpiry: number = 30 * 60 * 1000; // 30 minutes
  private cache: Map<string, CacheEntry<any>> = new Map();

  private reminders: Map<string, HabitReminder[]> = new Map(); // userId -> reminders
  private activeReminders: Set<string> = new Set(); // reminder IDs

  // Events
  onReminderTriggered: (reminder: HabitReminder) => void = () => {};
  onReminderScheduled: (reminder: HabitReminder) => void = () => {};
  onReminderCancelled: (reminderId: string) => void = () => {};

  private constructor() {}

  public static getInstance(): HabitReminderService {
    if (!HabitReminderService.instance) {
      HabitReminderService.instance = new HabitReminderService();
    }
    return HabitReminderService.instance;
  }

  /**
   * Create habit reminder
   */
  public createReminder(
    habitId: string,
    userId: string,
    time: string,
    type: 'notification' | 'email' | 'sms' = 'notification',
    daysOfWeek?: number[]
  ): HabitReminder {
    const id = `reminder_${habitId}_${Date.now()}`;

    const reminder: HabitReminder = {
      id,
      habitId,
      userId,
      time,
      daysOfWeek,
      type,
      enabled: true,
      smart: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!this.reminders.has(userId)) {
      this.reminders.set(userId, []);
    }

    this.reminders.get(userId)!.push(reminder);
    this.activeReminders.add(id);
    this.clearCache(`reminders_${userId}`);
    this.onReminderScheduled(reminder);

    return reminder;
  }

  /**
   * Update reminder
   */
  public updateReminder(reminderId: string, updates: Partial<HabitReminder>): HabitReminder | null {
    for (const reminders of this.reminders.values()) {
      const reminder = reminders.find((r) => r.id === reminderId);
      if (reminder) {
        Object.assign(reminder, updates, { updatedAt: new Date() });
        this.clearCache(`reminders_${reminder.userId}`);
        return reminder;
      }
    }
    return null;
  }

  /**
   * Delete reminder
   */
  public deleteReminder(reminderId: string): boolean {
    for (const [userId, reminders] of this.reminders) {
      const index = reminders.findIndex((r) => r.id === reminderId);
      if (index !== -1) {
        reminders.splice(index, 1);
        this.activeReminders.delete(reminderId);
        this.clearCache(`reminders_${userId}`);
        this.onReminderCancelled(reminderId);
        return true;
      }
    }
    return false;
  }

  /**
   * Get all reminders for user
   */
  public getUserReminders(userId: string): HabitReminder[] {
    const cacheKey = `reminders_${userId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    const reminders = this.reminders.get(userId) || [];
    this.cache.set(cacheKey, { result: reminders, timestamp: Date.now() });
    return reminders;
  }

  /**
   * Get reminders for specific habit
   */
  public getHabitReminders(habitId: string, userId: string): HabitReminder[] {
    return this.getUserReminders(userId).filter((r) => r.habitId === habitId);
  }

  /**
   * Get next reminder time for habit
   */
  public getNextReminder(habitId: string, userId: string): Date | null {
    const reminders = this.getHabitReminders(habitId, userId).filter((r) => r.enabled);

    if (reminders.length === 0) return null;

    const now = new Date();
    const todayReminders = reminders.map((r) => {
      const [hours, minutes] = r.time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);

      // Check if today or next occurrence
      if (date > now) {
        return date;
      } else {
        date.setDate(date.getDate() + 1);
        return date;
      }
    });

    return todayReminders.reduce((closest, current) =>
      current < closest ? current : closest
    );
  }

  /**
   * Enable smart scheduling for habit
   */
  public enableSmartScheduling(habitId: string, userId: string): void {
    const reminders = this.getHabitReminders(habitId, userId);
    reminders.forEach((r) => {
      this.updateReminder(r.id, { smart: true });
    });
  }

  /**
   * Disable smart scheduling for habit
   */
  public disableSmartScheduling(habitId: string, userId: string): void {
    const reminders = this.getHabitReminders(habitId, userId);
    reminders.forEach((r) => {
      this.updateReminder(r.id, { smart: false });
    });
  }

  /**
   * Enable/disable reminder
   */
  public setReminderEnabled(reminderId: string, enabled: boolean): void {
    const reminder = this.getReminderById(reminderId);
    if (reminder) {
      this.updateReminder(reminderId, { enabled });
      if (enabled) {
        this.onReminderScheduled(reminder);
      } else {
        this.onReminderCancelled(reminderId);
      }
    }
  }

  /**
   * Get schedule for next 7 days
   */
  public getWeekSchedule(userId: string): ReminderSchedule[] {
    const schedules: ReminderSchedule[] = [];
    const reminders = this.getUserReminders(userId).filter((r) => r.enabled);

    const habitIds = new Set(reminders.map((r) => r.habitId));

    for (const habitId of habitIds) {
      const habitReminders = reminders.filter((r) => r.habitId === habitId);
      const upcomingReminders: ScheduledReminder[] = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dayOfWeek = date.getDay();

        for (const reminder of habitReminders) {
          if (!reminder.daysOfWeek || reminder.daysOfWeek.includes(dayOfWeek)) {
            const [hours, minutes] = reminder.time.split(':').map(Number);
            const scheduledDate = new Date(date);
            scheduledDate.setHours(hours, minutes, 0, 0);

            upcomingReminders.push({
              habitId,
              scheduledTime: scheduledDate.toISOString(),
              type: reminder.type,
              message: `Time to work on this habit!`,
            });
          }
        }
      }

      schedules.push({
        habitId,
        upcomingReminders: upcomingReminders.sort(
          (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
        ),
        lastReminder: new Date(),
        nextReminder: upcomingReminders[0]
          ? new Date(upcomingReminders[0].scheduledTime)
          : undefined,
      });
    }

    return schedules;
  }

  /**
   * Check if it's time to send reminder
   */
  public checkDueReminders(userId: string): HabitReminder[] {
    const dueReminders: HabitReminder[] = [];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const reminders = this.getUserReminders(userId).filter((r) => r.enabled);

    reminders.forEach((reminder) => {
      if (reminder.time === currentTime) {
        dueReminders.push(reminder);
        this.onReminderTriggered(reminder);
      }
    });

    return dueReminders;
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

  private getReminderById(reminderId: string): HabitReminder | null {
    for (const reminders of this.reminders.values()) {
      const reminder = reminders.find((r) => r.id === reminderId);
      if (reminder) return reminder;
    }
    return null;
  }
}

export const habitReminderService = HabitReminderService.getInstance();
