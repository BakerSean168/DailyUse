/**
 * Get Task Dashboard Use Case
 */

import { getTaskDashboard, type GetTaskDashboardOutput } from '@dailyuse/application-server';

export async function getDashboardUseCase(accountUuid: string): Promise<GetTaskDashboardOutput> {
  return getTaskDashboard({ accountUuid });
}
