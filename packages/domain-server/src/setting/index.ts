/**
 * Setting Module - Domain Server
 * 设置模块 - 领域服务端
 *
 * 导出所有领域层组件：
 * - 值对象 (Value Objects)
 * - 实体 (Entities)
 * - 聚合根 (Aggregates)
 * - 仓储接口 (Repository Interfaces)
 * - 领域服务 (Domain Services)
 */

// ============ 值对象 ============
export { ValidationRule } from './value-objects/ValidationRule';
export { UIConfig } from './value-objects/UIConfig';
export { SyncConfig } from './value-objects/SyncConfig';

// ============ 实体 ============
export { SettingHistory } from './entities/SettingHistory';
export { SettingItem } from './entities/SettingItem';
export { SettingGroup } from './entities/SettingGroup';

// ============ 聚合根 ============
export { Setting } from './aggregates/Setting';
export { AppConfigServer } from './aggregates/AppConfigServer';
export { UserSettingServer } from './aggregates/UserSettingServer';
export { UserSetting } from './aggregates/UserSetting';

// ============ 仓储接口 ============
export type { ISettingRepository } from './repositories/ISettingRepository';
export type { IAppConfigRepository } from './repositories/IAppConfigRepository';
export type { IUserSettingRepository } from './repositories/IUserSettingRepository';

// ============ 领域服务 ============
export { SettingDomainService } from './services/SettingDomainService';
