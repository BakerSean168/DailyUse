import { listScheduleTasks } from '@dailyuse/application-server';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listTasksByAccountService');

export async function listTasksByAccountService(accountUuid: string): Promise<{
  tasks: ScheduleTaskClientDTO[];
  total: number;
}> {
  const result = await listScheduleTasks({ accountUuid });
  return {
    tasks: result.tasks,
    total: result.total,
  };
}
