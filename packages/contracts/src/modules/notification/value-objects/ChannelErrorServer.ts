/**
 * ChannelError Value Object (Server)
 *  S�<�a - ��
 */

// ============ ��I ============

/**
 *  S� - Server ��
 */
export interface IChannelErrorServer {
  code: string;
  message: string;
  details?: any;

  // <�a��
  equals(other: IChannelErrorServer): boolean;
  with(
    updates: Partial<
      Omit<
        IChannelErrorServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IChannelErrorServer;

  // DTO lb��
  toServerDTO(): ChannelErrorServerDTO;
  toClientDTO(): ChannelErrorClientDTO;
  toPersistenceDTO(): ChannelErrorPersistenceDTO;
}

// ============ DTO �I ============

/**
 * ChannelError Server DTO
 */
export interface ChannelErrorServerDTO {
  code: string;
  message: string;
  details?: any;
}

/**
 * ChannelError Client DTO ((� Server -> Client lb)
 */
export interface ChannelErrorClientDTO {
  code: string;
  message: string;
  details?: any;
  displayMessage: string;
  isRetryable: boolean;
}

/**
 * ChannelError Persistence DTO
 */
export interface ChannelErrorPersistenceDTO {
  code: string;
  message: string;
  details?: string | null; // JSON string
}

// ============ {��� ============

export type ChannelErrorServer = IChannelErrorServer;
