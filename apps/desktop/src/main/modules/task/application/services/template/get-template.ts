/**
 * Get Task Template Use Case
 */

import { getTaskTemplate } from '@dailyuse/application-server';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

export async function getTemplateUseCase(uuid: string): Promise<TaskTemplateClientDTO | null> {
  const result = await getTaskTemplate({ uuid });
  return result.template;
}
