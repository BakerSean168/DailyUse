import {
  createScheduleTask,
  type CreateScheduleTaskInput,
} from '@dailyuse/application-server';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('createTaskService');

export async function createTaskService(
  input: CreateScheduleTaskInput,
): Promise<ScheduleTaskClientDTO> {
  logger.debug('Creating schedule task', { name: input.name });
  const result = await createScheduleTask(input);
  return result.task;
}
