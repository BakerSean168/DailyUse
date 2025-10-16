/**
 * NotificationAction Value Object (Server)
 * ��\<�a - ��
 */

import type { NotificationActionType } from '../enums';

// ============ ��I ============

/**
 * ��\ - Server ��
 */
export interface INotificationActionServer {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;

  // <�a��
  equals(other: INotificationActionServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationActionServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationActionServer;

  // DTO lb��
  toServerDTO(): NotificationActionServerDTO;
  toClientDTO(): NotificationActionClientDTO;
  toPersistenceDTO(): NotificationActionPersistenceDTO;
}

// ============ DTO �I ============

/**
 * NotificationAction Server DTO
 */
export interface NotificationActionServerDTO {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;
}

/**
 * NotificationAction Client DTO ((� Server -> Client lb)
 */
export interface NotificationActionClientDTO {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;
  typeText: string;
  icon: string;
}

/**
 * NotificationAction Persistence DTO
 */
export interface NotificationActionPersistenceDTO {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: string | null; // JSON string
}

// ============ {��� ============

export type NotificationActionServer = INotificationActionServer;
