import { MessageRole } from '@dailyuse/contracts/ai';
import type {
  MessageClient,
  MessageClientDTO,
  MessageServerDTO,
} from '@dailyuse/contracts/ai';

export class AIMessage implements MessageClient {
  private constructor(
    public readonly uuid: string,
    public readonly conversationUuid: string,
    public readonly role: MessageRole,
    public content: string,
    public readonly tokenCount: number | null | undefined,
    public readonly createdAt: number,
  ) {}

  static fromServerDTO(dto: MessageServerDTO): AIMessage {
    return new AIMessage(
      dto.uuid,
      dto.conversationUuid,
      dto.role,
      dto.content,
      dto.tokenCount ?? null,
      dto.createdAt,
    );
  }

  static fromClientDTO(dto: MessageClientDTO): AIMessage {
    return new AIMessage(
      dto.uuid,
      dto.conversationUuid,
      dto.role,
      dto.content,
      dto.tokenCount ?? null,
      dto.createdAt,
    );
  }

  static create(params: {
    conversationUuid: string;
    role: MessageRole;
    content: string;
    tokenCount?: number;
  }): AIMessage {
    return new AIMessage(
      crypto.randomUUID(),
      params.conversationUuid,
      params.role,
      params.content,
      params.tokenCount ?? null,
      Date.now(),
    );
  }

  isUserMessage(): boolean {
    return this.role === MessageRole.USER;
  }
  isAssistantMessage(): boolean {
    return this.role === MessageRole.ASSISTANT;
  }
  isSystemMessage(): boolean {
    return this.role === MessageRole.SYSTEM;
  }
  getFormattedTime(): string {
    return new Date(this.createdAt).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  getContentSummary(maxLength: number = 60): string {
    return this.content.length <= maxLength
      ? this.content
      : `${this.content.slice(0, maxLength)}...`;
  }

  toClientDTO(): MessageClientDTO {
    return {
      uuid: this.uuid,
      conversationUuid: this.conversationUuid,
      role: this.role,
      content: this.content,
      tokenCount: this.tokenCount ?? null,
      createdAt: this.createdAt,
      isUser: this.role === MessageRole.USER,
      isAssistant: this.role === MessageRole.ASSISTANT,
      isSystem: this.role === MessageRole.SYSTEM,
      formattedTime: this.getFormattedTime(),
    };
  }

  toServerDTO(): MessageServerDTO {
    return {
      uuid: this.uuid,
      conversationUuid: this.conversationUuid,
      role: this.role,
      content: this.content,
      tokenCount: this.tokenCount ?? null,
      createdAt: this.createdAt,
    };
  }
}
