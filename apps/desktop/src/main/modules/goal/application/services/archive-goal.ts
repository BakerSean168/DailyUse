/**
 * Archive Goal Service
 */

import { archiveGoal } from '@dailyuse/application-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

export async function archiveGoalService(uuid: string): Promise<GoalClientDTO> {
  const result = await archiveGoal({ uuid });
  return result.goal;
}
