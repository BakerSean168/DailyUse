/**
 * NotificationMetadata Value Object (Server)
 * �Cpn<�a - ��
 */

// ============ ��I ============

/**
 * �Cpn - Server ��
 */
export interface INotificationMetadataServer {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: any; // �Ipn

  // <�a��
  equals(other: INotificationMetadataServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationMetadataServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationMetadataServer;

  // DTO lb��
  toServerDTO(): NotificationMetadataServerDTO;
  toClientDTO(): NotificationMetadataClientDTO;
  toPersistenceDTO(): NotificationMetadataPersistenceDTO;
}

// ============ DTO �I ============

/**
 * NotificationMetadata Server DTO
 */
export interface NotificationMetadataServerDTO {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: any;
}

/**
 * NotificationMetadata Client DTO ((� Server -> Client lb)
 */
export interface NotificationMetadataClientDTO {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: any;
  hasIcon: boolean;
  hasImage: boolean;
  hasBadge: boolean;
}

/**
 * NotificationMetadata Persistence DTO
 */
export interface NotificationMetadataPersistenceDTO {
  icon?: string | null;
  image?: string | null;
  color?: string | null;
  sound?: string | null;
  badge?: number | null;
  data?: string | null; // JSON string
}

// ============ {��� ============

export type NotificationMetadataServer = INotificationMetadataServer;
