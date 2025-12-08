/**
 * Daily Planning Service
 * 每日智能规划服务 - AI 生成每日最优日程
 * 
 * EPIC-006: Smart Productivity - STORY-030
 * 
 * Features:
 * - Intelligent task prioritization
 * - Energy curve optimization
 * - Time slot allocation
 * - Workload balancing
 * - Personalized insights generation
 */

import { addMinutes, differenceInMinutes, format, getHours, setHours } from 'date-fns';

// 本地定义的 Task 类型
export interface Task {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  tags?: string[];
}

export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // minutes
  energyLevel: 'high' | 'medium' | 'low';
  available: boolean;
}

export interface DailyTaskRecommendation {
  taskId: string;
  taskTitle: string;
  suggestedTime: {
    start: string; // HH:mm
    end: string; // HH:mm
    duration: number; // minutes
  };
  priority: number; // 1-10, 10 is highest
  reasoning: string;
  energyLevel: 'high' | 'medium' | 'low';
  focusLevel: 'deep' | 'moderate' | 'light';
  isOptimalSlot: boolean; // Whether this is the best slot for this task
}

export interface DailyPlanSummary {
  totalTasks: number;
  estimatedWorkHours: number;
  availableHours: number;
  workload: 'light' | 'moderate' | 'heavy' | 'overload';
  completionConfidence: number; // 0-100
  energyMatchScore: number; // 0-100, how well tasks match energy levels
}

export interface DailyPlan {
  date: string; // YYYY-MM-DD
  generatedAt: Date;
  summary: DailyPlanSummary;
  recommendations: DailyTaskRecommendation[];
  insights: string[];
  warnings?: string[];
  unscheduledTasks?: string[]; // Task IDs that couldn't be scheduled
}

export interface UserEnergyProfile {
  peakHours: number[]; // e.g., [8, 9, 10, 11]
  lowHours: number[]; // e.g., [13, 14, 20, 21]
  workStartHour: number; // default 9
  workEndHour: number; // default 18
  lunchBreak: { start: number; end: number }; // { start: 12, end: 13 }
  preferredBreakDuration: number; // minutes between tasks
}

/**
 * Daily Planning Service - Singleton Pattern
 * 生成每日最优日程建议
 */
export class DailyPlanningService {
  private static instance: DailyPlanningService;
  private cache = new Map<string, { plan: DailyPlan; timestamp: Date }>();
  private cacheExpiry = 60 * 60 * 1000; // 1 hour
  private userEnergyProfile: UserEnergyProfile;
  private defaultEnergyProfile: UserEnergyProfile = {
    peakHours: [8, 9, 10, 11],
    lowHours: [13, 14, 20, 21],
    workStartHour: 9,
    workEndHour: 18,
    lunchBreak: { start: 12, end: 13 },
    preferredBreakDuration: 10,
  };

  private constructor() {
    this.userEnergyProfile = { ...this.defaultEnergyProfile };
  }

  static getInstance(): DailyPlanningService {
    if (!this.instance) {
      this.instance = new DailyPlanningService();
    }
    return this.instance;
  }

  /**
   * Set custom energy profile for user
   */
  setEnergyProfile(profile: Partial<UserEnergyProfile>): void {
    this.userEnergyProfile = { ...this.userEnergyProfile, ...profile };
    this.clearCache(); // Clear cache when profile changes
  }

  /**
   * Get current energy profile
   */
  getEnergyProfile(): UserEnergyProfile {
    return { ...this.userEnergyProfile };
  }

  /**
   * 生成每日规划
   */
  async generateDailyPlan(
    date: Date = new Date(),
    tasks: Array<{
      id: string;
      title: string;
      estimatedMinutes?: number;
      priority?: 'critical' | 'high' | 'medium' | 'low';
      dueDate?: Date;
      focusLevel?: 'deep' | 'moderate' | 'light';
      dependencies?: number;
    }> = []
  ): Promise<DailyPlan> {
    // Check cache
    const cacheKey = this.generateCacheKey(date);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheExpiry) {
      return cached.plan;
    }

    // Get candidate tasks
    const candidateTasks = this.getCandidateTasks(tasks, date);

    // Calculate available time slots
    const availableSlots = this.calculateAvailableSlots(date);

    // Allocate tasks to slots
    const recommendations = this.allocateTasksToSlots(candidateTasks, availableSlots);

    // Generate insights
    const insights = this.generateInsights(recommendations, availableSlots);

    // Detect warnings
    const warnings = this.detectWarnings(recommendations, availableSlots);

    // Generate summary
    const summary = this.generateSummary(recommendations, availableSlots);

    const plan: DailyPlan = {
      date: format(date, 'yyyy-MM-dd'),
      generatedAt: new Date(),
      summary,
      recommendations,
      insights,
      warnings,
    };

    // Cache result
    this.cache.set(cacheKey, { plan, timestamp: new Date() });

    return plan;
  }

  /**
   * 获取候选任务 - 优先考虑今天到期和高优先级任务
   */
  private getCandidateTasks(
    tasks: Array<{
      id: string;
      title: string;
      estimatedMinutes?: number;
      priority?: string;
      dueDate?: Date;
      focusLevel?: string;
      dependencies?: number;
    }>,
    date: Date
  ): Array<{
    id: string;
    title: string;
    estimatedMinutes: number;
    priority: number;
    focusLevel: 'deep' | 'moderate' | 'light';
    daysUntilDue: number;
  }> {
    return tasks
      .map((task) => ({
        id: task.id,
        title: task.title,
        estimatedMinutes: task.estimatedMinutes || 30,
        priority: this.calculateTaskPriority(task, date),
        focusLevel: (task.focusLevel as any) || 'moderate',
        daysUntilDue: task.dueDate
          ? Math.ceil(
              (task.dueDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
            )
          : 365,
      }))
      .filter((t) => t.estimatedMinutes <= 240) // Max 4 hours per task
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10); // Max 10 candidates
  }

  /**
   * 计算任务优先级 (1-10 scale)
   */
  private calculateTaskPriority(
    task: {
      priority?: string;
      dueDate?: Date;
      dependencies?: number;
    },
    date: Date
  ): number {
    let score = 5; // 默认中等

    // Priority factor
    if (task.priority === 'critical') score += 3;
    else if (task.priority === 'high') score += 2;
    else if (task.priority === 'medium') score += 1;
    else if (task.priority === 'low') score -= 2;

    // Due date factor
    if (task.dueDate) {
      const daysUntil = Math.ceil(
        (task.dueDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil <= 0) score += 3;
      else if (daysUntil === 1) score += 2;
      else if (daysUntil <= 3) score += 1;
    }

    // Dependencies factor
    if (task.dependencies && task.dependencies > 0) {
      score += Math.min(task.dependencies, 2);
    }

    return Math.min(Math.max(score, 1), 10);
  }

  /**
   * 计算可用时间块
   */
  private calculateAvailableSlots(date: Date): TimeSlot[] {
    const profile = this.defaultEnergyProfile;
    const dayStart = setHours(date, profile.workStartHour);
    const dayEnd = setHours(date, profile.workEndHour);
    const lunchStart = setHours(date, profile.lunchBreak.start);
    const lunchEnd = setHours(date, profile.lunchBreak.end);

    const slots: TimeSlot[] = [];
    let currentTime = dayStart;

    // Add morning slot (high energy)
    const morningEnd = Math.min(
      getHours(lunchStart) === profile.lunchBreak.start ? lunchStart.getTime() : dayEnd.getTime(),
      dayStart.getTime() + 4 * 60 * 60 * 1000
    );

    if (currentTime.getTime() < morningEnd) {
      slots.push({
        start: currentTime,
        end: new Date(morningEnd),
        duration: differenceInMinutes(new Date(morningEnd), currentTime),
        energyLevel: 'high',
        available: true,
      });
      currentTime = new Date(morningEnd);
    }

    // Skip lunch
    if (currentTime < lunchEnd) {
      currentTime = lunchEnd;
    }

    // Add afternoon slot (medium energy)
    const afternoonEnd = setHours(date, Math.min(profile.workEndHour, 17));
    if (currentTime < afternoonEnd) {
      slots.push({
        start: currentTime,
        end: afternoonEnd,
        duration: differenceInMinutes(afternoonEnd, currentTime),
        energyLevel: 'medium',
        available: true,
      });
      currentTime = afternoonEnd;
    }

    // Add late afternoon slot (low energy)
    if (currentTime < dayEnd && differenceInMinutes(dayEnd, currentTime) >= 30) {
      slots.push({
        start: currentTime,
        end: dayEnd,
        duration: differenceInMinutes(dayEnd, currentTime),
        energyLevel: 'low',
        available: true,
      });
    }

    return slots.filter((s) => s.duration >= 30); // Only 30+ min slots
  }

  /**
   * 分配任务到时间块
   */
  private allocateTasksToSlots(
    tasks: Array<{
      id: string;
      title: string;
      estimatedMinutes: number;
      priority: number;
      focusLevel: string;
      daysUntilDue: number;
    }>,
    slots: TimeSlot[]
  ): DailyTaskRecommendation[] {
    const recommendations: DailyTaskRecommendation[] = [];
    const remainingSlots = slots.map((s) => ({ ...s }));

    for (const task of tasks) {
      if (recommendations.length >= 5) break;

      // Find best slot
      const bestSlotIndex = this.findBestSlot(task, remainingSlots);

      if (bestSlotIndex >= 0) {
        const slot = remainingSlots[bestSlotIndex];
        const duration = Math.min(task.estimatedMinutes, slot.duration);

        // Determine if this is an optimal slot match
        const isOptimalSlot = this.isOptimalSlotMatch(task, slot);

        recommendations.push({
          taskId: task.id,
          taskTitle: task.title,
          suggestedTime: {
            start: format(slot.start, 'HH:mm'),
            end: format(addMinutes(slot.start, duration), 'HH:mm'),
            duration,
          },
          priority: task.priority,
          reasoning: this.generateReasoning(task, slot),
          energyLevel: slot.energyLevel,
          focusLevel: (task.focusLevel as any) || 'moderate',
          isOptimalSlot,
        });

        // Consume slot
        if (duration >= slot.duration) {
          remainingSlots.splice(bestSlotIndex, 1);
        } else {
          slot.start = addMinutes(slot.start, duration);
          slot.duration -= duration;
        }
      }
    }

    return recommendations;
  }

  /**
   * Check if task-slot pairing is optimal
   */
  private isOptimalSlotMatch(
    task: { focusLevel: string },
    slot: TimeSlot
  ): boolean {
    const focusLevel = task.focusLevel || 'moderate';
    
    // Deep focus tasks need high energy slots
    if (focusLevel === 'deep' && slot.energyLevel === 'high') return true;
    // Light tasks are fine in low energy slots
    if (focusLevel === 'light' && slot.energyLevel === 'low') return true;
    // Moderate tasks work well in medium slots
    if (focusLevel === 'moderate' && slot.energyLevel === 'medium') return true;
    
    return false;
  }

  /**
   * 找到最合适的时间块
   */
  private findBestSlot(
    task: {
      focusLevel: string;
      daysUntilDue: number;
      estimatedMinutes: number;
    },
    slots: TimeSlot[]
  ): number {
    let bestIndex = -1;
    let bestScore = -1;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];

      if (slot.duration < task.estimatedMinutes) continue;

      let score = 0;

      // Prefer high energy for deep focus tasks
      if (task.focusLevel === 'deep') {
        if (slot.energyLevel === 'high') score += 3;
        else if (slot.energyLevel === 'medium') score += 1;
      }

      // Prefer any energy for light tasks
      if (task.focusLevel === 'light') {
        if (slot.energyLevel === 'low') score += 2;
        else if (slot.energyLevel === 'medium') score += 1;
      }

      // Prefer earlier slots for urgent tasks
      if (task.daysUntilDue <= 1) {
        score += 5;
      }

      // Prefer exact fit over oversized slots
      if (Math.abs(slot.duration - task.estimatedMinutes) < 15) {
        score += 2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  /**
   * 生成任务分配理由
   */
  private generateReasoning(
    task: { focusLevel: string; daysUntilDue: number },
    slot: TimeSlot
  ): string {
    const reasons: string[] = [];

    if (slot.energyLevel === 'high' && task.focusLevel === 'deep') {
      reasons.push('上午精力充沛，适合深度工作');
    } else if (slot.energyLevel === 'low' && task.focusLevel === 'light') {
      reasons.push('下午适合处理轻度任务');
    } else if (task.daysUntilDue <= 1) {
      reasons.push('任务即将截止，需要优先处理');
    } else {
      reasons.push('时间块充足，适合完成该任务');
    }

    return reasons.join('；') || '根据时间和任务特征分配';
  }

  /**
   * 生成洞察
   */
  private generateInsights(
    recommendations: DailyTaskRecommendation[],
    slots: TimeSlot[]
  ): string[] {
    const insights: string[] = [];

    const totalWorkMinutes = recommendations.reduce(
      (sum, r) => sum + r.suggestedTime.duration,
      0
    );

    const availableMinutes = slots.reduce((sum, s) => sum + s.duration, 0);
    const utilizationRate = availableMinutes > 0 ? totalWorkMinutes / availableMinutes : 0;

    if (utilizationRate > 0.8) {
      insights.push('⚠️ 今日工作量较大，建议合理安排休息时间');
    } else if (utilizationRate < 0.3 && recommendations.length > 0) {
      insights.push('💡 今日还有较多空闲时间，可考虑添加更多任务');
    }

    const deepFocusTasks = recommendations.filter((r) => r.focusLevel === 'deep');
    if (deepFocusTasks.length > 2) {
      insights.push('🎯 今日有多个深度工作任务，建议拆分到不同时段');
    }

    const morningTasks = recommendations.filter((r) => {
      const hour = parseInt(r.suggestedTime.start.split(':')[0]);
      return hour < 12;
    });

    if (morningTasks.length === 0 && recommendations.length > 0) {
      insights.push('📅 未在上午安排重要任务，可能影响工作效率');
    }

    return insights;
  }

  /**
   * 检测警告
   */
  private detectWarnings(
    recommendations: DailyTaskRecommendation[],
    slots: TimeSlot[]
  ): string[] {
    const warnings: string[] = [];

    // Check for consecutive deep focus tasks
    const deepFocusCount = recommendations.filter((r) => r.focusLevel === 'deep').length;
    if (deepFocusCount >= 3) {
      warnings.push('连续深度工作可能导致疲劳，建议穿插休息');
    }

    // Check for overallocation
    const totalMinutes = recommendations.reduce((sum, r) => sum + r.suggestedTime.duration, 0);
    const availableMinutes = slots.reduce((sum, s) => sum + s.duration, 0);
    if (totalMinutes > availableMinutes * 0.95) {
      warnings.push('日程几乎满载，建议为突发情况预留时间');
    }

    return warnings;
  }

  /**
   * 生成日程摘要
   */
  private generateSummary(
    recommendations: DailyTaskRecommendation[],
    slots: TimeSlot[]
  ): DailyPlanSummary {
    const totalWorkMinutes = recommendations.reduce(
      (sum, r) => sum + r.suggestedTime.duration,
      0
    );

    const availableMinutes = slots.reduce((sum, s) => sum + s.duration, 0);

    const utilizationRate = availableMinutes > 0 ? totalWorkMinutes / availableMinutes : 0;

    let workload: 'light' | 'moderate' | 'heavy' | 'overload' = 'moderate';
    if (utilizationRate < 0.3) workload = 'light';
    else if (utilizationRate > 0.9) workload = 'overload';
    else if (utilizationRate > 0.7) workload = 'heavy';

    // Confidence based on recommendation quality
    const avgTaskDuration =
      recommendations.length > 0
        ? totalWorkMinutes / recommendations.length
        : 0;
    const confidenceScore = Math.min(
      100,
      Math.max(20, 100 - Math.abs(30 - avgTaskDuration) / 2)
    );

    // Calculate energy match score based on optimal slot assignments
    const optimalMatches = recommendations.filter((r) => r.isOptimalSlot).length;
    const energyMatchScore =
      recommendations.length > 0
        ? Math.round((optimalMatches / recommendations.length) * 100)
        : 0;

    return {
      totalTasks: recommendations.length,
      estimatedWorkHours: Math.round((totalWorkMinutes / 60) * 10) / 10,
      availableHours: Math.round((availableMinutes / 60) * 10) / 10,
      workload,
      completionConfidence: Math.round(confidenceScore),
      energyMatchScore,
    };
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(date: Date): string {
    return `daily-plan-${format(date, 'yyyy-MM-dd')}`;
  }

  /**
   * 清空缓存
   */
  clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 设置缓存过期时间
   */
  setCacheExpiry(minutes: number): void {
    this.cacheExpiry = minutes * 60 * 1000;
  }
}

export default DailyPlanningService;
