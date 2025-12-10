/**
 * ShortcutSettingsView Component
 *
 * 快捷键设置页面
 * Story-012: Desktop Native Features
 */

import { useCallback, useState } from 'react';
import { useAppSettings, type ShortcutConfig } from '../../hooks/useAppSettings';
import { ShortcutRecorder } from './components';

export function ShortcutSettingsView() {
  const { settings, loading, error, updateShortcut, isElectron } = useAppSettings();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // 处理快捷键更改
  const handleShortcutChange = useCallback(
    async (index: number, accelerator: string) => {
      const shortcut = settings.shortcuts[index];
      await updateShortcut(index, { ...shortcut, accelerator });
      setEditingIndex(null);
    },
    [settings.shortcuts, updateShortcut]
  );

  // 切换快捷键启用状态
  const handleToggleShortcut = useCallback(
    async (index: number) => {
      const shortcut = settings.shortcuts[index];
      await updateShortcut(index, { ...shortcut, enabled: !shortcut.enabled });
    },
    [settings.shortcuts, updateShortcut]
  );

  // 格式化快捷键显示
  const formatShortcut = (accelerator: string): string => {
    if (!accelerator) return '未设置';
    return accelerator
      .replace(/CommandOrControl/g, process.platform === 'darwin' ? '⌘' : 'Ctrl')
      .replace(/Shift/g, process.platform === 'darwin' ? '⇧' : 'Shift')
      .replace(/Alt/g, process.platform === 'darwin' ? '⌥' : 'Alt')
      .replace(/\+/g, ' + ');
  };

  if (!isElectron) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">快捷键设置</h1>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⌨️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            快捷键功能仅在桌面应用中可用
          </h3>
          <p className="text-gray-600">
            请下载并使用 DailyUse 桌面应用以使用全局快捷键功能
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">快捷键设置</h1>
      <p className="text-gray-500 mb-6">
        配置全局快捷键，即使应用在后台也可以使用
      </p>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* 快捷键列表 */}
      <div className="space-y-4">
        {settings.shortcuts.map((shortcut, index) => (
          <div
            key={shortcut.action}
            className="bg-white rounded-lg border p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-medium text-gray-900">
                    {shortcut.description}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      shortcut.enabled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {shortcut.enabled ? '已启用' : '已禁用'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  动作: {shortcut.action}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* 快捷键显示/编辑 */}
                {editingIndex === index ? (
                  <ShortcutRecorder
                    value={shortcut.accelerator}
                    onChange={(acc) => handleShortcutChange(index, acc)}
                    disabled={loading}
                  />
                ) : (
                  <div
                    className="px-3 py-1.5 bg-gray-100 rounded-lg font-mono text-sm cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => setEditingIndex(index)}
                    title="点击修改"
                  >
                    {formatShortcut(shortcut.accelerator)}
                  </div>
                )}

                {/* 启用/禁用开关 */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={shortcut.enabled}
                  onClick={() => handleToggleShortcut(index)}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    shortcut.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      shortcut.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 提示信息 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">💡 提示</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 点击快捷键可以修改，按下新的组合键即可</li>
          <li>• 快捷键需要包含至少一个修饰键（Ctrl/Cmd、Alt、Shift）</li>
          <li>• 如果快捷键与其他应用冲突，可能无法正常工作</li>
          <li>• 全局快捷键在应用最小化或后台运行时也可以使用</li>
        </ul>
      </div>
    </div>
  );
}

export default ShortcutSettingsView;
