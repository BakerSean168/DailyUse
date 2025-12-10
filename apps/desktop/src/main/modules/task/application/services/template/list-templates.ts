/**
 * List Task Templates Use Case
 */

import { listTaskTemplates, type ListTaskTemplatesInput } from '@dailyuse/application-server';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

export async function listTemplatesUseCase(
  params: ListTaskTemplatesInput
): Promise<{ templates: TaskTemplateClientDTO[]; total: number }> {
  const result = await listTaskTemplates(params);
  return {
    templates: result.templates,
    total: result.total,
  };
}
