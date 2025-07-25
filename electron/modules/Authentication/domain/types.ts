export interface PasswordAuthenticationRequest {
  username: string;
  password: string;
  remember?: boolean;
  clientInfo?: {
    ip: string;
    userAgent: string;
    deviceId: string;
    location: string;
    country: string;
    city: string;
  };
}
export interface PasswordAuthenticationResponse {
  token: string | null;
  username: string;
  accountUuid: string;
}

export interface AuthInfo {
  token: string;
  accountUuid: string;
  // 其它需要的字段
}