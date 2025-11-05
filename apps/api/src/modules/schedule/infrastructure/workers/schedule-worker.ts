/**
 * Schedule Worker - Bree 任务执行脚本
 * 
 * 职责：
 * - 在独立的 Worker Thread 中执行调度任务
 * - 接收任务执行上下文
 * - 执行回调逻辑（发送通知、触发业务逻辑）
 * - 记录执行结果
 * 
 * 注意：
 * - 这个文件会在 Worker Thread 中运行
 * - 使用 workerData 接收父进程传递的参数
 * - 通过 parentPort 与父进程通信
 */

import { parentPort, workerData } from 'worker_threads';

/**
 * 任务执行上下文（从父进程传递）
 */
interface TaskExecutionContext {
  taskId: string;
  accountUuid: string;
  sourceModule: string;
  sourceEntityId: string;
  metadata: Record<string, any>;
  executedAt: number;
}

/**
 * 执行结果
 */
interface ExecutionResult {
  success: boolean;
  taskId: string;
  executedAt: number;
  finishedAt: number;
  duration: number;
  error?: string;
  output?: any;
}

/**
 * 主执行函数
 */
async function executeTask(context: TaskExecutionContext): Promise<ExecutionResult> {
  const startTime = Date.now();

  console.log(`\n🏃 [Worker] Executing task: ${context.taskId}`);
  console.log(`   Source: ${context.sourceModule}/${context.sourceEntityId}`);
  console.log(`   Account: ${context.accountUuid}`);
  console.log(`   Priority: ${context.metadata.priority}`);
  console.log(`   Tags: ${context.metadata.tags?.join(', ') || 'none'}`);

  try {
    // ============ 根据源模块执行不同的业务逻辑 ============
    
    let output: any = null;

    switch (context.sourceModule) {
      case 'GOAL':
        output = await executeGoalReminder(context);
        break;

      case 'TASK':
        output = await executeTaskReminder(context);
        break;

      case 'REMINDER':
        output = await executeReminder(context);
        break;

      default:
        throw new Error(`Unknown source module: ${context.sourceModule}`);
    }

    // ============ 构建成功结果 ============
    
    const finishedAt = Date.now();
    const result: ExecutionResult = {
      success: true,
      taskId: context.taskId,
      executedAt: context.executedAt,
      finishedAt,
      duration: finishedAt - startTime,
      output,
    };

    console.log(`✅ [Worker] Task completed in ${result.duration}ms`);

    return result;

  } catch (error) {
    // ============ 构建失败结果 ============
    
    const finishedAt = Date.now();
    const result: ExecutionResult = {
      success: false,
      taskId: context.taskId,
      executedAt: context.executedAt,
      finishedAt,
      duration: finishedAt - startTime,
      error: error instanceof Error ? error.message : String(error),
    };

    console.error(`❌ [Worker] Task failed: ${result.error}`);

    return result;
  }
}

/**
 * 执行 Goal 提醒
 */
async function executeGoalReminder(context: TaskExecutionContext): Promise<any> {
  console.log('📋 Executing Goal reminder...');

  // TODO: 实现具体的 Goal 提醒逻辑
  // 1. 查询 Goal 实体
  // 2. 检查触发条件（TIME_PROGRESS_PERCENTAGE、REMAINING_DAYS）
  // 3. 发送通知
  // 4. 记录提醒历史

  // 临时实现：模拟发送通知
  return {
    type: 'goal_reminder',
    notificationSent: true,
    message: 'Goal reminder notification sent',
  };
}

/**
 * 执行 Task 提醒
 */
async function executeTaskReminder(context: TaskExecutionContext): Promise<any> {
  console.log('📝 Executing Task reminder...');

  // TODO: 实现具体的 Task 提醒逻辑
  // 1. 查询 Task 实体
  // 2. 检查任务状态（是否已完成、是否已取消）
  // 3. 计算提醒时间（相对/绝对）
  // 4. 发送通知
  // 5. 创建任务实例（如果是重复任务）

  // 临时实现：模拟发送通知
  return {
    type: 'task_reminder',
    notificationSent: true,
    message: 'Task reminder notification sent',
  };
}

/**
 * 执行 Reminder
 */
async function executeReminder(context: TaskExecutionContext): Promise<any> {
  console.log('🔔 Executing Reminder...');

  // TODO: 实现具体的 Reminder 执行逻辑
  // 1. 查询 Reminder 实体
  // 2. 检查 Reminder 状态（是否启用、是否在活跃时间段）
  // 3. 检查触发条件（固定时间、间隔、自定义逻辑）
  // 4. 发送多渠道通知（IN_APP、PUSH、EMAIL、SMS）
  // 5. 更新统计信息（触发次数、最后触发时间）

  // 临时实现：模拟发送通知
  return {
    type: 'reminder',
    notificationSent: true,
    channels: ['IN_APP', 'PUSH'],
    message: 'Reminder notification sent',
  };
}

/**
 * Worker 入口
 */
(async () => {
  try {
    // 验证 workerData
    if (!workerData) {
      throw new Error('No workerData provided');
    }

    const context = workerData as TaskExecutionContext;

    // 执行任务
    const result = await executeTask(context);

    // 发送结果到父进程
    if (parentPort) {
      parentPort.postMessage(result);
    }

    // 成功退出
    process.exit(0);

  } catch (error) {
    // 发送错误到父进程
    if (parentPort) {
      parentPort.postMessage({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // 失败退出
    console.error('❌ [Worker] Fatal error:', error);
    process.exit(1);
  }
})();
