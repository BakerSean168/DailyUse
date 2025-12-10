/**
 * List Goals Service
 */

import { listGoals, type ListGoalsInput } from '@dailyuse/application-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

export async function listGoalsService(params: {
  accountUuid?: string;
  status?: string;
  folderUuid?: string;
  includeChildren?: boolean;
}): Promise<{ goals: GoalClientDTO[]; total: number }> {
  const input: ListGoalsInput = {
    accountUuid: params.accountUuid || 'default',
    status: params.status,
    folderUuid: params.folderUuid,
    includeChildren: params.includeChildren,
  };

  const result = await listGoals(input);
  return { goals: result.goals, total: result.total };
}
