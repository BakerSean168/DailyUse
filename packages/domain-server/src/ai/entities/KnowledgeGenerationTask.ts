/**
 * Knowledge Generation Task Entity (Story 4.3)
 * 知识系列生成任务聚合根
 *
 * 代表一个异步的知识文档系列生成任务
 */

export interface KnowledgeGenerationTask {
  uuid: string;
  accountUuid: string;
  topic: string;
  documentCount: number;
  targetAudience?: string;
  folderPath: string;
  status: KnowledgeGenerationTaskStatus;
  progress: number; // 0-100
  generatedDocumentUuids: string[];
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export type KnowledgeGenerationTaskStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

/**
 * Factory function to create a new task
 */
export function createKnowledgeGenerationTask(params: {
  uuid: string;
  accountUuid: string;
  topic: string;
  documentCount: number;
  targetAudience?: string;
  folderPath: string;
}): KnowledgeGenerationTask {
  return {
    uuid: params.uuid,
    accountUuid: params.accountUuid,
    topic: params.topic,
    documentCount: params.documentCount,
    targetAudience: params.targetAudience,
    folderPath: params.folderPath,
    status: 'PENDING',
    progress: 0,
    generatedDocumentUuids: [],
    createdAt: Date.now(),
  };
}

/**
 * Domain logic: Update task progress
 */
export function updateTaskProgress(
  task: KnowledgeGenerationTask,
  documentsCompleted: number,
): KnowledgeGenerationTask {
  const progress = Math.round((documentsCompleted / task.documentCount) * 100);
  return {
    ...task,
    progress: Math.min(progress, 100),
    status: 'GENERATING',
  };
}

/**
 * Domain logic: Mark task as completed
 */
export function completeTask(
  task: KnowledgeGenerationTask,
  documentUuids: string[],
): KnowledgeGenerationTask {
  return {
    ...task,
    status: 'COMPLETED',
    progress: 100,
    generatedDocumentUuids: documentUuids,
    completedAt: Date.now(),
  };
}

/**
 * Domain logic: Mark task as failed
 */
export function failTask(task: KnowledgeGenerationTask, error: string): KnowledgeGenerationTask {
  return {
    ...task,
    status: 'FAILED',
    error,
    completedAt: Date.now(),
  };
}
