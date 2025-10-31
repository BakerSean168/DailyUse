import { Document } from './Document';

export interface FindOptions {
  page: number;
  pageSize: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  folderPath?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DocumentRepository {
  save(document: Document): Promise<void>;
  findByUuid(uuid: string): Promise<Document | null>;
  findByAccountUuid(
    accountUuid: string,
    options: FindOptions
  ): Promise<PaginatedResult<Document>>;
  delete(uuid: string): Promise<void>;
}

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');
