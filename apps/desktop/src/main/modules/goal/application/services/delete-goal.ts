/**
 * Delete Goal Service
 */

import { deleteGoal } from '@dailyuse/application-server';

export async function deleteGoalService(uuid: string): Promise<void> {
  await deleteGoal({ uuid });
}
