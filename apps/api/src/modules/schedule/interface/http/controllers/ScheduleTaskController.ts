import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ScheduleApplicationService } from '../../../application/services/ScheduleApplicationService';
import { ResponseCode, createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';
import { ScheduleMonitor } from '../../../infrastructure/monitoring/ScheduleMonitor';

// 创建 logger 实例
const logger = createLogger('ScheduleTaskController');

export class ScheduleTaskController {
  private static scheduleService: ScheduleApplicationService | null = null;
  private static scheduleMonitor: ScheduleMonitor | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取应用服务实例（懒加载）
   */
  private static async getScheduleService(): Promise<ScheduleApplicationService> {
    if (!ScheduleTaskController.scheduleService) {
      ScheduleTaskController.scheduleService = await ScheduleApplicationService.getInstance();
    }
    return ScheduleTaskController.scheduleService;
  }

  /**
   * 获取监控服务实例（懒加载）
   */
  private static getScheduleMonitor(): ScheduleMonitor {
    if (!ScheduleTaskController.scheduleMonitor) {
      ScheduleTaskController.scheduleMonitor = ScheduleMonitor.getInstance();
    }
    return ScheduleTaskController.scheduleMonitor;
  }

  /**
   * 从请求中提取用户账户UUID
   */
  private static extractAccountUuid(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      logger.warn('Authentication attempt without Bearer token');
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;

    if (!decoded?.accountUuid) {
      logger.warn('Invalid token: missing accountUuid');
      throw new Error('Invalid token: missing accountUuid');
    }

    return decoded.accountUuid;
  }

  /**
   * 创建调度任务
   * @route POST /api/schedules/tasks
   */
  static async createTask(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleTaskController.extractAccountUuid(req);
      const service = await ScheduleTaskController.getScheduleService();

      logger.info('Creating schedule task', { accountUuid, name: req.body.name });

      const task = await service.createScheduleTask({
        accountUuid,
        name: req.body.name,
        description: req.body.description,
        sourceModule: req.body.sourceModule,
        sourceEntityId: req.body.sourceEntityId,
        schedule: req.body.schedule,
        retryConfig: req.body.retryConfig,
        payload: req.body.payload,
        tags: req.body.tags,
      });

      logger.info('Schedule task created successfully', {
        taskUuid: task.uuid,
        accountUuid,
      });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        task,
        'Schedule task created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid UUID')) {
          logger.error('Validation error creating schedule task');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error creating schedule task');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
      }

      logger.error('Error creating schedule task', { error });
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to create schedule task',
      });
    }
  }

  /**
   * 批量创建调度任务
   * @route POST /api/schedules/tasks/batch
   */
  static async createTasksBatch(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleTaskController.extractAccountUuid(req);
      const service = await ScheduleTaskController.getScheduleService();

      logger.info('Creating schedule tasks batch', {
        accountUuid,
        count: req.body.tasks?.length,
      });

      const tasks = await service.createScheduleTasksBatch(
        req.body.tasks.map((task: any) => ({
          accountUuid,
          ...task,
        })),
      );

      logger.info('Schedule tasks created successfully', {
        accountUuid,
        count: tasks.length,
      });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        tasks,
        'Schedule tasks created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error creating schedule tasks');
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Error creating schedule tasks batch', { error });
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to create schedule tasks',
      });
    }
  }

  /**
   * 获取调度任务列表
   * @route GET /api/schedules/tasks
   */
  static async getTasks(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleTaskController.extractAccountUuid(req);
      const service = await ScheduleTaskController.getScheduleService();

      logger.info('Fetching schedule tasks', { accountUuid });

      const tasks = await service.getScheduleTasksByAccount(accountUuid);

      logger.info('Schedule tasks fetched successfully', {
        accountUuid,
        count: tasks.length,
      });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        tasks,
        'Schedule tasks retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error fetching schedule tasks');
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Error fetching schedule tasks', { error });
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to fetch schedule tasks',
      });
    }
  }

  /**
   * 获取调度任务详情
   * @route GET /api/schedules/tasks/:id
   */
  static async getTask(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleTaskController.extractAccountUuid(req);
      const service = await ScheduleTaskController.getScheduleService();
      const { id } = req.params;

      logger.info('Fetching schedule task', { accountUuid, taskUuid: id });

      const task = await service.getScheduleTask(id);

      if (!task) {
        logger.warn('Schedule task not found', { taskUuid: id });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Schedule task not found',
        });
      }

      // 验证任务所有权
      if (task.accountUuid !== accountUuid) {
        logger.warn('Unauthorized schedule task access attempt', {
          accountUuid,
          taskUuid: id,
        });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to access this schedule task',
        });
      }

      logger.info('Schedule task fetched successfully', { taskUuid: id });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        task,
        'Schedule task retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error fetching schedule task');
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Error fetching schedule task', { error });
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to fetch schedule task',
      });
    }
  }

  /**
   * 查找需要执行的任务
   * @route GET /api/schedules/tasks/due
   */
  static async getDueTasks(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleTaskController.extractAccountUuid(req);
      const service = await ScheduleTaskController.getScheduleService();

      logger.info('Fetching due schedule tasks', { accountUuid });

      const beforeTime = req.query.beforeTime
        ? new Date(req.query.beforeTime as string)
        : new Date();
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      const tasks = await service.findDueTasksForExecution(beforeTime, limit);

      // 只返回当前用户的任务
      const userTasks = tasks.filter((task) => task.accountUuid === accountUuid);

      logger.info('Due schedule tasks fetched successfully', {
        accountUuid,
        count: userTasks.length,
      });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        userTasks,
        'Due schedule tasks retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error fetching due schedule tasks');
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Error fetching due schedule tasks', { error });
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to fetch due schedule tasks',
      });
    }
  }

  /**
   * 暂停任务
   * @route POST /api/schedules/tasks/:id/pause
   */
  static async pauseTask(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleTaskController.extractAccountUuid(req);
      const service = await ScheduleTaskController.getScheduleService();
      const { id } = req.params;

      logger.info('Pausing schedule task', { accountUuid, taskUuid: id });

      // 验证任务所有权
      const task = await service.getScheduleTask(id);
      if (!task) {
        logger.warn('Schedule task not found for pause', { taskUuid: id });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Schedule task not found',
        });
      }

      if (task.accountUuid !== accountUuid) {
        logger.warn('Unauthorized schedule task pause attempt', {
          accountUuid,
          taskUuid: id,
        });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to pause this schedule task',
        });
      }

      await service.pauseScheduleTask(id);

      logger.info('Schedule task paused successfully', { taskUuid: id });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        null,
        'Schedule task paused successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error pausing schedule task');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
        if (error.message.includes('not found')) {
          logger.warn('Schedule task not found during pause');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
      }

      logger.error('Error pausing schedule task', { error });
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to pause schedule task',
      });
    }
  }

  /**
   * 恢复任务
   * @route POST /api/schedules/tasks/:id/resume
   */
  static async resumeTask(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleTaskController.extractAccountUuid(req);
      const service = await ScheduleTaskController.getScheduleService();
      const { id } = req.params;

      logger.info('Resuming schedule task', { accountUuid, taskUuid: id });

      // 验证任务所有权
      const task = await service.getScheduleTask(id);
      if (!task) {
        logger.warn('Schedule task not found for resume', { taskUuid: id });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Schedule task not found',
        });
      }

      if (task.accountUuid !== accountUuid) {
        logger.warn('Unauthorized schedule task resume attempt', {
          accountUuid,
          taskUuid: id,
        });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to resume this schedule task',
        });
      }

      await service.resumeScheduleTask(id);

      logger.info('Schedule task resumed successfully', { taskUuid: id });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        null,
        'Schedule task resumed successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error resuming schedule task');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
        if (error.message.includes('not found')) {
          logger.warn('Schedule task not found during resume');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
      }

      logger.error('Error resuming schedule task', { error });
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to resume schedule task',
      });
    }
  }

  /**
   * 完成任务
   * @route POST /api/schedules/tasks/:id/complete
   */
  static async completeTask(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleTaskController.extractAccountUuid(req);
      const service = await ScheduleTaskController.getScheduleService();
      const { id } = req.params;

      logger.info('Completing schedule task', { accountUuid, taskUuid: id });

      // 验证任务所有权
      const task = await service.getScheduleTask(id);
      if (!task) {
        logger.warn('Schedule task not found for complete', { taskUuid: id });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Schedule task not found',
        });
      }

      if (task.accountUuid !== accountUuid) {
        logger.warn('Unauthorized schedule task complete attempt', {
          accountUuid,
          taskUuid: id,
        });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to complete this schedule task',
        });
      }

      await service.completeScheduleTask(id, req.body.reason);

      logger.info('Schedule task completed successfully', { taskUuid: id });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        null,
        'Schedule task completed successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error completing schedule task');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
        if (error.message.includes('not found')) {
          logger.warn('Schedule task not found during complete');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
      }

      logger.error('Error completing schedule task', { error });
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to complete schedule task',
      });
    }
  }

  /**
   * 取消任务
   * @route POST /api/schedules/tasks/:id/cancel
   */
  static async cancelTask(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleTaskController.extractAccountUuid(req);
      const service = await ScheduleTaskController.getScheduleService();
      const { id } = req.params;

      logger.info('Cancelling schedule task', { accountUuid, taskUuid: id });

      // 验证任务所有权
      const task = await service.getScheduleTask(id);
      if (!task) {
        logger.warn('Schedule task not found for cancel', { taskUuid: id });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Schedule task not found',
        });
      }

      if (task.accountUuid !== accountUuid) {
        logger.warn('Unauthorized schedule task cancel attempt', {
          accountUuid,
          taskUuid: id,
        });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to cancel this schedule task',
        });
      }

      await service.cancelScheduleTask(id, req.body.reason);

      logger.info('Schedule task cancelled successfully', { taskUuid: id });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        null,
        'Schedule task cancelled successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error cancelling schedule task');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
        if (error.message.includes('not found')) {
          logger.warn('Schedule task not found during cancel');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
      }

      logger.error('Error cancelling schedule task', { error });
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to cancel schedule task',
      });
    }
  }

  /**
   * 删除任务
   * @route DELETE /api/schedules/tasks/:id
   */
  static async deleteTask(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleTaskController.extractAccountUuid(req);
      const service = await ScheduleTaskController.getScheduleService();
      const { id } = req.params;

      logger.info('Deleting schedule task', { accountUuid, taskUuid: id });

      // 验证任务所有权
      const task = await service.getScheduleTask(id);
      if (!task) {
        logger.warn('Schedule task not found for deletion', { taskUuid: id });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Schedule task not found',
        });
      }

      if (task.accountUuid !== accountUuid) {
        logger.warn('Unauthorized schedule task deletion attempt', {
          accountUuid,
          taskUuid: id,
        });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to delete this schedule task',
        });
      }

      await service.deleteScheduleTask(id);

      logger.info('Schedule task deleted successfully', { taskUuid: id });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        null,
        'Schedule task deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error deleting schedule task');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
        if (error.message.includes('not found')) {
          logger.warn('Schedule task not found during deletion');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
      }

      logger.error('Error deleting schedule task', { error });
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to delete schedule task',
      });
    }
  }

  /**
   * 批量删除任务
   * @route POST /api/schedules/tasks/batch/delete
   */
  static async deleteTasksBatch(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleTaskController.extractAccountUuid(req);
      const service = await ScheduleTaskController.getScheduleService();

      logger.info('Batch deleting schedule tasks', {
        accountUuid,
        count: req.body.taskUuids?.length,
      });

      // 验证所有任务的所有权
      for (const taskUuid of req.body.taskUuids) {
        const task = await service.getScheduleTask(taskUuid);
        if (task && task.accountUuid !== accountUuid) {
          logger.warn('Unauthorized batch deletion attempt', {
            accountUuid,
            taskUuid,
          });
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.FORBIDDEN,
            message: 'You do not have permission to delete one or more tasks',
          });
        }
      }

      await service.deleteScheduleTasksBatch(req.body.taskUuids);

      logger.info('Schedule tasks deleted successfully', {
        accountUuid,
        count: req.body.taskUuids?.length,
      });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        null,
        'Schedule tasks deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error batch deleting schedule tasks');
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Error batch deleting schedule tasks', { error });
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to delete schedule tasks',
      });
    }
  }

  /**
   * 更新任务元数据
   * @route PATCH /api/schedules/tasks/:id/metadata
   */
  static async updateTaskMetadata(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleTaskController.extractAccountUuid(req);
      const service = await ScheduleTaskController.getScheduleService();
      const { id } = req.params;

      logger.info('Updating schedule task metadata', { accountUuid, taskUuid: id });

      // 验证任务所有权
      const task = await service.getScheduleTask(id);
      if (!task) {
        logger.warn('Schedule task not found for metadata update', { taskUuid: id });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Schedule task not found',
        });
      }

      if (task.accountUuid !== accountUuid) {
        logger.warn('Unauthorized schedule task metadata update attempt', {
          accountUuid,
          taskUuid: id,
        });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to update this schedule task',
        });
      }

      await service.updateTaskMetadata(id, {
        payload: req.body.payload,
        tagsToAdd: req.body.tagsToAdd,
        tagsToRemove: req.body.tagsToRemove,
      });

      logger.info('Schedule task metadata updated successfully', { taskUuid: id });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        null,
        'Schedule task metadata updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error updating schedule task metadata');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
        if (error.message.includes('not found')) {
          logger.warn('Schedule task not found during metadata update');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
      }

      logger.error('Error updating schedule task metadata', { error });
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to update schedule task metadata',
      });
    }
  }

  /**
   * 获取任务执行历史记录
   * GET /api/v1/schedules/tasks/:id/executions
   */
  static async getTaskExecutions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      logger.info('Getting task execution history', { taskUuid: id, limit });

      // 验证认证
      const accountUuid = ScheduleTaskController.extractAccountUuid(req);
      const service = await ScheduleTaskController.getScheduleService();

      // 验证任务所有权
      const task = await service.getScheduleTask(id);

      if (!task) {
        logger.warn('Schedule task not found for executions', { taskUuid: id });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Schedule task not found',
        });
      }

      if (task.accountUuid !== accountUuid) {
        logger.warn('Unauthorized schedule task executions access attempt', {
          accountUuid,
          taskUuid: id,
        });
        return ScheduleTaskController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to view this schedule task executions',
        });
      }

      // 获取执行历史
      const monitor = ScheduleTaskController.getScheduleMonitor();
      const allHistory = monitor.getExecutionHistory(1000); // 获取更多历史记录
      
      // 过滤当前任务的执行记录
      const taskHistory = allHistory
        .filter((record) => record.taskUuid === id)
        .slice(0, limit)
        .map((record) => ({
          uuid: `${record.taskUuid}-${record.startTime.getTime()}`,
          executionTime: record.startTime.getTime(),
          status: record.endTime 
            ? record.error 
              ? 'failed' 
              : 'success'
            : 'running',
          duration: record.endTime 
            ? record.endTime.getTime() - record.startTime.getTime()
            : null,
          errorMessage: record.error?.message || null,
        }));

      logger.info('Task execution history retrieved successfully', {
        taskUuid: id,
        count: taskHistory.length,
      });

      return ScheduleTaskController.responseBuilder.sendSuccess(
        res,
        taskHistory,
        'Task execution history retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error getting task executions');
          return ScheduleTaskController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
      }

      logger.error('Error getting task executions', { error });
      return ScheduleTaskController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to get task executions',
      });
    }
  }
}
