/**
 * QuotaEnforcementService Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIContracts } from '@dailyuse/contracts';
import { QuotaEnforcementService, QuotaExceededError } from '../QuotaEnforcementService';
import { AIUsageQuotaServer } from '../../aggregates/AIUsageQuotaServer';
import type { IAIUsageQuotaRepository } from '../../repositories/IAIUsageQuotaRepository';

const QuotaResetPeriodEnum = AIContracts.QuotaResetPeriod;

describe('QuotaEnforcementService', () => {
  let service: QuotaEnforcementService;
  let mockRepository: IAIUsageQuotaRepository;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findByAccountUuid: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    service = new QuotaEnforcementService(mockRepository);
  });

  describe('checkQuota', () => {
    it('should return allowed=true when quota is available', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });

      vi.spyOn(mockRepository, 'findByAccountUuid').mockResolvedValue(quota);

      const result = await service.checkQuota('user-123', 5);

      expect(result.allowed).toBe(true);
      expect(result.remainingQuota).toBe(50);
      expect(result.quotaLimit).toBe(50);
      expect(result.currentUsage).toBe(0);
    });

    it('should return allowed=false when quota is exceeded', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 10,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });

      // Consume all quota
      quota.consume(10);
      vi.spyOn(mockRepository, 'findByAccountUuid').mockResolvedValue(quota);

      const result = await service.checkQuota('user-123', 1);

      expect(result.allowed).toBe(false);
      expect(result.remainingQuota).toBe(0);
      expect(result.reason).toBe('Insufficient quota available');
    });

    it('should create default quota if none exists', async () => {
      vi.spyOn(mockRepository, 'findByAccountUuid').mockResolvedValue(null);

      const result = await service.checkQuota('new-user', 1);

      expect(result.allowed).toBe(true);
      expect(result.quotaLimit).toBe(50); // Default limit
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should auto-reset quota if reset time has passed', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });

      // Consume some quota
      quota.consume(40);

      // Mock shouldReset to return true
      vi.spyOn(quota, 'shouldReset').mockReturnValue(true);
      vi.spyOn(mockRepository, 'findByAccountUuid').mockResolvedValue(quota);

      const result = await service.checkQuota('user-123', 5);

      expect(result.allowed).toBe(true);
      expect(result.currentUsage).toBe(0); // Reset
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('consumeQuota', () => {
    it('should successfully consume quota when available', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });

      vi.spyOn(mockRepository, 'findByAccountUuid').mockResolvedValue(quota);

      await service.consumeQuota('user-123', 10);

      expect(quota.currentUsage).toBe(10);
      expect(mockRepository.save).toHaveBeenCalledWith(quota);
    });

    it('should throw QuotaExceededError when quota is insufficient', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 10,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });

      quota.consume(10); // Use all quota
      vi.spyOn(mockRepository, 'findByAccountUuid').mockResolvedValue(quota);

      await expect(service.consumeQuota('user-123', 5)).rejects.toThrow(QuotaExceededError);
    });

    it('should auto-reset before consuming if reset time has passed', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });

      quota.consume(50); // Use all quota
      vi.spyOn(quota, 'shouldReset').mockReturnValue(true);
      vi.spyOn(mockRepository, 'findByAccountUuid').mockResolvedValue(quota);

      await service.consumeQuota('user-123', 10);

      expect(quota.currentUsage).toBe(10); // Reset then consumed
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('resetQuota', () => {
    it('should reset quota manually', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });

      quota.consume(30);
      vi.spyOn(mockRepository, 'findByAccountUuid').mockResolvedValue(quota);

      await service.resetQuota('user-123');

      expect(quota.currentUsage).toBe(0);
      expect(mockRepository.save).toHaveBeenCalledWith(quota);
    });
  });

  describe('getQuotaStatus', () => {
    it('should return current quota status', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 100,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });

      quota.consume(25);
      vi.spyOn(mockRepository, 'findByAccountUuid').mockResolvedValue(quota);

      const status = await service.getQuotaStatus('user-123');

      expect(status.remainingQuota).toBe(75);
      expect(status.quotaLimit).toBe(100);
      expect(status.currentUsage).toBe(25);
      expect(status.usagePercentage).toBe(25);
      expect(status.isExceeded).toBe(false);
    });

    it('should show exceeded status when quota is used up', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });

      quota.consume(50);
      vi.spyOn(mockRepository, 'findByAccountUuid').mockResolvedValue(quota);

      const status = await service.getQuotaStatus('user-123');

      expect(status.remainingQuota).toBe(0);
      expect(status.isExceeded).toBe(true);
      expect(status.usagePercentage).toBe(100);
    });
  });

  describe('updateQuotaLimit', () => {
    it('should update quota limit', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });

      vi.spyOn(mockRepository, 'findByAccountUuid').mockResolvedValue(quota);

      await service.updateQuotaLimit('user-123', 100);

      expect(quota.quotaLimit).toBe(100);
      expect(mockRepository.save).toHaveBeenCalledWith(quota);
    });
  });
});
