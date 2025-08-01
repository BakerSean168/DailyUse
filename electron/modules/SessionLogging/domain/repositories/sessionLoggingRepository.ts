import { SessionLog } from "../aggregates/sessionLog";
import { AuditTrail } from "../entities/auditTrail";

/**
 * 会话日志存储库接口
 */
export interface ISessionLoggingRepository {
  save(sessionLog: SessionLog): Promise<void>;
  findById(uuid: string): Promise<SessionLog | null>;
  findByAccountUuid(accountUuid: string): Promise<SessionLog[]>;
  findBySessionId(sessionId: string): Promise<SessionLog[]>;
  findByOperationType(operationType: string): Promise<SessionLog[]>;
  findAnomalous(): Promise<SessionLog[]>;
  findByRiskLevel(riskLevel: string): Promise<SessionLog[]>;
  findByTimeRange(startTime: Date, endTime: Date): Promise<SessionLog[]>;
  findByAccountUuidAndTimeRange(accountUuid: string, startTime: Date, endTime: Date): Promise<SessionLog[]>;
  delete(uuid: string): Promise<void>;
  deleteByAccountUuid(accountUuid: string): Promise<void>;
  deleteOlderThan(date: Date): Promise<number>;
}

/**
 * 审计轨迹存储库接口
 */
export interface IAuditTrailRepository {
  save(sessionLogUuid: string, auditTrail: AuditTrail): Promise<void>;
  findById(uuid: string): Promise<AuditTrail | null>;
  findByAccountUuid(accountUuid: string): Promise<AuditTrail[]>;
  findBySessionLogId(sessionLogId: string): Promise<AuditTrail[]>;
  findByOperationType(operationType: string): Promise<AuditTrail[]>;
  findByRiskLevel(riskLevel: string): Promise<AuditTrail[]>;
  findAlertsTriggered(): Promise<AuditTrail[]>;
  findByTimeRange(startTime: Date, endTime: Date): Promise<AuditTrail[]>;
  findByAccountUuidAndTimeRange(accountUuid: string, startTime: Date, endTime: Date): Promise<AuditTrail[]>;
  delete(uuid: string): Promise<void>;
  deleteByAccountUuid(accountUuid: string): Promise<void>;
  deleteBySessionLogId(sessionLogId: string): Promise<void>;
  deleteOlderThan(date: Date): Promise<number>;
}
