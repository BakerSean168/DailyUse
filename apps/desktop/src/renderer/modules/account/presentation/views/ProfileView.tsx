/**
 * ProfileView
 *
 * 个人资料页面
 * Story-008: Auth & Account UI
 */

import { useState, type FormEvent } from 'react';
import { useAccount } from '../../hooks/useAccount';

export function ProfileView() {
  const { account, loading, error, updateProfile, clearError, refresh } =
    useAccount();

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('');
  const [language, setLanguage] = useState('');

  // Save status
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form when account loads or edit mode starts
  const startEditing = () => {
    if (account) {
      setDisplayName(account.profile?.displayName || '');
      setBio(account.profile?.bio || '');
      setLocation(account.profile?.location || '');
      setTimezone(account.profile?.timezone || 'Asia/Shanghai');
      setLanguage(account.profile?.language || 'zh-CN');
    }
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    clearError();
  };

  // Handle form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setSaveSuccess(false);

    try {
      await updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        timezone,
        language,
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Error is already set in useAccount
    }
  };

  // Loading state
  if (loading && !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl animate-spin mb-4">⏳</div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">个人资料</h1>
          {!isEditing && (
            <button
              onClick={startEditing}
              className="py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              编辑资料
            </button>
          )}
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm">
            ✅ 资料更新成功
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {isEditing ? (
            // Edit Form
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-3xl">
                  {account?.profile?.avatar ? (
                    <img
                      src={account.profile.avatar}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    '👤'
                  )}
                </div>
                <button
                  type="button"
                  className="py-2 px-4 border rounded-md hover:bg-muted transition-colors"
                >
                  更换头像
                </button>
              </div>

              {/* Display Name */}
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium mb-1"
                >
                  显示名称
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="请输入显示名称"
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium mb-1">
                  个人简介
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="介绍一下自己"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  disabled={loading}
                />
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium mb-1"
                >
                  所在地
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="如：北京"
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
              </div>

              {/* Timezone */}
              <div>
                <label
                  htmlFor="timezone"
                  className="block text-sm font-medium mb-1"
                >
                  时区
                </label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                >
                  <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
                  <option value="Asia/Tokyo">日本标准时间 (UTC+9)</option>
                  <option value="America/New_York">美国东部时间 (UTC-5)</option>
                  <option value="America/Los_Angeles">
                    美国太平洋时间 (UTC-8)
                  </option>
                  <option value="Europe/London">伦敦时间 (UTC+0)</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label
                  htmlFor="language"
                  className="block text-sm font-medium mb-1"
                >
                  语言
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English (US)</option>
                  <option value="ja-JP">日本語</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={loading}
                  className="py-2 px-4 border rounded-md hover:bg-muted transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            // View Mode
            <div className="space-y-6">
              {/* Avatar & Basic Info */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-3xl">
                  {account?.profile?.avatar ? (
                    <img
                      src={account.profile.avatar}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    '👤'
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {account?.profile?.displayName || account?.username || '用户'}
                  </h2>
                  <p className="text-muted-foreground">@{account?.username}</p>
                </div>
              </div>

              {/* Bio */}
              {account?.profile?.bio && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    个人简介
                  </h3>
                  <p>{account.profile.bio}</p>
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    邮箱
                  </h3>
                  <p className="flex items-center gap-1">
                    {account?.email}
                    {account?.emailVerified && (
                      <span title="已验证" className="text-green-500">
                        ✓
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    所在地
                  </h3>
                  <p>{account?.profile?.location || '未设置'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    时区
                  </h3>
                  <p>{account?.profile?.timezone || 'Asia/Shanghai'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    语言
                  </h3>
                  <p>
                    {account?.profile?.language === 'zh-CN'
                      ? '简体中文'
                      : account?.profile?.language === 'en-US'
                        ? 'English (US)'
                        : account?.profile?.language || '简体中文'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    注册时间
                  </h3>
                  <p>
                    {account?.createdAt
                      ? new Date(account.createdAt).toLocaleDateString('zh-CN')
                      : '未知'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    账户状态
                  </h3>
                  <p className="inline-flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        account?.status === 'ACTIVE'
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                      }`}
                    />
                    {account?.status === 'ACTIVE' ? '正常' : account?.status}
                  </p>
                </div>
              </div>

              {/* Refresh Button */}
              <div className="pt-4 border-t">
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="text-sm text-primary hover:underline"
                >
                  {loading ? '刷新中...' : '刷新资料'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileView;
