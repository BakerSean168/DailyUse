/**
 * Activate Goal Service
 */

import { activateGoal } from '@dailyuse/application-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

export async function activateGoalService(uuid: string): Promise<GoalClientDTO> {
  const result = await activateGoal({ uuid });
  return result.goal;
}
