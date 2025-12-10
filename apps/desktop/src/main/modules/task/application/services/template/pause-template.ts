/**
 * Pause Task Template Use Case
 */

import { pauseTaskTemplate } from '@dailyuse/application-server';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

export async function pauseTemplateUseCase(uuid: string): Promise<TaskTemplateClientDTO> {
  const result = await pauseTaskTemplate({ uuid });
  return result.template;
}
