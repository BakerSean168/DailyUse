/**
 * ForgotPasswordView
 *
 * 忘记密码页面
 * Story-008: Auth & Account UI
 */

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ForgotPasswordView() {
  const { forgotPassword, loading, error, clearError } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Validation
  const [validationError, setValidationError] = useState('');

  // Validate form
  const validateForm = (): boolean => {
    if (!email.trim()) {
      setValidationError('请输入邮箱');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('邮箱格式不正确');
      return false;
    }
    setValidationError('');
    return true;
  };

  // Handle form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch {
      // Error is already set in useAuth
    }
  };

  const displayError = validationError || error;

  // Success state
  if (submitted && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">DailyUse</h1>
          </div>

          {/* Success Message */}
          <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-xl font-semibold mb-2">重置邮件已发送</h2>
            <p className="text-muted-foreground mb-6">
              如果该邮箱已注册，您将收到一封包含密码重置链接的邮件。
              请检查您的收件箱（包括垃圾邮件文件夹）。
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              邮件发送至: <strong>{email}</strong>
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                className="w-full py-2 px-4 border rounded-md hover:bg-muted transition-colors"
              >
                使用其他邮箱
              </button>
              <Link
                to="/login"
                className="block w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-center transition-colors"
              >
                返回登录
              </Link>
            </div>
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
          <p className="text-muted-foreground mt-2">重置密码</p>
        </div>

        {/* Forgot Password Form */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <p className="text-sm text-muted-foreground">
              输入您的邮箱地址，我们将发送密码重置链接
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {displayError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                {displayError}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入注册时使用的邮箱"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                autoComplete="email"
                disabled={loading}
                required
                autoFocus
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
                  发送中...
                </span>
              ) : (
                '发送重置链接'
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

export default ForgotPasswordView;
