/**
 * Complete Task Instance Use Case
 */

import { completeTaskInstance } from '@dailyuse/application-server';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';

export async function completeInstanceUseCase(
  uuid: string,
  completion?: { duration?: number; note?: string; rating?: number }
): Promise<TaskInstanceClientDTO> {
  const result = await completeTaskInstance({
    uuid,
    duration: completion?.duration,
    note: completion?.note,
    rating: completion?.rating,
  });
  return result.instance;
}
