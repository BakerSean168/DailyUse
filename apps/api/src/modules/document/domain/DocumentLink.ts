// @ts-nocheck
import { randomUUID } from 'crypto';

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

interface DocumentLinkProps {
  uuid: string;
  sourceDocumentUuid: string;
  targetDocumentUuid: string | null;
  linkText: string;
  linkPosition: number;
  isBroken: boolean;
  createdAt: number;
  updatedAt: number;
}

interface CreateDocumentLinkProps {
  sourceDocumentUuid: string;
  targetDocumentUuid: string | null;
  linkText: string;
  linkPosition: number;
}

export class DocumentLink {
  private constructor(private props: DocumentLinkProps) {}

  // Factory Methods
  static create(props: CreateDocumentLinkProps): Result<DocumentLink> {
    // Validation
    if (!props.sourceDocumentUuid || props.sourceDocumentUuid.trim().length === 0) {
      return failure('Source document UUID is required');
    }
    if (!props.linkText || props.linkText.trim().length === 0) {
      return failure('Link text is required');
    }
    if (props.linkText.length > 200) {
      return failure('Link text must be less than 200 characters');
    }
    if (props.linkPosition < 0) {
      return failure('Link position must be non-negative');
    }

    const now = Math.floor(Date.now() / 1000);
    const link = new DocumentLink({
      uuid: randomUUID(),
      sourceDocumentUuid: props.sourceDocumentUuid,
      targetDocumentUuid: props.targetDocumentUuid,
      linkText: props.linkText.trim(),
      linkPosition: props.linkPosition,
      isBroken: props.targetDocumentUuid === null, // Broken if no target
      createdAt: now,
      updatedAt: now,
    });

    return success(link);
  }

  static fromPersistence(props: DocumentLinkProps): Result<DocumentLink> {
    return success(new DocumentLink(props));
  }

  // Business Methods
  markAsBroken(): Result<void> {
    if (this.props.isBroken) {
      return failure('Link is already marked as broken');
    }

    this.props.isBroken = true;
    this.props.targetDocumentUuid = null;
    this.props.updatedAt = Math.floor(Date.now() / 1000);
    return success(undefined);
  }

  repair(newTargetUuid: string): Result<void> {
    if (!this.props.isBroken) {
      return failure('Link is not broken');
    }
    if (!newTargetUuid || newTargetUuid.trim().length === 0) {
      return failure('Target document UUID is required');
    }

    this.props.isBroken = false;
    this.props.targetDocumentUuid = newTargetUuid;
    this.props.updatedAt = Math.floor(Date.now() / 1000);
    return success(undefined);
  }

  updatePosition(newPosition: number): Result<void> {
    if (newPosition < 0) {
      return failure('Link position must be non-negative');
    }

    this.props.linkPosition = newPosition;
    this.props.updatedAt = Math.floor(Date.now() / 1000);
    return success(undefined);
  }

  // Getters
  get uuid(): string {
    return this.props.uuid;
  }

  get sourceDocumentUuid(): string {
    return this.props.sourceDocumentUuid;
  }

  get targetDocumentUuid(): string | null {
    return this.props.targetDocumentUuid;
  }

  get linkText(): string {
    return this.props.linkText;
  }

  get linkPosition(): number {
    return this.props.linkPosition;
  }

  get isBroken(): boolean {
    return this.props.isBroken;
  }

  get createdAt(): number {
    return this.props.createdAt;
  }

  get updatedAt(): number {
    return this.props.updatedAt;
  }

  // DTO Conversions
  toDTO(): any {
    return {
      uuid: this.props.uuid,
      sourceDocumentUuid: this.props.sourceDocumentUuid,
      targetDocumentUuid: this.props.targetDocumentUuid,
      linkText: this.props.linkText,
      linkPosition: this.props.linkPosition,
      isBroken: this.props.isBroken,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  toPersistence(): any {
    return {
      uuid: this.props.uuid,
      sourceDocumentUuid: this.props.sourceDocumentUuid,
      targetDocumentUuid: this.props.targetDocumentUuid,
      linkText: this.props.linkText,
      linkPosition: this.props.linkPosition,
      isBroken: this.props.isBroken,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
