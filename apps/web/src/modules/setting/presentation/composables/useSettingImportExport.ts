/**
 * 设置导入/导出 Composable
 * 支持设置的备份、导出和导入功能
 * 
 * 更新：集成新的 Store 导入/导出功能
 */

import { ref } from 'vue';
import type { UserSettingClientDTO, UpdateUserSettingRequest } from '@dailyuse/contracts/setting';
import { useUserSettingStore } from '../stores/userSettingStore';

// 类型别名

export interface SettingExportData {
  version: string;
  exportTime: number;
  exportedBy: string;
  settings: UserSettingClientDTO;
}

export function useSettingImportExport() {
  const settingStore = useUserSettingStore();
  const isExporting = ref(false);
  const isImporting = ref(false);
  const importError = ref<string | null>(null);

  /**
   * 导出设置为 JSON 文件（使用新的 API）
   */
  const exportSettings = async (settings?: UserSettingClientDTO, filename?: string) => {
    isExporting.value = true;
    try {
      // 使用 store 的导出方法
      await settingStore.exportSettings();
      return true;
    } catch (error) {
      console.error('Failed to export settings:', error);
      return false;
    } finally {
      isExporting.value = false;
    }
  };

  /**
   * 导入设置从 JSON 文件（使用新的 API）
   */
  const importSettings = async (file: File, merge = false): Promise<UserSettingClientDTO | null> => {
    isImporting.value = true;
    importError.value = null;

    try {
      // 验证文件类型
      if (!file.type.includes('json') && !file.name.endsWith('.json')) {
        throw new Error('请选择有效的 JSON 文件');
      }

      // 使用 store 的导入方法
      await settingStore.importSettingsFromFile(file, merge);
      return settingStore.settings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导入失败';
      importError.value = errorMessage;
      console.error('Failed to import settings:', error);
      return null;
    } finally {
      isImporting.value = false;
    }
  };

  /**
   * 触发文件选择对话框并导入
   */
  const selectAndImportFile = (merge = false): void => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        await importSettings(file, merge);
      }
    };

    input.click();
  };

  /**
   * 导出为 CSV（用于备份多个字段）
   */
  const exportAsCSV = (settings: UserSettingClientDTO, filename?: string) => {
    try {
      const csvData = [
        ['Setting Key', 'Value'],
        ['Theme', settings.appearance.theme],
        ['Font Size', settings.appearance.fontSize],
        ['Compact Mode', settings.appearance.compactMode.toString()],
        ['Accent Color', settings.appearance.accentColor],
        ['Language', settings.locale.language],
        ['Timezone', settings.locale.timezone],
        ['Date Format', settings.locale.dateFormat],
        ['Time Format', settings.locale.timeFormat],
        ['Auto Save', settings.workflow.autoSave.toString()],
        ['Auto Save Interval', settings.workflow.autoSaveInterval.toString()],
      ].map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const dataBlob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `dailyuse-settings-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Failed to export as CSV:', error);
      return false;
    }
  };

  /**
   * 创建本地备份
   */
  const createLocalBackup = (settings: UserSettingClientDTO, storageKey: string = 'dailyuse_settings_backup') => {
    try {
      const backupData: SettingExportData = {
        version: '1.0.0',
        exportTime: Date.now(),
        exportedBy: 'DailyUse Local Backup',
        settings,
      };

      localStorage.setItem(storageKey, JSON.stringify(backupData));
      return true;
    } catch (error) {
      console.error('Failed to create local backup:', error);
      return false;
    }
  };

  /**
   * 从本地备份恢复
   */
  const restoreFromLocalBackup = (storageKey: string = 'dailyuse_settings_backup'): UserSettingClientDTO | null => {
    try {
      const backupStr = localStorage.getItem(storageKey);
      if (!backupStr) {
        throw new Error('找不到本地备份');
      }

      const backupData = JSON.parse(backupStr) as SettingExportData;
      return backupData.settings;
    } catch (error) {
      console.error('Failed to restore from local backup:', error);
      return null;
    }
  };

  /**
   * 获取本地备份列表
   */
  const getLocalBackups = () => {
    const backups: { key: string; time: number; label: string }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('dailyuse_settings_backup')) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const data = JSON.parse(value) as SettingExportData;
            backups.push({
              key,
              time: data.exportTime,
              label: new Date(data.exportTime).toLocaleString(),
            });
          } catch {
            // Skip invalid backup
          }
        }
      }
    }

    return backups.sort((a, b) => b.time - a.time);
  };

  return {
    isExporting,
    isImporting,
    importError,
    exportSettings,
    importSettings,
    selectAndImportFile, // 新增
    exportAsCSV,
    createLocalBackup,
    restoreFromLocalBackup,
    getLocalBackups,
  };
}

