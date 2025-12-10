import { findDueTasks } from '@dailyuse/application-server';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('findDueTasksService');

export async function findDueTasksService(params?: {
  beforeTime?: Date;
}): Promise<{
  tasks: ScheduleTaskClientDTO[];
  total: number;
}> {
  const result = await findDueTasks({
    beforeTime: params?.beforeTime || new Date(),
  });
  return {
    tasks: result.tasks,
    total: result.total,
  };
}
