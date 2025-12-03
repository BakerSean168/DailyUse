/**
 * @dailyuse/ui-core - Password Strength
 *
 * Framework-agnostic password strength calculation and generation.
 */

// ============================================================================
// Types
// ============================================================================

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong';

export interface PasswordStrengthResult {
  /** Strength score from 0 to 100 */
  score: number;
  /** Strength level */
  level: PasswordStrengthLevel;
  /** Human-readable strength text */
  text: string;
  /** Suggestions for improving the password */
  suggestions: string[];
  /** Whether the password meets minimum requirements */
  isValid: boolean;
  /** Whether the password is strong enough for sensitive operations */
  isStrong: boolean;
}

export interface PasswordStrengthOptions {
  /** Minimum length required */
  minLength?: number;
  /** Minimum score for isValid (0-100) */
  minValidScore?: number;
  /** Minimum score for isStrong (0-100) */
  minStrongScore?: number;
}

// ============================================================================
// Constants
// ============================================================================

const STRENGTH_LEVELS: Record<
  PasswordStrengthLevel,
  { min: number; max: number; text: string }
> = {
  weak: { min: 0, max: 25, text: '弱' },
  medium: { min: 25, max: 50, text: '中等' },
  strong: { min: 50, max: 75, text: '强' },
  'very-strong': { min: 75, max: 100, text: '非常强' },
};

const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBER_CHARS = '0123456789';
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Calculate password strength score (0-100)
 *
 * Scoring factors:
 * - Length: up to 30 points
 * - Lowercase letters: 10 points
 * - Uppercase letters: 15 points
 * - Numbers: 15 points
 * - Special characters: 20 points
 * - Mixed character types bonus: 10 points
 */
export function calculatePasswordScore(password: string): number {
  if (!password) return 0;

  let score = 0;

  // Length scoring (up to 30 points)
  const length = password.length;
  if (length >= 16) {
    score += 30;
  } else if (length >= 12) {
    score += 25;
  } else if (length >= 8) {
    score += 20;
  } else if (length >= 6) {
    score += 10;
  } else {
    score += 5;
  }

  // Character type scoring
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

  if (hasLowercase) score += 10;
  if (hasUppercase) score += 15;
  if (hasNumbers) score += 15;
  if (hasSpecial) score += 20;

  // Bonus for using multiple character types
  const typesUsed = [hasLowercase, hasUppercase, hasNumbers, hasSpecial].filter(
    Boolean
  ).length;
  if (typesUsed >= 3) {
    score += 10;
  }

  // Penalty for common patterns
  const commonPatterns = [
    /^123/,
    /abc/i,
    /qwerty/i,
    /password/i,
    /111|222|333|444|555|666|777|888|999|000/,
  ];
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score = Math.max(0, score - 15);
      break;
    }
  }

  return Math.min(100, score);
}

/**
 * Get password strength level from score
 */
export function getStrengthLevel(score: number): PasswordStrengthLevel {
  if (score >= 75) return 'very-strong';
  if (score >= 50) return 'strong';
  if (score >= 25) return 'medium';
  return 'weak';
}

/**
 * Get improvement suggestions for a password
 */
export function getPasswordSuggestions(password: string): string[] {
  const suggestions: string[] = [];

  if (!password) {
    suggestions.push('请输入密码');
    return suggestions;
  }

  if (password.length < 8) {
    suggestions.push('建议使用至少 8 个字符');
  }

  if (password.length < 12) {
    suggestions.push('使用 12 个或更多字符可以提高安全性');
  }

  if (!/[a-z]/.test(password)) {
    suggestions.push('添加小写字母');
  }

  if (!/[A-Z]/.test(password)) {
    suggestions.push('添加大写字母');
  }

  if (!/\d/.test(password)) {
    suggestions.push('添加数字');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    suggestions.push('添加特殊字符 (!@#$%^&* 等)');
  }

  return suggestions;
}

/**
 * Calculate full password strength result
 */
export function calculatePasswordStrength(
  password: string,
  options: PasswordStrengthOptions = {}
): PasswordStrengthResult {
  const { minLength = 6, minValidScore = 25, minStrongScore = 50 } = options;

  const score = calculatePasswordScore(password);
  const level = getStrengthLevel(score);
  const suggestions = getPasswordSuggestions(password);

  return {
    score,
    level,
    text: STRENGTH_LEVELS[level].text,
    suggestions,
    isValid: (password?.length ?? 0) >= minLength && score >= minValidScore,
    isStrong: score >= minStrongScore,
  };
}

// ============================================================================
// Password Generation
// ============================================================================

/**
 * Generate a strong random password
 */
export function generateStrongPassword(length = 16): string {
  if (length < 8) {
    throw new Error('Password length must be at least 8 characters');
  }

  const allChars = LOWERCASE_CHARS + UPPERCASE_CHARS + NUMBER_CHARS + SPECIAL_CHARS;
  const result: string[] = [];

  // Ensure at least one of each type
  result.push(LOWERCASE_CHARS[Math.floor(Math.random() * LOWERCASE_CHARS.length)]);
  result.push(UPPERCASE_CHARS[Math.floor(Math.random() * UPPERCASE_CHARS.length)]);
  result.push(NUMBER_CHARS[Math.floor(Math.random() * NUMBER_CHARS.length)]);
  result.push(SPECIAL_CHARS[Math.floor(Math.random() * SPECIAL_CHARS.length)]);

  // Fill the rest with random characters
  for (let i = result.length; i < length; i++) {
    result.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Shuffle the result
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

/**
 * Generate a memorable passphrase (word-based)
 */
export function generatePassphrase(wordCount = 4, separator = '-'): string {
  // Simple word list for demonstration
  // In production, you'd use a larger word list
  const words = [
    'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest',
    'garden', 'harbor', 'island', 'jungle', 'knight', 'lemon',
    'mountain', 'night', 'ocean', 'planet', 'queen', 'river',
    'sunset', 'thunder', 'umbrella', 'volcano', 'winter', 'yellow',
    'zebra', 'autumn', 'breeze', 'crystal', 'diamond', 'emerald',
  ];

  const selected: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * words.length);
    selected.push(words[randomIndex]);
  }

  // Capitalize first letter of each word and add a number
  const passphrase = selected
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(separator);

  // Add a random number for extra entropy
  const randomNum = Math.floor(Math.random() * 100);

  return `${passphrase}${separator}${randomNum}`;
}
