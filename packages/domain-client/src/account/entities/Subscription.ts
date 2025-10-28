/**
 * Subscription 实体实现 (Client)
 * 兼容 SubscriptionClient 接口
 */

import { AccountContracts, SubscriptionPlan, SubscriptionStatus, BillingCycle } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type ISubscriptionClient = AccountContracts.SubscriptionClient;
type SubscriptionClientDTO = AccountContracts.SubscriptionClientDTO;

/**
 * Subscription 实体 (Client)
 * 订阅实体
 */
export class Subscription extends Entity implements ISubscriptionClient {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _plan: SubscriptionPlan;
  private _status: SubscriptionStatus;
  private _startDate: number;
  private _endDate: number | null;
  private _renewalDate: number | null;
  private _autoRenew: boolean;
  private _paymentMethod: string | null;
  private _billingCycle: BillingCycle;
  private _amount: number | null;
  private _currency: string | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    startDate: number;
    endDate?: number | null;
    renewalDate?: number | null;
    autoRenew: boolean;
    paymentMethod?: string | null;
    billingCycle: BillingCycle;
    amount?: number | null;
    currency?: string | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._accountUuid = params.accountUuid;
    this._plan = params.plan;
    this._status = params.status;
    this._startDate = params.startDate;
    this._endDate = params.endDate ?? null;
    this._renewalDate = params.renewalDate ?? null;
    this._autoRenew = params.autoRenew;
    this._paymentMethod = params.paymentMethod ?? null;
    this._billingCycle = params.billingCycle;
    this._amount = params.amount ?? null;
    this._currency = params.currency ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get plan(): SubscriptionPlan {
    return this._plan;
  }
  public get status(): SubscriptionStatus {
    return this._status;
  }
  public get startDate(): number {
    return this._startDate;
  }
  public get endDate(): number | null {
    return this._endDate;
  }
  public get renewalDate(): number | null {
    return this._renewalDate;
  }
  public get autoRenew(): boolean {
    return this._autoRenew;
  }
  public get paymentMethod(): string | null {
    return this._paymentMethod;
  }
  public get billingCycle(): BillingCycle {
    return this._billingCycle;
  }
  public get amount(): number | null {
    return this._amount;
  }
  public get currency(): string | null {
    return this._currency;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建订阅
   */
  public static create(params: {
    accountUuid: string;
    plan?: SubscriptionPlan;
    billingCycle?: BillingCycle;
    autoRenew?: boolean;
  }): Subscription {
    const uuid = Entity.generateUUID();
    const now = Date.now();
    const plan = params.plan || SubscriptionPlan.FREE;

    return new Subscription({
      uuid,
      accountUuid: params.accountUuid,
      plan,
      status: SubscriptionStatus.ACTIVE,
      startDate: now,
      autoRenew: params.autoRenew ?? true,
      billingCycle: params.billingCycle || BillingCycle.MONTHLY,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): SubscriptionClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      plan: this._plan,
      status: this._status,
      startDate: this._startDate,
      endDate: this._endDate,
      renewalDate: this._renewalDate,
      autoRenew: this._autoRenew,
      paymentMethod: this._paymentMethod,
      billingCycle: this._billingCycle,
      amount: this._amount,
      currency: this._currency,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public static fromClientDTO(dto: SubscriptionClientDTO): Subscription {
    return new Subscription({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      plan: dto.plan as SubscriptionPlan,
      status: dto.status as SubscriptionStatus,
      startDate: dto.startDate,
      endDate: dto.endDate,
      renewalDate: dto.renewalDate,
      autoRenew: dto.autoRenew,
      paymentMethod: dto.paymentMethod,
      billingCycle: dto.billingCycle as BillingCycle,
      amount: dto.amount,
      currency: dto.currency,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
