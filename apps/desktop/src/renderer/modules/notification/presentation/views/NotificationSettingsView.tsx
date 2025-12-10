/**
 * NotificationSettingsView Component
 *
 * 通知设置页面
 * Story-010: Notification Module
 */

import { useState, useCallback } from 'react';

interface NotificationSettings {
  // 通知开关
  enableNotifications: boolean;
  enableSound: boolean;
  enableVibration: boolean;

  // 免打扰模式
  enableDND: boolean;
  dndStartTime: string;
  dndEndTime: string;

  // 通知类型设置
  notificationTypes: {
    system: boolean;
    reminder: boolean;
    goal: boolean;
    habit: boolean;
    achievement: boolean;
    social: boolean;
  };

  // 显示设置
  showPreview: boolean;
  groupByApp: boolean;
  autoDismissTime: number;
}

const defaultSettings: NotificationSettings = {
  enableNotifications: true,
  enableSound: true,
  enableVibration: true,
  enableDND: false,
  dndStartTime: '22:00',
  dndEndTime: '08:00',
  notificationTypes: {
    system: true,
    reminder: true,
    goal: true,
    habit: true,
    achievement: true,
    social: true,
  },
  showPreview: true,
  groupByApp: false,
  autoDismissTime: 5,
};

export function NotificationSettingsView() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 更新设置
  const updateSetting = useCallback(<K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaveSuccess(false);
  }, []);

  // 更新通知类型
  const updateNotificationType = useCallback((type: keyof NotificationSettings['notificationTypes'], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notificationTypes: {
        ...prev.notificationTypes,
        [type]: value,
      },
    }));
    setSaveSuccess(false);
  }, []);

  // 保存设置
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // TODO: 调用API保存设置
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // 重置设置
  const handleReset = useCallback(() => {
    setSettings(defaultSettings);
    setSaveSuccess(false);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">通知设置</h1>

      {/* 保存成功提示 */}
      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          设置已保存
        </div>
      )}

      {/* 基本设置 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">基本设置</h2>
        <div className="space-y-4 bg-white rounded-lg border p-4">
          <ToggleItem
            label="启用通知"
            description="接收来自应用的通知"
            checked={settings.enableNotifications}
            onChange={(v) => updateSetting('enableNotifications', v)}
          />
          <ToggleItem
            label="通知声音"
            description="收到通知时播放声音"
            checked={settings.enableSound}
            onChange={(v) => updateSetting('enableSound', v)}
            disabled={!settings.enableNotifications}
          />
          <ToggleItem
            label="振动"
            description="收到通知时振动"
            checked={settings.enableVibration}
            onChange={(v) => updateSetting('enableVibration', v)}
            disabled={!settings.enableNotifications}
          />
        </div>
      </section>

      {/* 免打扰模式 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">免打扰模式</h2>
        <div className="space-y-4 bg-white rounded-lg border p-4">
          <ToggleItem
            label="启用免打扰"
            description="在指定时间段内静音通知"
            checked={settings.enableDND}
            onChange={(v) => updateSetting('enableDND', v)}
          />
          {settings.enableDND && (
            <div className="flex items-center gap-4 pl-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">开始时间:</label>
                <input
                  type="time"
                  value={settings.dndStartTime}
                  onChange={(e) => updateSetting('dndStartTime', e.target.value)}
                  className="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">结束时间:</label>
                <input
                  type="time"
                  value={settings.dndEndTime}
                  onChange={(e) => updateSetting('dndEndTime', e.target.value)}
                  className="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 通知类型设置 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">通知类型</h2>
        <div className="space-y-4 bg-white rounded-lg border p-4">
          <ToggleItem
            label="系统通知"
            description="接收系统级别的通知"
            checked={settings.notificationTypes.system}
            onChange={(v) => updateNotificationType('system', v)}
            disabled={!settings.enableNotifications}
          />
          <ToggleItem
            label="提醒通知"
            description="接收提醒和日程通知"
            checked={settings.notificationTypes.reminder}
            onChange={(v) => updateNotificationType('reminder', v)}
            disabled={!settings.enableNotifications}
          />
          <ToggleItem
            label="目标通知"
            description="接收目标进度和完成通知"
            checked={settings.notificationTypes.goal}
            onChange={(v) => updateNotificationType('goal', v)}
            disabled={!settings.enableNotifications}
          />
          <ToggleItem
            label="习惯通知"
            description="接收习惯打卡提醒"
            checked={settings.notificationTypes.habit}
            onChange={(v) => updateNotificationType('habit', v)}
            disabled={!settings.enableNotifications}
          />
          <ToggleItem
            label="成就通知"
            description="接收成就解锁和奖励通知"
            checked={settings.notificationTypes.achievement}
            onChange={(v) => updateNotificationType('achievement', v)}
            disabled={!settings.enableNotifications}
          />
          <ToggleItem
            label="社交通知"
            description="接收好友动态和互动通知"
            checked={settings.notificationTypes.social}
            onChange={(v) => updateNotificationType('social', v)}
            disabled={!settings.enableNotifications}
          />
        </div>
      </section>

      {/* 显示设置 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">显示设置</h2>
        <div className="space-y-4 bg-white rounded-lg border p-4">
          <ToggleItem
            label="显示预览"
            description="在通知中显示内容预览"
            checked={settings.showPreview}
            onChange={(v) => updateSetting('showPreview', v)}
          />
          <ToggleItem
            label="按应用分组"
            description="将相同类型的通知分组显示"
            checked={settings.groupByApp}
            onChange={(v) => updateSetting('groupByApp', v)}
          />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">自动消失时间</p>
              <p className="text-sm text-gray-500">桌面通知自动消失的时间（秒）</p>
            </div>
            <select
              value={settings.autoDismissTime}
              onChange={(e) => updateSetting('autoDismissTime', Number(e.target.value))}
              className="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={3}>3 秒</option>
              <option value={5}>5 秒</option>
              <option value={10}>10 秒</option>
              <option value={15}>15 秒</option>
              <option value={0}>永不消失</option>
            </select>
          </div>
        </div>
      </section>

      {/* 操作按钮 */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? '保存中...' : '保存设置'}
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          恢复默认
        </button>
      </div>
    </div>
  );
}

// 开关组件
interface ToggleItemProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleItem({ label, description, checked, onChange, disabled }: ToggleItemProps) {
  return (
    <div className={`flex items-center justify-between py-2 ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        } ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default NotificationSettingsView;
