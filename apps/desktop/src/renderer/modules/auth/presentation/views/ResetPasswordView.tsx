/**
 * ResetPasswordView
 *
 * 重置密码页面（通过邮件链接访问）
 * Story-008: Auth & Account UI
 */

import { useState, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function ResetPasswordView() {
  const { resetPassword, loading, error, clearError } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get token from URL
  const token = searchParams.get('token') || '';

  // Form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!token) {
      errors.push('重置链接无效或已过期');
    }

    if (!newPassword) {
      errors.push('请输入新密码');
    } else if (newPassword.length < 6) {
      errors.push('密码至少 6 个字符');
    }

    if (newPassword !== confirmPassword) {
      errors.push('两次输入的密码不一致');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch {
      // Error is already set in useAuth
    }
  };

  const allErrors = [...validationErrors, ...(error ? [error] : [])];

  // No token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">链接无效</h2>
            <p className="text-muted-foreground mb-6">
              密码重置链接无效或已过期，请重新申请。
            </p>
            <Link
              to="/forgot-password"
              className="inline-block py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              重新申请
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2">密码重置成功</h2>
            <p className="text-muted-foreground mb-6">
              您的密码已重置成功，请使用新密码登录。
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              前往登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">DailyUse</h1>
          <p className="text-muted-foreground mt-2">设置新密码</p>
        </div>

        {/* Reset Password Form */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium mb-1"
              >
                新密码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码（至少 6 位）"
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-1"
              >
                确认密码 <span className="text-red-500">*</span>
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  重置中...
                </span>
              ) : (
                '重置密码'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              ← 返回登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordView;
