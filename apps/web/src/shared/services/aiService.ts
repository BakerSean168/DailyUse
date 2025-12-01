/**
 * AI Service - 前端 AI 服务
 * 
 * 提供与后端 AI 模块通信的接口，支持：
 * 1. 流式聊天 (SSE)
 * 2. 知识文档生成
 */

import { apiClient } from '@/shared/api/instances';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChatOptions {
  messages: ChatMessage[];
  onChunk: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

/**
 * AI 服务类
 */
class AIService {
  private baseUrl = '/ai';

  /**
   * 流式聊天 - 使用 SSE
   */
  async streamChat(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    onComplete?: (fullContent: string) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const fullContent: string[] = [];

    try {
      // 使用 fetch 发送 SSE 请求
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1${this.baseUrl}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              if (onComplete) {
                onComplete(fullContent.join(''));
              }
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent.push(parsed.content);
                onChunk(parsed.content);
              }
            } catch {
              // 可能是纯文本内容
              fullContent.push(data);
              onChunk(data);
            }
          }
        }
      }

      if (onComplete) {
        onComplete(fullContent.join(''));
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * 简单的非流式聊天
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await apiClient.post<{ content: string }>(`${this.baseUrl}/chat`, {
      messages,
    });
    return response.content;
  }

  /**
   * 生成知识文档
   */
  async generateKnowledge(
    topic: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const systemPrompt = `你是一个知识整理专家。请根据用户的需求，生成一份结构化的知识文档。

要求：
1. 使用 Markdown 格式
2. 包含清晰的标题层级（使用 ##、### 等）
3. 内容详实、条理清晰
4. 适当使用列表、表格、代码块等格式
5. 在开头添加简短概述
6. 在结尾添加总结或延伸阅读建议
7. 不要包含 YAML frontmatter，系统会自动添加`;

    if (onChunk) {
      // 流式生成
      let fullContent = '';
      await this.streamChat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: topic },
        ],
        (chunk) => {
          fullContent += chunk;
          onChunk(chunk);
        }
      );
      return fullContent;
    } else {
      // 非流式生成
      return await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: topic },
      ]);
    }
  }

  /**
   * 生成目标关联知识文档
   */
  async generateGoalKnowledge(
    goalName: string,
    goalDescription: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const systemPrompt = `你是一个学习规划专家。用户刚刚设定了一个目标，请为该目标生成相关的知识文档。

请生成以下内容：
1. **概述**：该领域的基本介绍
2. **核心概念**：需要掌握的关键概念和术语
3. **学习路径**：建议的学习顺序和阶段
4. **资源推荐**：推荐的学习资源（书籍、课程、网站等）
5. **常见问题**：初学者常见的问题和解答
6. **最佳实践**：该领域的最佳实践和注意事项

使用 Markdown 格式，结构清晰，内容详实。不要包含 YAML frontmatter。`;

    const userPrompt = `目标名称：${goalName}
目标描述：${goalDescription || '无详细描述'}

请为这个目标生成相关的知识文档。`;

    if (onChunk) {
      let fullContent = '';
      await this.streamChat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        (chunk) => {
          fullContent += chunk;
          onChunk(chunk);
        }
      );
      return fullContent;
    } else {
      return await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);
    }
  }
}

export const aiService = new AIService();
