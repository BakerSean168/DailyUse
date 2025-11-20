/**
 * Mock AI Adapter
 *
 * Simulates AI responses for local development and testing.
 * Does not make real API calls or consume quota.
 */

import type { AIContracts } from '@dailyuse/contracts';
import { BaseAIAdapter, type AIGenerationResult, type AIStreamCallback } from './BaseAIAdapter';

type GenerationInputServerDTO = AIContracts.GenerationInputServerDTO;
type GenerationTaskType = AIContracts.GenerationTaskType;

const MockResponses: Record<GenerationTaskType, string> = {
  GOAL_KEY_RESULTS: `Based on your goal, here are suggested Key Results:

1. Increase user engagement by 30% measured by daily active users
2. Reduce customer churn rate from 5% to 2%
3. Achieve NPS score of 50 or higher
4. Complete 3 major feature releases`,

  TASK_TEMPLATES: `Here are suggested task templates:

1. **Initial Research**
   - Duration: 2 hours
   - Priority: High
   - Description: Conduct comprehensive research on the topic

2. **Planning Phase**
   - Duration: 1 hour
   - Priority: High
   - Description: Create detailed project plan

3. **Implementation**
   - Duration: 4 hours
   - Priority: Medium
   - Description: Execute the planned work`,

  DOCUMENT_SUMMARY: `## Summary

This document discusses key concepts and provides actionable insights. The main points include:

- **Overview**: Introduction to the topic
- **Key Findings**: Important discoveries and results
- **Recommendations**: Suggested next steps and actions`,

  KNOWLEDGE_DOCUMENTS: `# Knowledge Document

## Context
This knowledge base article provides comprehensive information about the topic.

## Key Points
- Point 1: Important concept
- Point 2: Best practices
- Point 3: Common pitfalls to avoid

## Action Items
- Follow the recommended approach
- Review periodically for updates`,

  GENERAL_CHAT: `I understand your question. Here's a helpful response based on the context provided. Let me know if you need any clarification or have additional questions!`,
};

export class MockAIAdapter extends BaseAIAdapter {
  private readonly delayMs: number;

  constructor(config: { delayMs?: number } = {}) {
    super({ model: 'mock-model' });
    this.delayMs = config.delayMs ?? 500;
  }

  protected getDefaultModel(): string {
    return 'mock-gpt-4';
  }

  async generateText(input: GenerationInputServerDTO): Promise<AIGenerationResult> {
    // Simulate network delay
    await this.delay(this.delayMs);

    const response = this.getMockResponse(input);
    const tokens = response.length / 4; // Rough approximation

    return {
      content: response,
      tokenUsage: {
        promptTokens: input.prompt.length / 4,
        completionTokens: tokens,
        totalTokens: input.prompt.length / 4 + tokens,
      },
      finishReason: 'stop',
      metadata: {
        model: this.model,
        mock: true,
      },
    };
  }

  async generateStream(input: GenerationInputServerDTO, callback: AIStreamCallback): Promise<void> {
    callback.onStart?.();

    try {
      const response = this.getMockResponse(input);
      const words = response.split(' ');

      // Stream word by word
      for (let i = 0; i < words.length; i++) {
        await this.delay(50); // Simulate streaming delay
        const chunk = i === 0 ? words[i] : ' ' + words[i];
        callback.onChunk(chunk);
      }

      const tokens = response.length / 4;
      callback.onComplete({
        content: response,
        tokenUsage: {
          promptTokens: input.prompt.length / 4,
          completionTokens: tokens,
          totalTokens: input.prompt.length / 4 + tokens,
        },
        finishReason: 'stop',
        metadata: {
          model: this.model,
          mock: true,
        },
      });
    } catch (error) {
      callback.onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async validate(): Promise<boolean> {
    return true; // Mock adapter is always valid
  }

  getAdapterName(): string {
    return 'MockAIAdapter';
  }

  private getMockResponse(input: GenerationInputServerDTO): string {
    const baseResponse = MockResponses[input.taskType] || MockResponses.GENERAL_CHAT;

    // Optionally include system prompt context
    if (input.systemPrompt) {
      return `[System: ${input.systemPrompt}]\n\n${baseResponse}`;
    }

    return baseResponse;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
