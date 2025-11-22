// Migrated from ai-tools/types/knowledgeGeneration.ts
export enum TaskStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
export enum DocumentStatus {
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
export enum TargetAudience {
  BEGINNERS = 'Beginners',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}
export interface GeneratedDocumentPreview {
  uuid: string;
  title: string;
  status: DocumentStatus;
  excerpt: string;
  wordCount: number;
  errorMessage?: string;
}
export interface KnowledgeGenerationTask {
  taskUuid: string;
  topic: string;
  status: TaskStatus;
  progress: number;
  generatedDocuments: GeneratedDocumentPreview[];
  estimatedTimeRemaining?: number;
  error?: string;
  createdAt: number;
  completedAt?: number;
}
export interface KnowledgeGenerationRequest {
  topic: string;
  documentCount: number;
  targetAudience: TargetAudience;
  folderPath?: string;
}
export interface GeneratedDocument {
  uuid: string;
  title: string;
  content: string;
  wordCount: number;
  status: DocumentStatus;
  folderPath: string;
  createdAt: number;
}
