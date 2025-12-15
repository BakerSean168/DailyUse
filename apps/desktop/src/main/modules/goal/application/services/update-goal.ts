/**
 * Update Goal Service
 */

import { updateGoal, type UpdateGoalInput } from '@dailyuse/application-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

export async function updateGoalService(uuid: string, params: Omit<UpdateGoalInput, 'uuid'>): Promise<GoalClientDTO> {
  const result = await updateGoal({ uuid, ...params });
  return result.goal;
}
