import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DailyUse API',
      version: '1.0.0',
      description: 'DailyUse 应用的 REST API 文档',
      contact: {
        name: 'DailyUse Team',
        email: 'support@dailyuse.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3888/api/v1',
        description: '开发环境',
      },
      {
        url: 'https://api.dailyuse.com/v1',
        description: '生产环境',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // 通用响应结构
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '操作是否成功',
            },
            message: {
              type: 'string',
              description: '响应消息',
            },
            data: {
              type: 'object',
              description: '响应数据',
            },
            metadata: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'number',
                  description: '时间戳',
                },
                version: {
                  type: 'string',
                  description: 'API版本',
                },
              },
            },
          },
          required: ['success', 'message'],
        },
        // 分页响应结构
        PaginatedResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponse' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      description: '数据列表',
                    },
                    total: {
                      type: 'integer',
                      description: '总记录数',
                    },
                    page: {
                      type: 'integer',
                      description: '当前页码',
                    },
                    limit: {
                      type: 'integer',
                      description: '每页限制',
                    },
                    hasMore: {
                      type: 'boolean',
                      description: '是否有更多数据',
                    },
                  },
                },
              },
            },
          ],
        },
        // 错误响应结构
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: '错误消息',
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: '错误代码',
                },
                details: {
                  type: 'string',
                  description: '错误详情',
                },
              },
            },
          },
          required: ['success', 'message'],
        },
        // 认证相关 Schema
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: '用户名',
              example: 'Test1',
            },
            password: {
              type: 'string',
              description: '密码',
              example: 'test1@example.com',
            },
            accountType: {
              type: 'string',
              enum: ['GUEST', 'ADMIN'],
              default: 'GUEST',
              description: '账户类型',
            },
          },
        },
        LoginResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponse' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', description: 'JWT 令牌' },
                    refreshToken: { type: 'string', description: '刷新令牌' },
                    user: {
                      type: 'object',
                      properties: {
                        uuid: { type: 'string' },
                        username: { type: 'string' },
                        accountType: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
        // 任务相关 Schema
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '任务ID' },
            title: { type: 'string', description: '任务标题' },
            description: { type: 'string', description: '任务描述' },
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
              description: '任务状态',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
              description: '优先级',
            },
            dueDate: { type: 'string', format: 'date-time', description: '截止时间' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // 目标相关 Schema
        Goal: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '目标ID' },
            title: { type: 'string', description: '目标标题' },
            description: { type: 'string', description: '目标描述' },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'],
              description: '目标状态',
            },
            targetDate: { type: 'string', format: 'date-time', description: '目标日期' },
            progress: { type: 'number', minimum: 0, maximum: 100, description: '完成进度' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // 提醒相关 Schema
        Reminder: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '提醒ID' },
            title: { type: 'string', description: '提醒标题' },
            message: { type: 'string', description: '提醒内容' },
            triggerTime: { type: 'string', format: 'date-time', description: '触发时间' },
            repeatType: {
              type: 'string',
              enum: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'],
              description: '重复类型',
            },
            isActive: { type: 'boolean', description: '是否激活' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // 用户账户 Schema
        Account: {
          type: 'object',
          properties: {
            uuid: { type: 'string', description: '用户UUID' },
            username: { type: 'string', description: '用户名' },
            email: { type: 'string', format: 'email', description: '邮箱' },
            accountType: {
              type: 'string',
              enum: ['GUEST', 'ADMIN'],
              description: '账户类型',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
              description: '账户状态',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Repository 相关 Schema
        Repository: {
          type: 'object',
          properties: {
            uuid: { type: 'string', description: '仓储唯一标识' },
            accountUuid: { type: 'string', description: '账户UUID' },
            name: { type: 'string', description: '仓储名称' },
            type: {
              type: 'string',
              enum: ['local', 'remote', 'synchronized'],
              description: '仓储类型',
            },
            path: { type: 'string', description: '仓储路径' },
            description: { type: 'string', description: '仓储描述' },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'archived', 'syncing'],
              description: '仓储状态',
            },
            config: {
              type: 'object',
              properties: {
                enableGit: { type: 'boolean', description: '是否启用Git' },
                autoSync: { type: 'boolean', description: '是否自动同步' },
                syncInterval: { type: 'number', description: '同步间隔(分钟)' },
                defaultLinkedDocName: { type: 'string', description: '默认关联文档名称' },
                supportedFileTypes: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '支持的文件类型',
                },
                maxFileSize: { type: 'number', description: '最大文件大小(字节)' },
                enableVersionControl: { type: 'boolean', description: '是否启用版本控制' },
              },
            },
            relatedGoals: {
              type: 'array',
              items: { type: 'string' },
              description: '关联目标列表',
            },
            git: {
              type: 'object',
              properties: {
                isGitRepo: { type: 'boolean', description: '是否为Git仓库' },
                currentBranch: { type: 'string', description: '当前分支' },
                hasChanges: { type: 'boolean', description: '是否有未提交更改' },
                remoteUrl: { type: 'string', description: '远程仓库URL' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Resource: {
          type: 'object',
          properties: {
            uuid: { type: 'string', description: '资源唯一标识' },
            repositoryUuid: { type: 'string', description: '所属仓储UUID' },
            name: { type: 'string', description: '资源名称' },
            type: {
              type: 'string',
              enum: ['markdown', 'image', 'video', 'audio', 'pdf', 'link', 'code', 'other'],
              description: '资源类型',
            },
            path: { type: 'string', description: '资源路径' },
            size: { type: 'number', description: '资源大小(字节)' },
            description: { type: 'string', description: '资源描述' },
            author: { type: 'string', description: '作者' },
            version: { type: 'string', description: '版本' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: '标签列表',
            },
            category: { type: 'string', description: '分类' },
            status: {
              type: 'string',
              enum: ['active', 'archived', 'deleted', 'draft'],
              description: '资源状态',
            },
            metadata: { type: 'object', description: '资源元数据' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/modules/**/interface/http/routes.ts',
    './src/modules/**/interface/http/routes/**/*.ts',
    './src/modules/**/routes.ts',
    './src/modules/**/*.routes.ts',
    './src/shared/types/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  // Swagger UI 路径
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      swaggerOptions: {
        filter: true,
        showRequestHeaders: true,
      },
    }),
  );

  // 提供 OpenAPI JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger UI 已启用: http://localhost:3888/api-docs');
  console.log('📄 OpenAPI JSON: http://localhost:3888/api-docs.json');
}

export { specs as swaggerSpecs };
