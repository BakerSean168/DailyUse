/**
 * Delete Task Template Use Case
 */

import { deleteTaskTemplate } from '@dailyuse/application-server';

export async function deleteTemplateUseCase(uuid: string): Promise<void> {
  await deleteTaskTemplate({ uuid });
}
