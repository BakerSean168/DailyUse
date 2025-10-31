// @ts-nocheck
import type { PrismaClient } from '@prisma/client';
import type { IUserSettingRepository } from '@dailyuse/domain-server';
import { UserSetting } from '@dailyuse/domain-server';

export class PrismaUserSettingRepository implements IUserSettingRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 根据账户UUID查找用户设置
   */
  async findByAccountUuid(accountUuid: string): Promise<UserSetting | null> {
    const record = await this.prisma.userSetting.findUnique({
      where: { accountUuid },
    });

    if (!record) {
      return null;
    }

    return UserSetting.fromPersistenceDTO({
      uuid: record.uuid,
      accountUuid: record.accountUuid,
      appearanceTheme: record.appearanceTheme,
      appearanceFontSize: record.appearanceFontSize,
      appearanceCompactMode: record.appearanceCompactMode,
      appearanceAccentColor: record.appearanceAccentColor,
      appearanceFontFamily: record.appearanceFontFamily,
      localeLanguage: record.localeLanguage,
      localeTimezone: record.localeTimezone,
      localeDateFormat: record.localeDateFormat,
      localeTimeFormat: record.localeTimeFormat,
      localeWeekStartsOn: record.localeWeekStartsOn,
      localeCurrency: record.localeCurrency,
      notificationEmail: record.notificationEmail,
      notificationPush: record.notificationPush,
      notificationInApp: record.notificationInApp,
      notificationSound: record.notificationSound,
      editorTheme: record.editorTheme,
      editorFontSize: record.editorFontSize,
      editorTabSize: record.editorTabSize,
      editorWordWrap: record.editorWordWrap,
      editorLineNumbers: record.editorLineNumbers,
      editorMinimap: record.editorMinimap,
      shortcutsEnabled: record.shortcutsEnabled,
      shortcutsCustom: (record.shortcutsCustom as Record<string, string>) || {},
      workflowAutoSave: record.workflowAutoSave,
      workflowAutoSaveInterval: record.workflowAutoSaveInterval,
      workflowConfirmBeforeDelete: record.workflowConfirmBeforeDelete,
      workflowDefaultGoalView: record.workflowDefaultGoalView,
      workflowDefaultScheduleView: record.workflowDefaultScheduleView,
      workflowDefaultTaskView: record.workflowDefaultTaskView,
      privacyProfileVisibility: record.privacyProfileVisibility,
      privacyShowOnlineStatus: record.privacyShowOnlineStatus,
      privacyAllowSearchByEmail: record.privacyAllowSearchByEmail,
      privacyAllowSearchByPhone: record.privacyAllowSearchByPhone,
      privacyShareUsageData: record.privacyShareUsageData,
      experimentalEnabled: record.experimentalEnabled,
      experimentalFeatures: (record.experimentalFeatures as string[]) || [],
      startPage: record.startPage,
      sidebarCollapsed: record.sidebarCollapsed,
      createdAt: record.createdAt.getTime(),
      updatedAt: record.updatedAt.getTime(),
    });
  }

  /**
   * 保存用户设置
   */
  async save(setting: UserSetting): Promise<void> {
    const dto = setting.toPersistenceDTO();

    await this.prisma.userSetting.upsert({
      where: { accountUuid: dto.accountUuid },
      create: {
        uuid: dto.uuid,
        accountUuid: dto.accountUuid,
        appearanceTheme: dto.appearanceTheme,
        appearanceFontSize: dto.appearanceFontSize,
        appearanceCompactMode: dto.appearanceCompactMode,
        appearanceAccentColor: dto.appearanceAccentColor,
        appearanceFontFamily: dto.appearanceFontFamily,
        localeLanguage: dto.localeLanguage,
        localeTimezone: dto.localeTimezone,
        localeDateFormat: dto.localeDateFormat,
        localeTimeFormat: dto.localeTimeFormat,
        localeWeekStartsOn: dto.localeWeekStartsOn,
        localeCurrency: dto.localeCurrency,
        notificationEmail: dto.notificationEmail,
        notificationPush: dto.notificationPush,
        notificationInApp: dto.notificationInApp,
        notificationSound: dto.notificationSound,
        editorTheme: dto.editorTheme,
        editorFontSize: dto.editorFontSize,
        editorTabSize: dto.editorTabSize,
        editorWordWrap: dto.editorWordWrap,
        editorLineNumbers: dto.editorLineNumbers,
        editorMinimap: dto.editorMinimap,
        shortcutsEnabled: dto.shortcutsEnabled,
        shortcutsCustom: dto.shortcutsCustom,
        workflowAutoSave: dto.workflowAutoSave,
        workflowAutoSaveInterval: dto.workflowAutoSaveInterval,
        workflowConfirmBeforeDelete: dto.workflowConfirmBeforeDelete,
        workflowDefaultGoalView: dto.workflowDefaultGoalView,
        workflowDefaultScheduleView: dto.workflowDefaultScheduleView,
        workflowDefaultTaskView: dto.workflowDefaultTaskView,
        privacyProfileVisibility: dto.privacyProfileVisibility,
        privacyShowOnlineStatus: dto.privacyShowOnlineStatus,
        privacyAllowSearchByEmail: dto.privacyAllowSearchByEmail,
        privacyAllowSearchByPhone: dto.privacyAllowSearchByPhone,
        privacyShareUsageData: dto.privacyShareUsageData,
        experimentalEnabled: dto.experimentalEnabled,
        experimentalFeatures: dto.experimentalFeatures,
        startPage: dto.startPage,
        sidebarCollapsed: dto.sidebarCollapsed,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
      },
      update: {
        appearanceTheme: dto.appearanceTheme,
        appearanceFontSize: dto.appearanceFontSize,
        appearanceCompactMode: dto.appearanceCompactMode,
        appearanceAccentColor: dto.appearanceAccentColor,
        appearanceFontFamily: dto.appearanceFontFamily,
        localeLanguage: dto.localeLanguage,
        localeTimezone: dto.localeTimezone,
        localeDateFormat: dto.localeDateFormat,
        localeTimeFormat: dto.localeTimeFormat,
        localeWeekStartsOn: dto.localeWeekStartsOn,
        localeCurrency: dto.localeCurrency,
        notificationEmail: dto.notificationEmail,
        notificationPush: dto.notificationPush,
        notificationInApp: dto.notificationInApp,
        notificationSound: dto.notificationSound,
        editorTheme: dto.editorTheme,
        editorFontSize: dto.editorFontSize,
        editorTabSize: dto.editorTabSize,
        editorWordWrap: dto.editorWordWrap,
        editorLineNumbers: dto.editorLineNumbers,
        editorMinimap: dto.editorMinimap,
        shortcutsEnabled: dto.shortcutsEnabled,
        shortcutsCustom: dto.shortcutsCustom,
        workflowAutoSave: dto.workflowAutoSave,
        workflowAutoSaveInterval: dto.workflowAutoSaveInterval,
        workflowConfirmBeforeDelete: dto.workflowConfirmBeforeDelete,
        workflowDefaultGoalView: dto.workflowDefaultGoalView,
        workflowDefaultScheduleView: dto.workflowDefaultScheduleView,
        workflowDefaultTaskView: dto.workflowDefaultTaskView,
        privacyProfileVisibility: dto.privacyProfileVisibility,
        privacyShowOnlineStatus: dto.privacyShowOnlineStatus,
        privacyAllowSearchByEmail: dto.privacyAllowSearchByEmail,
        privacyAllowSearchByPhone: dto.privacyAllowSearchByPhone,
        privacyShareUsageData: dto.privacyShareUsageData,
        experimentalEnabled: dto.experimentalEnabled,
        experimentalFeatures: dto.experimentalFeatures,
        startPage: dto.startPage,
        sidebarCollapsed: dto.sidebarCollapsed,
        updatedAt: new Date(dto.updatedAt),
      },
    });
  }

  /**
   * 删除用户设置
   */
  async delete(accountUuid: string): Promise<void> {
    await this.prisma.userSetting.delete({
      where: { accountUuid },
    });
  }
}
