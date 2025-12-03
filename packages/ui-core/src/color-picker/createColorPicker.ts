/**
 * @dailyuse/ui-core - Color Picker State Machine
 *
 * Framework-agnostic color picker state management and color utilities.
 */

// ============================================================================
// Types
// ============================================================================

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface HSLA extends HSL {
  a: number;
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsv';

export interface ColorPickerState {
  /** Current color in hex format */
  hex: string;
  /** Current RGB values */
  rgb: RGB;
  /** Current HSL values */
  hsl: HSL;
  /** Current HSV values */
  hsv: HSV;
  /** Alpha value (0-1) */
  alpha: number;
  /** Whether the picker is open */
  isOpen: boolean;
}

export interface ColorPickerController {
  /** Get current state */
  getState(): ColorPickerState;
  /** Set color from hex string */
  setHex(hex: string): void;
  /** Set color from RGB values */
  setRGB(rgb: RGB): void;
  /** Set color from HSL values */
  setHSL(hsl: HSL): void;
  /** Set color from HSV values */
  setHSV(hsv: HSV): void;
  /** Set alpha value */
  setAlpha(alpha: number): void;
  /** Open the picker */
  open(): void;
  /** Close the picker */
  close(): void;
  /** Toggle the picker */
  toggle(): void;
  /** Subscribe to state changes */
  subscribe(listener: (state: ColorPickerState) => void): () => void;
}

// ============================================================================
// Color Conversion Utilities
// ============================================================================

/**
 * Parse hex color string to RGB
 */
export function hexToRGB(hex: string): RGB {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '');

  // Handle 3-digit hex
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  // Parse
  const num = parseInt(fullHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Convert RGB to hex string
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert RGB to HSL
 */
export function rgbToHSL(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRGB(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB to HSV
 */
export function rgbToHSV(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

/**
 * Convert HSV to RGB
 */
export function hsvToRGB(hsv: HSV): RGB {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  let r: number, g: number, b: number;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
    default:
      r = 0;
      g = 0;
      b = 0;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// ============================================================================
// Color String Formatting
// ============================================================================

/**
 * Format color as RGB string
 */
export function formatRGB(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * Format color as RGBA string
 */
export function formatRGBA(rgb: RGB, alpha: number): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Format color as HSL string
 */
export function formatHSL(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * Format color as HSLA string
 */
export function formatHSLA(hsl: HSL, alpha: number): string {
  return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`;
}

// ============================================================================
// Color Parsing
// ============================================================================

/**
 * Parse any color string to RGB
 */
export function parseColor(color: string): RGB | null {
  // Try hex
  if (color.startsWith('#')) {
    try {
      return hexToRGB(color);
    } catch {
      return null;
    }
  }

  // Try rgb/rgba
  const rgbMatch = color.match(
    /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)/i
  );
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Try hsl/hsla
  const hslMatch = color.match(
    /hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*[\d.]+)?\s*\)/i
  );
  if (hslMatch) {
    return hslToRGB({
      h: parseInt(hslMatch[1], 10),
      s: parseInt(hslMatch[2], 10),
      l: parseInt(hslMatch[3], 10),
    });
  }

  return null;
}

// ============================================================================
// Core Implementation
// ============================================================================

const DEFAULT_COLOR = '#000000';

/**
 * Create a color picker controller
 */
export function createColorPickerController(
  initialColor = DEFAULT_COLOR
): ColorPickerController {
  const rgb = parseColor(initialColor) ?? hexToRGB(DEFAULT_COLOR);

  let state: ColorPickerState = {
    hex: rgbToHex(rgb),
    rgb,
    hsl: rgbToHSL(rgb),
    hsv: rgbToHSV(rgb),
    alpha: 1,
    isOpen: false,
  };

  const listeners = new Set<(state: ColorPickerState) => void>();

  function notify() {
    for (const listener of listeners) {
      listener({ ...state });
    }
  }

  function updateFromRGB(rgb: RGB) {
    state = {
      ...state,
      hex: rgbToHex(rgb),
      rgb,
      hsl: rgbToHSL(rgb),
      hsv: rgbToHSV(rgb),
    };
    notify();
  }

  return {
    getState() {
      return { ...state };
    },

    setHex(hex: string) {
      const rgb = parseColor(hex);
      if (rgb) {
        updateFromRGB(rgb);
      }
    },

    setRGB(rgb: RGB) {
      updateFromRGB(rgb);
    },

    setHSL(hsl: HSL) {
      updateFromRGB(hslToRGB(hsl));
    },

    setHSV(hsv: HSV) {
      updateFromRGB(hsvToRGB(hsv));
    },

    setAlpha(alpha: number) {
      state = {
        ...state,
        alpha: Math.max(0, Math.min(1, alpha)),
      };
      notify();
    },

    open() {
      state = { ...state, isOpen: true };
      notify();
    },

    close() {
      state = { ...state, isOpen: false };
      notify();
    },

    toggle() {
      state = { ...state, isOpen: !state.isOpen };
      notify();
    },

    subscribe(listener: (state: ColorPickerState) => void) {
      listeners.add(listener);
      listener({ ...state });
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// ============================================================================
// Preset Colors
// ============================================================================

export const MATERIAL_COLORS = [
  '#f44336', // Red
  '#e91e63', // Pink
  '#9c27b0', // Purple
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
  '#2196f3', // Blue
  '#03a9f4', // Light Blue
  '#00bcd4', // Cyan
  '#009688', // Teal
  '#4caf50', // Green
  '#8bc34a', // Light Green
  '#cddc39', // Lime
  '#ffeb3b', // Yellow
  '#ffc107', // Amber
  '#ff9800', // Orange
  '#ff5722', // Deep Orange
  '#795548', // Brown
  '#9e9e9e', // Grey
  '#607d8b', // Blue Grey
];

export const BASIC_COLORS = [
  '#000000', // Black
  '#ffffff', // White
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#00ffff', // Cyan
  '#ff00ff', // Magenta
];

// ============================================================================
// Color Utility Functions
// ============================================================================

/**
 * Get a contrasting text color (black or white) for a background
 */
export function getContrastColor(hex: string): string {
  const rgb = hexToRGB(hex);
  // Using relative luminance formula
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Lighten a color by a percentage
 */
export function lighten(hex: string, percent: number): string {
  const hsl = rgbToHSL(hexToRGB(hex));
  hsl.l = Math.min(100, hsl.l + percent);
  return rgbToHex(hslToRGB(hsl));
}

/**
 * Darken a color by a percentage
 */
export function darken(hex: string, percent: number): string {
  const hsl = rgbToHSL(hexToRGB(hex));
  hsl.l = Math.max(0, hsl.l - percent);
  return rgbToHex(hslToRGB(hsl));
}

/**
 * Generate a color palette from a base color
 */
export function generatePalette(
  hex: string,
  steps = 5
): { lighter: string[]; darker: string[] } {
  const lighter: string[] = [];
  const darker: string[] = [];

  for (let i = 1; i <= steps; i++) {
    const percent = (i / steps) * 40;
    lighter.push(lighten(hex, percent));
    darker.push(darken(hex, percent));
  }

  return { lighter, darker };
}
