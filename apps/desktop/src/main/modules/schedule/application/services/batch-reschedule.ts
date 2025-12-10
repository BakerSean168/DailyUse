import { rescheduleTaskService } from './reschedule-task';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('batchRescheduleService');

export async function batchRescheduleService(
  tasks: Array<{ uuid: string; cronExpression: string }>,
): Promise<{ success: boolean; count: number }> {
  let count = 0;
  for (const item of tasks) {
    try {
      await rescheduleTaskService(item.uuid, { cronExpression: item.cronExpression });
      count++;
    } catch (error) {
      logger.warn(`Failed to reschedule task ${item.uuid}`, error);
    }
  }
  return { success: true, count };
}
