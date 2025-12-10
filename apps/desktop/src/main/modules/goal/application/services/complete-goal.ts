/**
 * Complete Goal Service
 */

import { completeGoal } from '@dailyuse/application-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

export async function completeGoalService(uuid: string): Promise<GoalClientDTO> {
  const result = await completeGoal({ uuid });
  return result.goal;
}
