/**
 * Application Layer Errors for Weight Snapshot
 * 权重快照应用层错误
 */

import { DomainError } from '@dailyuse/utils';

/**
 * 权重总和无效错误
 *
 * 当所有 KeyResult 的权重总和不等于 100% 时抛出
 */
export class InvalidWeightSumError extends DomainError {
  constructor(goalUuid: string, actualSum: number, weights: Record<string, number>) {
    super(
      'INVALID_WEIGHT_SUM',
      `Invalid weight sum for Goal ${goalUuid}: ${actualSum.toFixed(2)} (expected 100). KR weights: ${JSON.stringify(weights)}`,
      {
        goalUuid,
        actualSum,
        expectedSum: 100,
        weights,
      },
      400,
    );
  }
}

/**
 * Goal 未找到错误
 */
export class GoalNotFoundError extends DomainError {
  constructor(goalUuid: string) {
    super('GOAL_NOT_FOUND', `Goal not found: ${goalUuid}`, { goalUuid }, 404);
  }
}

/**
 * KeyResult 未找到错误
 */
export class KeyResultNotFoundError extends DomainError {
  constructor(krUuid: string, goalUuid?: string) {
    const message = goalUuid
      ? `KeyResult not found in Goal ${goalUuid}: ${krUuid}`
      : `KeyResult not found: ${krUuid}`;
    super('KEY_RESULT_NOT_FOUND', message, { krUuid, goalUuid }, 404);
  }
}
