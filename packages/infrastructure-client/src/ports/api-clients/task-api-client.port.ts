/**
 * Task API Client Port Interface
 */

// TODO: Import from @dailyuse/contracts/task when available

/**
 * Task API Client Interface
 */
export interface ITaskApiClient {
  /** 创建任务 */
  createTask(request: unknown): Promise<unknown>;

  /** 获取任务列表 */
  getTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<unknown>;

  /** 获取任务详情 */
  getTaskById(uuid: string): Promise<unknown>;

  /** 更新任务 */
  updateTask(uuid: string, request: unknown): Promise<unknown>;

  /** 删除任务 */
  deleteTask(uuid: string): Promise<void>;

  /** 完成任务 */
  completeTask(uuid: string): Promise<unknown>;
}
