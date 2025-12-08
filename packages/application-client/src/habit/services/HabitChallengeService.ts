/**
 * HabitChallengeService - Gamification & Challenges
 * 
 * Manages habit challenges and gamification:
 * - Create and manage challenges
 * - Track leaderboards
 * - Award achievements and badges
 */

export interface HabitChallenge {
  id: string;
  name: string;
  description: string;
  habitId?: string; // Empty if global challenge
  userId?: string; // Empty if public challenge
  type: 'personal' | 'friend' | 'public';
  goal: number; // Target days
  duration: number; // Days
  startDate: Date;
  endDate: Date;
  participants: string[]; // User IDs
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  reward: ChallengeReward;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeReward {
  points: number;
  badge?: string;
  bonus?: string;
}

export interface ChallengeParticipant {
  userId: string;
  username: string;
  progress: number;
  rank: number;
  completedDays: number;
}

export interface Leaderboard {
  challengeId: string;
  participants: ChallengeParticipant[];
  yourRank: number;
  topPerfomer: ChallengeParticipant;
}

export interface Achievement {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  points: number;
}

interface CacheEntry<T> {
  result: T;
  timestamp: number;
}

/**
 * HabitChallengeService - Singleton service for challenges and gamification
 */
export class HabitChallengeService {
  private static instance: HabitChallengeService;
  private cacheExpiry: number = 60 * 60 * 1000; // 1 hour
  private cache: Map<string, CacheEntry<any>> = new Map();

  private challenges: Map<string, HabitChallenge> = new Map(); // challengeId -> challenge
  private userAchievements: Map<string, Achievement[]> = new Map(); // userId -> achievements
  private userPoints: Map<string, number> = new Map(); // userId -> total points

  private challengeIdCounter = 1000;
  private achievementIdCounter = 5000;

  // Events
  onChallengeCreated: (challenge: HabitChallenge) => void = () => {};
  onChallengeCompleted: (challenge: HabitChallenge) => void = () => {};
  onAchievementUnlocked: (achievement: Achievement) => void = () => {};

  private constructor() {}

  public static getInstance(): HabitChallengeService {
    if (!HabitChallengeService.instance) {
      HabitChallengeService.instance = new HabitChallengeService();
    }
    return HabitChallengeService.instance;
  }

  /**
   * Create new challenge
   */
  public createChallenge(
    name: string,
    description: string,
    type: 'personal' | 'friend' | 'public',
    goal: number,
    durationDays: number,
    userId?: string,
    habitId?: string
  ): HabitChallenge {
    const id = `challenge_${this.challengeIdCounter++}`;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const challenge: HabitChallenge = {
      id,
      name,
      description,
      habitId,
      userId,
      type,
      goal,
      duration: durationDays,
      startDate,
      endDate,
      participants: userId ? [userId] : [],
      status: 'active',
      reward: {
        points: Math.min(100, goal * 2),
        badge: `${name.toLowerCase().replace(/ /g, '_')}_master`,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.challenges.set(id, challenge);
    this.clearCache('challenges');
    this.onChallengeCreated(challenge);

    return challenge;
  }

  /**
   * Join challenge
   */
  public joinChallenge(challengeId: string, userId: string): boolean {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return false;

    if (!challenge.participants.includes(userId)) {
      challenge.participants.push(userId);
      challenge.updatedAt = new Date();
      this.clearCache(`challenge_${challengeId}`);
      this.clearCache('challenges');
      return true;
    }

    return false;
  }

  /**
   * Leave challenge
   */
  public leaveChallenge(challengeId: string, userId: string): boolean {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return false;

    const index = challenge.participants.indexOf(userId);
    if (index !== -1) {
      challenge.participants.splice(index, 1);
      challenge.updatedAt = new Date();
      this.clearCache(`challenge_${challengeId}`);
      this.clearCache('challenges');
      return true;
    }

    return false;
  }

  /**
   * Complete challenge
   */
  public completeChallenge(challengeId: string, userId: string): boolean {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return false;

    challenge.status = 'completed';
    challenge.updatedAt = new Date();

    // Award points and achievement
    const currentPoints = this.userPoints.get(userId) || 0;
    this.userPoints.set(userId, currentPoints + challenge.reward.points);

    if (challenge.reward.badge) {
      this.unlockAchievement(userId, challenge.reward.badge, challenge.name, challenge.reward.points);
    }

    this.clearCache(`challenge_${challengeId}`);
    this.clearCache(`user_challenges_${userId}`);
    this.onChallengeCompleted(challenge);

    return true;
  }

  /**
   * Get active challenges for user
   */
  public getUserChallenges(userId: string): HabitChallenge[] {
    const cacheKey = `user_challenges_${userId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    const userChallenges = Array.from(this.challenges.values()).filter(
      (c) =>
        (c.userId === userId || c.participants.includes(userId)) &&
        c.status === 'active'
    );

    this.cache.set(cacheKey, { result: userChallenges, timestamp: Date.now() });
    return userChallenges;
  }

  /**
   * Get all active challenges
   */
  public getActiveChallenges(): HabitChallenge[] {
    const cacheKey = 'active_challenges';
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    const active = Array.from(this.challenges.values()).filter(
      (c) => c.status === 'active' && c.type !== 'personal'
    );

    this.cache.set(cacheKey, { result: active, timestamp: Date.now() });
    return active;
  }

  /**
   * Get challenge by ID
   */
  public getChallenge(challengeId: string): HabitChallenge | null {
    return this.challenges.get(challengeId) || null;
  }

  /**
   * Get leaderboard for challenge
   */
  public getLeaderboard(challengeId: string, userId: string): Leaderboard | null {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return null;

    const participants: ChallengeParticipant[] = challenge.participants.map(
      (participantId, index) => ({
        userId: participantId,
        username: `User${participantId.substring(0, 5)}`,
        progress: this.calculateProgress(participantId, challenge),
        rank: index + 1,
        completedDays: this.calculateCompletedDays(participantId, challenge),
      })
    );

    participants.sort((a, b) => b.progress - a.progress);
    participants.forEach((p, i) => (p.rank = i + 1));

    const yourRank = participants.findIndex((p) => p.userId === userId) + 1 || 0;
    const topPerformer = participants[0];

    return {
      challengeId,
      participants,
      yourRank,
      topPerfomer: topPerformer,
    };
  }

  /**
   * Unlock achievement
   */
  public unlockAchievement(userId: string, badgeId: string, name: string, points: number): Achievement {
    const id = `achievement_${this.achievementIdCounter++}`;

    const achievement: Achievement = {
      id,
      userId,
      name,
      description: `Unlocked by completing challenge: ${name}`,
      icon: this.getBadgeIcon(badgeId),
      unlockedAt: new Date(),
      points,
    };

    if (!this.userAchievements.has(userId)) {
      this.userAchievements.set(userId, []);
    }

    this.userAchievements.get(userId)!.push(achievement);
    this.clearCache(`achievements_${userId}`);
    this.onAchievementUnlocked(achievement);

    return achievement;
  }

  /**
   * Get user achievements
   */
  public getUserAchievements(userId: string): Achievement[] {
    const cacheKey = `achievements_${userId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    const achievements = this.userAchievements.get(userId) || [];
    this.cache.set(cacheKey, { result: achievements, timestamp: Date.now() });
    return achievements;
  }

  /**
   * Get user total points
   */
  public getUserPoints(userId: string): number {
    return this.userPoints.get(userId) || 0;
  }

  /**
   * Get user level based on points
   */
  public getUserLevel(userId: string): number {
    const points = this.getUserPoints(userId);
    return Math.floor(points / 100) + 1;
  }

  /**
   * Get global leaderboard
   */
  public getGlobalLeaderboard(limit: number = 10): Array<{ userId: string; points: number; level: number }> {
    const leaderboard = Array.from(this.userPoints.entries())
      .map(([userId, points]) => ({
        userId,
        points,
        level: this.getUserLevel(userId),
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);

    return leaderboard;
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

  private calculateProgress(userId: string, challenge: HabitChallenge): number {
    const completedDays = this.calculateCompletedDays(userId, challenge);
    return (completedDays / challenge.goal) * 100;
  }

  private calculateCompletedDays(userId: string, challenge: HabitChallenge): number {
    // Simulated calculation - in production, would query actual check-ins
    return Math.floor(Math.random() * challenge.goal);
  }

  private getBadgeIcon(badgeId: string): string {
    const icons: { [key: string]: string } = {
      early_bird: '🌅',
      night_owl: '🌙',
      consistency: '⚡',
      master: '🏆',
      legend: '👑',
      beginner: '🌱',
    };
    return icons[badgeId] || '⭐';
  }
}

export const habitChallengeService = HabitChallengeService.getInstance();
