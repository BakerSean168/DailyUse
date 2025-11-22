import { AIConversation } from '../aggregates/AIConversation';
import type { AiConversationRepository, StreamEvent } from './AiConversationRepository';

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

async function httpGet<T>(url: string, params?: Record<string, any>): Promise<T> {
  const fullUrl = params
    ? `${url}?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null)).toString()}`
    : url;
  const res = await fetch(fullUrl, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function httpDelete(url: string): Promise<void> {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${url} -> ${res.status}`);
}

function parseSSE(buffer: string): { event: string; data: any }[] {
  const packets: { event: string; data: any }[] = [];
  const rawEvents = buffer.split('\n\n');
  for (const raw of rawEvents) {
    if (!raw.trim()) continue;
    let eventType = 'message';
    let dataLine = '';
    for (const line of raw.split('\n')) {
      if (line.startsWith('event:')) eventType = line.replace('event:', '').trim();
      else if (line.startsWith('data:')) dataLine = line.replace('data:', '').trim();
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

export class HttpAiConversationRepository implements AiConversationRepository {
  async listConversations(
    params: { page?: number; limit?: number } = {},
  ): Promise<AIConversation[]> {
    const data = await httpGet<{ conversations: ConversationServerItem[] }>(
      '/api/ai/conversations',
      params,
    );
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
  async getConversation(conversationUuid: string): Promise<AIConversation> {
    const dto = await httpGet<any>(`/api/ai/conversations/${conversationUuid}`);
    return AIConversation.fromServerDTO(dto);
  }
  async deleteConversation(conversationUuid: string): Promise<void> {
    await httpDelete(`/api/ai/conversations/${conversationUuid}`);
  }
  async streamChat(
    params: { message: string; conversationUuid?: string },
    onEvent: (evt: StreamEvent) => void,
  ): Promise<{ conversationUuid?: string }> {
    const response = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Readable stream not available');
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
        for (const pkt of parseSSE(processPart)) {
          switch (pkt.event) {
            case 'chunk':
              if (pkt.data.content) onEvent({ type: 'chunk', content: pkt.data.content });
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
    return { conversationUuid: params.conversationUuid }; // server may return in future
  }
}

export const httpAiConversationRepository = new HttpAiConversationRepository();
