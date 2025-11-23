---
tags:
  - guide
  - development
  - debugging
  - troubleshooting
description: DailyUse调试指南 - 前端、后端、全栈调试技巧与工具
created: 2025-11-23T16:30:00
updated: 2025-11-23T16:30:00
---

# 🐛 调试指南 (Debugging Guide)

> 高效的调试技巧，快速定位和解决问题

## 📋 目录

- [调试策略](#调试策略)
- [后端调试](#后端调试)
- [前端调试](#前端调试)
- [全栈调试](#全栈调试)
- [数据库调试](#数据库调试)
- [性能调试](#性能调试)
- [调试工具](#调试工具)

---

## 🎯 调试策略

### 调试思维

```
1. 复现问题 → 2. 定位问题 → 3. 分析原因 → 4. 解决问题 → 5. 验证修复
```

### 调试步骤

1. **复现问题**
   - 记录详细步骤
   - 确定触发条件
   - 收集错误信息

2. **定位问题**
   - 使用日志追踪
   - 设置断点调试
   - 二分法缩小范围

3. **分析原因**
   - 检查数据流
   - 验证假设
   - 查看相关代码

4. **解决问题**
   - 实施修复方案
   - 添加防御性代码
   - 更新错误处理

5. **验证修复**
   - 运行测试
   - 手动测试
   - 监控日志

---

## 🏗 后端调试

### VS Code调试配置

**`.vscode/launch.json`**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["nx", "serve", "api"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug API Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["nx", "test", "api", "--run", "--inspect-brk"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Attach to API",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### 启动调试服务器

```bash
# 启动调试模式
pnpm nx serve api --inspect

# 指定调试端口
pnpm nx serve api --inspect=9229

# 在第一行代码处暂停
pnpm nx serve api --inspect-brk
```

### NestJS日志调试

**添加日志**

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class GoalService {
  private readonly logger = new Logger(GoalService.name);

  async create(dto: CreateGoalDto): Promise<Goal> {
    this.logger.debug(`Creating goal: ${JSON.stringify(dto)}`);
    
    const goal = GoalEntity.create(dto);
    this.logger.debug(`Created goal entity: ${goal.id}`);
    
    const savedGoal = await this.repository.save(goal);
    this.logger.log(`Goal saved successfully: ${savedGoal.id}`);
    
    return savedGoal;
  }

  async findById(id: string): Promise<Goal> {
    this.logger.debug(`Finding goal by ID: ${id}`);
    
    const goal = await this.repository.findById(id);
    
    if (!goal) {
      this.logger.warn(`Goal not found: ${id}`);
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }
    
    return goal;
  }
}
```

**日志级别**

```typescript
// 日志级别优先级（从高到低）
logger.error('错误信息');      // 0 - 错误
logger.warn('警告信息');       // 1 - 警告
logger.log('一般信息');        // 2 - 信息
logger.debug('调试信息');      // 3 - 调试
logger.verbose('详细信息');    // 4 - 详细
```

**配置日志级别**

```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log'], // 生产环境
  // logger: ['error', 'warn', 'log', 'debug', 'verbose'], // 开发环境
});
```

### 断点调试技巧

#### 条件断点

```typescript
// 只在特定条件下暂停
async findById(id: string): Promise<Goal> {
  // 右键断点 → 条件断点 → 输入: id === 'specific-id'
  const goal = await this.repository.findById(id);
  return goal;
}
```

#### 日志断点

```typescript
// 不暂停执行，只输出日志
async create(dto: CreateGoalDto): Promise<Goal> {
  // 右键断点 → 日志点 → 输入: Creating goal with title: {dto.title}
  const goal = GoalEntity.create(dto);
  return goal;
}
```

#### Hit Count断点

```typescript
// 命中N次后暂停
for (let i = 0; i < 1000; i++) {
  // 右键断点 → Hit Count → 输入: 100
  process(i);
}
```

### 调试装饰器

```typescript
// 创建调试装饰器
function DebugMethod(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    console.log(`[DEBUG] Calling ${propertyKey} with args:`, args);
    
    const startTime = Date.now();
    const result = await originalMethod.apply(this, args);
    const endTime = Date.now();
    
    console.log(`[DEBUG] ${propertyKey} returned:`, result);
    console.log(`[DEBUG] ${propertyKey} took ${endTime - startTime}ms`);
    
    return result;
  };

  return descriptor;
}

// 使用装饰器
@Injectable()
export class GoalService {
  @DebugMethod
  async create(dto: CreateGoalDto): Promise<Goal> {
    // ...
  }
}
```

---

## 🖼 前端调试

### Vue DevTools

**安装**

- [Chrome Extension](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- [Firefox Add-on](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

**功能**

1. **组件树** - 查看组件层级和props
2. **事件追踪** - 监听自定义事件
3. **状态管理** - 查看Pinia store状态
4. **性能分析** - 组件渲染性能
5. **路由追踪** - 查看路由变化

### Browser DevTools

#### Console调试

```typescript
// 打印对象
console.log('Goal:', goal);

// 打印表格
console.table([goal1, goal2, goal3]);

// 分组日志
console.group('Goal Creation');
console.log('Step 1: Validate');
console.log('Step 2: Create');
console.log('Step 3: Save');
console.groupEnd();

// 计时
console.time('fetchGoals');
await fetchGoals();
console.timeEnd('fetchGoals');

// 断言
console.assert(goal.id, 'Goal should have an ID');

// 追踪调用栈
console.trace('Goal created');
```

#### Debugger语句

```typescript
async function createGoal(dto: CreateGoalDto) {
  console.log('Creating goal:', dto);
  
  // 触发断点
  debugger;
  
  const goal = await api.createGoal(dto);
  return goal;
}
```

#### Network调试

1. 打开Network面板
2. 筛选XHR/Fetch请求
3. 查看请求详情：
   - Headers（请求头）
   - Payload（请求体）
   - Response（响应）
   - Timing（耗时）

#### Source Map调试

**配置Source Map**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: true, // 生成source map
  },
});
```

### Vue组件调试

**使用 `$inspect`**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';

const goal = ref<Goal>();

onMounted(() => {
  // 暴露到全局，方便在Console中调试
  window.$goal = goal;
});
</script>
```

**调试响应式数据**

```typescript
import { reactive, watchEffect } from 'vue';

const state = reactive({ count: 0 });

// 监听所有响应式变化
watchEffect(() => {
  console.log('State changed:', state);
});
```

**调试生命周期**

```vue
<script setup lang="ts">
import { onMounted, onUpdated, onUnmounted } from 'vue';

onMounted(() => {
  console.log('[Lifecycle] Component mounted');
});

onUpdated(() => {
  console.log('[Lifecycle] Component updated');
});

onUnmounted(() => {
  console.log('[Lifecycle] Component unmounted');
});
</script>
```

### VS Code前端调试

**`.vscode/launch.json`**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Web (Chrome)",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}/apps/web",
      "sourceMapPathOverrides": {
        "webpack:///./*": "${webRoot}/*"
      }
    },
    {
      "name": "Debug Web (Edge)",
      "type": "msedge",
      "request": "launch",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}/apps/web"
    }
  ]
}
```

---

## 🔗 全栈调试

### 同时调试前后端

**`.vscode/launch.json`**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["nx", "serve", "api"],
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Web",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}/apps/web"
    }
  ],
  "compounds": [
    {
      "name": "Debug Full Stack",
      "configurations": ["Debug API", "Debug Web"],
      "presentation": {
        "hidden": false,
        "group": "Full Stack",
        "order": 1
      }
    }
  ]
}
```

### 调试API调用

**前端请求拦截**

```typescript
// api.interceptor.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    console.log('[API Request]', config.method?.toUpperCase(), config.url);
    console.log('[API Request Data]', config.data);
    return config;
  },
  error => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    console.log('[API Response]', response.status, response.config.url);
    console.log('[API Response Data]', response.data);
    return response;
  },
  error => {
    console.error('[API Response Error]', error.response?.status, error.config.url);
    console.error('[API Error Data]', error.response?.data);
    return Promise.reject(error);
  }
);
```

**后端请求日志**

```typescript
// logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const startTime = Date.now();

    console.log(`[Request] ${method} ${url}`);
    console.log(`[Request Body]`, body);

    return next.handle().pipe(
      tap(data => {
        const endTime = Date.now();
        console.log(`[Response] ${method} ${url} - ${endTime - startTime}ms`);
        console.log(`[Response Data]`, data);
      })
    );
  }
}
```

---

## 🗄️ 数据库调试

### Prisma Studio

```bash
# 启动Prisma Studio
pnpm nx run api:prisma-studio

# 打开 http://localhost:5555
```

**功能**:
- 可视化数据表
- 查询和编辑数据
- 查看表关系

### 查询日志

**启用Prisma日志**

```typescript
// prisma.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});
```

### SQL调试

**原始SQL查询**

```typescript
// 执行原始SQL
const goals = await prisma.$queryRaw`
  SELECT * FROM goals 
  WHERE user_id = ${userId} 
  AND status = ${status}
`;

console.log('Raw query result:', goals);
```

**查看生成的SQL**

```bash
# 使用Prisma CLI查看生成的SQL
pnpm prisma migrate diff \
  --from-schema-datamodel schema.prisma \
  --to-schema-datasource schema.prisma \
  --script
```

---

## ⚡ 性能调试

### 后端性能分析

**使用Node.js Profiler**

```bash
# 启动性能分析
node --prof apps/api/src/main.js

# 生成报告
node --prof-process isolate-*.log > profile.txt
```

**使用Chrome DevTools**

```bash
# 启动调试服务器
pnpm nx serve api --inspect

# 打开 chrome://inspect
# 点击 "Open dedicated DevTools for Node"
# 使用 Profiler 和 Memory 面板
```

**性能监控装饰器**

```typescript
function Performance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const startTime = performance.now();
    const result = await originalMethod.apply(this, args);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    if (duration > 100) {
      console.warn(`[Performance] ${propertyKey} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  };

  return descriptor;
}

@Injectable()
export class GoalService {
  @Performance
  async findAll(): Promise<Goal[]> {
    // ...
  }
}
```

### 前端性能分析

**Vue DevTools Performance**

1. 打开Vue DevTools
2. 切换到Performance面板
3. 点击Record开始录制
4. 执行操作
5. 停止录制并分析

**Chrome DevTools Performance**

1. 打开DevTools → Performance
2. 点击Record
3. 执行操作
4. 停止录制
5. 分析火焰图

**性能指标**

```typescript
// 使用Performance API
const startMark = 'fetchGoals-start';
const endMark = 'fetchGoals-end';
const measureName = 'fetchGoals';

performance.mark(startMark);

await fetchGoals();

performance.mark(endMark);
performance.measure(measureName, startMark, endMark);

const measure = performance.getEntriesByName(measureName)[0];
console.log(`fetchGoals took ${measure.duration}ms`);
```

**React DevTools Profiler**

```typescript
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}

<Profiler id="GoalList" onRender={onRenderCallback}>
  <GoalList />
</Profiler>
```

---

## 🛠 调试工具

### VS Code扩展

| 扩展 | 用途 |
|------|------|
| **Debugger for Chrome** | Chrome调试 |
| **REST Client** | API测试 |
| **Prisma** | 数据库调试 |
| **Vue Language Features (Volar)** | Vue调试 |
| **Error Lens** | 实时错误显示 |

### 浏览器扩展

| 扩展 | 用途 |
|------|------|
| **Vue DevTools** | Vue组件调试 |
| **React Developer Tools** | React组件调试 |
| **Redux DevTools** | 状态管理调试 |
| **JSON Viewer** | JSON格式化 |

### 独立工具

| 工具 | 用途 |
|------|------|
| **Postman** | API测试 |
| **Insomnia** | API调试 |
| **Prisma Studio** | 数据库管理 |
| **Redis Commander** | Redis调试 |

---

## 📚 调试最佳实践

### 1. 使用日志而非console.log

```typescript
// ❌ Bad
console.log('User:', user);

// ✅ Good
this.logger.debug('User loaded', { userId: user.id, email: user.email });
```

### 2. 添加上下文信息

```typescript
// ❌ Bad
throw new Error('Invalid status');

// ✅ Good
throw new Error(`Invalid goal status: ${status}. Expected one of: ${validStatuses.join(', ')}`);
```

### 3. 使用断言

```typescript
import { assert } from 'console';

function updateGoalStatus(goal: Goal, status: GoalStatus) {
  assert(goal, 'Goal must be provided');
  assert(status in GoalStatus, `Invalid status: ${status}`);
  
  goal.status = status;
}
```

### 4. 记录错误上下文

```typescript
try {
  await this.repository.save(goal);
} catch (error) {
  this.logger.error('Failed to save goal', {
    goalId: goal.id,
    userId: goal.userId,
    error: error.message,
    stack: error.stack,
  });
  throw error;
}
```

### 5. 使用调试标志

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('[DEBUG] Goal state:', goal);
}
```

---

## 🔍 常见问题调试

### API请求404

1. 检查URL路径
2. 检查HTTP方法
3. 检查路由配置
4. 查看Network面板

### 数据未更新

1. 检查响应式数据
2. 检查状态管理
3. 检查API调用
4. 查看Vue DevTools

### 性能问题

1. 使用Performance面板
2. 检查网络请求
3. 分析渲染性能
4. 优化数据查询

### 内存泄漏

1. 使用Memory面板
2. 检查事件监听器
3. 检查定时器
4. 检查闭包引用

---

## 📚 参考资源

### 调试文档

- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Vue Debugging](https://vuejs.org/guide/best-practices/production-deployment.html#tracking-runtime-errors)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)

### 工具文档

- [Vue DevTools](https://devtools.vuejs.org/)
- [Postman](https://learning.postman.com/)
- [Prisma Studio](https://www.prisma.io/studio)

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0
