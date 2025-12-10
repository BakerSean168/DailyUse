import { pauseScheduleTask } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('pauseTaskService');

export async function pauseTaskService(uuid: string): Promise<{ success: boolean }> {
  const result = await pauseScheduleTask({ uuid });
  return { success: result.success };
}
