import type { Database } from 'better-sqlite3';
import { getDatabase } from "../../../../shared/database/index";
import type { ITaskInstanceRepository } from '../../domain/repositories/iTaskInstanceRepository';
import { TaskInstance } from '../../domain/aggregates/taskInstance';
import type { TResponse } from '@/shared/types/response';
import type { DateTime } from '@/shared/types/myDateTime';

/**
 * TaskInstance 数据库仓库实现
 * 直接使用数据库进行数据持久化
 */
export class TaskInstanceDatabaseRepository implements ITaskInstanceRepository {
  private db: Database | null = null;

  /**
   * 获取数据库实例
   */
  private async getDB(): Promise<Database> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  /**
   * 将 TaskInstance 实体转换为数据库记录
   */
  private toDbRecord(instance: TaskInstance, accountUuid: string): any {
    const json = instance.toDTO();
    return {
      uuid: json.uuid,
      account_uuid: accountUuid,
      template_uuid: json.templateId,
      title: json.title,
      description: json.description,
      time_config: JSON.stringify(json.timeConfig),
      actual_start_time: json.actualStartTime ? new Date(json.actualStartTime.isoString).getTime() : null,
      actual_end_time: json.actualEndTime ? new Date(json.actualEndTime.isoString).getTime() : null,
      key_result_links: json.keyResultLinks ? JSON.stringify(json.keyResultLinks) : null,
      priority: json.priority,
      status: json.status,
      completed_at: json.completedAt ? new Date(json.completedAt.isoString).getTime() : null,
      reminder_status: JSON.stringify(json.reminderStatus),
      lifecycle: JSON.stringify(json.lifecycle),
      metadata: JSON.stringify(json.metadata),
      version: json.version,
      created_at: new Date(json.lifecycle.createdAt.isoString).getTime(),
      updated_at: new Date(json.lifecycle.updatedAt.isoString).getTime()
    };
  }

  /**
   * 将数据库记录转换为 TaskInstance 实体
   */
  private fromDbRecord(record: any): TaskInstance {
    const instanceData = {
      uuid: record.uuid,
      templateId: record.template_uuid,
      title: record.title,
      description: record.description,
      timeConfig: JSON.parse(record.time_config),
      actualStartTime: record.actual_start_time ? { isoString: new Date(record.actual_start_time).toISOString() } : undefined,
      actualEndTime: record.actual_end_time ? { isoString: new Date(record.actual_end_time).toISOString() } : undefined,
      keyResultLinks: record.key_result_links ? JSON.parse(record.key_result_links) : undefined,
      priority: record.priority,
      status: record.status,
      completedAt: record.completed_at ? { isoString: new Date(record.completed_at).toISOString() } : undefined,
      reminderStatus: JSON.parse(record.reminder_status),
      lifecycle: JSON.parse(record.lifecycle),
      metadata: JSON.parse(record.metadata),
      version: record.version
    };

    return TaskInstance.fromCompleteData(instanceData);
  }

  /**
   * 保存 TaskInstance
   */
  async save(accountUuid: string, instance: TaskInstance): Promise<TResponse<TaskInstance>> {
    try {
      const db = await this.getDB();
      const record = this.toDbRecord(instance, accountUuid);

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO task_instances (
          uuid, account_uuid, template_uuid, title, description, time_config,
          actual_start_time, actual_end_time, key_result_links, priority,
          status, completed_at, reminder_status, lifecycle, metadata,
          version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        record.uuid, record.account_uuid, record.template_uuid, record.title,
        record.description, record.time_config, record.actual_start_time,
        record.actual_end_time, record.key_result_links, record.priority,
        record.status, record.completed_at, record.reminder_status,
        record.lifecycle, record.metadata, record.version,
        record.created_at, record.updated_at
      );

      return {
        success: true,
        data: instance,
        message: 'TaskInstance 保存成功'
      };
    } catch (error) {
      console.error('保存 TaskInstance 失败:', error);
      return {
        success: false,
        data: instance,
        message: `保存失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 批量保存 TaskInstance
   */
  async saveAll(accountUuid: string, instances: TaskInstance[]): Promise<TResponse<TaskInstance[]>> {
    try {
      const db = await this.getDB();
      
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO task_instances (
          uuid, account_uuid, template_uuid, title, description, time_config,
          actual_start_time, actual_end_time, key_result_links, priority,
          status, completed_at, reminder_status, lifecycle, metadata,
          version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction(() => {
        for (const instance of instances) {
          const record = this.toDbRecord(instance, accountUuid);
          stmt.run(
            record.uuid, record.account_uuid, record.template_uuid, record.title,
            record.description, record.time_config, record.actual_start_time,
            record.actual_end_time, record.key_result_links, record.priority,
            record.status, record.completed_at, record.reminder_status,
            record.lifecycle, record.metadata, record.version,
            record.created_at, record.updated_at
          );
        }
      });

      transaction();

      return {
        success: true,
        data: instances,
        message: `成功保存 ${instances.length} 个 TaskInstance`
      };
    } catch (error) {
      console.error('批量保存 TaskInstance 失败:', error);
      return {
        success: false,
        data: instances,
        message: `批量保存失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 根据 ID 查找 TaskInstance
   */
  async findById(accountUuid: string, uuid: string): Promise<TResponse<TaskInstance>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_instances 
        WHERE uuid = ? AND account_uuid = ?
      `);
      
      const record = stmt.get(uuid, accountUuid);
      
      if (record) {
        const instance = this.fromDbRecord(record);
        return {
          success: true,
          data: instance,
          message: 'TaskInstance 查找成功'
        };
      } else {
        return {
          success: false,
          data: null as any,
          message: `未找到 ID 为 ${uuid} 的 TaskInstance`
        };
      }
    } catch (error) {
      console.error('查找 TaskInstance 失败:', error);
      return {
        success: false,
        data: null as any,
        message: `查找失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取所有 TaskInstance
   */
  async findAll(accountUuid: string): Promise<TResponse<TaskInstance[]>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_instances 
        WHERE account_uuid = ?
        ORDER BY created_at DESC
      `);
      
      const records = stmt.all(accountUuid);
      const instances = records.map(record => this.fromDbRecord(record));

      return {
        success: true,
        data: instances,
        message: `找到 ${instances.length} 个 TaskInstance`
      };
    } catch (error) {
      console.error('获取所有 TaskInstance 失败:', error);
      return {
        success: false,
        data: [],
        message: `获取失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 根据模板 ID 查找 TaskInstance
   */
  async findByTemplateId(accountUuid: string, templateId: string): Promise<TResponse<TaskInstance[]>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_instances 
        WHERE template_uuid = ? AND account_uuid = ?
        ORDER BY created_at DESC
      `);
      
      const records = stmt.all(templateId, accountUuid);
      const instances = records.map(record => this.fromDbRecord(record));

      return {
        success: true,
        data: instances,
        message: `找到 ${instances.length} 个相关 TaskInstance`
      };
    } catch (error) {
      console.error('根据模板ID查找 TaskInstance 失败:', error);
      return {
        success: false,
        data: [],
        message: `查找失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 根据目标查找 TaskInstance
   */
  async findByGoal(accountUuid: string, goalUuid: string): Promise<TResponse<TaskInstance[]>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM task_instances 
        WHERE account_uuid = ? AND key_result_links LIKE ?
        ORDER BY created_at DESC
      `);
      
      const records = stmt.all(accountUuid, `%"goalUuid":"${goalUuid}"%`);
      const instances = records.map(record => this.fromDbRecord(record));

      return {
        success: true,
        data: instances,
        message: `找到 ${instances.length} 个相关 TaskInstance`
      };
    } catch (error) {
      console.error('根据目标查找 TaskInstance 失败:', error);
      return {
        success: false,
        data: [],
        message: `查找失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取今日任务
   */
  async findTodayTasks(accountUuid: string): Promise<TResponse<TaskInstance[]>> {
    try {
      const db = await this.getDB();
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

      const stmt = db.prepare(`
        SELECT * FROM task_instances 
        WHERE account_uuid = ? 
        AND ((actual_start_time BETWEEN ? AND ?) 
             OR (completed_at BETWEEN ? AND ?)
             OR (created_at BETWEEN ? AND ? AND status IN ('pending', 'in_progress')))
        ORDER BY created_at DESC
      `);
      
      const records = stmt.all(
        accountUuid,
        startOfDay, endOfDay,
        startOfDay, endOfDay,
        startOfDay, endOfDay
      );
      
      const instances = records.map(record => this.fromDbRecord(record));

      return {
        success: true,
        data: instances,
        message: `找到 ${instances.length} 个今日任务`
      };
    } catch (error) {
      console.error('获取今日任务失败:', error);
      return {
        success: false,
        data: [],
        message: `获取失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 根据时间范围查找任务 (接口要求的方法名)
   */
  async findByDateRange(accountUuid: string, startTime: DateTime, endTime: DateTime): Promise<TResponse<TaskInstance[]>> {
    return this.findByTimeRange(accountUuid, startTime, endTime);
  }

  /**
   * 根据时间范围查找任务
   */
  async findByTimeRange(accountUuid: string, startTime: DateTime, endTime: DateTime): Promise<TResponse<TaskInstance[]>> {
    try {
      const db = await this.getDB();
      const start = new Date(startTime.isoString).getTime();
      const end = new Date(endTime.isoString).getTime();

      const stmt = db.prepare(`
        SELECT * FROM task_instances 
        WHERE account_uuid = ? 
        AND ((actual_start_time BETWEEN ? AND ?) 
             OR (completed_at BETWEEN ? AND ?)
             OR (created_at BETWEEN ? AND ?))
        ORDER BY created_at DESC
      `);
      
      const records = stmt.all(
        accountUuid,
        start, end,
        start, end,
        start, end
      );
      
      const instances = records.map(record => this.fromDbRecord(record));

      return {
        success: true,
        data: instances,
        message: `找到 ${instances.length} 个任务`
      };
    } catch (error) {
      console.error('根据时间范围查找任务失败:', error);
      return {
        success: false,
        data: [],
        message: `查找失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 更新 TaskInstance
   */
  async update(accountUuid: string, instance: TaskInstance): Promise<TResponse<TaskInstance>> {
    try {
      const db = await this.getDB();
      const record = this.toDbRecord(instance, accountUuid);

      const stmt = db.prepare(`
        UPDATE task_instances SET
          template_uuid = ?, title = ?, description = ?, time_config = ?,
          actual_start_time = ?, actual_end_time = ?, key_result_links = ?,
          priority = ?, status = ?, completed_at = ?, reminder_status = ?,
          lifecycle = ?, metadata = ?, version = ?, updated_at = ?
        WHERE uuid = ? AND account_uuid = ?
      `);

      const result = stmt.run(
        record.template_uuid, record.title, record.description, record.time_config,
        record.actual_start_time, record.actual_end_time, record.key_result_links,
        record.priority, record.status, record.completed_at, record.reminder_status,
        record.lifecycle, record.metadata, record.version, record.updated_at,
        record.uuid, record.account_uuid
      );

      if (result.changes > 0) {
        return {
          success: true,
          data: instance,
          message: 'TaskInstance 更新成功'
        };
      } else {
        return {
          success: false,
          data: instance,
          message: `未找到要更新的 TaskInstance (ID: ${instance.uuid})`
        };
      }
    } catch (error) {
      console.error('更新 TaskInstance 失败:', error);
      return {
        success: false,
        data: instance,
        message: `更新失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 删除 TaskInstance
   */
  async delete(accountUuid: string, uuid: string): Promise<TResponse<boolean>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        DELETE FROM task_instances 
        WHERE uuid = ? AND account_uuid = ?
      `);
      
      const result = stmt.run(uuid, accountUuid);

      if (result.changes > 0) {
        return {
          success: true,
          data: true,
          message: 'TaskInstance 删除成功'
        };
      } else {
        return {
          success: false,
          data: false,
          message: `未找到要删除的 TaskInstance (ID: ${uuid})`
        };
      }
    } catch (error) {
      console.error('删除 TaskInstance 失败:', error);
      return {
        success: false,
        data: false,
        message: `删除失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 批量更新实例
   */
  async updateInstances(accountUuid: string, instances: TaskInstance[]): Promise<TResponse<TaskInstance[]>> {
    try {
      const db = await this.getDB();
      
      const stmt = db.prepare(`
        UPDATE task_instances SET
          template_uuid = ?, title = ?, description = ?, time_config = ?,
          actual_start_time = ?, actual_end_time = ?, key_result_links = ?,
          priority = ?, status = ?, completed_at = ?, reminder_status = ?,
          lifecycle = ?, metadata = ?, version = ?, updated_at = ?
        WHERE uuid = ? AND account_uuid = ?
      `);

      const transaction = db.transaction(() => {
        for (const instance of instances) {
          const record = this.toDbRecord(instance, accountUuid);
          stmt.run(
            record.template_uuid, record.title, record.description, record.time_config,
            record.actual_start_time, record.actual_end_time, record.key_result_links,
            record.priority, record.status, record.completed_at, record.reminder_status,
            record.lifecycle, record.metadata, record.version, record.updated_at,
            record.uuid, record.account_uuid
          );
        }
      });

      transaction();

      return {
        success: true,
        data: instances,
        message: `成功更新 ${instances.length} 个 TaskInstance`
      };
    } catch (error) {
      console.error('批量更新 TaskInstance 失败:', error);
      return {
        success: false,
        data: instances,
        message: `批量更新失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
}