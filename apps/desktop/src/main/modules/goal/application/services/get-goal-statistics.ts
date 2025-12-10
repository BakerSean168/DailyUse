/**
 * Get Goal Statistics Service
 */

import { GoalContainer } from '@dailyuse/infrastructure-server';

export async function getGoalStatisticsService(accountUuid?: string) {
  const container = GoalContainer.getInstance();
  const repo = container.getGoalRepository();
  
  const goals = await repo.findByAccount(accountUuid || 'default');
  
  return {
    total: goals.length,
    active: goals.filter((g) => g.status === 'ACTIVE').length,
    completed: goals.filter((g) => g.status === 'COMPLETED').length,
    archived: goals.filter((g) => g.status === 'ARCHIVED').length,
  };
}
