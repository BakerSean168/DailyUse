/**
 * DeviceInfo 值对象实现 (Client)
 * 兼容 DeviceInfoClient 接口
 */

import { AuthenticationContracts, DeviceType } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IDeviceInfoClient = AuthenticationContracts.DeviceInfoClient;
type DeviceInfoClientDTO = AuthenticationContracts.DeviceInfoClientDTO;

/**
 * DeviceInfo 值对象 (Client)
 * 设备信息值对象
 */
export class DeviceInfo extends ValueObject implements IDeviceInfoClient {
  // ===== 私有字段 =====
  private _deviceId: string;
  private _deviceFingerprint: string;
  private _deviceType: DeviceType;
  private _deviceName: string | null;
  private _os: string | null;
  private _browser: string | null;
  private _ipAddress: string | null;
  private _location: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;
  private _firstSeenAt: number;
  private _lastSeenAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    deviceId: string;
    deviceFingerprint: string;
    deviceType: DeviceType;
    deviceName?: string | null;
    os?: string | null;
    browser?: string | null;
    ipAddress?: string | null;
    location?: {
      country?: string | null;
      region?: string | null;
      city?: string | null;
      timezone?: string | null;
    } | null;
    firstSeenAt: number;
    lastSeenAt: number;
  }) {
    super();
    this._deviceId = params.deviceId;
    this._deviceFingerprint = params.deviceFingerprint;
    this._deviceType = params.deviceType;
    this._deviceName = params.deviceName ?? null;
    this._os = params.os ?? null;
    this._browser = params.browser ?? null;
    this._ipAddress = params.ipAddress ?? null;
    this._location = params.location ?? null;
    this._firstSeenAt = params.firstSeenAt;
    this._lastSeenAt = params.lastSeenAt;
  }

  // ===== Getter 属性 =====
  public get deviceId(): string {
    return this._deviceId;
  }
  public get deviceFingerprint(): string {
    return this._deviceFingerprint;
  }
  public get deviceType(): DeviceType {
    return this._deviceType;
  }
  public get deviceName(): string | null {
    return this._deviceName;
  }
  public get os(): string | null {
    return this._os;
  }
  public get browser(): string | null {
    return this._browser;
  }
  public get ipAddress(): string | null {
    return this._ipAddress;
  }
  public get location(): DeviceInfo['_location'] {
    return this._location ? { ...this._location } : null;
  }
  public get firstSeenAt(): number {
    return this._firstSeenAt;
  }
  public get lastSeenAt(): number {
    return this._lastSeenAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建设备信息
   */
  public static create(params: {
    deviceId: string;
    deviceFingerprint: string;
    deviceType: DeviceType;
    deviceName?: string;
    os?: string;
    browser?: string;
    ipAddress?: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  }): DeviceInfo {
    const now = Date.now();

    return new DeviceInfo({
      ...params,
      firstSeenAt: now,
      lastSeenAt: now,
    });
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): DeviceInfoClientDTO {
    return {
      deviceId: this._deviceId,
      deviceFingerprint: this._deviceFingerprint,
      deviceType: this._deviceType,
      deviceName: this._deviceName,
      os: this._os,
      browser: this._browser,
      ipAddress: this._ipAddress,
      location: this._location ? { ...this._location } : null,
      firstSeenAt: this._firstSeenAt,
      lastSeenAt: this._lastSeenAt,
    };
  }

  public static fromClientDTO(dto: DeviceInfoClientDTO): DeviceInfo {
    return new DeviceInfo({
      deviceId: dto.deviceId,
      deviceFingerprint: dto.deviceFingerprint,
      deviceType: dto.deviceType as DeviceType,
      deviceName: dto.deviceName,
      os: dto.os,
      browser: dto.browser,
      ipAddress: dto.ipAddress,
      location: dto.location,
      firstSeenAt: dto.firstSeenAt,
      lastSeenAt: dto.lastSeenAt,
    });
  }

  // ===== ValueObject 必需方法 =====

  /**
   * 判断两个 DeviceInfo 是否相等
   */
  public equals(other: DeviceInfo): boolean {
    if (!(other instanceof DeviceInfo)) {
      return false;
    }
    return this._deviceId === other._deviceId && this._deviceFingerprint === other._deviceFingerprint;
  }
}
