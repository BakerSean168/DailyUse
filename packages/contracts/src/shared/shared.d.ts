/**
 * 设备信息类型
 */
export type ClientInfo = {
    deviceId: string;
    deviceName: string;
    userAgent: string;
    ipAddress?: string;
};
/**
 * 用户协议同意信息
 */
export type UserAgreement = {
    agreedToTerms: boolean;
    agreedToPrivacy: boolean;
    termsVersion: string;
    privacyVersion: string;
    agreedAt: number;
    ipAddress?: string;
};
//# sourceMappingURL=shared.d.ts.map