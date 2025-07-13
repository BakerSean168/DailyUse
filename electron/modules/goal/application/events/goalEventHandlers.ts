import { EventBus } from '@/shared/events/eventBus';
import type { TaskCompletedEvent, TaskUndoCompletedEvent } from '../../../Task/index';
import { MainGoalApplicationService } from '../../application/services/mainGoalApplicationService';
const goalApplicationService = new MainGoalApplicationService();
/**
 * Goal 模块主进程事件处理器
 * 负责处理来自其他模块的事件，如任务完成、撤销等
 */
export class GoalEventHandlers {
  private static taskCompletedHandler: any = null;
  private static taskUndoCompletedHandler: any = null;

  /**
   * 注册 Goal 模块的事件处理器
   */
  static registerHandlers(): void {
    const eventBus = EventBus.getInstance();

    // 处理任务完成事件
    GoalEventHandlers.taskCompletedHandler = async (event: TaskCompletedEvent) => {
      console.log('🎯 [Goal事件处理器] 处理任务完成事件:', event);
      
      try {
        if (event.payload.keyResultLinks && event.payload.keyResultLinks.length > 0) {
          await GoalEventHandlers.handleTaskCompleted(event);
        }
      } catch (error) {
        console.error('❌ [Goal事件处理器] 处理任务完成事件失败:', error);
      }
    };

    eventBus.subscribe<TaskCompletedEvent>('TaskCompleted', GoalEventHandlers.taskCompletedHandler);

    // 处理任务撤销完成事件
    GoalEventHandlers.taskUndoCompletedHandler = async (event: TaskUndoCompletedEvent) => {
      console.log('🎯 [Goal事件处理器] 处理任务撤销完成事件:', event);
      
      try {
        if (event.payload.keyResultLinks && event.payload.keyResultLinks.length > 0) {
          await GoalEventHandlers.handleTaskUndoCompleted(event);
        }
      } catch (error) {
        console.error('❌ [Goal事件处理器] 处理任务撤销完成事件失败:', error);
      }
    };

    eventBus.subscribe<TaskUndoCompletedEvent>('TaskUndoCompleted', GoalEventHandlers.taskUndoCompletedHandler);

    console.log('✅ [Goal事件处理器] 事件处理器注册完成');
  }

  /**
   * 处理任务完成事件
   */
  private static async handleTaskCompleted(event: TaskCompletedEvent): Promise<void> {


    for (const link of event.payload.keyResultLinks!) {
      try {
        console.log(`🔄 [Goal事件处理器] 为目标 ${link.goalId} 的关键结果 ${link.keyResultId} 添加记录 +${link.incrementValue}`);
        
        const result = await goalApplicationService.addRecordToGoal(
          link.goalId,
          link.keyResultId,
          link.incrementValue,
          `任务完成自动记录: ${event.payload.taskId}`
        );

        if (result.success) {
          console.log(`✅ [Goal事件处理器] 成功添加记录: ${result.data?.record.id}`);
        } else {
          console.error(`❌ [Goal事件处理器] 添加记录失败: ${result.message}`);
        }
      } catch (error) {
        console.error(`❌ [Goal事件处理器] 处理关键结果 ${link.keyResultId} 失败:`, error);
      }
    }
  }

  /**
   * 处理任务撤销完成事件
   */
  private static async handleTaskUndoCompleted(event: TaskUndoCompletedEvent): Promise<void> {

    for (const link of event.payload.keyResultLinks!) {
      try {
        console.log(`🔄 [Goal事件处理器] 为目标 ${link.goalId} 的关键结果 ${link.keyResultId} 添加回退记录 -${link.incrementValue}`);
        
        const result = await goalApplicationService.addRecordToGoal(
          link.goalId,
          link.keyResultId,
          -link.incrementValue, // 负值表示回退
          `任务撤销完成自动记录: ${event.payload.taskId}`
        );

        if (result.success) {
          console.log(`✅ [Goal事件处理器] 成功添加回退记录: ${result.data?.record.id}`);
        } else {
          console.error(`❌ [Goal事件处理器] 添加回退记录失败: ${result.message}`);
        }
      } catch (error) {
        console.error(`❌ [Goal事件处理器] 处理关键结果回退 ${link.keyResultId} 失败:`, error);
      }
    }
  }

  /**
   * 清理事件处理器
   */
  static cleanup(): void {
    const eventBus = EventBus.getInstance();
    
    if (GoalEventHandlers.taskCompletedHandler) {
      eventBus.unsubscribe('TaskCompleted', GoalEventHandlers.taskCompletedHandler);
      GoalEventHandlers.taskCompletedHandler = null;
    }
    
    if (GoalEventHandlers.taskUndoCompletedHandler) {
      eventBus.unsubscribe('TaskUndoCompleted', GoalEventHandlers.taskUndoCompletedHandler);
      GoalEventHandlers.taskUndoCompletedHandler = null;
    }
    
    console.log('🧹 [Goal事件处理器] 事件处理器已清理');
  }
}
