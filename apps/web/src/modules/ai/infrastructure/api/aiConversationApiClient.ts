/**
 * AI Conversation API Client
 * AI 对话功能 API 客户端
 *
 * 职责：
 * - 封装 AI 对话相关的 HTTP 请求
 * - 处理请求参数和响应数据
 * - 携带认证 token（通过 apiClient）
 */

import { apiClient } from '@/shared/api/instances';
import { AIConversation } from '@dailyuse/domain-client/ai';

interface ConversationServerItem {
  uuid: string;
  accountUuid: string;
  title: string;
  status: string;
  messageCount: number;
  lastMessageAt?: number | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

interface ConversationListResponse {
  conversations: ConversationServerItem[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface StreamEvent {
  type: 'chunk' | 'error' | 'complete';
  content?: string;
  error?: string;
}

/**
 * AI Conversation API Client
 */
export class AIConversationApiClient {
  private readonly baseUrl = '/ai';

  /**
   * 获取对话列表
   */
  async listConversations(params: { page?: number; limit?: number } = {}): Promise<AIConversation[]> {
    const data = await apiClient.get<ConversationListResponse>(`${this.baseUrl}/conversations`, {
      params,
    });
    
    return data.conversations.map((c: ConversationServerItem) =>
      AIConversation.fromServerDTO({
        uuid: c.uuid,
        accountUuid: c.accountUuid,
        title: c.title,
        status: c.status as any,
        messageCount: c.messageCount,
        lastMessageAt: c.lastMessageAt ?? null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        deletedAt: c.deletedAt ?? null,
        messages: [],
      }),
    );
  }

  /**
   * 获取单个对话详情
   */
  async getConversation(conversationUuid: string): Promise<AIConversation> {
    const dto = await apiClient.get<any>(`${this.baseUrl}/conversations/${conversationUuid}`);
    return AIConversation.fromServerDTO(dto);
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversationUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/conversations/${conversationUuid}`);
  }

  /**
   * 流式聊天
   * 注意：这个方法需要使用原生 fetch 来处理 SSE
   */
  async streamChat(
    params: { message: string; conversationUuid?: string },
    onEvent: (evt: StreamEvent) => void,
  ): Promise<{ conversationUuid?: string }> {
    // 获取 token
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`/api${this.baseUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Readable stream not available');
    }
    
    let buffered = '';
    let aborted = false;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffered += new TextDecoder().decode(value);
      const lastBreak = buffered.lastIndexOf('\n\n');
      
      if (lastBreak !== -1) {
        const processPart = buffered.slice(0, lastBreak + 2);
        const remaining = buffered.slice(lastBreak + 2);
        
        for (const pkt of this.parseSSE(processPart)) {
          switch (pkt.event) {
            case 'chunk':
              if (pkt.data.content) {
                onEvent({ type: 'chunk', content: pkt.data.content });
              }
              break;
            case 'error':
              onEvent({ type: 'error', error: pkt.data.error || 'Stream error' });
              aborted = true;
              break;
            case 'complete':
              onEvent({ type: 'complete' });
              break;
          }
        }
        
        buffered = remaining;
        if (aborted) break;
      }
    }
    
    return { conversationUuid: params.conversationUuid };
  }

  /**
   * 解析 SSE 消息
   */
  private parseSSE(buffer: string): { event: string; data: any }[] {
    const packets: { event: string; data: any }[] = [];
    const rawEvents = buffer.split('\n\n');
    
    for (const raw of rawEvents) {
      if (!raw.trim()) continue;
      
      let eventType = 'message';
      let dataLine = '';
      
      for (const line of raw.split('\n')) {
        if (line.startsWith('event:')) {
          eventType = line.replace('event:', '').trim();
        } else if (line.startsWith('data:')) {
          dataLine = line.replace('data:', '').trim();
        }
      }
      
      if (dataLine) {
        try {
          packets.push({ event: eventType, data: JSON.parse(dataLine) });
        } catch {
          /* ignore */
        }
      }
    }
    
    return packets;
  }
}

/**
 * 导出单例实例
 */
export const aiConversationApiClient = new AIConversationApiClient();
