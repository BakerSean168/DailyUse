import {
  listScheduleTasks,
  type ListScheduleTasksInput,
} from '@dailyuse/application-server';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listTasksService');

export async function listTasksService(
  params?: ListScheduleTasksInput,
): Promise<{
  tasks: ScheduleTaskClientDTO[];
  total: number;
}> {
  const result = await listScheduleTasks(params || {});
  return {
    tasks: result.tasks,
    total: result.total,
  };
}
