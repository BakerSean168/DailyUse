/**
 * SQLite Notification Template Repository
 *
 * 实现 INotificationTemplateRepository 接口
 */

import type { INotificationTemplateRepository, NotificationTemplate } from '@dailyuse/domain-server/notification';
import { NotificationCategory, NotificationType } from '@dailyuse/contracts/notification';
import { getDatabase, transaction } from '../../database';

interface NotificationTemplateRow {
  uuid: string;
  name: string;
  description: string | null;
  type: string;
  category: string;
  is_active: number;
  is_system_template: number;
  template_title: string;
  template_content: string;
  template_variables: string | null;
  template_layout: string | null;
  template_style: string | null;
  template_email_subject: string | null;
  template_email_html_body: string | null;
  template_email_text_body: string | null;
  template_push_title: string | null;
  template_push_body: string | null;
  template_push_icon: string | null;
  template_push_sound: string | null;
  created_at: number;
  updated_at: number;
}

export class SqliteNotificationTemplateRepository implements INotificationTemplateRepository {
  /**
   * 保存模板（创建或更新）
   */
  async save(template: NotificationTemplate): Promise<void> {
    const db = getDatabase();
    const dto = template.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM notification_templates WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE notification_templates SET
            name = ?, description = ?, type = ?, category = ?,
            is_active = ?, is_system_template = ?,
            template_title = ?, template_content = ?, template_variables = ?,
            template_layout = ?, template_style = ?,
            template_email_subject = ?, template_email_html_body = ?, template_email_text_body = ?,
            template_push_title = ?, template_push_body = ?, template_push_icon = ?, template_push_sound = ?,
            updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.name, dto.description, dto.type, dto.category,
          dto.isActive ? 1 : 0, dto.isSystemTemplate ? 1 : 0,
          dto.templateTitle, dto.templateContent, dto.templateVariables,
          dto.templateLayout, dto.templateStyle,
          dto.templateEmailSubject, dto.templateEmailHtmlBody, dto.templateEmailTextBody,
          dto.templatePushTitle, dto.templatePushBody, dto.templatePushIcon, dto.templatePushSound,
          dto.updatedAt,
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO notification_templates (
            uuid, name, description, type, category,
            is_active, is_system_template,
            template_title, template_content, template_variables,
            template_layout, template_style,
            template_email_subject, template_email_html_body, template_email_text_body,
            template_push_title, template_push_body, template_push_icon, template_push_sound,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.name, dto.description, dto.type, dto.category,
          dto.isActive ? 1 : 0, dto.isSystemTemplate ? 1 : 0,
          dto.templateTitle, dto.templateContent, dto.templateVariables,
          dto.templateLayout, dto.templateStyle,
          dto.templateEmailSubject, dto.templateEmailHtmlBody, dto.templateEmailTextBody,
          dto.templatePushTitle, dto.templatePushBody, dto.templatePushIcon, dto.templatePushSound,
          dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  /**
   * 通过 UUID 查找模板
   */
  async findById(uuid: string): Promise<NotificationTemplate | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM notification_templates WHERE uuid = ?').get(uuid) as NotificationTemplateRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 查找所有模板
   */
  async findAll(options?: { includeInactive?: boolean }): Promise<NotificationTemplate[]> {
    const db = getDatabase();
    let sql = 'SELECT * FROM notification_templates';
    if (!options?.includeInactive) {
      sql += ' WHERE is_active = 1';
    }
    sql += ' ORDER BY name ASC';

    const rows = db.prepare(sql).all() as NotificationTemplateRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 通过名称查找模板
   */
  async findByName(name: string): Promise<NotificationTemplate | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM notification_templates WHERE name = ?').get(name) as NotificationTemplateRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 通过分类查找模板
   */
  async findByCategory(
    category: NotificationCategory,
    options?: { activeOnly?: boolean }
  ): Promise<NotificationTemplate[]> {
    const db = getDatabase();
    let sql = 'SELECT * FROM notification_templates WHERE category = ?';
    if (options?.activeOnly !== false) {
      sql += ' AND is_active = 1';
    }
    sql += ' ORDER BY name ASC';

    const rows = db.prepare(sql).all(category) as NotificationTemplateRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 通过类型查找模板
   */
  async findByType(
    type: NotificationType,
    options?: { activeOnly?: boolean }
  ): Promise<NotificationTemplate[]> {
    const db = getDatabase();
    let sql = 'SELECT * FROM notification_templates WHERE type = ?';
    if (options?.activeOnly !== false) {
      sql += ' AND is_active = 1';
    }
    sql += ' ORDER BY name ASC';

    const rows = db.prepare(sql).all(type) as NotificationTemplateRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找系统预设模板
   */
  async findSystemTemplates(): Promise<NotificationTemplate[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM notification_templates WHERE is_system_template = 1 ORDER BY name ASC').all() as NotificationTemplateRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 删除模板
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM notification_templates WHERE uuid = ?').run(uuid);
  }

  /**
   * 检查模板是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db.prepare('SELECT 1 FROM notification_templates WHERE uuid = ?').get(uuid);
    return !!row;
  }

  /**
   * 检查模板名称是否已被使用
   */
  async isNameUsed(name: string, excludeUuid?: string): Promise<boolean> {
    const db = getDatabase();
    let sql = 'SELECT 1 FROM notification_templates WHERE name = ?';
    const params: unknown[] = [name];

    if (excludeUuid) {
      sql += ' AND uuid != ?';
      params.push(excludeUuid);
    }

    const row = db.prepare(sql).get(...params);
    return !!row;
  }

  /**
   * 统计模板数量
   */
  async count(options?: { activeOnly?: boolean }): Promise<number> {
    const db = getDatabase();
    let sql = 'SELECT COUNT(*) as count FROM notification_templates';
    if (options?.activeOnly) {
      sql += ' WHERE is_active = 1';
    }

    const result = db.prepare(sql).get() as { count: number };
    return result.count;
  }

  private mapToEntity(row: NotificationTemplateRow): NotificationTemplate {
    const { NotificationTemplate } = require('@dailyuse/domain-server/notification');
    return NotificationTemplate.fromPersistenceDTO({
      uuid: row.uuid,
      name: row.name,
      description: row.description,
      type: row.type,
      category: row.category,
      isActive: row.is_active === 1,
      isSystemTemplate: row.is_system_template === 1,
      templateTitle: row.template_title,
      templateContent: row.template_content,
      templateVariables: row.template_variables,
      templateLayout: row.template_layout,
      templateStyle: row.template_style,
      templateEmailSubject: row.template_email_subject,
      templateEmailHtmlBody: row.template_email_html_body,
      templateEmailTextBody: row.template_email_text_body,
      templatePushTitle: row.template_push_title,
      templatePushBody: row.template_push_body,
      templatePushIcon: row.template_push_icon,
      templatePushSound: row.template_push_sound,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
