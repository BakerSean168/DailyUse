/**
 * RegisterView
 *
 * 注册页面
 * Story-008: Auth & Account UI
 */

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function RegisterView() {
  const { register, loading, error, clearError } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!email.trim()) {
      errors.push('请输入邮箱');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('邮箱格式不正确');
    }

    if (!username.trim()) {
      errors.push('请输入用户名');
    } else if (username.length < 3) {
      errors.push('用户名至少 3 个字符');
    }

    if (!password) {
      errors.push('请输入密码');
    } else if (password.length < 6) {
      errors.push('密码至少 6 个字符');
    }

    if (password !== confirmPassword) {
      errors.push('两次输入的密码不一致');
    }

    if (!acceptTerms) {
      errors.push('请同意服务条款');
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
      await register({
        email: email.trim(),
        username: username.trim(),
        password,
      });
    } catch {
      // Error is already set in useAuth
    }
  };

  const allErrors = [...validationErrors, ...(error ? [error] : [])];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">DailyUse</h1>
          <p className="text-muted-foreground mt-2">创建新账户</p>
        </div>

        {/* Register Form */}
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

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                邮箱 <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-1"
              >
                用户名 <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
              >
                密码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（至少 6 位）"
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  autoComplete="new-password"
                  disabled={loading}
                  required
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
                placeholder="请再次输入密码"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                autoComplete="new-password"
                disabled={loading}
                required
              />
            </div>

            {/* Accept Terms */}
            <div>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="rounded mt-0.5"
                  disabled={loading}
                />
                <span className="text-muted-foreground">
                  我已阅读并同意{' '}
                  <a href="#" className="text-primary hover:underline">
                    服务条款
                  </a>{' '}
                  和{' '}
                  <a href="#" className="text-primary hover:underline">
                    隐私政策
                  </a>
                </span>
              </label>
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
                  注册中...
                </span>
              ) : (
                '注册'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t" />
            <span className="px-4 text-sm text-muted-foreground">或者</span>
            <div className="flex-1 border-t" />
          </div>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            已有账户？{' '}
            <Link to="/login" className="text-primary hover:underline">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterView;
