/**
 * HabitChallengeService.test.ts - Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { habitChallengeService } from './HabitChallengeService';

describe('HabitChallengeService', () => {
  const userId = 'user_1';

  beforeEach(() => {
    habitChallengeService.clearCache();
  });

  afterEach(() => {
    habitChallengeService.clearCache();
  });

  describe('createChallenge', () => {
    it('should create new personal challenge', () => {
      const challenge = habitChallengeService.createChallenge(
        ' Week Challenge',
        'Complete 7 consecutive days',
        'personal',
        7,
        7,
        userId
      );

      expect(challenge).toBeDefined();
      expect(challenge.name).toBe('Week Challenge');
      expect(challenge.type).toBe('personal');
      expect(challenge.status).toBe('active');
    });

    it('should create friend challenge', () => {
      const challenge = habitChallengeService.createChallenge(
        'Friend Challenge',
        'Complete together',
        'friend',
        30,
        30,
        userId
      );

      expect(challenge.type).toBe('friend');
    });

    it('should create public challenge', () => {
      const challenge = habitChallengeService.createChallenge(
        'Public Challenge',
        'Open to everyone',
        'public',
        30,
        30
      );

      expect(challenge.type).toBe('public');
      expect(challenge.participants).toHaveLength(0);
    });

    it('should trigger onChallengeCreated event', () => {
      let eventTriggered = false;
      habitChallengeService.onChallengeCreated = () => {
        eventTriggered = true;
      };

      habitChallengeService.createChallenge('Test', 'Description', 'personal', 7, 7, userId);
      expect(eventTriggered).toBe(true);
    });

    it('should set reward points based on goal', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'personal', 14, 14, userId);

      expect(challenge.reward.points).toBeGreaterThan(0);
      expect(challenge.reward.badge).toBeDefined();
    });
  });

  describe('joinChallenge', () => {
    it('should join public challenge', () => {
      const challenge = habitChallengeService.createChallenge(
        'Public Challenge',
        'Open to everyone',
        'public',
        30,
        30
      );

      const joined = habitChallengeService.joinChallenge(challenge.id, userId);

      expect(joined).toBe(true);
      expect(challenge.participants).toContain(userId);
    });

    it('should prevent duplicate joining', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'public', 30, 30);

      habitChallengeService.joinChallenge(challenge.id, userId);
      const joined = habitChallengeService.joinChallenge(challenge.id, userId);

      expect(joined).toBe(false);
      expect(challenge.participants.filter((p) => p === userId)).toHaveLength(1);
    });

    it('should return false for non-existent challenge', () => {
      const joined = habitChallengeService.joinChallenge('non_existent', userId);
      expect(joined).toBe(false);
    });
  });

  describe('leaveChallenge', () => {
    it('should leave challenge', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'public', 30, 30);

      habitChallengeService.joinChallenge(challenge.id, userId);
      const left = habitChallengeService.leaveChallenge(challenge.id, userId);

      expect(left).toBe(true);
      expect(challenge.participants).not.toContain(userId);
    });

    it('should return false if not a participant', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'public', 30, 30);

      const left = habitChallengeService.leaveChallenge(challenge.id, userId);
      expect(left).toBe(false);
    });
  });

  describe('completeChallenge', () => {
    it('should mark challenge as completed', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'personal', 7, 7, userId);

      habitChallengeService.completeChallenge(challenge.id, userId);

      expect(challenge.status).toBe('completed');
    });

    it('should award points on completion', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'personal', 7, 7, userId);

      const pointsBefore = habitChallengeService.getUserPoints(userId);
      habitChallengeService.completeChallenge(challenge.id, userId);
      const pointsAfter = habitChallengeService.getUserPoints(userId);

      expect(pointsAfter).toBeGreaterThan(pointsBefore);
    });

    it('should trigger onChallengeCompleted event', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'personal', 7, 7, userId);

      let eventTriggered = false;
      habitChallengeService.onChallengeCompleted = () => {
        eventTriggered = true;
      };

      habitChallengeService.completeChallenge(challenge.id, userId);
      expect(eventTriggered).toBe(true);
    });
  });

  describe('getUserChallenges', () => {
    it('should return active challenges for user', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'personal', 7, 7, userId);

      const challenges = habitChallengeService.getUserChallenges(userId);
      expect(challenges.length).toBeGreaterThan(0);
      expect(challenges[0].status).toBe('active');
    });

    it('should not include completed challenges', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'personal', 7, 7, userId);

      habitChallengeService.completeChallenge(challenge.id, userId);
      const challenges = habitChallengeService.getUserChallenges(userId);

      expect(challenges).toHaveLength(0);
    });
  });

  describe('getActiveChallenges', () => {
    it('should return public active challenges', () => {
      habitChallengeService.createChallenge('Public Challenge', 'Description', 'public', 30, 30);
      habitChallengeService.createChallenge('Personal', 'Description', 'personal', 7, 7, userId);

      const challenges = habitChallengeService.getActiveChallenges();
      expect(challenges.some((c) => c.type === 'public')).toBe(true);
      expect(challenges.some((c) => c.type === 'personal')).toBe(false);
    });
  });

  describe('getChallenge', () => {
    it('should retrieve challenge by ID', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'personal', 7, 7, userId);

      const retrieved = habitChallengeService.getChallenge(challenge.id);
      expect(retrieved).toEqual(challenge);
    });

    it('should return null for non-existent challenge', () => {
      const retrieved = habitChallengeService.getChallenge('non_existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('getLeaderboard', () => {
    it('should generate leaderboard for challenge', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'public', 30, 30);

      habitChallengeService.joinChallenge(challenge.id, userId);
      const leaderboard = habitChallengeService.getLeaderboard(challenge.id, userId);

      expect(leaderboard).toBeDefined();
      expect(leaderboard?.participants.length).toBeGreaterThan(0);
    });

    it('should include user rank', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'public', 30, 30);

      habitChallengeService.joinChallenge(challenge.id, userId);
      const leaderboard = habitChallengeService.getLeaderboard(challenge.id, userId);

      expect(leaderboard?.yourRank).toBeGreaterThan(0);
    });

    it('should rank by progress', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'public', 30, 30);

      habitChallengeService.joinChallenge(challenge.id, 'user1');
      habitChallengeService.joinChallenge(challenge.id, 'user2');

      const leaderboard = habitChallengeService.getLeaderboard(challenge.id, 'user1');

      // Verify participants are sorted by rank
      if (leaderboard && leaderboard.participants.length > 1) {
        for (let i = 1; i < leaderboard.participants.length; i++) {
          expect(leaderboard.participants[i - 1].rank).toBeLessThanOrEqual(
            leaderboard.participants[i].rank
          );
        }
      }
    });
  });

  describe('achievements', () => {
    it('should unlock achievement on challenge completion', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'personal', 7, 7, userId);

      habitChallengeService.completeChallenge(challenge.id, userId);
      const achievements = habitChallengeService.getUserAchievements(userId);

      expect(achievements.length).toBeGreaterThan(0);
    });

    it('should trigger onAchievementUnlocked event', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'personal', 7, 7, userId);

      let eventTriggered = false;
      habitChallengeService.onAchievementUnlocked = () => {
        eventTriggered = true;
      };

      habitChallengeService.completeChallenge(challenge.id, userId);
      expect(eventTriggered).toBe(true);
    });
  });

  describe('points and levels', () => {
    it('should track user points', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'personal', 7, 7, userId);

      const pointsBefore = habitChallengeService.getUserPoints(userId);
      habitChallengeService.completeChallenge(challenge.id, userId);
      const pointsAfter = habitChallengeService.getUserPoints(userId);

      expect(pointsAfter).toBeGreaterThan(pointsBefore);
    });

    it('should calculate level from points', () => {
      const challenge = habitChallengeService.createChallenge('Test', 'Description', 'personal', 100, 7, userId);

      habitChallengeService.completeChallenge(challenge.id, userId);
      const level = habitChallengeService.getUserLevel(userId);

      expect(level).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getGlobalLeaderboard', () => {
    it('should return top users by points', () => {
      const leaderboard = habitChallengeService.getGlobalLeaderboard(10);

      expect(leaderboard).toBeDefined();
      expect(Array.isArray(leaderboard)).toBe(true);
    });

    it('should respect limit parameter', () => {
      const leaderboard = habitChallengeService.getGlobalLeaderboard(5);
      expect(leaderboard.length).toBeLessThanOrEqual(5);
    });

    it('should order by points descending', () => {
      const leaderboard = habitChallengeService.getGlobalLeaderboard(10);

      for (let i = 1; i < leaderboard.length; i++) {
        expect(leaderboard[i - 1].points).toBeGreaterThanOrEqual(leaderboard[i].points);
      }
    });
  });

  describe('cache management', () => {
    it('should cache challenges', () => {
      habitChallengeService.createChallenge('Test', 'Description', 'public', 30, 30);

      const challenges1 = habitChallengeService.getActiveChallenges();
      const challenges2 = habitChallengeService.getActiveChallenges();

      expect(challenges1).toBe(challenges2); // Same reference (cached)
    });
  });
});
