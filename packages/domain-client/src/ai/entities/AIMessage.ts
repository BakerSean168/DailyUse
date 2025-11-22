import { AIContracts } from '@dailyuse/contracts';

type MessageRole = AIContracts.MessageRole;
type MessageServerDTO = AIContracts.MessageServerDTO;
type MessageClientDTO = AIContracts.MessageClientDTO;
type MessageClient = AIContracts.MessageClient;

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
    return this.role === AIContracts.MessageRole.USER;
  }
  isAssistantMessage(): boolean {
    return this.role === AIContracts.MessageRole.ASSISTANT;
  }
  isSystemMessage(): boolean {
    return this.role === AIContracts.MessageRole.SYSTEM;
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
      isUser: this.role === AIContracts.MessageRole.USER,
      isAssistant: this.role === AIContracts.MessageRole.ASSISTANT,
      isSystem: this.role === AIContracts.MessageRole.SYSTEM,
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
