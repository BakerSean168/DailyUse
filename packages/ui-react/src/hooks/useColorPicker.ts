import { useState, useCallback, useMemo } from 'react';
import {
  isLightColor,
  hexToRgb,
  rgbToHex,
  type ColorPickerState,
  type UseColorPickerOptions,
} from '@dailyuse/ui-core';

export interface UseColorPickerReturn {
  /** Current color (hex) */
  color: string;
  /** Whether the color is light */
  isLight: boolean;
  /** Set color */
  setColor: (color: string) => void;
  /** Current state */
  state: ColorPickerState;
  /** Color utilities */
  utils: {
    isLightColor: typeof isLightColor;
    hexToRgb: typeof hexToRgb;
    rgbToHex: typeof rgbToHex;
  };
}

/**
 * React hook for color picker state management
 * Wraps @dailyuse/ui-core color picker logic
 */
export function useColorPicker(options: UseColorPickerOptions = {}): UseColorPickerReturn {
  const [color, setColorState] = useState(options.initialColor || '#000000');

  const setColor = useCallback((newColor: string) => {
    setColorState(newColor);
  }, []);

  const isLight = useMemo(() => isLightColor(color), [color]);

  const state: ColorPickerState = useMemo(() => ({ color }), [color]);

  return {
    color,
    isLight,
    setColor,
    state,
    utils: {
      isLightColor,
      hexToRgb,
      rgbToHex,
    },
  };
}
