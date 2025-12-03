import { useState, useMemo, useCallback } from 'react';
import {
  createPasswordStrength,
  generatePassword,
  type PasswordStrengthLevel,
  type PasswordStrengthResult,
} from '@dailyuse/ui-core';

export interface UsePasswordStrengthReturn {
  /** The password being analyzed */
  password: string;
  /** Set password */
  setPassword: (password: string) => void;
  /** Current strength level */
  level: PasswordStrengthLevel;
  /** Strength score (0-100) */
  score: number;
  /** Display label for current strength */
  label: string;
  /** Color for current strength */
  color: string;
  /** Full strength result */
  strength: PasswordStrengthResult;
  /** Generate a random password */
  generate: (length?: number) => string;
}

/**
 * React hook for password strength analysis
 * Wraps @dailyuse/ui-core password strength logic
 */
export function usePasswordStrength(initialPassword = ''): UsePasswordStrengthReturn {
  const [password, setPassword] = useState(initialPassword);
  const core = useMemo(() => createPasswordStrength(), []);

  const strength = useMemo(() => core.analyze(password), [core, password]);

  const generate = useCallback((length?: number) => {
    const newPassword = generatePassword(length);
    setPassword(newPassword);
    return newPassword;
  }, []);

  return {
    password,
    setPassword,
    level: strength.level,
    score: strength.score,
    label: strength.label,
    color: strength.color,
    strength,
    generate,
  };
}
