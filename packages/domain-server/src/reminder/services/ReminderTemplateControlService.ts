/**
 * ReminderTemplateControlService - 提醒模板控制服务
 *
 * DDD Domain Service:
 * - 处理提醒模板的有效启用状态计算
 * - 考虑分组控制模式的影响
 * - 跨聚合根的业务逻辑（ReminderTemplate + ReminderGroup）
 *
 * 职责：
 * - 计算模板是否真正处于启用状态（考虑分组控制）
 * - 批量计算模板的有效状态
 * - 提供状态查询接口
 */

import type { ReminderTemplate } from '../aggregates/ReminderTemplate';
import type { ReminderGroup } from '../aggregates/ReminderGroup';
import type { IReminderTemplateRepository } from '../repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '../repositories/IReminderGroupRepository';
import { ReminderContracts } from '@dailyuse/contracts';

type ControlMode = ReminderContracts.ControlMode;
const ControlMode = ReminderContracts.ControlMode;
type ReminderStatus = ReminderContracts.ReminderStatus;
const ReminderStatus = ReminderContracts.ReminderStatus;

// 显式导出类型以解决 tsup dts 生成问题
export type { ControlMode, ReminderStatus };

/**
 * 模板有效状态结果
 */
export interface ITemplateEffectiveStatus {
  /** 模板 UUID */
  templateUuid: string;
  /** 模板自身状态 */
  templateStatus: ReminderStatus;
  /** 所属分组 UUID */
  groupUuid: string | null;
  /** 分组状态 */
  groupStatus: ReminderStatus | null;
  /** 分组控制模式 */
  controlMode: ControlMode | null;
  /** 最终有效状态（考虑分组控制后） */
  effectiveStatus: ReminderStatus;
  /** 是否真正启用 */
  isEffectivelyEnabled: boolean;
  /** 状态说明 */
  statusReason: string;
}

/**
 * ReminderTemplateControlService
 */
export class ReminderTemplateControlService {
  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly groupRepository: IReminderGroupRepository,
  ) {}

  /**
   * 计算单个模板的有效启用状态
   *
   * 规则：
   * - 如果模板未分组：模板状态 = 有效状态
   * - 如果分组为 INDIVIDUAL 模式：模板状态 = 有效状态
   * - 如果分组为 GROUP 模式：分组状态 AND 模板状态 = 有效状态
   */
  async calculateEffectiveStatus(template: ReminderTemplate): Promise<ITemplateEffectiveStatus> {
    const groupUuid = template.groupUuid;
    const templateStatus = template.status;

    // 未分组：模板状态即有效状态
    if (!groupUuid) {
      return {
        templateUuid: template.uuid,
        templateStatus,
        groupUuid: null,
        groupStatus: null,
        controlMode: null,
        effectiveStatus: templateStatus,
        isEffectivelyEnabled: templateStatus === ReminderStatus.ACTIVE,
        statusReason: '未分组，使用模板自身状态',
      };
    }

    // 获取分组信息
    const group = await this.groupRepository.findById(groupUuid);
    if (!group) {
      // 分组不存在，视为未分组
      return {
        templateUuid: template.uuid,
        templateStatus,
        groupUuid,
        groupStatus: null,
        controlMode: null,
        effectiveStatus: templateStatus,
        isEffectivelyEnabled: templateStatus === ReminderStatus.ACTIVE,
        statusReason: '分组不存在，使用模板自身状态',
      };
    }

    const groupStatus = group.status;
    const controlMode = group.controlMode;

    // INDIVIDUAL 模式：模板状态即有效状态
    if (controlMode === ControlMode.INDIVIDUAL) {
      return {
        templateUuid: template.uuid,
        templateStatus,
        groupUuid,
        groupStatus,
        controlMode,
        effectiveStatus: templateStatus,
        isEffectivelyEnabled: templateStatus === ReminderStatus.ACTIVE,
        statusReason: '分组为独立控制模式，使用模板自身状态',
      };
    }

    // GROUP 模式：分组状态 AND 模板状态
    const effectiveStatus =
      groupStatus === ReminderStatus.ACTIVE && templateStatus === ReminderStatus.ACTIVE
        ? ReminderStatus.ACTIVE
        : ReminderStatus.PAUSED;

    let statusReason = '分组为组控制模式';
    if (groupStatus === ReminderStatus.PAUSED) {
      statusReason += '，分组已暂停';
    } else if (templateStatus === ReminderStatus.PAUSED) {
      statusReason += '，模板已暂停';
    } else {
      statusReason += '，分组和模板均启用';
    }

    return {
      templateUuid: template.uuid,
      templateStatus,
      groupUuid,
      groupStatus,
      controlMode,
      effectiveStatus,
      isEffectivelyEnabled: effectiveStatus === ReminderStatus.ACTIVE,
      statusReason,
    };
  }

  /**
   * 批量计算多个模板的有效启用状态
   */
  async calculateEffectiveStatusBatch(
    templates: ReminderTemplate[],
  ): Promise<ITemplateEffectiveStatus[]> {
    // 收集所有相关的分组 UUID
    const groupUuids = new Set<string>();
    for (const template of templates) {
      if (template.groupUuid) {
        groupUuids.add(template.groupUuid);
      }
    }

    // 批量加载分组
    const groups = await this.groupRepository.findByIds(Array.from(groupUuids));
    const groupMap = new Map<string, ReminderGroup>();
    for (const group of groups) {
      groupMap.set(group.uuid, group);
    }

    // 计算每个模板的有效状态
    const results: ITemplateEffectiveStatus[] = [];
    for (const template of templates) {
      const groupUuid = template.groupUuid;
      const templateStatus = template.status;

      if (!groupUuid) {
        results.push({
          templateUuid: template.uuid,
          templateStatus,
          groupUuid: null,
          groupStatus: null,
          controlMode: null,
          effectiveStatus: templateStatus,
          isEffectivelyEnabled: templateStatus === ReminderStatus.ACTIVE,
          statusReason: '未分组，使用模板自身状态',
        });
        continue;
      }

      const group = groupMap.get(groupUuid);
      if (!group) {
        results.push({
          templateUuid: template.uuid,
          templateStatus,
          groupUuid,
          groupStatus: null,
          controlMode: null,
          effectiveStatus: templateStatus,
          isEffectivelyEnabled: templateStatus === ReminderStatus.ACTIVE,
          statusReason: '分组不存在，使用模板自身状态',
        });
        continue;
      }

      const groupStatus = group.status;
      const controlMode = group.controlMode;

      if (controlMode === ControlMode.INDIVIDUAL) {
        results.push({
          templateUuid: template.uuid,
          templateStatus,
          groupUuid,
          groupStatus,
          controlMode,
          effectiveStatus: templateStatus,
          isEffectivelyEnabled: templateStatus === ReminderStatus.ACTIVE,
          statusReason: '分组为独立控制模式，使用模板自身状态',
        });
        continue;
      }

      const effectiveStatus =
        groupStatus === ReminderStatus.ACTIVE && templateStatus === ReminderStatus.ACTIVE
          ? ReminderStatus.ACTIVE
          : ReminderStatus.PAUSED;

      let statusReason = '分组为组控制模式';
      if (groupStatus === ReminderStatus.PAUSED) {
        statusReason += '，分组已暂停';
      } else if (templateStatus === ReminderStatus.PAUSED) {
        statusReason += '，模板已暂停';
      } else {
        statusReason += '，分组和模板均启用';
      }

      results.push({
        templateUuid: template.uuid,
        templateStatus,
        groupUuid,
        groupStatus,
        controlMode,
        effectiveStatus,
        isEffectivelyEnabled: effectiveStatus === ReminderStatus.ACTIVE,
        statusReason,
      });
    }

    return results;
  }

  /**
   * 检查模板是否真正启用
   * （快捷方法，不需要完整的状态信息）
   */
  async isTemplateEffectivelyEnabled(template: ReminderTemplate): Promise<boolean> {
    const status = await this.calculateEffectiveStatus(template);
    return status.isEffectivelyEnabled;
  }

  /**
   * 获取分组下所有真正启用的模板
   */
  async getEffectivelyEnabledTemplatesInGroup(groupUuid: string): Promise<ReminderTemplate[]> {
    const templates = await this.templateRepository.findByGroupUuid(groupUuid);
    const statusResults = await this.calculateEffectiveStatusBatch(templates);

    const enabledTemplateUuids = statusResults
      .filter((r) => r.isEffectivelyEnabled)
      .map((r) => r.templateUuid);

    return templates.filter((t) => enabledTemplateUuids.includes(t.uuid));
  }

  /**
   * 获取账户下所有真正启用的模板
   */
  async getEffectivelyEnabledTemplatesByAccount(accountUuid: string): Promise<ReminderTemplate[]> {
    const templates = await this.templateRepository.findByAccountUuid(accountUuid);
    const statusResults = await this.calculateEffectiveStatusBatch(templates);

    const enabledTemplateUuids = statusResults
      .filter((r) => r.isEffectivelyEnabled)
      .map((r) => r.templateUuid);

    return templates.filter((t) => enabledTemplateUuids.includes(t.uuid));
  }
}
