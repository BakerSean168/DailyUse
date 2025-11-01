import express, {
  type Express,
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
// TEMPORARY: Comment out AccountController until we properly refactor it
import accountRouter from './modules/account/interface/http/accountRoutes';
import authenticationRouter from './modules/authentication/interface/http/authenticationRoutes';
import taskRouter from './modules/task/interface/http/routes/index';
import goalRouter from './modules/goal/interface/http/goalRoutes';
import goalFolderRouter from './modules/goal/interface/http/goalFolderRoutes';
import focusSessionRouter from './modules/goal/interface/http/focusSessionRoutes';
import weightSnapshotRouter from './modules/goal/interface/http/weightSnapshotRoutes';
import reminderRouter from './modules/reminder/interface/http/reminderRoutes';
import scheduleRouter from './modules/schedule/interface/http/routes/scheduleRoutes';
import notificationRouter from './modules/notification/interface/http/notificationRoutes';
import notificationSSERouter from './modules/notification/interface/http/sseRoutes';
// import settingRouter from './modules/setting/interface/http/settingRoutes'; // TEMPORARILY DISABLED
// import themeRoutes from './modules/theme/interface/http/themeRoutes';
import editorRouter from './modules/editor/interface/http/routes/editorRoutes';
import repositoryRouter from './modules/repository/interface/http/routes/repositoryRoutes';
import repositoryNewRouter from './modules/repository-new/presentation/RepositoryController';
import resourceNewRouter from './modules/repository-new/presentation/ResourceController';
import metricsRouter from './modules/metrics/interface/http/routes/metricsRoutes';

import { authMiddleware, optionalAuthMiddleware } from './shared/middlewares/index';
import { setupSwagger } from './config/swagger';
import { createLogger } from '@dailyuse/utils';
import { performanceMiddleware } from './middleware/performance.middleware';

const logger = createLogger('Express');
const app: Express = express();

// Env / CORS origins (comma separated)
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean);

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // 允许非浏览器客户端（没有 origin header）
      if (!origin) return callback(null, true);
      
      // 如果配置了通配符 *，允许所有源
      if (allowedOrigins.includes('*')) return callback(null, true);
      
      // 检查是否在允许列表中
      if (allowedOrigins.includes(origin)) return callback(null, true);
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);
app.use(compression());

// Performance monitoring middleware
app.use(performanceMiddleware);

// API v1 router
const api = Router();
api.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// 挂载账户路由到api路由器
api.use('/accounts', accountRouter);

// 挂载认证路由到 api 路由器 (登录/登出/刷新等) - 不需要认证
api.use('/auth', authenticationRouter);

// 应用认证中间件到需要认证的路由
// 注意：认证相关的路由（如登录、注册）应该放在认证中间件之前
/**
 * 任务模块
 */
// 挂载任务管理路由 - 需要认证
api.use('/tasks', authMiddleware, taskRouter);

/**
 * 目标模块
 */
// 挂载目标管理路由 - 需要认证
api.use('/goals', authMiddleware, goalRouter);

// 挂载目标文件夹管理路由 - 需要认证
api.use('/goal-folders', authMiddleware, goalFolderRouter);

// 挂载专注周期管理路由 - 需要认证（路由内部已有 authMiddleware）
api.use('', focusSessionRouter);

// 挂载权重快照管理路由 - 需要认证
api.use('', authMiddleware, weightSnapshotRouter);

/**
 * 提醒模块
 */
// 挂载提醒管理路由 - 需要认证
api.use('/reminders', authMiddleware, reminderRouter);

/**
 * schedule 调度模块
 */
// 挂载任务调度管理路由 - 需要认证
api.use('/schedules', authMiddleware, scheduleRouter);

/**
 * editor 编辑器模块
 */
// 挂载编辑器聚合根路由 - 需要认证
api.use('/editor', authMiddleware, editorRouter);

/**
 * repository 仓储模块
 */
// 挂载仓储路由 - 需要认证
api.use('/repositories', authMiddleware, repositoryRouter);

/**
 * repository-new 仓储模块 (Epic 7 重构版本 - MVP)
 * DDD 架构 - Repository 聚合根 + Resource 实体
 */
// 挂载新版仓储路由 - 内置简单认证中间件（TODO: 升级为 JWT）
api.use('', repositoryNewRouter);
api.use('', resourceNewRouter);

/**
 * setting 设置模块
 */
// 挂载用户设置路由 - 需要认证
// TEMPORARILY DISABLED due to UserSetting compilation issues
// api.use('/settings', authMiddleware, settingRouter);

/**
 * metrics 性能指标模块
 */
// 挂载性能指标路由 - 需要认证
api.use('/metrics', authMiddleware, metricsRouter);

/**
 * theme 主题模块
 */
// 挂载主题管理路由 - 需要认证
// api.use('/theme', authMiddleware, themeRoutes);

/**
 * notification 通知模块
 */
// 挂载通知 SSE 路由 - 必须在 /notifications 之前！（避免被 authMiddleware 拦截）
// token 通过 URL 参数传递，路由内部自行验证
api.use('/notifications/sse', notificationSSERouter);

// 挂载通知管理路由 - 需要认证
api.use('/notifications', authMiddleware, notificationRouter);
// api.use('/notification-preferences', authMiddleware, notificationPreferenceRouter);
// api.use('/notification-templates', authMiddleware, notificationTemplateRouter);

// 注意：所有模块的初始化都通过 shared/initialization/initializer.ts 统一管理
// NotificationApplicationService, UserPreferencesApplicationService, ThemeApplicationService
// NotificationTemplateController 等所有服务和控制器
// 都在各自模块的 initialization 层中初始化，并可通过 getInstance() 获取单例

logger.info('Notification and event system initialized successfully');

// Setup Swagger documentation
setupSwagger(app);

app.use('/api/v1', api);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Not Found' });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Express error handler caught error', err, {
    status: err?.status,
    code: err?.code,
    message: err?.message,
  });
  const status = Number(err?.status ?? 500);
  res.status(status).json({
    code: err?.code ?? 'INTERNAL_ERROR',
    message: err?.message ?? 'Internal Server Error',
  });
});

export default app;
