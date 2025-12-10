import {
  generateGoal,
  type GenerateGoalOutput,
  type GenerateGoalInput,
} from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('generateGoalService');

export async function generateGoalService(
  accountUuid: string,
  input: Omit<GenerateGoalInput, 'accountUuid'>,
): Promise<GenerateGoalOutput> {
  logger.debug('Generating goal', { accountUuid });
  return generateGoal({ accountUuid, ...input });
}
