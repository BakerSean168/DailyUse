/**
 * HabitCheckInService - Habit Check-In Management
 * 
 * Manages daily habit check-ins:
 * - Recording habit completions
 * - Backfill mechanism (补打卡)
 * - Check-in history tracking
 */

export interface HabitCheckIn {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkedAt: Date;
  isBackfilled: boolean;
  note?: string;
  mood?: 'great' | 'good' | 'ok' | 'bad';
}

export interface CheckInStats {
  totalCheckIns: number;
  completedToday: boolean;
  lastCheckedInDate?: string;
  thisMonthCount: number;
}

interface CacheEntry<T> {
  result: T;
  timestamp: number;
}

/**
 * HabitCheckInService - Singleton service for habit check-ins
 */
export class HabitCheckInService {
  private static instance: HabitCheckInService;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes (frequent updates)
  private cache: Map<string, CacheEntry<any>> = new Map();

  private checkIns: Map<string, HabitCheckIn[]> = new Map(); // habitId -> checkIns
  private userCheckIns: Map<string, HabitCheckIn[]> = new Map(); // userId -> checkIns
  private backfillCounts: Map<string, number> = new Map(); // habitId -> month backfill count

  // Events
  onCheckIn: (checkIn: HabitCheckIn) => void = () => {};
  onUndoCheckIn: (habitId: string, date: string) => void = () => {};
  onBackfillCheckIn: (checkIn: HabitCheckIn) => void = () => {};

  private constructor() {}

  public static getInstance(): HabitCheckInService {
    if (!HabitCheckInService.instance) {
      HabitCheckInService.instance = new HabitCheckInService();
    }
    return HabitCheckInService.instance;
  }

  /**
   * Check in habit for today
   */
  public checkIn(habitId: string, userId: string, note?: string, mood?: string): HabitCheckIn {
    const today = this.getDateString(new Date());
    return this.checkInForDate(habitId, userId, today, false, note, mood as any);
  }

  /**
   * Check in for a specific date (backfill)
   */
  public backfillCheckIn(
    habitId: string,
    userId: string,
    date: string,
    note?: string
  ): HabitCheckIn {
    if (!this.canBackfill(habitId, date)) {
      throw new Error(`Cannot backfill for date: ${date}`);
    }

    const checkIn = this.checkInForDate(habitId, userId, date, true, note);

    // Increment backfill count
    const countKey = `${habitId}_${this.getMonthString(new Date(date))}`;
    this.backfillCounts.set(countKey, (this.backfillCounts.get(countKey) || 0) + 1);

    this.onBackfillCheckIn(checkIn);
    return checkIn;
  }

  /**
   * Undo check-in for today
   */
  public undoCheckIn(habitId: string, date: string = this.getDateString(new Date())): void {
    const key = `${habitId}_${date}`;
    const checkIns = this.checkIns.get(habitId) || [];
    const index = checkIns.findIndex((c) => c.date === date);

    if (index > -1) {
      checkIns.splice(index, 1);
    }

    this.onUndoCheckIn(habitId, date);
    this.clearCache(`checkins_${habitId}`);
  }

  /**
   * Check if habit is checked in for date
   */
  public isCheckedIn(habitId: string, date: string = this.getDateString(new Date())): boolean {
    const checkIns = this.checkIns.get(habitId) || [];
    return checkIns.some((c) => c.date === date);
  }

  /**
   * Get check-in for specific date
   */
  public getCheckIn(habitId: string, date: string): HabitCheckIn | undefined {
    const checkIns = this.checkIns.get(habitId) || [];
    return checkIns.find((c) => c.date === date);
  }

  /**
   * Get check-in history for date range
   */
  public getCheckInHistory(
    habitId: string,
    startDate: Date,
    endDate: Date
  ): HabitCheckIn[] {
    const checkIns = this.checkIns.get(habitId) || [];
    const startStr = this.getDateString(startDate);
    const endStr = this.getDateString(endDate);

    return checkIns.filter((c) => c.date >= startStr && c.date <= endStr);
  }

  /**
   * Get today's check-ins for user
   */
  public getTodayCheckIns(userId: string): HabitCheckIn[] {
    const today = this.getDateString(new Date());
    const userCheckIns = this.userCheckIns.get(userId) || [];
    return userCheckIns.filter((c) => c.date === today);
  }

  /**
   * Get check-in statistics for habit
   */
  public getCheckInStats(habitId: string, userId: string): CheckInStats {
    const checkIns = this.checkIns.get(habitId) || [];
    const today = this.getDateString(new Date());
    const thisMonth = this.getMonthString(new Date());

    return {
      totalCheckIns: checkIns.length,
      completedToday: checkIns.some((c) => c.date === today),
      lastCheckedInDate: checkIns.length > 0 ? checkIns[checkIns.length - 1].date : undefined,
      thisMonthCount: checkIns.filter((c) => c.date.startsWith(thisMonth)).length,
    };
  }

  /**
   * Can backfill check-in for date
   */
  public canBackfill(habitId: string, date: string): boolean {
    const today = this.getDateString(new Date());
    const daysAgo = this.getDaysDiff(new Date(date), new Date());

    // Can only backfill 1 day ago
    if (daysAgo > 1) {
      return false;
    }

    // Can't backfill future dates
    if (daysAgo < 0) {
      return false;
    }

    // Already checked in
    if (this.isCheckedIn(habitId, date)) {
      return false;
    }

    // Check monthly backfill limit (3 per month)
    const monthStr = date.substring(0, 7); // YYYY-MM
    const countKey = `${habitId}_${monthStr}`;
    const count = this.backfillCounts.get(countKey) || 0;
    if (count >= 3) {
      return false;
    }

    return true;
  }

  /**
   * Get remaining backfills for month
   */
  public getRemainingBackfills(habitId: string): number {
    const monthStr = this.getMonthString(new Date());
    const countKey = `${habitId}_${monthStr}`;
    const count = this.backfillCounts.get(countKey) || 0;
    return Math.max(0, 3 - count);
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

  private checkInForDate(
    habitId: string,
    userId: string,
    date: string,
    isBackfilled: boolean,
    note?: string,
    mood?: 'great' | 'good' | 'ok' | 'bad'
  ): HabitCheckIn {
    const checkIn: HabitCheckIn = {
      id: `checkin_${habitId}_${date}_${Date.now()}`,
      habitId,
      userId,
      date,
      checkedAt: new Date(),
      isBackfilled,
      note,
      mood,
    };

    if (!this.checkIns.has(habitId)) {
      this.checkIns.set(habitId, []);
    }
    this.checkIns.get(habitId)!.push(checkIn);

    if (!this.userCheckIns.has(userId)) {
      this.userCheckIns.set(userId, []);
    }
    this.userCheckIns.get(userId)!.push(checkIn);

    this.onCheckIn(checkIn);
    this.clearCache(`checkins_${habitId}`);

    return checkIn;
  }

  private getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getMonthString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private getDaysDiff(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2.getTime() - date1.getTime()) / oneDay);
  }
}

export const habitCheckInService = HabitCheckInService.getInstance();
