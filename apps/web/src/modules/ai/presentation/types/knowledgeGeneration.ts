/**
 * Knowledge Generation Types
 *
 * Type definitions for the Knowledge Generation Wizard feature.
 * These types align with the backend API contract from Story 4.3.
 */

/**
 * Task status enum for knowledge generation tasks
 */
export enum TaskStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Document generation status
 */
export enum DocumentStatus {
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Target audience options for generated content
 */
export enum TargetAudience {
  BEGINNERS = 'Beginners',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

/**
 * Generated document preview (displayed in Step 3)
 */
export interface GeneratedDocumentPreview {
  /** Unique identifier for the document */
  uuid: string;
  /** Document title */
  title: string;
  /** Generation status */
  status: DocumentStatus;
  /** Text excerpt (first 200 chars) */
  excerpt: string;
  /** Word count of full document */
  wordCount: number;
  /** Error message if status is FAILED */
  errorMessage?: string;
}

/**
 * Knowledge generation task (backend response)
 */
export interface KnowledgeGenerationTask {
  /** Task UUID (returned from POST) */
  taskUuid: string;
  /** Topic provided by user */
  topic: string;
  /** Current task status */
  status: TaskStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Array of generated documents */
  generatedDocuments: GeneratedDocumentPreview[];
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
  /** Error message if task failed */
  error?: string;
  /** Task creation timestamp */
  createdAt: number;
  /** Task completion timestamp */
  completedAt?: number;
}

/**
 * Request payload for starting knowledge generation
 */
export interface KnowledgeGenerationRequest {
  /** Topic to generate content about */
  topic: string;
  /** Number of documents to generate (3-7) */
  documentCount: number;
  /** Target audience level */
  targetAudience: TargetAudience;
  /** Optional: destination folder path in Knowledge Base */
  folderPath?: string;
}

/**
 * Complete document response (fetched after completion)
 */
export interface GeneratedDocument {
  /** Document UUID */
  uuid: string;
  /** Document title */
  title: string;
  /** Full document content (markdown) */
  content: string;
  /** Word count */
  wordCount: number;
  /** Generation status */
  status: DocumentStatus;
  /** Folder path where document is saved */
  folderPath: string;
  /** Creation timestamp */
  createdAt: number;
}
