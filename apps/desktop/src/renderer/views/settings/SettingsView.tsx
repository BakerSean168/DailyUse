/**
 * 设置视图
 * 懒加载组件 - 用于路由级代码分割
 */

import { useState } from 'react';
import { SyncSettingsView } from './SyncSettingsView';

type SettingsTab = 'general' | 'sync' | 'shortcuts';

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const tabs = [
    { id: 'general' as const, label: '通用', icon: '⚙️' },
    { id: 'sync' as const, label: '同步', icon: '☁️' },
    { id: 'shortcuts' as const, label: '快捷键', icon: '⌨️' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">设置</h1>
      
      {/* Tab 导航 */}
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 -mb-px border-b-2 transition-colors
              ${activeTab === tab.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="pt-4">
        {activeTab === 'general' && (
          <div className="space-y-4">
            <p className="text-muted-foreground">通用设置开发中...</p>
          </div>
        )}

        {activeTab === 'sync' && (
          <SyncSettingsView />
        )}

        {activeTab === 'shortcuts' && (
          <div className="space-y-4">
            <p className="text-muted-foreground">快捷键设置开发中...</p>
          </div>
        )}
      </div>
    </div>
  );
}
