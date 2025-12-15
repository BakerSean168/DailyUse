# Story 13.32: Account 模块 UI 和 Views 实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.32 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 4: 系统模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 5h |
| 前置依赖 | Story 13.31 (Account Store) |
| 关联模块 | Account |

## 目标

实现 Account 模块的 UI 组件和页面视图。

## 任务列表

### 1. 创建 ProfileView 组件 (1.5h)
- [ ] 用户信息显示
- [ ] 头像上传
- [ ] 基本信息编辑

### 2. 创建 PreferencesView 组件 (2h)
- [ ] 主题设置
- [ ] 系统偏好设置
- [ ] 番茄钟设置
- [ ] 通知设置

### 3. 创建 AccountPage 页面 (1h)
- [ ] 整合所有账户设置
- [ ] 导出数据功能
- [ ] 危险操作区域

### 4. 路由集成 (0.5h)
- [ ] 配置路由
- [ ] 导航集成

## 技术规范

### ProfileView 组件
```typescript
// renderer/modules/account/presentation/components/ProfileView.tsx
import React, { useState, useRef } from 'react';
import { useProfile } from '../hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui';
import { Camera, Save, Loader2 } from 'lucide-react';

const TIMEZONES = [
  { value: 'Asia/Shanghai', label: '中国标准时间 (UTC+8)' },
  { value: 'Asia/Tokyo', label: '日本标准时间 (UTC+9)' },
  { value: 'America/New_York', label: '美国东部时间 (UTC-5)' },
  { value: 'America/Los_Angeles', label: '美国太平洋时间 (UTC-8)' },
  { value: 'Europe/London', label: '英国时间 (UTC)' },
  { value: 'Europe/Paris', label: '中欧时间 (UTC+1)' },
];

const LANGUAGES = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁体中文' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'ja-JP', label: '日本語' },
];

export const ProfileView: React.FC = () => {
  const { profile, isLoading, updateProfile, updateDisplayName, updateTimezone } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'Asia/Shanghai');
  const [language, setLanguage] = useState(profile?.language ?? 'zh-CN');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 or upload to server
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await updateProfile({ avatarUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        displayName,
        timezone,
        language,
      });
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: 'displayName' | 'timezone' | 'language', value: string) => {
    setIsDirty(true);
    switch (field) {
      case 'displayName':
        setDisplayName(value);
        break;
      case 'timezone':
        setTimezone(value);
        break;
      case 'language':
        setLanguage(value);
        break;
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>个人资料</CardTitle>
        <CardDescription>管理你的个人信息和偏好设置</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-2xl">
                {profile?.displayName?.[0]?.toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="font-medium">{profile?.displayName}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName">显示名称</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => handleChange('displayName', e.target.value)}
            placeholder="输入显示名称"
          />
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="timezone">时区</Label>
          <Select
            value={timezone}
            onValueChange={(value) => handleChange('timezone', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择时区" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language">语言</Label>
          <Select
            value={language}
            onValueChange={(value) => handleChange('language', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择语言" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        {isDirty && (
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存更改
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
```

### PreferencesView 组件
```typescript
// renderer/modules/account/presentation/components/PreferencesView.tsx
import React from 'react';
import { usePreferences } from '../hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
  Label,
  Slider,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@dailyuse/ui';
import { Sun, Moon, Monitor, Bell, Clock, Calendar } from 'lucide-react';

export const PreferencesView: React.FC = () => {
  const { preferences, updatePreference, setTheme, effectiveTheme } = usePreferences();

  if (!preferences) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {effectiveTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            外观
          </CardTitle>
          <CardDescription>自定义应用程序的外观</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>主题</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light', icon: Sun, label: '浅色' },
                { value: 'dark', icon: Moon, label: '深色' },
                { value: 'system', icon: Monitor, label: '跟随系统' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors
                    ${preferences.theme === value
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/50'
                    }
                  `}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            系统
          </CardTitle>
          <CardDescription>配置系统级行为</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>开机启动</Label>
              <p className="text-sm text-muted-foreground">系统启动时自动运行应用</p>
            </div>
            <Switch
              checked={preferences.startOnBoot}
              onCheckedChange={(checked) => updatePreference('startOnBoot', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>最小化到托盘</Label>
              <p className="text-sm text-muted-foreground">关闭窗口时最小化到系统托盘</p>
            </div>
            <Switch
              checked={preferences.minimizeToTray}
              onCheckedChange={(checked) => updatePreference('minimizeToTray', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>菜单栏图标</Label>
              <p className="text-sm text-muted-foreground">在菜单栏显示应用图标</p>
            </div>
            <Switch
              checked={preferences.showInMenuBar}
              onCheckedChange={(checked) => updatePreference('showInMenuBar', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            通知
          </CardTitle>
          <CardDescription>配置通知和提醒</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>通知声音</Label>
              <p className="text-sm text-muted-foreground">收到通知时播放声音</p>
            </div>
            <Switch
              checked={preferences.notificationSound}
              onCheckedChange={(checked) => updatePreference('notificationSound', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>每日摘要时间</Label>
            <Select
              value={preferences.dailyDigestTime ?? 'disabled'}
              onValueChange={(value) =>
                updatePreference('dailyDigestTime', value === 'disabled' ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择时间" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disabled">禁用</SelectItem>
                <SelectItem value="06:00">06:00</SelectItem>
                <SelectItem value="07:00">07:00</SelectItem>
                <SelectItem value="08:00">08:00</SelectItem>
                <SelectItem value="09:00">09:00</SelectItem>
                <SelectItem value="10:00">10:00</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            日历
          </CardTitle>
          <CardDescription>配置日历和任务默认设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>周起始日</Label>
            <Select
              value={String(preferences.weekStartsOn)}
              onValueChange={(value) =>
                updatePreference('weekStartsOn', Number(value) as 0 | 1 | 6)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">周日</SelectItem>
                <SelectItem value="1">周一</SelectItem>
                <SelectItem value="6">周六</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>默认视图</Label>
            <Select
              value={preferences.defaultView}
              onValueChange={(value) =>
                updatePreference('defaultView', value as 'today' | 'week' | 'month')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">今日</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pomodoro Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            番茄钟
          </CardTitle>
          <CardDescription>配置番茄工作法参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>工作时长</Label>
              <span className="text-sm font-medium">{preferences.pomodoroWorkMinutes} 分钟</span>
            </div>
            <Slider
              value={[preferences.pomodoroWorkMinutes]}
              onValueChange={([value]) => updatePreference('pomodoroWorkMinutes', value)}
              min={15}
              max={60}
              step={5}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>短休息时长</Label>
              <span className="text-sm font-medium">{preferences.pomodoroBreakMinutes} 分钟</span>
            </div>
            <Slider
              value={[preferences.pomodoroBreakMinutes]}
              onValueChange={([value]) => updatePreference('pomodoroBreakMinutes', value)}
              min={3}
              max={15}
              step={1}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>长休息时长</Label>
              <span className="text-sm font-medium">{preferences.pomodoroLongBreakMinutes} 分钟</span>
            </div>
            <Slider
              value={[preferences.pomodoroLongBreakMinutes]}
              onValueChange={([value]) => updatePreference('pomodoroLongBreakMinutes', value)}
              min={10}
              max={30}
              step={5}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>长休息间隔</Label>
              <span className="text-sm font-medium">
                每 {preferences.pomodoroSessionsBeforeLongBreak} 个番茄
              </span>
            </div>
            <Slider
              value={[preferences.pomodoroSessionsBeforeLongBreak]}
              onValueChange={([value]) =>
                updatePreference('pomodoroSessionsBeforeLongBreak', value)
              }
              min={2}
              max={6}
              step={1}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

### AccountPage 页面
```typescript
// renderer/modules/account/presentation/views/AccountPage.tsx
import React, { useState } from 'react';
import { ProfileView } from '../components/ProfileView';
import { PreferencesView } from '../components/PreferencesView';
import { useAccountStore } from '../stores';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@dailyuse/ui';
import {
  User,
  Settings,
  Download,
  Trash2,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { exportData, deleteAccount, isExporting, lastExport } = useAccountStore();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = async () => {
    try {
      await exportData({
        format: exportFormat,
        modules: ['tasks', 'goals', 'schedules', 'reminders', 'documents', 'preferences'],
      });
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      // Redirect to login or show confirmation
    } catch (error) {
      console.error('Delete account failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="account-page container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">账户设置</h1>
        <p className="text-muted-foreground">管理你的账户和偏好设置</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            个人资料
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            偏好设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileView />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <PreferencesView />
        </TabsContent>
      </Tabs>

      {/* Data Management Section */}
      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-semibold">数据管理</h2>

        {/* Export Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              导出数据
            </CardTitle>
            <CardDescription>
              导出你的所有数据，包括任务、目标、日程等
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                {lastExport && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    上次导出: {new Date(lastExport.exportedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <Button onClick={() => setShowExportDialog(true)}>
                <Download className="w-4 h-4 mr-2" />
                导出数据
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              危险操作
            </CardTitle>
            <CardDescription>
              这些操作不可逆，请谨慎操作
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">删除账户</p>
                <p className="text-sm text-muted-foreground">
                  永久删除你的账户和所有数据
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除账户
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确定要删除账户吗？</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作不可撤销。这将永久删除你的账户和所有相关数据，
                      包括任务、目标、日程、提醒、文档等。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          删除中...
                        </>
                      ) : (
                        '确认删除'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导出数据</DialogTitle>
            <DialogDescription>
              选择导出格式，导出的文件将保存到你选择的位置
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">导出格式</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'json', label: 'JSON', desc: '完整数据格式，可用于导入' },
                  { value: 'csv', label: 'CSV', desc: '表格格式，可用于Excel' },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setExportFormat(value as 'json' | 'csv')}
                    className={`
                      p-3 rounded-lg border-2 text-left transition-colors
                      ${exportFormat === value
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/50'
                      }
                    `}
                  >
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              取消
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
```

### 路由配置
```typescript
// renderer/modules/account/routes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
import { AccountPage } from './presentation/views/AccountPage';

export const accountRoutes: RouteObject[] = [
  {
    path: '/account',
    element: <AccountPage />,
  },
  {
    path: '/settings',
    element: <AccountPage />,
  },
];
```

### 模块索引
```typescript
// renderer/modules/account/index.ts
// Infrastructure
export { accountIPCClient } from './infrastructure/ipc';
export type {
  UserProfile,
  UserPreferences,
  UpdateProfileInput,
  UpdatePreferencesInput,
  ExportDataOptions,
  ExportDataResult,
} from './infrastructure/ipc';

// Presentation - Stores
export { useAccountStore } from './presentation/stores';

// Presentation - Hooks
export { usePreferences, useProfile } from './presentation/hooks';

// Presentation - Components
export { ProfileView } from './presentation/components/ProfileView';
export { PreferencesView } from './presentation/components/PreferencesView';

// Presentation - Views
export { AccountPage } from './presentation/views/AccountPage';

// Routes
export { accountRoutes } from './routes';
```

## 验收标准

- [ ] 个人资料显示和编辑正常
- [ ] 头像上传功能正常
- [ ] 所有偏好设置切换正常
- [ ] 主题切换实时生效
- [ ] 番茄钟设置滑块正常
- [ ] 数据导出功能正常
- [ ] 删除账户确认对话框正常
- [ ] 路由配置正确
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/account/presentation/components/ProfileView.tsx`
- `renderer/modules/account/presentation/components/PreferencesView.tsx`
- `renderer/modules/account/presentation/views/AccountPage.tsx`
- `renderer/modules/account/routes.tsx`
- `renderer/modules/account/index.ts`
