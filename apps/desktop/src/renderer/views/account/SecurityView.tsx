/**
 * SecurityView
 *
 * 安全设置页面（修改密码、双因素认证等）
 * Story-008: Auth & Account UI
 */

import { useState, type FormEvent } from 'react';
import { useAccount } from '../../hooks/useAccount';
import { useAuth } from '../../hooks/useAuth';

export function SecurityView() {
  const { account, loading: accountLoading } = useAccount();
  const { changePassword, logout, loading: authLoading, error, clearError } = useAuth();

  // Password change form
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const loading = accountLoading || authLoading;

  // Validate password form
  const validatePasswordForm = (): boolean => {
    const errors: string[] = [];

    if (!currentPassword) {
      errors.push('请输入当前密码');
    }

    if (!newPassword) {
      errors.push('请输入新密码');
    } else if (newPassword.length < 6) {
      errors.push('新密码至少 6 个字符');
    }

    if (newPassword !== confirmPassword) {
      errors.push('两次输入的新密码不一致');
    }

    if (currentPassword === newPassword) {
      errors.push('新密码不能与当前密码相同');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle password change submit
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setPasswordSuccess(false);

    if (!validatePasswordForm()) {
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setValidationErrors([]);
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch {
      // Error is already set in useAuth
    }
  };

  // Cancel password form
  const cancelPasswordForm = () => {
    setShowPasswordForm(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setValidationErrors([]);
    clearError();
  };

  const allErrors = [...validationErrors, ...(error ? [error] : [])];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold mb-6">安全设置</h1>

        {/* Success Message */}
        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm">
            ✅ 密码修改成功
          </div>
        )}

        {/* Password Section */}
        <div className="rounded-lg border bg-card p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">修改密码</h2>
              <p className="text-sm text-muted-foreground">
                定期更换密码可以提高账户安全性
              </p>
            </div>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                修改密码
              </button>
            )}
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4 border-t">
              {/* Error Messages */}
              {allErrors.length > 0 && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                  <ul className="list-disc list-inside space-y-1">
                    {allErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium mb-1"
                >
                  当前密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="请输入当前密码"
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPasswords ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium mb-1"
                >
                  新密码 <span className="text-red-500">*</span>
                </label>
                <input
                  id="newPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码（至少 6 位）"
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium mb-1"
                >
                  确认新密码 <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '修改中...' : '确认修改'}
                </button>
                <button
                  type="button"
                  onClick={cancelPasswordForm}
                  disabled={loading}
                  className="py-2 px-4 border rounded-md hover:bg-muted transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="rounded-lg border bg-card p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">双因素认证</h2>
              <p className="text-sm text-muted-foreground">
                添加额外的安全验证层来保护您的账户
              </p>
            </div>
            <div className="flex items-center gap-2">
              {account?.security?.twoFactorEnabled ? (
                <>
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    已启用
                  </span>
                  <button className="py-2 px-4 border rounded-md hover:bg-muted transition-colors">
                    管理
                  </button>
                </>
              ) : (
                <button className="py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  启用
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Sessions Section */}
        <div className="rounded-lg border bg-card p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-2">活动会话</h2>
          <p className="text-sm text-muted-foreground mb-4">
            查看和管理您的登录会话
          </p>

          <div className="space-y-3">
            {/* Current Session */}
            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
              <div className="flex items-center gap-3">
                <span className="text-xl">💻</span>
                <div>
                  <p className="font-medium">当前会话</p>
                  <p className="text-sm text-muted-foreground">
                    桌面应用 • 
                    {account?.stats?.lastLoginAt
                      ? ` 最后活动 ${new Date(account.stats.lastLoginAt).toLocaleString('zh-CN')}`
                      : ' 活跃中'}
                  </p>
                </div>
              </div>
              <span className="text-sm text-green-600">当前</span>
            </div>
          </div>

          <button
            className="mt-4 text-sm text-red-600 hover:underline"
            onClick={() => {
              // TODO: Implement logout all other sessions
            }}
          >
            退出所有其他会话
          </button>
        </div>

        {/* Danger Zone */}
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-red-700 mb-2">危险区域</h2>
          <p className="text-sm text-muted-foreground mb-4">
            以下操作不可逆，请谨慎操作
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">退出登录</p>
                <p className="text-sm text-muted-foreground">退出当前账户</p>
              </div>
              <button
                onClick={logout}
                className="py-2 px-4 border border-red-300 text-red-600 rounded-md hover:bg-red-100 transition-colors"
              >
                退出登录
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-red-200">
              <div>
                <p className="font-medium text-red-700">删除账户</p>
                <p className="text-sm text-muted-foreground">
                  永久删除您的账户和所有数据
                </p>
              </div>
              <button
                className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                onClick={() => {
                  // TODO: Implement account deletion confirmation
                }}
              >
                删除账户
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityView;
