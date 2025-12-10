/**
 * Create Goal Service
 */

import { createGoal, type CreateGoalInput } from '@dailyuse/application-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('CreateGoalService');

export async function createGoalService(params: CreateGoalInput): Promise<GoalClientDTO> {
  logger.debug('Creating goal', { title: params.title });
  const result = await createGoal(params);
  return result.goal;
}
