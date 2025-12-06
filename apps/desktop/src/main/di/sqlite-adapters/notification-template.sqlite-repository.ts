// @ts-nocheck
/**
 * SQLite Notification Template Repository
 * TODO: 修复类型定义后移除 @ts-nocheck
 */

import type { INotificationTemplateRepository } from '@dailyuse/domain-server/notification';
import type { NotificationTemplate } from '@dailyuse/domain-server/notification';
import { getDatabase, transaction } from '../../database';

export class SqliteNotificationTemplateRepository implements INotificationTemplateRepository {
  async save(template: NotificationTemplate): Promise<void> {
    const db = getDatabase();
    const dto = template.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM notification_templates WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE notification_templates SET
            name = ?, type = ?, title_template = ?, content_template = ?, variables = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.name, dto.type, dto.titleTemplate, dto.contentTemplate,
          JSON.stringify(dto.variables), dto.updatedAt, dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO notification_templates (
            uuid, name, type, title_template, content_template, variables, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.name, dto.type, dto.titleTemplate, dto.contentTemplate,
          JSON.stringify(dto.variables), dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  async findByUuid(uuid: string): Promise<NotificationTemplate | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM notification_templates WHERE uuid = ?').get(uuid);
    return row ? this.mapToEntity(row) : null;
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM notification_templates WHERE name = ?').get(name);
    return row ? this.mapToEntity(row) : null;
  }

  async findByType(type: string): Promise<NotificationTemplate[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM notification_templates WHERE type = ?').all(type);
    return rows.map((row) => this.mapToEntity(row));
  }

  async findAll(): Promise<NotificationTemplate[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM notification_templates ORDER BY name ASC').all();
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM notification_templates WHERE uuid = ?').run(uuid);
  }

  private mapToEntity(row: unknown): NotificationTemplate {
    const { NotificationTemplate } = require('@dailyuse/domain-server/notification');
    return NotificationTemplate.fromPersistenceDTO(row);
  }
}
