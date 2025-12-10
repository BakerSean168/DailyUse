import { resumeScheduleTask } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('resumeTaskService');

export async function resumeTaskService(uuid: string): Promise<{ success: boolean }> {
  const result = await resumeScheduleTask({ uuid });
  return { success: result.success };
}
