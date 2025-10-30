import type { Request, Response } from 'express';
import { z } from 'zod';
import { ResponseCode, createResponseBuilder } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import { ScheduleEventApplicationService } from '../../../application/services/ScheduleEventApplicationService';

const logger = createLogger('ScheduleEventController');

// ============ Zod Validation Schemas ============

const createScheduleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  startTime: z.number().int().positive(),
  endTime: z.number().int().positive(),
  priority: z.number().int().min(1).max(5).optional(),
  location: z.string().max(200).optional(),
  attendees: z.array(z.string()).max(50).optional(),
});

const updateScheduleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  startTime: z.number().int().positive().optional(),
  endTime: z.number().int().positive().optional(),
  priority: z.number().int().min(1).max(5).optional(),
  location: z.string().max(200).optional(),
  attendees: z.array(z.string()).max(50).optional(),
});

const getTimeRangeQuerySchema = z.object({
  startTime: z.string().regex(/^\d+$/).transform(Number),
  endTime: z.string().regex(/^\d+$/).transform(Number),
});

// ============ Controller ============

/**
 * Schedule Event Controller
 * 处理日程事件 CRUD 的 HTTP 请求
 * 
 * Story 4-1: Schedule Event CRUD
 */
export class ScheduleEventController {
  private static service: ScheduleEventApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * Lazy-load ApplicationService (singleton pattern)
   */
  private static getService(): ScheduleEventApplicationService {
    if (!ScheduleEventController.service) {
      ScheduleEventController.service = ScheduleEventApplicationService.getInstance();
    }
    return ScheduleEventController.service;
  }

  /**
   * Extract accountUuid from authenticated request
   */
  private static extractAccountUuid(req: Request): string {
    const user = (req as any).user;
    if (!user || !user.accountUuid) {
      throw new Error('User not authenticated or accountUuid missing');
    }
    return user.accountUuid;
  }

  /**
   * POST /api/v1/schedules/events
   * 创建日程事件
   */
  static async createSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleEventController.extractAccountUuid(req);

      // 验证请求体
      const validation = createScheduleSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('Invalid create schedule request', {
          errors: validation.error.errors,
        });
        return res
          .status(400)
          .json(
            ScheduleEventController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'Invalid request data',
              validation.error.errors,
            ),
          );
      }

      const data = validation.data;

      // 调用应用服务
      const service = ScheduleEventController.getService();
      const schedule = await service.createSchedule({
        accountUuid,
        ...data,
      });

      logger.info('Schedule created via API', {
        uuid: schedule.uuid,
        accountUuid,
      });

      return res
        .status(201)
        .json(
          ScheduleEventController.responseBuilder.success(
            ResponseCode.SUCCESS,
            schedule,
            'Schedule created successfully',
          ),
        );
    } catch (error) {
      logger.error('Failed to create schedule', error);
      return res
        .status(500)
        .json(
          ScheduleEventController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * GET /api/v1/schedules/events/:uuid
   * 获取日程事件详情
   */
  static async getSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleEventController.extractAccountUuid(req);
      const { uuid } = req.params;

      if (!uuid) {
        return res
          .status(400)
          .json(
            ScheduleEventController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'Schedule UUID is required',
            ),
          );
      }

      // 调用应用服务
      const service = ScheduleEventController.getService();
      const schedule = await service.getSchedule(uuid);

      if (!schedule) {
        return res
          .status(404)
          .json(
            ScheduleEventController.responseBuilder.error(
              ResponseCode.NOT_FOUND,
              'Schedule not found',
            ),
          );
      }

      // 验证所有权
      if (schedule.accountUuid !== accountUuid) {
        return res
          .status(403)
          .json(
            ScheduleEventController.responseBuilder.error(
              ResponseCode.FORBIDDEN,
              'You do not have permission to access this schedule',
            ),
          );
      }

      return res
        .status(200)
        .json(
          ScheduleEventController.responseBuilder.success(
            ResponseCode.SUCCESS,
            schedule,
          ),
        );
    } catch (error) {
      logger.error('Failed to get schedule', error);
      return res
        .status(500)
        .json(
          ScheduleEventController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * GET /api/v1/schedules/events
   * 获取账户的所有日程事件
   */
  static async getSchedulesByAccount(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleEventController.extractAccountUuid(req);

      // 检查是否有时间范围查询参数
      const queryValidation = getTimeRangeQuerySchema.safeParse(req.query);

      const service = ScheduleEventController.getService();
      let schedules;

      if (queryValidation.success) {
        // 按时间范围查询
        const { startTime, endTime } = queryValidation.data;
        schedules = await service.getSchedulesByTimeRange(accountUuid, startTime, endTime);
      } else {
        // 查询所有
        schedules = await service.getSchedulesByAccount(accountUuid);
      }

      return res
        .status(200)
        .json(
          ScheduleEventController.responseBuilder.success(
            ResponseCode.SUCCESS,
            schedules,
          ),
        );
    } catch (error) {
      logger.error('Failed to get schedules', error);
      return res
        .status(500)
        .json(
          ScheduleEventController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * PATCH /api/v1/schedules/events/:uuid
   * 更新日程事件
   */
  static async updateSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleEventController.extractAccountUuid(req);
      const { uuid } = req.params;

      if (!uuid) {
        return res
          .status(400)
          .json(
            ScheduleEventController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'Schedule UUID is required',
            ),
          );
      }

      // 验证所有权
      const service = ScheduleEventController.getService();
      const existingSchedule = await service.getSchedule(uuid);

      if (!existingSchedule) {
        return res
          .status(404)
          .json(
            ScheduleEventController.responseBuilder.error(
              ResponseCode.NOT_FOUND,
              'Schedule not found',
            ),
          );
      }

      if (existingSchedule.accountUuid !== accountUuid) {
        return res
          .status(403)
          .json(
            ScheduleEventController.responseBuilder.error(
              ResponseCode.FORBIDDEN,
              'You do not have permission to update this schedule',
            ),
          );
      }

      // 验证请求体
      const validation = updateScheduleSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('Invalid update schedule request', {
          errors: validation.error.errors,
        });
        return res
          .status(400)
          .json(
            ScheduleEventController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'Invalid request data',
              validation.error.errors,
            ),
          );
      }

      // 调用应用服务
      const updatedSchedule = await service.updateSchedule(uuid, validation.data);

      logger.info('Schedule updated via API', { uuid, accountUuid });

      return res
        .status(200)
        .json(
          ScheduleEventController.responseBuilder.success(
            ResponseCode.SUCCESS,
            updatedSchedule,
            'Schedule updated successfully',
          ),
        );
    } catch (error) {
      logger.error('Failed to update schedule', error);
      return res
        .status(500)
        .json(
          ScheduleEventController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * DELETE /api/v1/schedules/events/:uuid
   * 删除日程事件
   */
  static async deleteSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleEventController.extractAccountUuid(req);
      const { uuid } = req.params;

      if (!uuid) {
        return res
          .status(400)
          .json(
            ScheduleEventController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'Schedule UUID is required',
            ),
          );
      }

      // 验证所有权
      const service = ScheduleEventController.getService();
      const existingSchedule = await service.getSchedule(uuid);

      if (!existingSchedule) {
        return res
          .status(404)
          .json(
            ScheduleEventController.responseBuilder.error(
              ResponseCode.NOT_FOUND,
              'Schedule not found',
            ),
          );
      }

      if (existingSchedule.accountUuid !== accountUuid) {
        return res
          .status(403)
          .json(
            ScheduleEventController.responseBuilder.error(
              ResponseCode.FORBIDDEN,
              'You do not have permission to delete this schedule',
            ),
          );
      }

      // 调用应用服务
      await service.deleteSchedule(uuid);

      logger.info('Schedule deleted via API', { uuid, accountUuid });

      return res
        .status(200)
        .json(
          ScheduleEventController.responseBuilder.success(
            ResponseCode.SUCCESS,
            null,
            'Schedule deleted successfully',
          ),
        );
    } catch (error) {
      logger.error('Failed to delete schedule', error);
      return res
        .status(500)
        .json(
          ScheduleEventController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * 获取日程冲突详情
   * GET /api/v1/schedules/events/:uuid/conflicts
   * 
   * Story 4-3: Schedule Conflict Detection Integration
   */
  static async getConflicts(req: Request, res: Response): Promise<Response> {
    try {
      const { uuid } = req.params;
      const accountUuid = ScheduleEventController.extractAccountUuid(req);

      logger.info('Getting schedule conflicts via API', { uuid, accountUuid });

      // 验证日程存在且属于当前用户
      const service = ScheduleEventController.getService();
      const schedule = await service.getSchedule(uuid);

      if (!schedule) {
        return res
          .status(404)
          .json(
            ScheduleEventController.responseBuilder.error(
              ResponseCode.NOT_FOUND,
              'Schedule not found',
            ),
          );
      }

      if (schedule.accountUuid !== accountUuid) {
        return res
          .status(403)
          .json(
            ScheduleEventController.responseBuilder.error(
              ResponseCode.FORBIDDEN,
              'You do not have permission to access this schedule',
            ),
          );
      }

      // 获取冲突详情
      const conflictResult = await service.getScheduleConflicts(uuid);

      if (!conflictResult) {
        return res
          .status(404)
          .json(
            ScheduleEventController.responseBuilder.error(
              ResponseCode.NOT_FOUND,
              'Schedule not found',
            ),
          );
      }

      logger.info('Schedule conflicts retrieved', { 
        uuid, 
        hasConflict: conflictResult.hasConflict,
        conflictCount: conflictResult.conflicts.length,
      });

      return res
        .status(200)
        .json(
          ScheduleEventController.responseBuilder.success(
            ResponseCode.SUCCESS,
            conflictResult,
            'Conflict details retrieved successfully',
          ),
        );
    } catch (error) {
      logger.error('Failed to get schedule conflicts', error);
      return res
        .status(500)
        .json(
          ScheduleEventController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }
}
