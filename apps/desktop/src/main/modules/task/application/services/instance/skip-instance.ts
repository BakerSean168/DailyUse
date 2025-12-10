/**
 * Skip Task Instance Use Case
 */

import { skipTaskInstance } from '@dailyuse/application-server';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';

export async function skipInstanceUseCase(uuid: string, reason?: string): Promise<TaskInstanceClientDTO> {
  const result = await skipTaskInstance({ uuid, reason });
  return result.instance;
}
