/**
 * Subscription 实体实现
 * 实现 SubscriptionServer 接口
 */

import {
  SubscriptionClientDTO,
  SubscriptionPersistenceDTO,
  SubscriptionServer,
  SubscriptionServerDTO,
} from '@dailyuse/contracts/account';
import { Entity } from '@dailyuse/utils';

export class Subscription extends Entity implements SubscriptionServer {
  private _accountUuid: string;
  private _plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  private _status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
  private _startDate: number;
  private _endDate: number | null;
  private _renewalDate: number | null;
  private _autoRenew: boolean;
  private _paymentMethod: string | null;
  private _billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  private _amount: number | null;
  private _currency: string | null;
  private _createdAt: number;
  private _updatedAt: number;

  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
    startDate: number;
    endDate?: number | null;
    renewalDate?: number | null;
    autoRenew: boolean;
    paymentMethod?: string | null;
    billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
    amount?: number | null;
    currency?: string | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid ?? Entity.generateUUID());
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

  // Getters
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get plan(): 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE' {
    return this._plan;
  }
  public get status(): 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED' {
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
  public get billingCycle(): 'MONTHLY' | 'YEARLY' | 'LIFETIME' {
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

  // Factory methods
  public static create(params: {
    accountUuid: string;
    plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
    billingCycle?: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  }): Subscription {
    const now = Date.now();
    return new Subscription({
      accountUuid: params.accountUuid,
      plan: params.plan,
      status: 'ACTIVE',
      startDate: now,
      autoRenew: true,
      billingCycle: params.billingCycle ?? 'MONTHLY',
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromServerDTO(dto: SubscriptionServerDTO): Subscription {
    return new Subscription({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      plan: dto.plan,
      status: dto.status,
      startDate: dto.startDate,
      endDate: dto.endDate,
      renewalDate: dto.renewalDate,
      autoRenew: dto.autoRenew,
      paymentMethod: dto.paymentMethod,
      billingCycle: dto.billingCycle,
      amount: dto.amount,
      currency: dto.currency,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static fromPersistenceDTO(dto: SubscriptionPersistenceDTO): Subscription {
    return new Subscription({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      plan: dto.plan,
      status: dto.status,
      startDate: dto.startDate,
      endDate: dto.endDate,
      renewalDate: dto.renewalDate,
      autoRenew: dto.autoRenew,
      paymentMethod: dto.paymentMethod,
      billingCycle: dto.billingCycle,
      amount: dto.amount,
      currency: dto.currency,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  // Business methods
  public isActive(): boolean {
    return this._status === 'ACTIVE' && (!this._endDate || Date.now() < this._endDate);
  }

  public isExpired(): boolean {
    return this._endDate !== null && Date.now() > this._endDate;
  }

  public cancel(): void {
    this._status = 'CANCELLED';
    this._autoRenew = false;
    this._updatedAt = Date.now();
  }

  public renew(): void {
    const now = Date.now();
    if (this._billingCycle === 'MONTHLY') {
      this._renewalDate = now + 30 * 24 * 60 * 60 * 1000;
    } else if (this._billingCycle === 'YEARLY') {
      this._renewalDate = now + 365 * 24 * 60 * 60 * 1000;
    }
    this._status = 'ACTIVE';
    this._updatedAt = now;
  }

  public upgrade(plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'): void {
    this._plan = plan;
    this._updatedAt = Date.now();
  }

  public downgrade(plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'): void {
    this._plan = plan;
    this._updatedAt = Date.now();
  }

  // DTO conversion
  public toServerDTO(): SubscriptionServerDTO {
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

  public toPersistenceDTO(): SubscriptionPersistenceDTO {
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
}
