/**
 * Get Goal Statistics Service
 */

import type { Goal } from '@dailyuse/domain-server/goal';
import { GoalContainer } from '@dailyuse/infrastructure-server';

export async function getGoalStatisticsService(accountUuid?: string) {
  const container = GoalContainer.getInstance();
  const repo = container.getGoalRepository();
  
  const goals: Goal[] = await repo.findByAccountUuid(accountUuid || 'default');
  
  return {
    total: goals.length,
    active: goals.filter((g: Goal) => g.status === 'ACTIVE').length,
    completed: goals.filter((g: Goal) => g.status === 'COMPLETED').length,
    archived: goals.filter((g: Goal) => g.status === 'ARCHIVED').length,
  };
}
