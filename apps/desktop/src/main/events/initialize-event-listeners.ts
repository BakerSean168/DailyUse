/**
 * Desktop App Event Listeners Initialization
 * 
 * 初始化所有模块的事件监听器
 * 主要用于跨模块的业务逻辑协调
 */

import { eventBus, type DomainEvent } from '@dailyuse/utils';
import { GoalContainer } from '@dailyuse/infrastructure-server';
import { GoalRecord, type KeyResult } from '@dailyuse/domain-server/goal';

let isInitialized = false;

/**
 * 初始化事件监听器
 */
export async function initializeEventListeners(): Promise<void> {
  if (isInitialized) {
    console.log('⚠️ [EventListeners] Already initialized, skipping...');
    return;
  }

  console.log('🚀 [EventListeners] Initializing desktop app event listeners...');

  // 初始化任务完成 → 目标进度更新监听器
  initializeTaskToGoalProgressListener();

  isInitialized = true;
  console.log('✅ [EventListeners] All event listeners registered successfully!');
}

/**
 * 监听任务完成事件，自动更新目标进度
 */
function initializeTaskToGoalProgressListener(): void {
  eventBus.on('task.instance.completed', async (event: DomainEvent) => {
    try {
      if (!event.accountUuid) {
        console.error(
          '❌ [TaskToGoalProgress] Missing accountUuid in task.instance.completed event',
        );
        return;
      }

      const { goalBinding, taskInstanceUuid, title } = event.payload as {
        goalBinding?: {
          goalUuid: string;
          keyResultUuid?: string;
          incrementValue: number;
        };
        taskInstanceUuid: string;
        title: string;
      };

      // 如果任务没有关联目标，直接返回
      if (!goalBinding) {
        console.log(
          `ℹ️ [TaskToGoalProgress] Task ${taskInstanceUuid} completed without goal binding`,
        );
        return;
      }

      console.log(
        `🎯 [TaskToGoalProgress] Task "${title}" completed, updating goal progress`,
        {
          goalUuid: goalBinding.goalUuid,
          keyResultUuid: goalBinding.keyResultUuid,
          incrementValue: goalBinding.incrementValue,
        },
      );

      // 如果有指定关键结果，通过添加记录来增加进度
      if (goalBinding.keyResultUuid) {
        const container = GoalContainer.getInstance();
        const goalRepository = container.getGoalRepository();

        // 1. 查询目标（包含子实体）
        const goal = await goalRepository.findById(goalBinding.goalUuid, { includeChildren: true });
        if (!goal) {
          console.error(`❌ [TaskToGoalProgress] Goal not found: ${goalBinding.goalUuid}`);
          return;
        }

        // 2. 查找关键结果
        const keyResult = goal.keyResults.find((kr: KeyResult) => kr.uuid === goalBinding.keyResultUuid);
        if (!keyResult) {
          console.error(
            `❌ [TaskToGoalProgress] KeyResult not found: ${goalBinding.keyResultUuid}`,
          );
          return;
        }

        // 3. 创建记录实体
        const record = GoalRecord.create({
          keyResultUuid: goalBinding.keyResultUuid,
          goalUuid: goalBinding.goalUuid,
          value: goalBinding.incrementValue,
          note: `任务完成: ${title}`,
          recordedAt: Date.now(),
        });

        // 4. 添加到关键结果（会自动重新计算 currentValue）
        keyResult.addRecord(record.toServerDTO());

        // 5. 持久化
        await goalRepository.save(goal);

        console.log(
          `✅ [TaskToGoalProgress] Added progress record for key result ${goalBinding.keyResultUuid} with value ${goalBinding.incrementValue}`,
        );
      } else {
        // TODO: 如果没有指定关键结果，可以更新目标的整体进度或记录
        console.log(
          `ℹ️ [TaskToGoalProgress] Task completed for goal ${goalBinding.goalUuid}, but no key result specified`,
        );
      }
    } catch (error) {
      console.error('❌ [TaskToGoalProgress] Error handling task.instance.completed:', error);
    }
  });

  console.log('✅ [TaskToGoalProgress] Task completion → Goal progress listener registered');
}

/**
 * 重置事件监听器（用于测试）
 */
export function resetEventListeners(): void {
  console.log('🔄 [EventListeners] Resetting event listeners...');
  eventBus.off('task.instance.completed');
  isInitialized = false;
}
