/**
 * AI Service Interface
 * 
 * Defines the contract for AI service providers
 * Used by both application-client and infrastructure-client
 */

/**
 * Configuration for AI service providers
 */
export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}

/**
 * AI Service Interface
 * Defines methods that all AI providers must implement
 */
export interface IAIService {
  /**
   * Decompose a goal into subtasks using AI
   */
  decomposeGoal(request: any): Promise<any>;

  /**
   * Estimate time required for a task
   */
  estimateTaskTime(taskDescription: string): Promise<{
    estimatedMinutes: number;
    confidence: number;
  }>;

  /**
   * Suggest priorities for a list of tasks
   */
  suggestPriority(
    tasks: Array<{ title: string; description: string }>
  ): Promise<{
    priorities: Array<{ title: string; priority: number }>;
    reasoning: string;
  }>;

  /**
   * Check if the AI service is available
   */
  isAvailable(): Promise<boolean>;
}
