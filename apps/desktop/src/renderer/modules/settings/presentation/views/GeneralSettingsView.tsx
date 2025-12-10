/**
 * GeneralSettingsView Component
 *
 * 通用设置页面
 * Story-012: Desktop Native Features
 */

import { useCallback } from 'react';
import { useAppSettings } from '../../hooks/useAppSettings';

export function GeneralSettingsView() {
  const {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    setAutoLaunch,
    isElectron,
  } = useAppSettings();

  // 主题切换
  const handleThemeChange = useCallback(
    (theme: 'light' | 'dark' | 'system') => {
      updateSettings({ theme });
    },
    [updateSettings]
  );

  // 自启动切换
  const handleAutoLaunchChange = useCallback(
    (enabled: boolean) => {
      setAutoLaunch(enabled);
    },
    [setAutoLaunch]
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">通用设置</h1>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* 外观设置 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">外观</h2>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">主题</p>
              <p className="text-sm text-gray-500">选择应用的颜色主题</p>
            </div>
            <select
              value={settings.theme}
              onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'system')}
              className="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="system">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>
        </div>
      </section>

      {/* 启动设置 - 仅在 Electron 中显示 */}
      {isElectron && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">启动</h2>
          <div className="space-y-4 bg-white rounded-lg border p-4">
            <ToggleItem
              label="开机自启动"
              description="系统启动时自动运行 DailyUse"
              checked={settings.autoLaunch}
              onChange={handleAutoLaunchChange}
              disabled={loading}
            />
            <ToggleItem
              label="启动时最小化"
              description="启动后最小化到系统托盘"
              checked={settings.startMinimized}
              onChange={(v) => updateSettings({ startMinimized: v })}
              disabled={loading || !settings.autoLaunch}
            />
            <ToggleItem
              label="关闭时最小化到托盘"
              description="点击关闭按钮时隐藏到系统托盘而不是退出"
              checked={settings.hideOnClose}
              onChange={(v) => updateSettings({ hideOnClose: v })}
              disabled={loading}
            />
          </div>
        </section>
      )}

      {/* 托盘设置 - 仅在 Electron 中显示 */}
      {isElectron && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">系统托盘</h2>
          <div className="space-y-4 bg-white rounded-lg border p-4">
            <ToggleItem
              label="显示托盘图标"
              description="在系统托盘区域显示应用图标"
              checked={settings.showTrayIcon}
              onChange={(v) => updateSettings({ showTrayIcon: v })}
              disabled={loading}
            />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">托盘图标点击行为</p>
                <p className="text-sm text-gray-500">点击托盘图标时的操作</p>
              </div>
              <select
                value={settings.trayClickAction}
                onChange={(e) =>
                  updateSettings({
                    trayClickAction: e.target.value as 'show' | 'toggle',
                  })
                }
                className="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading || !settings.showTrayIcon}
              >
                <option value="toggle">显示/隐藏窗口</option>
                <option value="show">显示窗口</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* 语言设置 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">语言</h2>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">显示语言</p>
              <p className="text-sm text-gray-500">选择应用的界面语言</p>
            </div>
            <select
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value })}
              className="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁體中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>
      </section>

      {/* 操作按钮 */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
        <button
          onClick={resetSettings}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          恢复默认设置
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

export default GeneralSettingsView;
