/**
 * Activate Task Template Use Case
 */

import { activateTaskTemplate } from '@dailyuse/application-server';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

export async function activateTemplateUseCase(uuid: string): Promise<TaskTemplateClientDTO> {
  const result = await activateTaskTemplate({ uuid });
  return result.template;
}
