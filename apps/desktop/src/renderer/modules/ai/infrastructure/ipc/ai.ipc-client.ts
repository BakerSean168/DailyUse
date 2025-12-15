/**
 * AI IPC Client - AI 模块 IPC 客户端
 * 
 * @module renderer/modules/ai/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { AIChannels } from '@/shared/types/ipc-channels';

// ============ Types ============

export interface AIConfigDTO {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
}

export type AIProvider = 'openai' | 'anthropic' | 'azure' | 'ollama' | 'local';

export interface ChatMessageDTO {
  uuid: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ChatSessionDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  messages: ChatMessageDTO[];
  context?: ChatContextDTO;
  createdAt: number;
  updatedAt: number;
}

export interface ChatContextDTO {
  tasks?: string[];
  goals?: string[];
  schedules?: string[];
  customContext?: string;
}

export interface TaskDecompositionDTO {
  originalTask: string;
  subtasks: SubtaskDTO[];
  estimatedTotalTime: number;
  suggestions?: string[];
}

export interface SubtaskDTO {
  title: string;
  description?: string;
  estimatedTime: number;
  priority: number;
  dependencies?: string[];
}

export interface DailyPlanDTO {
  date: string;
  summary: string;
  timeBlocks: TimeBlockDTO[];
  recommendations: string[];
  focusGoals: string[];
}

export interface WeeklyPlanDTO {
  startDate: string;
  endDate: string;
  summary: string;
  dailyPlans: DailyPlanDTO[];
  focusGoals: string[];
}

export interface TimeBlockDTO {
  startTime: string;
  endTime: string;
  type: 'task' | 'break' | 'meeting' | 'focus';
  taskUuid?: string;
  title: string;
  description?: string;
}

export interface ReviewReportDTO {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  summary: string;
  accomplishments: string[];
  insights: InsightDTO[];
  recommendations: string[];
  metrics: ReviewMetricsDTO;
}

export interface InsightDTO {
  type: 'pattern' | 'improvement' | 'warning' | 'achievement';
  title: string;
  description: string;
  data?: Record<string, unknown>;
}

export interface ReviewMetricsDTO {
  tasksCompleted: number;
  taskCompletionRate: number;
  goalsProgress: number;
  focusMinutes: number;
  productivityScore: number;
}

export interface ChatRequest {
  sessionUuid?: string;
  message: string;
  context?: ChatContextDTO;
}

// ============ AI IPC Client ============

/**
 * AI IPC Client
 */
export class AIIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ Configuration ============

  /**
   * 获取 AI 配置
   */
  async getConfig(): Promise<AIConfigDTO> {
    return this.client.invoke<AIConfigDTO>(
      AIChannels.GET_CONFIG,
      {}
    );
  }

  /**
   * 更新 AI 配置
   */
  async updateConfig(config: Partial<AIConfigDTO>): Promise<AIConfigDTO> {
    return this.client.invoke<AIConfigDTO>(
      AIChannels.UPDATE_CONFIG,
      config
    );
  }

  // ============ Chat ============

  /**
   * 发送聊天消息
   */
  async chat(params: ChatRequest): Promise<ChatMessageDTO> {
    return this.client.invoke<ChatMessageDTO>(
      AIChannels.CHAT,
      params
    );
  }

  /**
   * 流式聊天
   */
  async chatStream(params: ChatRequest): Promise<string> {
    return this.client.invoke<string>(
      AIChannels.CHAT_STREAM,
      params
    );
  }

  /**
   * 停止聊天
   */
  async chatStop(sessionUuid: string): Promise<void> {
    return this.client.invoke<void>(
      AIChannels.CHAT_STOP,
      { sessionUuid }
    );
  }

  // ============ Conversations ============

  /**
   * 获取会话列表
   */
  async listConversations(): Promise<ChatSessionDTO[]> {
    return this.client.invoke<ChatSessionDTO[]>(
      AIChannels.CONVERSATION_LIST,
      {}
    );
  }

  /**
   * 获取会话
   */
  async getConversation(uuid: string): Promise<ChatSessionDTO> {
    return this.client.invoke<ChatSessionDTO>(
      AIChannels.CONVERSATION_GET,
      { uuid }
    );
  }

  /**
   * 创建会话
   */
  async createConversation(title?: string): Promise<ChatSessionDTO> {
    return this.client.invoke<ChatSessionDTO>(
      AIChannels.CONVERSATION_CREATE,
      { title }
    );
  }

  /**
   * 删除会话
   */
  async deleteConversation(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      AIChannels.CONVERSATION_DELETE,
      { uuid }
    );
  }

  /**
   * 清空会话
   */
  async clearConversation(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      AIChannels.CONVERSATION_CLEAR,
      { uuid }
    );
  }

  // ============ Task AI ============

  /**
   * 任务分解
   */
  async decomposeTask(taskTitle: string, taskDescription?: string): Promise<TaskDecompositionDTO> {
    return this.client.invoke<TaskDecompositionDTO>(
      AIChannels.DECOMPOSE_TASK,
      { taskTitle, taskDescription }
    );
  }

  /**
   * 分析任务
   */
  async analyzeTask(taskUuid: string): Promise<{
    suggestions: string[];
    estimatedTime: number;
    priority: number;
  }> {
    return this.client.invoke(
      AIChannels.ANALYZE_TASK,
      { taskUuid }
    );
  }

  /**
   * 分析目标
   */
  async analyzeGoal(goalUuid: string): Promise<{
    suggestions: string[];
    milestones: string[];
    estimatedCompletion: string;
  }> {
    return this.client.invoke(
      AIChannels.ANALYZE_GOAL,
      { goalUuid }
    );
  }

  /**
   * 建议任务分解
   */
  async suggestBreakdown(taskUuid: string): Promise<SubtaskDTO[]> {
    return this.client.invoke<SubtaskDTO[]>(
      AIChannels.SUGGEST_BREAKDOWN,
      { taskUuid }
    );
  }

  /**
   * 建议日程
   */
  async suggestSchedule(date: string): Promise<TimeBlockDTO[]> {
    return this.client.invoke<TimeBlockDTO[]>(
      AIChannels.SUGGEST_SCHEDULE,
      { date }
    );
  }

  // ============ Planning ============

  /**
   * 生成每日计划
   */
  async planDay(date: string): Promise<DailyPlanDTO> {
    return this.client.invoke<DailyPlanDTO>(
      AIChannels.PLAN_DAY,
      { date }
    );
  }

  /**
   * 生成每周计划
   */
  async planWeek(startDate: string): Promise<WeeklyPlanDTO> {
    return this.client.invoke<WeeklyPlanDTO>(
      AIChannels.PLAN_WEEK,
      { startDate }
    );
  }

  /**
   * 优化计划
   */
  async optimizePlan(date: string, constraints?: string[]): Promise<DailyPlanDTO> {
    return this.client.invoke<DailyPlanDTO>(
      AIChannels.PLAN_OPTIMIZE,
      { date, constraints }
    );
  }

  // ============ Reviews ============

  /**
   * 每日回顾
   */
  async reviewDaily(date: string): Promise<ReviewReportDTO> {
    return this.client.invoke<ReviewReportDTO>(
      AIChannels.REVIEW_DAILY,
      { date }
    );
  }

  /**
   * 每周回顾
   */
  async reviewWeekly(startDate: string): Promise<ReviewReportDTO> {
    return this.client.invoke<ReviewReportDTO>(
      AIChannels.REVIEW_WEEKLY,
      { startDate }
    );
  }

  /**
   * 每月回顾
   */
  async reviewMonthly(month: string): Promise<ReviewReportDTO> {
    return this.client.invoke<ReviewReportDTO>(
      AIChannels.REVIEW_MONTHLY,
      { month }
    );
  }
}

// ============ Singleton Export ============

export const aiIPCClient = new AIIPCClient();
