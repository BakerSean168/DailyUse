import { AggregateRoot } from '@dailyuse/utils';
import { ConversationStatus } from '@dailyuse/contracts/ai';
import type {
  AIConversationClient,
  AIConversationClientDTO,
  AIConversationClientInstance,
  AIConversationServerDTO,
  MessageClient,
} from '@dailyuse/contracts/ai';
import { AIMessage } from '../entities/AIMessage';

// Aliases & Types


export class AIConversation extends AggregateRoot implements AIConversationClientInstance {
  private _accountUuid: string;
  private _title: string;
  private _status: ConversationStatusEnum;
  private _messageCount: number;
  private _lastMessageAt?: number | null;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt?: number | null;
  private _messages: AIMessage[];

  private constructor(params: {
    uuid: string;
    accountUuid: string;
    title: string;
    status: ConversationStatusEnum;
    messageCount: number;
    lastMessageAt?: number | null;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
    messages?: AIMessage[];
  }) {
    super(params.uuid);
    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._status = params.status;
    this._messageCount = params.messageCount;
    this._lastMessageAt = params.lastMessageAt;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
    this._messages = params.messages ?? [];
  }

  // Getters
  get accountUuid() {
    return this._accountUuid;
  }
  get title() {
    return this._title;
  }
  get status() {
    return this._status;
  }
  get messageCount() {
    return this._messageCount;
  }
  get lastMessageAt() {
    return this._lastMessageAt ?? null;
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }
  get deletedAt() {
    return this._deletedAt ?? null;
  }
  get messages(): AIMessage[] {
    return [...this._messages];
  }

  // Interface-required computed props
  get isActive(): boolean {
    return this._status === ConversationStatus.ACTIVE;
  }
  get isClosed(): boolean {
    return this._status === ConversationStatus.CLOSED;
  }
  get isArchived(): boolean {
    return this._status === ConversationStatus.ARCHIVED;
  }
  get canAddMessage(): boolean {
    return this.isActive;
  }
  get statusText(): string {
    const map: Record<ConversationStatusEnum, string> = {
      [ConversationStatus.ACTIVE]: '进行中',
      [ConversationStatus.CLOSED]: '已关闭',
      [ConversationStatus.ARCHIVED]: '已归档',
    };
    return map[this._status];
  }
  get formattedCreatedAt(): string {
    return new Date(this._createdAt).toLocaleString('zh-CN');
  }
  get formattedUpdatedAt(): string {
    return new Date(this._updatedAt).toLocaleString('zh-CN');
  }
  get formattedLastMessageAt(): string | null {
    return this._lastMessageAt ? new Date(this._lastMessageAt).toLocaleString('zh-CN') : null;
  }

  // Derived helpers (not all in interface but useful)
  get isDeleted(): boolean {
    return !!this._deletedAt;
  }
  get latestMessage(): AIMessage | null {
    return this._messages.length ? this._messages[this._messages.length - 1] : null;
  }
  get displayTitle(): string {
    return this._title || '新对话';
  }

  addMessage(message: AIMessage) {
    this._messages.push(message);
    this._messageCount = this._messages.length;
    this._lastMessageAt = message.createdAt;
    this._updatedAt = Date.now();
  }

  // Interface methods
  getDisplayTitle(): string {
    return this.displayTitle;
  }
  getStatusBadge(): string {
    return this.statusText;
  }
  canClose(): boolean {
    return this.isActive;
  }
  canArchive(): boolean {
    return this.isClosed;
  }
  canDelete(): boolean {
    return !this.isArchived;
  }
  hasMessages(): boolean {
    return this._messages.length > 0;
  }
  getMessageCount(): number {
    return this._messages.length;
  }

  toClientDTO(includeMessages = true): AIConversationClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      status: this._status,
      messageCount: this._messageCount,
      lastMessageAt: this._lastMessageAt ?? null,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      // Client DTO UI fields
      isActive: this.isActive,
      isClosed: this.isClosed,
      isArchived: this.isArchived,
      canAddMessage: this.canAddMessage,
      statusText: this.statusText,
      formattedCreatedAt: this.formattedCreatedAt,
      formattedUpdatedAt: this.formattedUpdatedAt,
      formattedLastMessageAt: this.formattedLastMessageAt,
      messages: includeMessages ? this._messages.map((m) => m.toClientDTO()) : undefined,
    };
  }

  toServerDTO(): AIConversationServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      status: this._status,
      messageCount: this._messageCount,
      lastMessageAt: this._lastMessageAt ?? null,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt ?? null,
      messages: this._messages.map((m) => m.toServerDTO()),
    };
  }

  static fromServerDTO(dto: AIConversationServerDTO): AIConversation {
    return new AIConversation({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      status: dto.status,
      messageCount: dto.messageCount,
      lastMessageAt: dto.lastMessageAt ?? null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt ?? null,
      messages: dto.messages?.map((m) => AIMessage.fromServerDTO(m)) || [],
    });
  }

  static fromClientDTO(dto: AIConversationClientDTO): AIConversation {
    return new AIConversation({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      status: dto.status,
      messageCount: dto.messageCount,
      lastMessageAt: dto.lastMessageAt ?? null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      messages: dto.messages?.map((m) => AIMessage.fromClientDTO(m)) || [],
    });
  }

  static forCreate(accountUuid: string, title: string): AIConversation {
    const now = Date.now();
    return new AIConversation({
      uuid: crypto.randomUUID(),
      accountUuid,
      title,
      status: ConversationStatus.ACTIVE,
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
      messages: [],
    });
  }

  clone(): AIConversationClient {
    return AIConversation.fromClientDTO(this.toClientDTO(true));
  }
}
