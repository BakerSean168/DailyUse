import { eventBus, type DomainEvent, Logger } from '@dailyuse/utils';
import type { ReminderTemplateServerDTO, ReminderGroupServerDTO } from '@dailyuse/contracts/reminder';
import { ReminderContainer } from '../../infrastructure/di/ReminderContainer';

const logger = new Logger('ReminderEventHandler');

type ReminderTemplateAction =
  | 'template-created'
  | 'template-updated'
  | 'template-enabled'
  | 'template-paused'
  | 'template-deleted'
  | 'template-moved';

type ReminderGroupAction =
  | 'group-created'
  | 'group-updated'
  | 'group-enabled'
  | 'group-paused'
  | 'group-control-mode-changed'
  | 'group-deleted';

type ReminderTemplateRefreshPayload = {
  templateUuid: string;
  reason: ReminderTemplateAction;
  action: ReminderTemplateAction;
  timestamp: number;
  payload?: Record<string, unknown>;
  template?: ReminderTemplateServerDTO;
};

type ReminderGroupRefreshPayload = {
  groupUuid: string;
  reason: ReminderGroupAction;
  action: ReminderGroupAction;
  timestamp: number;
  payload?: Record<string, unknown>;
  group?: ReminderGroupServerDTO;
};

type SSEManager = import('../../../notification/interface/http/sseRoutes').SSEConnectionManager;

export class ReminderEventHandler {
  private static isInitialized = false;
  private static sseManagerPromise: Promise<SSEManager> | null = null;

  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ [ReminderEventHandler] Already initialized, skipping');
      return;
    }

    console.log('🎧 [ReminderEventHandler] Initializing reminder event listeners...');

    eventBus.on('reminder.template.created', async (event: DomainEvent) => {
      await this.handleTemplateEvent(event, 'template-created', {
        includeSnapshotFromEvent: true,
      });
      
      // 🔥 创建 ScheduleTask
      await this.createScheduleTaskForReminder(event);
    });

    eventBus.on('reminder.template.updated', async (event: DomainEvent) => {
      await this.handleTemplateEvent(event, 'template-updated');
    });

    eventBus.on('reminder.template.enabled', async (event: DomainEvent) => {
      await this.handleTemplateEvent(event, 'template-enabled');
      
      // 🔥 启用对应的 ScheduleTask
      await this.enableScheduleTaskForReminder(event);
    });

    eventBus.on('reminder.template.paused', async (event: DomainEvent) => {
      await this.handleTemplateEvent(event, 'template-paused');
      
      // 🔥 暂停对应的 ScheduleTask
      await this.disableScheduleTaskForReminder(event);
    });

    eventBus.on('reminder.template.deleted', async (event: DomainEvent) => {
      await this.handleTemplateEvent(event, 'template-deleted', {
        skipSnapshot: true,
      });
      
      // 🔥 删除对应的 ScheduleTask
      await this.deleteScheduleTaskForReminder(event);
    });

    eventBus.on('reminder.template.moved', async (event: DomainEvent) => {
      await this.handleTemplateEvent(event, 'template-moved');
    });

    eventBus.on('ReminderGroupCreated', async (event: DomainEvent) => {
      await this.handleGroupEvent(event, 'group-created');
    });

    eventBus.on('ReminderGroupEnabled', async (event: DomainEvent) => {
      await this.handleGroupEvent(event, 'group-enabled');
    });

    eventBus.on('ReminderGroupPaused', async (event: DomainEvent) => {
      await this.handleGroupEvent(event, 'group-paused');
    });

    eventBus.on('ReminderGroupControlModeSwitched', async (event: DomainEvent) => {
      await this.handleGroupEvent(event, 'group-control-mode-changed');
    });

    eventBus.on('ReminderGroupDeleted', async (event: DomainEvent) => {
      await this.handleGroupEvent(event, 'group-deleted', { skipSnapshot: true });
    });

    this.isInitialized = true;
    console.log('✅ [ReminderEventHandler] Reminder event listeners initialized');
  }

  private static async handleTemplateEvent(
    event: DomainEvent,
    action: ReminderTemplateAction,
    options?: { includeSnapshotFromEvent?: boolean; skipSnapshot?: boolean },
  ): Promise<void> {
    if (!event.accountUuid) {
      logger.warn(`[ReminderEventHandler] Missing accountUuid for ${action}`, {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
      });
      return;
    }

    const rawPayload =
      typeof event.payload === 'object' && event.payload !== null
        ? (event.payload as Record<string, unknown>)
        : undefined;

    const payload: ReminderTemplateRefreshPayload = {
      templateUuid: event.aggregateId,
      reason: action,
      action,
      timestamp: Date.now(),
      payload: rawPayload,
    };

    if (!options?.skipSnapshot) {
      let templateSnapshot: ReminderTemplateServerDTO | undefined;

      if (options?.includeSnapshotFromEvent) {
        templateSnapshot = rawPayload?.reminder as
          | ReminderTemplateServerDTO
          | undefined;
      }

      if (!templateSnapshot) {
        templateSnapshot = await this.fetchTemplateSnapshot(event.aggregateId);
      }

      if (templateSnapshot) {
        payload.template = templateSnapshot;
      }
    }

    await this.emitSse(event.accountUuid, 'reminder:template:refresh', payload);
  }

  private static async handleGroupEvent(
    event: DomainEvent,
    action: ReminderGroupAction,
    options?: { skipSnapshot?: boolean },
  ): Promise<void> {
    if (!event.accountUuid) {
      logger.warn(`[ReminderEventHandler] Missing accountUuid for ${action}`, {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
      });
      return;
    }

    const rawPayload =
      typeof event.payload === 'object' && event.payload !== null
        ? (event.payload as Record<string, unknown>)
        : undefined;

    const payload: ReminderGroupRefreshPayload = {
      groupUuid: event.aggregateId,
      reason: action,
      action,
      timestamp: Date.now(),
      payload: rawPayload,
    };

    if (!options?.skipSnapshot) {
      const groupSnapshot = await this.fetchGroupSnapshot(event.aggregateId);
      if (groupSnapshot) {
        payload.group = groupSnapshot;
      }
    }

    await this.emitSse(event.accountUuid, 'reminder:group:refresh', payload);
  }

  private static async fetchTemplateSnapshot(
    uuid: string,
  ): Promise<ReminderTemplateServerDTO | undefined> {
    try {
      const repo = ReminderContainer.getInstance().getReminderTemplateRepository() as any;
      const template = typeof repo.findByUuid === 'function' ? await repo.findByUuid(uuid) : await repo.findById(uuid);
      return template?.toServerDTO();
    } catch (error) {
      logger.error('[ReminderEventHandler] Failed to fetch template snapshot', { uuid, error });
      return undefined;
    }
  }

  private static async fetchGroupSnapshot(
    uuid: string,
  ): Promise<ReminderGroupServerDTO | undefined> {
    try {
      const repo = ReminderContainer.getInstance().getReminderGroupRepository() as any;
      let group = null;

      if (typeof repo.findByUuid === 'function') {
        group = await repo.findByUuid(uuid);
      } else if (typeof repo.findById === 'function') {
        group = await repo.findById(uuid);
      }

      return group?.toServerDTO();
    } catch (error) {
      logger.error('[ReminderEventHandler] Failed to fetch group snapshot', { uuid, error });
      return undefined;
    }
  }

  private static async emitSse(accountUuid: string, eventName: string, data: any): Promise<void> {
    try {
      const sseManager = await this.getSseManager();
      const sent = sseManager.sendMessage(accountUuid, eventName, data);

      if (!sent) {
        logger.warn('[ReminderEventHandler] SSE message not delivered (no active connection)', {
          accountUuid,
          eventName,
        });
      }
    } catch (error) {
      logger.error('[ReminderEventHandler] Failed to emit SSE message', {
        accountUuid,
        eventName,
        error,
      });
    }
  }

  private static async getSseManager(): Promise<SSEManager> {
    if (!this.sseManagerPromise) {
      this.sseManagerPromise = import('../../../notification/interface/http/sseRoutes').then(
        ({ SSEConnectionManager }) => SSEConnectionManager.getInstance(),
      );
    }
    return this.sseManagerPromise;
  }

  /**
   * 为 ReminderTemplate 创建 ScheduleTask
   */
  private static async createScheduleTaskForReminder(event: DomainEvent): Promise<void> {
    const { accountUuid, payload } = event as any;
    
    if (!accountUuid) {
      logger.error('[ReminderEventHandler] Missing accountUuid in reminder.template.created event');
      return;
    }

    const rawPayload =
      typeof payload === 'object' && payload !== null
        ? (payload as Record<string, unknown>)
        : undefined;

    const reminder = rawPayload?.reminder as ReminderTemplateServerDTO | undefined;
    
    if (!reminder) {
      logger.error('[ReminderEventHandler] Missing reminder in event payload');
      return;
    }

    logger.info('📝 [ReminderEventHandler] Creating ScheduleTask for reminder', {
      accountUuid,
      reminderUuid: reminder.uuid,
      reminderTitle: reminder.title,
      selfEnabled: reminder.selfEnabled,
      status: reminder.status,
    });

    try {
      const { ScheduleTaskFactory } = await import('@dailyuse/domain-server');
      const { SourceModule } = await import('@dailyuse/contracts/schedule');
      const { ScheduleContainer } = await import('../../../schedule/infrastructure/di/ScheduleContainer');
      
      // 创建 ScheduleTaskFactory
      const factory = new ScheduleTaskFactory();
      
      // 使用 ReminderScheduleStrategy 创建 ScheduleTask
      const scheduleTask = factory.createFromSourceEntity({
        accountUuid,
        sourceModule: SourceModule.REMINDER,
        sourceEntityId: reminder.uuid,
        sourceEntity: reminder, // 使用 ServerDTO
      });
      
      // 保存到仓储
      const container = ScheduleContainer.getInstance();
      const repository = container.getScheduleTaskRepository();
      await repository.save(scheduleTask);
      
      logger.info(`✅ [ReminderEventHandler] 为提醒 "${reminder.title}" 创建了 ScheduleTask`, {
        scheduleTaskUuid: scheduleTask.uuid,
        reminderUuid: reminder.uuid,
        accountUuid,
      });
    } catch (error: any) {
      // 如果是"不需要调度"错误，不报错
      if (error?.name === 'SourceEntityNoScheduleRequiredError') {
        logger.info(`ℹ️  [ReminderEventHandler] 提醒 "${reminder.title}" 不需要创建 ScheduleTask（未启用或不满足条件）`);
        return;
      }
      
      logger.error(
        `❌ [ReminderEventHandler] 为提醒 "${reminder.title}" 创建 ScheduleTask 失败`,
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          reminderUuid: reminder.uuid,
          accountUuid,
        }
      );
      // 不抛出错误，ScheduleTask 创建失败不影响 ReminderTemplate 创建
    }
  }

  /**
   * 启用 Reminder 对应的 ScheduleTask
   */
  private static async enableScheduleTaskForReminder(event: DomainEvent): Promise<void> {
    const reminderUuid = event.aggregateId;
    
    try {
      const { ScheduleContainer } = await import('../../../schedule/infrastructure/di/ScheduleContainer');
      const { SourceModule } = await import('@dailyuse/contracts/schedule');
      
      const container = ScheduleContainer.getInstance();
      const repository = container.getScheduleTaskRepository();
      
      // 查找该 reminder 对应的 ScheduleTask（返回数组）
      const scheduleTasks = await repository.findBySourceEntity(SourceModule.REMINDER, reminderUuid);
      
      if (scheduleTasks && scheduleTasks.length > 0) {
        for (const scheduleTask of scheduleTasks) {
          scheduleTask.enable();
          await repository.save(scheduleTask);
          
          logger.info('✅ [ReminderEventHandler] 启用了 ScheduleTask', {
            reminderUuid,
            scheduleTaskUuid: scheduleTask.uuid,
          });
        }
      } else {
        logger.warn('⚠️ [ReminderEventHandler] 未找到对应的 ScheduleTask', {
          reminderUuid,
        });
      }
    } catch (error) {
      logger.error('❌ [ReminderEventHandler] 启用 ScheduleTask 失败', {
        error: error instanceof Error ? error.message : String(error),
        reminderUuid,
      });
    }
  }

  /**
   * 暂停 Reminder 对应的 ScheduleTask
   */
  private static async disableScheduleTaskForReminder(event: DomainEvent): Promise<void> {
    const reminderUuid = event.aggregateId;
    
    try {
      const { ScheduleContainer } = await import('../../../schedule/infrastructure/di/ScheduleContainer');
      const { SourceModule } = await import('@dailyuse/contracts/schedule');
      
      const container = ScheduleContainer.getInstance();
      const repository = container.getScheduleTaskRepository();
      
      // 查找该 reminder 对应的 ScheduleTask（返回数组）
      const scheduleTasks = await repository.findBySourceEntity(SourceModule.REMINDER, reminderUuid);
      
      if (scheduleTasks && scheduleTasks.length > 0) {
        for (const scheduleTask of scheduleTasks) {
          scheduleTask.disable();
          await repository.save(scheduleTask);
          
          logger.info('✅ [ReminderEventHandler] 暂停了 ScheduleTask', {
            reminderUuid,
            scheduleTaskUuid: scheduleTask.uuid,
          });
        }
      } else {
        logger.warn('⚠️ [ReminderEventHandler] 未找到对应的 ScheduleTask', {
          reminderUuid,
        });
      }
    } catch (error) {
      logger.error('❌ [ReminderEventHandler] 暂停 ScheduleTask 失败', {
        error: error instanceof Error ? error.message : String(error),
        reminderUuid,
      });
    }
  }

  /**
   * 删除 Reminder 对应的 ScheduleTask
   */
  private static async deleteScheduleTaskForReminder(event: DomainEvent): Promise<void> {
    const reminderUuid = event.aggregateId;
    
    try {
      const { ScheduleContainer } = await import('../../../schedule/infrastructure/di/ScheduleContainer');
      const { SourceModule } = await import('@dailyuse/contracts/schedule');
      
      const container = ScheduleContainer.getInstance();
      const repository = container.getScheduleTaskRepository();
      
      // 查找该 reminder 对应的 ScheduleTask（返回数组）
      const scheduleTasks = await repository.findBySourceEntity(SourceModule.REMINDER, reminderUuid);
      
      if (scheduleTasks && scheduleTasks.length > 0) {
        for (const scheduleTask of scheduleTasks) {
          await repository.deleteByUuid(scheduleTask.uuid);
          
          logger.info('✅ [ReminderEventHandler] 删除了 ScheduleTask', {
            reminderUuid,
            scheduleTaskUuid: scheduleTask.uuid,
          });
        }
      } else {
        logger.warn('⚠️ [ReminderEventHandler] 未找到对应的 ScheduleTask', {
          reminderUuid,
        });
      }
    } catch (error) {
      logger.error('❌ [ReminderEventHandler] 删除 ScheduleTask 失败', {
        error: error instanceof Error ? error.message : String(error),
        reminderUuid,
      });
    }
  }
}

