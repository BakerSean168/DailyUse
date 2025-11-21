/**
 * Knowledge Generation Task Repository Interface (Story 4.3)
 * 知识系列生成任务仓储接口
 */

import type { KnowledgeGenerationTask } from '../entities/KnowledgeGenerationTask';

export interface IKnowledgeGenerationTaskRepository {
  /**
   * 创建新任务
   */
  create(task: KnowledgeGenerationTask): Promise<KnowledgeGenerationTask>;

  /**
   * 根据 UUID 查找任务
   */
  findByUuid(uuid: string): Promise<KnowledgeGenerationTask | null>;

  /**
   * 根据账户 UUID 查找任务列表
   */
  findByAccountUuid(accountUuid: string): Promise<KnowledgeGenerationTask[]>;

  /**
   * 更新任务
   */
  update(task: KnowledgeGenerationTask): Promise<KnowledgeGenerationTask>;

  /**
   * 删除任务
   */
  delete(uuid: string): Promise<void>;
}
