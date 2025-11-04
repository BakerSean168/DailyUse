import { apiClient } from '@/shared/api/instances';
import { type TaskContracts } from '@dailyuse/contracts';

/**
 * Task Template API 客户端
 * 负责任务模板相关的API调用
 *
 * API路由基于 DDD 聚合根控制模式:
 * - POST   /tasks/templates              - 创建任务模板
 * - GET    /tasks/templates              - 获取任务模板列表
 * - GET    /tasks/templates/:id          - 获取任务模板详情
 * - DELETE /tasks/templates/:id          - 删除任务模板
 * - POST   /tasks/templates/:id/activate - 激活任务模板
 * - POST   /tasks/templates/:id/pause    - 暂停任务模板
 * - POST   /tasks/templates/:id/archive  - 归档任务模板
 * - POST   /tasks/templates/:id/generate-instances - 生成任务实例
 * - POST   /tasks/templates/:id/bind-goal   - 绑定到目标
 * - POST   /tasks/templates/:id/unbind-goal - 解除目标绑定
 */
export class TaskTemplateApiClient {
  private readonly baseUrl = '/tasks/templates';

  // ===== Task Template CRUD =====

  /**
   * 创建任务模板
   */
  async createTaskTemplate(
    request: TaskContracts.CreateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateClientDTO> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 获取任务模板列表
   */
  async getTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    folderUuid?: string;
    goalUuid?: string;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    const data = await apiClient.get(this.baseUrl, { params });
    return data;
  }

  /**
   * 获取任务模板详情
   */
  async getTaskTemplateById(
    uuid: string,
    includeChildren = false,
  ): Promise<TaskContracts.TaskTemplateClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}`, {
      params: { includeChildren },
    });
    return data;
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Task Template 状态管理（聚合根操作）=====

  /**
   * 激活任务模板
   */
  async activateTaskTemplate(uuid: string): Promise<TaskContracts.TaskTemplateClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/activate`);
    return data;
  }

  /**
   * 暂停任务模板
   */
  async pauseTaskTemplate(uuid: string): Promise<TaskContracts.TaskTemplateClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/pause`);
    return data;
  }

  /**
   * 归档任务模板
   */
  async archiveTaskTemplate(uuid: string): Promise<TaskContracts.TaskTemplateClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/archive`);
    return data;
  }

  // ===== 聚合根控制：任务实例管理 =====

  /**
   * 生成任务实例
   * 根据模板和重复规则生成任务实例
   */
  async generateInstances(
    templateUuid: string,
    request: TaskContracts.GenerateInstancesRequest,
  ): Promise<TaskContracts.TaskInstanceClientDTO[]> {
    const data = await apiClient.post(`${this.baseUrl}/${templateUuid}/generate-instances`, request);
    return data;
  }

  // ===== 聚合根控制：目标关联管理 =====

  /**
   * 绑定到目标
   * 将任务模板绑定到OKR目标
   */
  async bindToGoal(
    templateUuid: string,
    request: TaskContracts.BindToGoalRequest,
  ): Promise<TaskContracts.TaskTemplateClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${templateUuid}/bind-goal`, request);
    return data;
  }

  /**
   * 解除目标绑定
   */
  async unbindFromGoal(templateUuid: string): Promise<TaskContracts.TaskTemplateClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${templateUuid}/unbind-goal`);
    return data;
  }
}

/**
 * Task Instance API 客户端
 * 负责任务实例相关的API调用
 *
 * API路由基于 DDD 聚合根控制模式:
 * - GET    /tasks/templates/instances            - 获取任务实例列表
 * - GET    /tasks/templates/instances/:id        - 获取任务实例详情
 * - DELETE /tasks/templates/instances/:id        - 删除任务实例
 * - POST   /tasks/templates/instances/:id/start  - 开始任务实例
 * - POST   /tasks/templates/instances/:id/complete - 完成任务实例
 * - POST   /tasks/templates/instances/:id/skip   - 跳过任务实例
 * - POST   /tasks/templates/instances/check-expired - 检查过期任务
 */
export class TaskInstanceApiClient {
  private readonly baseUrl = '/tasks/templates/instances';

  // ===== Task Instance CRUD =====

  /**
   * 获取任务实例列表
   */
  async getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateUuid?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<TaskContracts.TaskInstanceClientDTO[]> {
    const data = await apiClient.get(this.baseUrl, { params });
    return data;
  }

  /**
   * 获取任务实例详情
   */
  async getTaskInstanceById(uuid: string): Promise<TaskContracts.TaskInstanceClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return data;
  }

  /**
   * 删除任务实例
   */
  async deleteTaskInstance(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Task Instance 状态管理（聚合根操作）=====

  /**
   * 开始任务实例
   * 将任务实例状态从 PENDING 转换为 IN_PROGRESS
   */
  async startTaskInstance(uuid: string): Promise<TaskContracts.TaskInstanceClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/start`);
    return data;
  }

  /**
   * 完成任务实例
   */
  async completeTaskInstance(
    uuid: string,
    request?: TaskContracts.CompleteTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/complete`, request);
    return data;
  }

  /**
   * 跳过任务实例
   */
  async skipTaskInstance(
    uuid: string,
    request?: TaskContracts.SkipTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/skip`, request);
    return data;
  }

  // ===== 批量操作 =====

  /**
   * 检查并标记过期的任务实例
   */
  async checkExpiredInstances(): Promise<{ count: number; instances: TaskContracts.TaskInstanceClientDTO[] }> {
    const data = await apiClient.post(`${this.baseUrl}/check-expired`);
    return data;
  }
}

/**
 * Task Dependency API 客户端
 * 负责任务依赖关系相关的API调用
 *
 * API路由基于 RESTful 设计:
 * - POST   /tasks/:taskUuid/dependencies           - 创建任务依赖关系
 * - GET    /tasks/:taskUuid/dependencies           - 获取任务的所有前置依赖
 * - GET    /tasks/:taskUuid/dependents             - 获取依赖此任务的所有任务
 * - GET    /tasks/:taskUuid/dependency-chain       - 获取任务的完整依赖链
 * - POST   /tasks/dependencies/validate            - 验证依赖关系
 * - DELETE /tasks/dependencies/:uuid               - 删除依赖关系
 * - PUT    /tasks/dependencies/:uuid               - 更新依赖关系
 */
export class TaskDependencyApiClient {
  private readonly baseUrl = '/tasks';

  /**
   * 创建任务依赖关系
   */
  async createDependency(
    taskUuid: string,
    request: TaskContracts.CreateTaskDependencyRequest,
  ): Promise<TaskContracts.TaskDependencyClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${taskUuid}/dependencies`, request);
    return data;
  }

  /**
   * 获取任务的所有前置依赖
   */
  async getDependencies(taskUuid: string): Promise<TaskContracts.TaskDependencyClientDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/${taskUuid}/dependencies`);
    return data;
  }

  /**
   * 获取依赖此任务的所有任务（后续任务）
   */
  async getDependents(taskUuid: string): Promise<TaskContracts.TaskDependencyClientDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/${taskUuid}/dependents`);
    return data;
  }

  /**
   * 获取任务的完整依赖链信息
   */
  async getDependencyChain(taskUuid: string): Promise<TaskContracts.DependencyChainClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${taskUuid}/dependency-chain`);
    return data;
  }

  /**
   * 验证依赖关系（不实际创建）
   */
  async validateDependency(
    request: TaskContracts.ValidateDependencyRequest,
  ): Promise<TaskContracts.ValidateDependencyResponse> {
    const data = await apiClient.post(`${this.baseUrl}/dependencies/validate`, request);
    return data;
  }

  /**
   * 删除依赖关系
   */
  async deleteDependency(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/dependencies/${uuid}`);
  }

  /**
   * 更新依赖关系
   */
  async updateDependency(
    uuid: string,
    request: TaskContracts.UpdateTaskDependencyRequest,
  ): Promise<TaskContracts.TaskDependencyClientDTO> {
    const data = await apiClient.put(`${this.baseUrl}/dependencies/${uuid}`, request);
    return data;
  }
}

/**
 * Task Statistics API 客户端
 * 负责任务统计相关的API调用
 *
 * API路由基于 DDD 聚合根控制模式:
 * - GET    /tasks/statistics/:accountUuid                     - 获取任务统计
 * - POST   /tasks/statistics/:accountUuid/recalculate         - 重新计算统计
 * - DELETE /tasks/statistics/:accountUuid                     - 删除统计数据
 * - POST   /tasks/statistics/:accountUuid/update-template-stats    - 更新模板统计
 * - POST   /tasks/statistics/:accountUuid/update-instance-stats    - 更新实例统计
 * - POST   /tasks/statistics/:accountUuid/update-completion-stats  - 更新完成统计
 * - GET    /tasks/statistics/:accountUuid/today-completion-rate    - 今日完成率
 * - GET    /tasks/statistics/:accountUuid/week-completion-rate     - 本周完成率
 * - GET    /tasks/statistics/:accountUuid/efficiency-trend         - 效率趋势
 */
export class TaskStatisticsApiClient {
  private readonly baseUrl = '/tasks/statistics';

  // ===== Task Statistics 查询 =====

  /**
   * 获取任务统计数据
   */
  async getTaskStatistics(
    accountUuid: string,
    forceRecalculate = false,
  ): Promise<TaskContracts.TaskStatisticsServerDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${accountUuid}`, {
      params: { forceRecalculate },
    });
    return data;
  }

  /**
   * 重新计算任务统计
   */
  async recalculateTaskStatistics(
    accountUuid: string,
    force = true,
  ): Promise<TaskContracts.TaskStatisticsServerDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${accountUuid}/recalculate`, { force });
    return data;
  }

  /**
   * 删除统计数据
   */
  async deleteTaskStatistics(accountUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${accountUuid}`);
  }

  // ===== 部分更新操作 =====

  /**
   * 更新模板统计信息
   */
  async updateTemplateStats(accountUuid: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${accountUuid}/update-template-stats`);
  }

  /**
   * 更新实例统计信息
   */
  async updateInstanceStats(accountUuid: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${accountUuid}/update-instance-stats`);
  }

  /**
   * 更新完成统计信息
   */
  async updateCompletionStats(accountUuid: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${accountUuid}/update-completion-stats`);
  }

  // ===== 快速查询方法 =====

  /**
   * 获取今日完成率
   */
  async getTodayCompletionRate(accountUuid: string): Promise<number> {
    const data = await apiClient.get(`${this.baseUrl}/${accountUuid}/today-completion-rate`);
    return data.rate;
  }

  /**
   * 获取本周完成率
   */
  async getWeekCompletionRate(accountUuid: string): Promise<number> {
    const data = await apiClient.get(`${this.baseUrl}/${accountUuid}/week-completion-rate`);
    return data.rate;
  }

  /**
   * 获取效率趋势
   */
  async getEfficiencyTrend(accountUuid: string): Promise<'UP' | 'DOWN' | 'STABLE'> {
    const data = await apiClient.get(`${this.baseUrl}/${accountUuid}/efficiency-trend`);
    return data.trend;
  }
}

// 导出单例实例
export const taskTemplateApiClient = new TaskTemplateApiClient();
export const taskInstanceApiClient = new TaskInstanceApiClient();
export const taskDependencyApiClient = new TaskDependencyApiClient();
export const taskStatisticsApiClient = new TaskStatisticsApiClient();
