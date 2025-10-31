// @ts-nocheck
import { DocumentLink } from './DocumentLink';

export const DOCUMENT_LINK_REPOSITORY = Symbol('DOCUMENT_LINK_REPOSITORY');

export interface DocumentLinkRepository {
  /**
   * Save document link
   */
  save(link: DocumentLink): Promise<void>;

  /**
   * Find links by source document UUID
   */
  findBySourceDocument(sourceDocumentUuid: string): Promise<DocumentLink[]>;

  /**
   * Find links by target document UUID (backlinks)
   */
  findByTargetDocument(targetDocumentUuid: string): Promise<DocumentLink[]>;

  /**
   * Find broken links
   */
  findBrokenLinks(): Promise<DocumentLink[]>;

  /**
   * Delete link by UUID
   */
  delete(uuid: string): Promise<void>;

  /**
   * Delete all links for a source document
   */
  deleteBySourceDocument(sourceDocumentUuid: string): Promise<void>;

  /**
   * Mark links as broken when target document is deleted
   */
  markLinksAsBroken(targetDocumentUuid: string): Promise<void>;
}
