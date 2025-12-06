/**
 * Desktop App Root Component
 *
 * React + shadcn/ui 基础结构
 */

import { useState, useEffect } from 'react';

interface AppInfo {
  platform: string;
  version: string;
}

export function App() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [diStatus, setDiStatus] = useState<string>('checking...');

  useEffect(() => {
    // 获取应用信息
    window.electronAPI?.getAppInfo().then(setAppInfo);

    // 检查 DI 状态
    window.electronAPI?.checkDIStatus().then((status: boolean) => {
      setDiStatus(status ? '✅ Container 已初始化' : '❌ Container 未初始化');
    });
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">
          DailyUse Desktop
        </h1>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-xl font-semibold">系统信息</h2>

          {appInfo ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">平台：</span>
                {appInfo.platform}
              </p>
              <p>
                <span className="text-muted-foreground">版本：</span>
                {appInfo.version}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">加载中...</p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-xl font-semibold">依赖注入状态</h2>
          <p className="text-lg">{diStatus}</p>
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-xl font-semibold">STORY-002 验收</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>主进程 Container 注入成功</li>
            <li>SQLite Repository 适配器已注册</li>
            <li>IPC 通道已建立</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
