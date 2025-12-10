/**
 * Get Goal Service
 */

import { getGoal } from '@dailyuse/application-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

export async function getGoalService(uuid: string, includeChildren = true): Promise<GoalClientDTO | null> {
  const result = await getGoal({ uuid, includeChildren });
  return result.goal;
}
