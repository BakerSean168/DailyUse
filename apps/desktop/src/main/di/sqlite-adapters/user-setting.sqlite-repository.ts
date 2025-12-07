/**
 * SQLite User Setting Repository
 *
 * 实现 IUserSettingRepository 接口
 */

import type { IUserSettingRepository, UserSetting } from '@dailyuse/domain-server/setting';
import { getDatabase, transaction } from '../../database';

interface UserSettingRow {
  uuid: string;
  account_uuid: string;
  appearance_theme: string;
  appearance_accent_color: string;
  appearance_font_size: string;
  appearance_font_family: string | null;
  appearance_compact_mode: number;
  locale_language: string;
  locale_timezone: string;
  locale_date_format: string;
  locale_time_format: string;
  locale_week_starts_on: number;
  locale_currency: string;
  workflow_default_task_view: string;
  workflow_default_goal_view: string;
  workflow_default_schedule_view: string;
  workflow_auto_save: number;
  workflow_auto_save_interval: number;
  workflow_confirm_before_delete: number;
  shortcuts_enabled: number;
  shortcuts_custom: string;
  privacy_profile_visibility: string;
  privacy_show_online_status: number;
  privacy_allow_search_by_email: number;
  privacy_allow_search_by_phone: number;
  privacy_share_usage_data: number;
  experimental_enabled: number;
  experimental_features: string;
  created_at: number;
  updated_at: number;
}

export class SqliteUserSettingRepository implements IUserSettingRepository {
  /**
   * 保存用户设置
   */
  async save(setting: UserSetting): Promise<void> {
    const db = getDatabase();
    const dto = setting.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM user_settings WHERE account_uuid = ?').get(dto.accountUuid);

      if (existing) {
        db.prepare(`
          UPDATE user_settings SET
            appearance_theme = ?, appearance_accent_color = ?, appearance_font_size = ?,
            appearance_font_family = ?, appearance_compact_mode = ?,
            locale_language = ?, locale_timezone = ?, locale_date_format = ?,
            locale_time_format = ?, locale_week_starts_on = ?, locale_currency = ?,
            workflow_default_task_view = ?, workflow_default_goal_view = ?,
            workflow_default_schedule_view = ?, workflow_auto_save = ?,
            workflow_auto_save_interval = ?, workflow_confirm_before_delete = ?,
            shortcuts_enabled = ?, shortcuts_custom = ?,
            privacy_profile_visibility = ?, privacy_show_online_status = ?,
            privacy_allow_search_by_email = ?, privacy_allow_search_by_phone = ?,
            privacy_share_usage_data = ?,
            experimental_enabled = ?, experimental_features = ?,
            updated_at = ?
          WHERE account_uuid = ?
        `).run(
          dto.appearanceTheme, dto.appearanceAccentColor, dto.appearanceFontSize,
          dto.appearanceFontFamily, dto.appearanceCompactMode ? 1 : 0,
          dto.localeLanguage, dto.localeTimezone, dto.localeDateFormat,
          dto.localeTimeFormat, dto.localeWeekStartsOn, dto.localeCurrency,
          dto.workflowDefaultTaskView, dto.workflowDefaultGoalView,
          dto.workflowDefaultScheduleView, dto.workflowAutoSave ? 1 : 0,
          dto.workflowAutoSaveInterval, dto.workflowConfirmBeforeDelete ? 1 : 0,
          dto.shortcutsEnabled ? 1 : 0, dto.shortcutsCustom,
          dto.privacyProfileVisibility, dto.privacyShowOnlineStatus ? 1 : 0,
          dto.privacyAllowSearchByEmail ? 1 : 0, dto.privacyAllowSearchByPhone ? 1 : 0,
          dto.privacyShareUsageData ? 1 : 0,
          dto.experimentalEnabled ? 1 : 0, dto.experimentalFeatures,
          Date.now(),
          dto.accountUuid
        );
      } else {
        db.prepare(`
          INSERT INTO user_settings (
            uuid, account_uuid,
            appearance_theme, appearance_accent_color, appearance_font_size,
            appearance_font_family, appearance_compact_mode,
            locale_language, locale_timezone, locale_date_format,
            locale_time_format, locale_week_starts_on, locale_currency,
            workflow_default_task_view, workflow_default_goal_view,
            workflow_default_schedule_view, workflow_auto_save,
            workflow_auto_save_interval, workflow_confirm_before_delete,
            shortcuts_enabled, shortcuts_custom,
            privacy_profile_visibility, privacy_show_online_status,
            privacy_allow_search_by_email, privacy_allow_search_by_phone,
            privacy_share_usage_data,
            experimental_enabled, experimental_features,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.accountUuid,
          dto.appearanceTheme, dto.appearanceAccentColor, dto.appearanceFontSize,
          dto.appearanceFontFamily, dto.appearanceCompactMode ? 1 : 0,
          dto.localeLanguage, dto.localeTimezone, dto.localeDateFormat,
          dto.localeTimeFormat, dto.localeWeekStartsOn, dto.localeCurrency,
          dto.workflowDefaultTaskView, dto.workflowDefaultGoalView,
          dto.workflowDefaultScheduleView, dto.workflowAutoSave ? 1 : 0,
          dto.workflowAutoSaveInterval, dto.workflowConfirmBeforeDelete ? 1 : 0,
          dto.shortcutsEnabled ? 1 : 0, dto.shortcutsCustom,
          dto.privacyProfileVisibility, dto.privacyShowOnlineStatus ? 1 : 0,
          dto.privacyAllowSearchByEmail ? 1 : 0, dto.privacyAllowSearchByPhone ? 1 : 0,
          dto.privacyShareUsageData ? 1 : 0,
          dto.experimentalEnabled ? 1 : 0, dto.experimentalFeatures,
          Date.now(), Date.now()
        );
      }
    });
  }

  /**
   * 根据账户 UUID 查找用户设置（返回单个）
   */
  async findByAccountUuid(accountUuid: string): Promise<UserSetting | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM user_settings WHERE account_uuid = ?').get(accountUuid) as UserSettingRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 删除用户设置（使用 accountUuid）
   */
  async delete(accountUuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM user_settings WHERE account_uuid = ?').run(accountUuid);
  }

  private mapToEntity(row: UserSettingRow): UserSetting {
    const { UserSetting } = require('@dailyuse/domain-server/setting');
    return UserSetting.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      appearanceTheme: row.appearance_theme,
      appearanceAccentColor: row.appearance_accent_color,
      appearanceFontSize: row.appearance_font_size,
      appearanceFontFamily: row.appearance_font_family,
      appearanceCompactMode: row.appearance_compact_mode === 1,
      localeLanguage: row.locale_language,
      localeTimezone: row.locale_timezone,
      localeDateFormat: row.locale_date_format,
      localeTimeFormat: row.locale_time_format,
      localeWeekStartsOn: row.locale_week_starts_on as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      localeCurrency: row.locale_currency,
      workflowDefaultTaskView: row.workflow_default_task_view,
      workflowDefaultGoalView: row.workflow_default_goal_view,
      workflowDefaultScheduleView: row.workflow_default_schedule_view,
      workflowAutoSave: row.workflow_auto_save === 1,
      workflowAutoSaveInterval: row.workflow_auto_save_interval,
      workflowConfirmBeforeDelete: row.workflow_confirm_before_delete === 1,
      shortcutsEnabled: row.shortcuts_enabled === 1,
      shortcutsCustom: row.shortcuts_custom,
      privacyProfileVisibility: row.privacy_profile_visibility,
      privacyShowOnlineStatus: row.privacy_show_online_status === 1,
      privacyAllowSearchByEmail: row.privacy_allow_search_by_email === 1,
      privacyAllowSearchByPhone: row.privacy_allow_search_by_phone === 1,
      privacyShareUsageData: row.privacy_share_usage_data === 1,
      experimentalEnabled: row.experimental_enabled === 1,
      experimentalFeatures: row.experimental_features,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
