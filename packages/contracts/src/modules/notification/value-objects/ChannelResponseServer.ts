/**
 * ChannelResponse Value Object (Server)
 *  S͔<�a - 
��
 */

import type { ChannelResponseClientDTO } from './ChannelResponseClient';
// ============ ��I ============

/**
 *  S͔ - Server ��
 */
export interface IChannelResponseServer {
  messageId?: string | null;
  statusCode?: number | null;
  data?: any;

  // <�a��
  equals(other: IChannelResponseServer): boolean;
  with(
    updates: Partial<
      Omit<
        IChannelResponseServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IChannelResponseServer;

  // DTO lb��
  toServerDTO(): ChannelResponseServerDTO;
  toClientDTO(): ChannelResponseClientDTO;
  toPersistenceDTO(): ChannelResponsePersistenceDTO;
}

// ============ DTO �I ============

/**
 * ChannelResponse Server DTO
 */
export interface ChannelResponseServerDTO {
  messageId?: string | null;
  statusCode?: number | null;
  data?: any;
}

/**
 * ChannelResponse Persistence DTO
 */
export interface ChannelResponsePersistenceDTO {
  message_id?: string | null;
  status_code?: number | null;
  data?: string | null; // JSON string
}

// ============ {��� ============

export type ChannelResponseServer = IChannelResponseServer;
