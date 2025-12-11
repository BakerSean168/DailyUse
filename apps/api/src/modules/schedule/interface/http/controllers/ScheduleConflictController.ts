import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { ResponseCode, createResponseBuilder } from '@dailyuse/contracts/response';
import type { ScheduleServerDTO } from '@dailyuse/contracts/schedule';
import { ResolutionStrategy } from '@dailyuse/contracts/schedule';
import { Schedule as DomainSchedule } from '@dailyuse/domain-server/schedule';
import { createLogger } from '@dailyuse/utils';
import { ScheduleConflictDetectionService } from '../../../application/services/ScheduleConflictDetectionService';
import { ScheduleContainer } from '../../../infrastructure/di/ScheduleContainer';

const logger = createLogger('ScheduleConflictController');

// ============ Zod Validation Schemas ============

const detectConflictsSchema = z
  .object({
    userId: z.string().uuid('Invalid userId: must be a valid UUID'),
    startTime: z.number().int().positive('Start time must be a positive integer'),
    endTime: z.number().int().positive('End time must be a positive integer'),
    excludeUuid: z.string().uuid().optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Start time must be before end time',
    path: ['startTime'],
  });

const createScheduleSchema = z
  .object({
    accountUuid: z.string().uuid('Invalid accountUuid: must be a valid UUID'),
    title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
    description: z.string().max(500, 'Description must be 500 characters or less').optional(),
    startTime: z.number().int().positive('Start time must be a positive integer'),
    endTime: z.number().int().positive('End time must be a positive integer'),
    duration: z.number().int().positive('Duration must be a positive integer'),
    priority: z.number().int().min(1).max(5).optional(),
    location: z.string().optional(),
    attendees: z.array(z.string()).optional(),
    autoDetectConflicts: z.boolean().optional().default(true),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Start time must be before end time',
    path: ['startTime'],
  })
  .refine((data) => data.duration === Math.floor((data.endTime - data.startTime) / 60000), {
    message: 'Duration must match the time range (endTime - startTime) / 60000',
    path: ['duration'],
  });

const resolutionStrategyEnum = z.enum(['RESCHEDULE', 'CANCEL', 'ADJUST_DURATION', 'IGNORE']);

const resolveConflictSchema = z
  .object({
    resolution: resolutionStrategyEnum,
    newStartTime: z.number().int().positive().optional(),
    newEndTime: z.number().int().positive().optional(),
    newDuration: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      if (data.resolution === 'RESCHEDULE') {
        return data.newStartTime !== undefined && data.newEndTime !== undefined;
      }
      if (data.resolution === 'ADJUST_DURATION') {
        return data.newDuration !== undefined;
      }
      return true;
    },
    { message: 'Invalid resolution parameters for strategy' }
  );

export class ScheduleConflictController {
  private static conflictService: ScheduleConflictDetectionService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * Lazy-load ApplicationService (singleton pattern)
   */
  private static getConflictService(): ScheduleConflictDetectionService {
    if (!ScheduleConflictController.conflictService) {
      const container = ScheduleContainer.getInstance();
      const repository = container.getScheduleRepository();
      ScheduleConflictController.conflictService = new ScheduleConflictDetectionService(repository);
    }
    return ScheduleConflictController.conflictService;
  }

  /**
   * Extract accountUuid from JWT token
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
   * Convert Domain Schedule to Client DTO
   */
  private static scheduleToClientDTO(schedule: DomainSchedule): any {
    const serverDto = schedule.toServerDTO();
    return {
      uuid: serverDto.uuid,
      accountUuid: serverDto.accountUuid,
      title: serverDto.title,
      description: serverDto.description || null,
      startTime: serverDto.startTime,
      endTime: serverDto.endTime,
      duration: serverDto.duration,
      hasConflict: serverDto.hasConflict,
      conflictingSchedules: serverDto.conflictingSchedules || null,
      priority: serverDto.priority || null,
      location: serverDto.location || null,
      attendees: serverDto.attendees || null,
      createdAt: serverDto.createdAt,
      updatedAt: serverDto.updatedAt,
    };
  }

  /**
   * POST /api/v1/schedules/detect-conflicts
   * Detect schedule conflicts for a given time range
   */
  static async detectConflicts(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('Detecting conflicts', { body: req.body });

      // Step 1: Validate input
      const validatedData = detectConflictsSchema.parse(req.body);

      // Step 2: Create a temporary schedule DTO for conflict detection
      const tempScheduleDto: ScheduleServerDTO = {
        uuid: validatedData.excludeUuid || 'temp-uuid',
        accountUuid: validatedData.userId,
        title: 'Temporary Schedule',
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        duration: Math.floor((validatedData.endTime - validatedData.startTime) / 60000),
        hasConflict: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Step 3: Call ApplicationService
      const service = ScheduleConflictController.getConflictService();
      const result = await service.detectConflictsForSchedule(tempScheduleDto);

      logger.info('Conflict detection completed', {
        hasConflict: result.hasConflict,
        conflictCount: result.conflicts.length,
      });

      // Step 4: Return success response
      return ScheduleConflictController.responseBuilder.sendSuccess(
        res,
        { result },
        'Conflict detection completed',
        200
      );
    } catch (error) {
      // Step 5: Handle errors
      if (error instanceof z.ZodError) {
        logger.warn('Validation error detecting conflicts', { errors: error.issues });
        return ScheduleConflictController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
            field: err.path.join('.'),
            code: 'VALIDATION_ERROR',
            message: err.message,
          })),
        });
      }

      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error detecting conflicts');
        return ScheduleConflictController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Error detecting conflicts', { error });
      return ScheduleConflictController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to detect conflicts',
      });
    }
  }

  /**
   * POST /api/v1/schedules
   * Create a new schedule with automatic conflict detection
   */
  static async createSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleConflictController.extractAccountUuid(req);
      logger.info('Creating schedule', { accountUuid, title: req.body.title });

      // Step 1: Validate input
      const validatedData = createScheduleSchema.parse(req.body);

      // Step 2: Verify accountUuid matches JWT token
      if (validatedData.accountUuid !== accountUuid) {
        logger.warn('AccountUuid mismatch', {
          tokenAccountUuid: accountUuid,
          bodyAccountUuid: validatedData.accountUuid,
        });
        return ScheduleConflictController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'AccountUuid in request body must match authenticated user',
        });
      }

      // Step 3: Create schedule aggregate
      const container = ScheduleContainer.getInstance();
      const repository = container.getScheduleRepository();

      const scheduleDto: ScheduleServerDTO = {
        uuid: '', // Will be generated by Domain
        accountUuid: validatedData.accountUuid,
        title: validatedData.title,
        description: validatedData.description,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        duration: validatedData.duration,
        hasConflict: false,
        conflictingSchedules: [],
        priority: validatedData.priority,
        location: validatedData.location,
        attendees: validatedData.attendees ? [...validatedData.attendees] : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const schedule = DomainSchedule.create({
        accountUuid: validatedData.accountUuid,
        title: validatedData.title,
        description: validatedData.description,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        priority: validatedData.priority,
        location: validatedData.location,
        attendees: validatedData.attendees,
      });

      // Step 4: Check for duplicate UUID (edge case)
      const existing = await repository.findByUuid(schedule.uuid);
      if (existing) {
        logger.warn('Schedule UUID already exists', { uuid: schedule.uuid });
        return ScheduleConflictController.responseBuilder.sendError(res, {
          code: ResponseCode.CONFLICT,
          message: 'Schedule with this UUID already exists',
        });
      }

      // Step 5: Optionally detect conflicts before saving
      let conflicts = undefined;
      if (validatedData.autoDetectConflicts) {
        const service = ScheduleConflictController.getConflictService();
        conflicts = await service.detectConflictsForSchedule(schedule.toServerDTO());

        // Update schedule with conflict information
        if (conflicts.hasConflict) {
          const conflictingUuids = conflicts.conflicts.map((c) => c.scheduleUuid);
          schedule.markAsConflicting(conflictingUuids);
        }
      }

      // Step 6: Save schedule
      await repository.save(schedule);

      logger.info('Schedule created successfully', {
        uuid: schedule.uuid,
        hasConflict: schedule.hasConflict,
      });

      // Step 7: Return response
      return ScheduleConflictController.responseBuilder.sendSuccess(
        res,
        {
          schedule: ScheduleConflictController.scheduleToClientDTO(schedule),
          conflicts,
        },
        'Schedule created successfully',
        201
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error creating schedule', { errors: error.issues });
        return ScheduleConflictController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
            field: err.path.join('.'),
            code: 'VALIDATION_ERROR',
            message: err.message,
          })),
        });
      }

      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error creating schedule');
          return ScheduleConflictController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        // Database errors (e.g., unique constraint violation)
        if (error.message.includes('Unique constraint')) {
          logger.error('Duplicate schedule error', { error });
          return ScheduleConflictController.responseBuilder.sendError(res, {
            code: ResponseCode.CONFLICT,
            message: 'Schedule already exists',
          });
        }
      }

      logger.error('Error creating schedule', { error });
      return ScheduleConflictController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to create schedule',
      });
    }
  }

  /**
   * POST /api/v1/schedules/:id/resolve-conflict
   * Resolve a schedule conflict by applying a resolution strategy
   */
  static async resolveConflict(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = ScheduleConflictController.extractAccountUuid(req);
      const scheduleUuid = req.params.id;

      logger.info('Resolving conflict', { accountUuid, scheduleUuid, resolution: req.body.resolution });

      // Step 1: Validate input
      const validatedData = resolveConflictSchema.parse(req.body);

      // Step 2: Find the schedule
      const container = ScheduleContainer.getInstance();
      const repository = container.getScheduleRepository();
      const schedule = await repository.findByUuid(scheduleUuid);

      if (!schedule) {
        logger.warn('Schedule not found', { scheduleUuid });
        return ScheduleConflictController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Schedule not found',
        });
      }

      // Step 3: Verify ownership
      if (schedule.accountUuid !== accountUuid) {
        logger.warn('Unauthorized schedule access', { scheduleUuid, accountUuid });
        return ScheduleConflictController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'You do not have permission to modify this schedule',
        });
      }

      // Step 4: Store previous values for response
      const previousStartTime = schedule.startTime;
      const previousEndTime = schedule.endTime;
      const changes: string[] = [];

      // Step 5: Apply resolution strategy
      switch (validatedData.resolution) {
        case 'RESCHEDULE':
          if (!validatedData.newStartTime || !validatedData.newEndTime) {
            throw new Error('newStartTime and newEndTime are required for RESCHEDULE strategy');
          }
          schedule.reschedule(validatedData.newStartTime, validatedData.newEndTime);
          changes.push(
            `Rescheduled from ${new Date(previousStartTime).toLocaleString()} to ${new Date(validatedData.newStartTime).toLocaleString()}`
          );
          break;

        case 'CANCEL':
          await repository.deleteByUuid(scheduleUuid);
          logger.info('Schedule deleted (CANCEL strategy)', { scheduleUuid });
          return ScheduleConflictController.responseBuilder.sendSuccess(
            res,
            {
              schedule: null,
              conflicts: {
                hasConflicts: false,
                conflictCount: 0,
                conflicts: [],
                suggestions: [],
              },
              applied: {
                strategy: 'CANCEL',
                previousStartTime,
                previousEndTime,
                changes: ['Schedule deleted'],
              },
            },
            'Conflict resolved by canceling schedule',
            200
          );

        case 'ADJUST_DURATION':
          if (!validatedData.newDuration) {
            throw new Error('newDuration is required for ADJUST_DURATION strategy');
          }
          const newEndTime = schedule.startTime + validatedData.newDuration * 60000;
          schedule.reschedule(schedule.startTime, newEndTime);
          changes.push(`Adjusted duration to ${validatedData.newDuration} minutes`);
          break;

        case 'IGNORE':
          schedule.clearConflicts();
          changes.push('Marked as no conflict (manual override)');
          break;

        default:
          throw new Error('Invalid resolution strategy');
      }

      // Step 6: Re-detect conflicts after resolution (except for IGNORE)
      const service = ScheduleConflictController.getConflictService();
      const conflicts = await service.detectConflictsForSchedule(schedule.toServerDTO());

      // Update schedule with new conflict information
      if (conflicts.hasConflict && validatedData.resolution !== 'IGNORE') {
        const conflictingUuids = conflicts.conflicts.map((c) => c.scheduleUuid);
        schedule.markAsConflicting(conflictingUuids);
      } else if (!conflicts.hasConflict) {
        schedule.clearConflicts();
      }

      // Step 7: Save updated schedule
      await repository.save(schedule);

      logger.info('Conflict resolved successfully', {
        scheduleUuid,
        strategy: validatedData.resolution,
        hasConflict: conflicts.hasConflict,
      });

      // Step 8: Return response
      return ScheduleConflictController.responseBuilder.sendSuccess(
        res,
        {
          schedule: ScheduleConflictController.scheduleToClientDTO(schedule),
          conflicts,
          applied: {
            strategy: validatedData.resolution,
            previousStartTime,
            previousEndTime,
            changes,
          },
        },
        'Conflict resolved successfully',
        200
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error resolving conflict', { errors: error.issues });
        return ScheduleConflictController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
            field: err.path.join('.'),
            code: 'VALIDATION_ERROR',
            message: err.message,
          })),
        });
      }

      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error resolving conflict');
        return ScheduleConflictController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Error resolving conflict', { error });
      return ScheduleConflictController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to resolve conflict',
      });
    }
  }
}
