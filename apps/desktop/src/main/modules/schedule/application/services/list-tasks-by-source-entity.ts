import { listScheduleTasks } from '@dailyuse/application-server';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listTasksBySourceEntityService');

export async function listTasksBySourceEntityService(
  sourceModule: string,
  sourceEntityId: string,
): Promise<{ tasks: ScheduleTaskClientDTO[]; total: number }> {
  const result = await listScheduleTasks({
    sourceModule: sourceModule as any,
    sourceEntityId,
  });
  return {
    tasks: result.tasks,
    total: result.total,
  };
}
