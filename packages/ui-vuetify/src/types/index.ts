export interface SnackbarOptions {
  show: boolean;
  message: string;
  color: 'success' | 'error' | 'warning' | 'info';
  timeout: number;
}

export interface FormRule {
  (value: any): boolean | string;
}

export interface UserBasicInfo {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  sex?: string;
  birthday?: string;
}

export interface RegistrationData {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
}

export interface LoginData {
  username: string;
  password: string;
  remember: boolean;
}

export interface PasswordStrength {
  score: number;
  text: string;
  color: string;
}

export type SexOption = {
  text: string;
  value: string;
};
