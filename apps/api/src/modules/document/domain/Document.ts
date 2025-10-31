import { randomUUID } from 'crypto';
import type { DocumentContracts } from '@dailyuse/contracts';

type DocumentServerDTO = DocumentContracts.DocumentServerDTO;
type DocumentClientDTO = DocumentContracts.DocumentClientDTO;

type Result<T> = 
  | { isSuccess: true; isFailure: false; getValue: () => T }
  | { isSuccess: false; isFailure: true; error: string };

function success<T>(value: T): Result<T> {
  return {
    isSuccess: true,
    isFailure: false,
    getValue: () => value,
  };
}

function failure<T>(error: string): Result<T> {
  return {
    isSuccess: false,
    isFailure: true,
    error,
  };
}

interface DocumentProps {
  uuid: string;
  accountUuid: string;
  title: string;
  content: string;
  folderPath: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  currentVersion: number;
  lastVersionedAt: number | null;
  lastEditedAt: number | null;
  editSessionId: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

interface CreateDocumentProps {
  accountUuid: string;
  title: string;
  content: string;
  folderPath: string;
  tags: string[];
}

export class Document {
  private constructor(private props: DocumentProps) {}

  // Factory Methods
  static create(props: CreateDocumentProps): Result<Document> {
    // Validation
    if (!props.title || props.title.trim().length === 0) {
      return failure('Title is required');
    }
    if (props.title.length > 200) {
      return failure('Title must be less than 200 characters');
    }
    if (!props.content) {
      return failure('Content is required');
    }
    if (props.content.length > 102400) { // 100KB
      return failure('Content must be less than 100KB');
    }
    if (!props.folderPath) {
      return failure('Folder path is required');
    }
    if (!props.folderPath.startsWith('/')) {
      return failure('Folder path must start with /');
    }

    const now = Math.floor(Date.now() / 1000);
    const document = new Document({
      uuid: randomUUID(),
      accountUuid: props.accountUuid,
      title: props.title.trim(),
      content: props.content,
      folderPath: props.folderPath,
      tags: props.tags || [],
      status: 'DRAFT',
      currentVersion: 0,
      lastVersionedAt: null,
      lastEditedAt: null,
      editSessionId: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    return success(document);
  }

  static fromPersistence(props: DocumentProps): Result<Document> {
    return success(new Document(props));
  }

  // Business Methods
  updateTitle(newTitle: string): Result<void> {
    if (!newTitle || newTitle.trim().length === 0) {
      return failure('Title is required');
    }
    if (newTitle.length > 200) {
      return failure('Title must be less than 200 characters');
    }

    this.props.title = newTitle.trim();
    this.props.updatedAt = Math.floor(Date.now() / 1000);
    return success(undefined);
  }

  updateContent(newContent: string): Result<void> {
    if (!newContent) {
      return failure('Content is required');
    }
    if (newContent.length > 102400) {
      return failure('Content must be less than 100KB');
    }

    this.props.content = newContent;
    this.props.updatedAt = Math.floor(Date.now() / 1000);
    return success(undefined);
  }

  moveTo(newFolderPath: string): Result<void> {
    if (!newFolderPath || !newFolderPath.startsWith('/')) {
      return failure('Invalid folder path');
    }

    this.props.folderPath = newFolderPath;
    this.props.updatedAt = Math.floor(Date.now() / 1000);
    return success(undefined);
  }

  addTag(tag: string): Result<void> {
    if (!tag || tag.trim().length === 0) {
      return failure('Tag is required');
    }
    if (this.props.tags.includes(tag)) {
      return failure('Tag already exists');
    }

    this.props.tags.push(tag.trim());
    this.props.updatedAt = Math.floor(Date.now() / 1000);
    return success(undefined);
  }

  removeTag(tag: string): Result<void> {
    const index = this.props.tags.indexOf(tag);
    if (index === -1) {
      return failure('Tag not found');
    }

    this.props.tags.splice(index, 1);
    this.props.updatedAt = Math.floor(Date.now() / 1000);
    return success(undefined);
  }

  publish(): Result<void> {
    if (this.props.status === 'ARCHIVED') {
      return failure('Cannot publish archived document');
    }

    this.props.status = 'PUBLISHED';
    this.props.updatedAt = Math.floor(Date.now() / 1000);
    return success(undefined);
  }

  archive(): Result<void> {
    this.props.status = 'ARCHIVED';
    this.props.updatedAt = Math.floor(Date.now() / 1000);
    return success(undefined);
  }

  softDelete(): Result<void> {
    const now = Math.floor(Date.now() / 1000);
    this.props.deletedAt = now;
    this.props.updatedAt = now;
    return success(undefined);
  }

  // Version Management Methods
  incrementVersion(): void {
    this.props.currentVersion += 1;
    this.props.lastVersionedAt = Math.floor(Date.now() / 1000);
  }

  getCurrentVersionNumber(): number {
    return this.props.currentVersion;
  }

  getLastVersionedAt(): number | null {
    return this.props.lastVersionedAt;
  }

  // Edit Conflict Detection Methods
  updateWithConflictCheck(
    newContent: string,
    clientLastEditedAt: number | null,
    newSessionId: string
  ): Result<{ updated: boolean; conflict: boolean }> {
    // Check for conflict: another session has edited since client's last known edit
    if (
      this.props.lastEditedAt !== null &&
      clientLastEditedAt !== null &&
      this.props.lastEditedAt > clientLastEditedAt &&
      this.props.editSessionId !== newSessionId
    ) {
      return success({ updated: false, conflict: true });
    }

    // No conflict, update content
    const updateResult = this.updateContent(newContent);
    if (updateResult.isFailure) {
      return failure(updateResult.error);
    }

    // Update edit tracking fields
    this.props.lastEditedAt = Math.floor(Date.now() / 1000);
    this.props.editSessionId = newSessionId;

    return success({ updated: true, conflict: false });
  }

  getLastEditedAt(): number | null {
    return this.props.lastEditedAt;
  }

  getEditSessionId(): string | null {
    return this.props.editSessionId;
  }

  // Getters
  get uuid(): string {
    return this.props.uuid;
  }

  get accountUuid(): string {
    return this.props.accountUuid;
  }

  get title(): string {
    return this.props.title;
  }

  get content(): string {
    return this.props.content;
  }

  get excerpt(): string {
    const text = this.props.content.replace(/[#*`_\[\]]/g, '').trim();
    return text.substring(0, 200) + (text.length > 200 ? '...' : '');
  }

  get folderPath(): string {
    return this.props.folderPath;
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  get status(): string {
    return this.props.status;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  get currentVersion(): number {
    return this.props.currentVersion;
  }

  get lastVersionedAt(): number | null {
    return this.props.lastVersionedAt;
  }

  get createdAt(): number {
    return this.props.createdAt;
  }

  get updatedAt(): number {
    return this.props.updatedAt;
  }

  // DTO Conversions
  toServerDTO(): DocumentServerDTO {
    return {
      uuid: this.props.uuid,
      accountUuid: this.props.accountUuid,
      title: this.props.title,
      content: this.props.content,
      folderPath: this.props.folderPath,
      tags: this.props.tags,
      status: this.props.status,
      currentVersion: this.props.currentVersion,
      lastVersionedAt: this.props.lastVersionedAt,
      lastEditedAt: this.props.lastEditedAt,
      editSessionId: this.props.editSessionId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }

  toClientDTO(): DocumentClientDTO {
    return {
      uuid: this.props.uuid,
      title: this.props.title,
      content: this.props.content,
      excerpt: this.excerpt,
      folderPath: this.props.folderPath,
      tags: this.props.tags,
      status: this.props.status,
      currentVersion: this.props.currentVersion,
      lastVersionedAt: this.props.lastVersionedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  toPersistence(): any {
    return {
      uuid: this.props.uuid,
      accountUuid: this.props.accountUuid,
      title: this.props.title,
      content: this.props.content,
      folderPath: this.props.folderPath,
      tags: this.props.tags,
      status: this.props.status,
      currentVersion: this.props.currentVersion,
      lastVersionedAt: this.props.lastVersionedAt,
      lastEditedAt: this.props.lastEditedAt,
      editSessionId: this.props.editSessionId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      deletedAt: this.props.deletedAt,
    };
  }
}
