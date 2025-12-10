/**
 * List Instances By Date Range Use Case
 */

import { getTaskInstancesByDateRange } from '@dailyuse/application-server';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';

export async function listInstancesByDateRangeUseCase(
  startDate: number,
  endDate: number,
  accountUuid: string
): Promise<{ instances: TaskInstanceClientDTO[]; total: number }> {
  const result = await getTaskInstancesByDateRange({ accountUuid, startDate, endDate });
  return {
    instances: result.instances,
    total: result.total,
  };
}
