# Story 13.33: Auth 模块实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.33 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 4: 系统模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 6h |
| 前置依赖 | Story 13.32 (Account UI) |
| 关联模块 | Auth |

## 目标

实现 Auth 模块的完整架构，包括 Main Process Handler、IPC Client、Store 和 UI 组件。

## 任务列表

### 1. Main Process Auth Handler (2h)
- [ ] 实现本地认证
- [ ] 实现 OAuth 认证（可选）
- [ ] Session 管理
- [ ] Token 存储

### 2. Renderer Process Auth Client (1h)
- [ ] IPC Client 实现
- [ ] 类型定义

### 3. Auth Store (1.5h)
- [ ] 认证状态管理
- [ ] 登录/登出 Actions
- [ ] Session 恢复

### 4. Auth UI 组件 (1.5h)
- [ ] 登录页面
- [ ] 注册页面
- [ ] 认证守卫

## 技术规范

### Main Process Auth Handler
```typescript
// main/modules/auth/authHandler.ts
import { ipcMain, BrowserWindow, safeStorage } from 'electron';
import { db } from '../../database';
import * as crypto from 'crypto';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

class AuthHandler {
  private mainWindow: BrowserWindow | null = null;
  private currentSession: AuthSession | null = null;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  register() {
    // Local Auth
    ipcMain.handle('auth:login', async (_, credentials: AuthCredentials) => {
      return this.login(credentials);
    });

    ipcMain.handle('auth:register', async (_, credentials: AuthCredentials) => {
      return this.register(credentials);
    });

    ipcMain.handle('auth:logout', async () => {
      return this.logout();
    });

    ipcMain.handle('auth:check-session', async () => {
      return this.checkSession();
    });

    ipcMain.handle('auth:refresh-session', async () => {
      return this.refreshSession();
    });

    // OAuth
    ipcMain.handle('auth:oauth-login', async (_, provider: string) => {
      return this.oauthLogin(provider);
    });

    console.log('[AuthHandler] Registered');
  }

  // ===== Local Authentication =====

  private async login(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const user = await db.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user) {
        return { success: false, error: '用户不存在' };
      }

      // Verify password
      const isValid = await this.verifyPassword(credentials.password, user.passwordHash);
      if (!isValid) {
        return { success: false, error: '密码错误' };
      }

      // Create session
      const session = await this.createSession(user.uuid);
      this.currentSession = session;

      // Store token securely
      if (safeStorage.isEncryptionAvailable()) {
        const encryptedToken = safeStorage.encryptString(session.token);
        await db.appState.upsert({
          where: { key: 'auth_token' },
          update: { value: encryptedToken.toString('base64') },
          create: { key: 'auth_token', value: encryptedToken.toString('base64') },
        });
      }

      this.emitEvent('auth:session-changed', { isAuthenticated: true, userId: user.uuid });

      return { success: true, session };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async register(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      // Check if user exists
      const existing = await db.user.findUnique({
        where: { email: credentials.email },
      });

      if (existing) {
        return { success: false, error: '邮箱已被注册' };
      }

      // Hash password
      const passwordHash = await this.hashPassword(credentials.password);

      // Create user
      const user = await db.user.create({
        data: {
          uuid: crypto.randomUUID(),
          email: credentials.email,
          passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create profile
      await db.userProfile.create({
        data: {
          uuid: crypto.randomUUID(),
          userId: user.uuid,
          email: credentials.email,
          displayName: credentials.email.split('@')[0],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: 'zh-CN',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Auto login
      return this.login(credentials);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async logout(): Promise<void> {
    // Clear session
    if (this.currentSession) {
      await db.session.delete({
        where: { token: this.currentSession.token },
      }).catch(() => {});
    }

    // Clear stored token
    await db.appState.delete({
      where: { key: 'auth_token' },
    }).catch(() => {});

    this.currentSession = null;
    this.emitEvent('auth:session-changed', { isAuthenticated: false, userId: null });
  }

  private async checkSession(): Promise<AuthSession | null> {
    if (this.currentSession && this.currentSession.expiresAt > new Date()) {
      return this.currentSession;
    }

    // Try to restore from storage
    try {
      const stored = await db.appState.findUnique({
        where: { key: 'auth_token' },
      });

      if (stored && safeStorage.isEncryptionAvailable()) {
        const token = safeStorage.decryptString(Buffer.from(stored.value, 'base64'));
        const session = await db.session.findUnique({
          where: { token },
        });

        if (session && session.expiresAt > new Date()) {
          this.currentSession = {
            userId: session.userId,
            token: session.token,
            expiresAt: session.expiresAt,
          };
          return this.currentSession;
        }
      }
    } catch (error) {
      console.error('[AuthHandler] Failed to restore session:', error);
    }

    return null;
  }

  private async refreshSession(): Promise<AuthSession | null> {
    if (!this.currentSession) {
      return null;
    }

    try {
      const newSession = await this.createSession(this.currentSession.userId);
      
      // Delete old session
      await db.session.delete({
        where: { token: this.currentSession.token },
      }).catch(() => {});

      this.currentSession = newSession;

      // Update stored token
      if (safeStorage.isEncryptionAvailable()) {
        const encryptedToken = safeStorage.encryptString(newSession.token);
        await db.appState.upsert({
          where: { key: 'auth_token' },
          update: { value: encryptedToken.toString('base64') },
          create: { key: 'auth_token', value: encryptedToken.toString('base64') },
        });
      }

      return newSession;
    } catch (error) {
      console.error('[AuthHandler] Failed to refresh session:', error);
      return null;
    }
  }

  // ===== OAuth =====

  private async oauthLogin(provider: string): Promise<AuthResult> {
    // OAuth implementation placeholder
    // Would open OAuth window, handle callback, etc.
    return { success: false, error: 'OAuth not implemented' };
  }

  // ===== Helpers =====

  private async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16);
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
      });
    });
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const [salt, key] = hash.split(':');
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, Buffer.from(salt, 'hex'), 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('hex') === key);
      });
    });
  }

  private async createSession(userId: string): Promise<AuthSession> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.session.create({
      data: {
        token,
        userId,
        expiresAt,
        createdAt: new Date(),
      },
    });

    return { userId, token, expiresAt };
  }

  private emitEvent(channel: string, data: unknown) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}

export const authHandler = new AuthHandler();
```

### Auth IPC Client
```typescript
// renderer/modules/auth/infrastructure/ipc/authIPCClient.ts
import { BaseIPCClient } from '../../../../infrastructure/ipc';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

export interface SessionChangeEvent {
  isAuthenticated: boolean;
  userId: string | null;
}

export interface AuthIPCClient {
  login(credentials: AuthCredentials): Promise<AuthResult>;
  register(credentials: AuthCredentials): Promise<AuthResult>;
  logout(): Promise<void>;
  checkSession(): Promise<AuthSession | null>;
  refreshSession(): Promise<AuthSession | null>;
  oauthLogin(provider: string): Promise<AuthResult>;
  onSessionChanged(callback: (event: SessionChangeEvent) => void): () => void;
}

class AuthIPCClientImpl extends BaseIPCClient implements AuthIPCClient {
  constructor() {
    super('auth');
  }

  async login(credentials: AuthCredentials): Promise<AuthResult> {
    return this.invoke<AuthResult>('login', credentials);
  }

  async register(credentials: AuthCredentials): Promise<AuthResult> {
    return this.invoke<AuthResult>('register', credentials);
  }

  async logout(): Promise<void> {
    return this.invoke<void>('logout');
  }

  async checkSession(): Promise<AuthSession | null> {
    return this.invoke<AuthSession | null>('check-session');
  }

  async refreshSession(): Promise<AuthSession | null> {
    return this.invoke<AuthSession | null>('refresh-session');
  }

  async oauthLogin(provider: string): Promise<AuthResult> {
    return this.invoke<AuthResult>('oauth-login', provider);
  }

  onSessionChanged(callback: (event: SessionChangeEvent) => void): () => void {
    return this.on('session-changed', callback);
  }
}

export const authIPCClient = new AuthIPCClientImpl();
```

### Auth Store
```typescript
// renderer/modules/auth/presentation/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  authIPCClient,
  type AuthCredentials,
  type AuthSession,
  type AuthResult,
} from '../../infrastructure/ipc';

interface AuthState {
  isAuthenticated: boolean;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: AuthCredentials) => Promise<AuthResult>;
  register: (credentials: AuthCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  isAuthenticated: false,
  session: null,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authIPCClient.login(credentials);
          if (result.success && result.session) {
            set({
              isAuthenticated: true,
              session: result.session,
              isLoading: false,
            });
          } else {
            set({
              error: result.error ?? '登录失败',
              isLoading: false,
            });
          }
          return result;
        } catch (error) {
          const errorMessage = (error as Error).message;
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      register: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authIPCClient.register(credentials);
          if (result.success && result.session) {
            set({
              isAuthenticated: true,
              session: result.session,
              isLoading: false,
            });
          } else {
            set({
              error: result.error ?? '注册失败',
              isLoading: false,
            });
          }
          return result;
        } catch (error) {
          const errorMessage = (error as Error).message;
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authIPCClient.logout();
          set({
            isAuthenticated: false,
            session: null,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
        }
      },

      checkSession: async () => {
        set({ isLoading: true });
        try {
          const session = await authIPCClient.checkSession();
          if (session) {
            set({
              isAuthenticated: true,
              session,
              isLoading: false,
            });
          } else {
            set({
              isAuthenticated: false,
              session: null,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            isAuthenticated: false,
            session: null,
            isLoading: false,
          });
        }
      },

      refreshSession: async () => {
        try {
          const session = await authIPCClient.refreshSession();
          if (session) {
            set({ session });
          }
        } catch (error) {
          // Session refresh failed, will need to re-login
        }
      },

      clearError: () => {
        set({ error: null });
      },

      initialize: async () => {
        await get().checkSession();

        // Listen for session changes from main process
        authIPCClient.onSessionChanged((event) => {
          set({
            isAuthenticated: event.isAuthenticated,
            session: event.isAuthenticated ? get().session : null,
          });
        });

        // Auto refresh session before expiry
        const { session } = get();
        if (session) {
          const timeUntilExpiry = new Date(session.expiresAt).getTime() - Date.now();
          const refreshTime = timeUntilExpiry - 24 * 60 * 60 * 1000; // 1 day before expiry
          
          if (refreshTime > 0) {
            setTimeout(() => {
              get().refreshSession();
            }, refreshTime);
          }
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        // Don't persist sensitive data
      }),
    }
  )
);
```

### Login Page
```typescript
// renderer/modules/auth/presentation/views/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Alert,
  AlertDescription,
} from '@dailyuse/ui';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const result = await login({ email, password });
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">欢迎回来</CardTitle>
          <CardDescription>登录到你的账户继续使用</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              还没有账户？{' '}
              <Link to="/auth/register" className="text-primary hover:underline">
                注册
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
```

### Register Page
```typescript
// renderer/modules/auth/presentation/views/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Alert,
  AlertDescription,
} from '@dailyuse/ui';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    // Validate
    if (password.length < 8) {
      setValidationError('密码至少需要8个字符');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('两次输入的密码不一致');
      return;
    }
    
    const result = await register({ email, password });
    if (result.success) {
      navigate('/');
    }
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">创建账户</CardTitle>
          <CardDescription>注册一个新账户开始使用</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {displayError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少8个字符"
                  className="pl-10"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              已有账户？{' '}
              <Link to="/auth/login" className="text-primary hover:underline">
                登录
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
```

### Auth Guard
```typescript
// renderer/modules/auth/presentation/components/AuthGuard.tsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

### Routes
```typescript
// renderer/modules/auth/routes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
import { LoginPage } from './presentation/views/LoginPage';
import { RegisterPage } from './presentation/views/RegisterPage';

export const authRoutes: RouteObject[] = [
  {
    path: '/auth/login',
    element: <LoginPage />,
  },
  {
    path: '/auth/register',
    element: <RegisterPage />,
  },
];
```

### Module Index
```typescript
// renderer/modules/auth/index.ts
// Infrastructure
export { authIPCClient } from './infrastructure/ipc';
export type {
  AuthCredentials,
  AuthSession,
  AuthResult,
  SessionChangeEvent,
} from './infrastructure/ipc';

// Presentation - Stores
export { useAuthStore } from './presentation/stores';

// Presentation - Components
export { AuthGuard } from './presentation/components/AuthGuard';

// Presentation - Views
export { LoginPage } from './presentation/views/LoginPage';
export { RegisterPage } from './presentation/views/RegisterPage';

// Routes
export { authRoutes } from './routes';
```

## 验收标准

- [ ] 本地登录功能正常
- [ ] 本地注册功能正常
- [ ] 密码安全存储（scrypt 哈希）
- [ ] Session 持久化
- [ ] Session 自动恢复
- [ ] Session 刷新机制
- [ ] 登出功能正常
- [ ] AuthGuard 保护路由正常
- [ ] 错误提示清晰
- [ ] TypeScript 类型检查通过

## 相关文件

- `main/modules/auth/authHandler.ts`
- `main/modules/auth/index.ts`
- `renderer/modules/auth/infrastructure/ipc/authIPCClient.ts`
- `renderer/modules/auth/presentation/stores/authStore.ts`
- `renderer/modules/auth/presentation/views/LoginPage.tsx`
- `renderer/modules/auth/presentation/views/RegisterPage.tsx`
- `renderer/modules/auth/presentation/components/AuthGuard.tsx`
- `renderer/modules/auth/routes.tsx`
- `renderer/modules/auth/index.ts`
