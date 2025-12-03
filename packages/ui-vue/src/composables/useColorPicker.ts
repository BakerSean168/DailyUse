/**
 * @dailyuse/ui-vue - Color Picker Composables
 *
 * Vue 3 composables wrapping @dailyuse/ui-core color picker state.
 */

import {
  ref,
  readonly,
  onUnmounted,
  type Ref,
  type DeepReadonly,
} from 'vue';
import {
  createColorPickerController,
  hexToRGB,
  rgbToHex,
  rgbToHSL,
  hslToRGB,
  rgbToHSV,
  hsvToRGB,
  formatRGB,
  formatRGBA,
  formatHSL,
  formatHSLA,
  parseColor,
  getContrastColor,
  lighten,
  darken,
  generatePalette,
  MATERIAL_COLORS,
  BASIC_COLORS,
  type ColorPickerState,
  type RGB,
  type HSL,
  type HSV,
  type ColorFormat,
} from '@dailyuse/ui-core';

// Re-export utilities and types
export {
  hexToRGB,
  rgbToHex,
  rgbToHSL,
  hslToRGB,
  rgbToHSV,
  hsvToRGB,
  formatRGB,
  formatRGBA,
  formatHSL,
  formatHSLA,
  parseColor,
  getContrastColor,
  lighten,
  darken,
  generatePalette,
  MATERIAL_COLORS,
  BASIC_COLORS,
};

export type { ColorPickerState, RGB, HSL, HSV, ColorFormat };

// ============================================================================
// Color Picker Composable
// ============================================================================

/**
 * Color picker composable
 */
export function useColorPicker(initialColor = '#000000'): {
  /** Reactive color picker state */
  state: DeepReadonly<Ref<ColorPickerState>>;
  /** Current hex color */
  hex: Ref<string>;
  /** Current RGB values */
  rgb: Ref<RGB>;
  /** Current HSL values */
  hsl: Ref<HSL>;
  /** Current HSV values */
  hsv: Ref<HSV>;
  /** Alpha value */
  alpha: Ref<number>;
  /** Whether picker is open */
  isOpen: Ref<boolean>;
  /** Contrast text color */
  contrastColor: Ref<string>;
  /** Set color from hex */
  setHex: (hex: string) => void;
  /** Set color from RGB */
  setRGB: (rgb: RGB) => void;
  /** Set color from HSL */
  setHSL: (hsl: HSL) => void;
  /** Set color from HSV */
  setHSV: (hsv: HSV) => void;
  /** Set alpha value */
  setAlpha: (alpha: number) => void;
  /** Open picker */
  open: () => void;
  /** Close picker */
  close: () => void;
  /** Toggle picker */
  toggle: () => void;
} {
  const controller = createColorPickerController(initialColor);
  const initialState = controller.getState();

  const state = ref<ColorPickerState>(initialState);
  const hex = ref(initialState.hex);
  const rgb = ref<RGB>(initialState.rgb);
  const hsl = ref<HSL>(initialState.hsl);
  const hsv = ref<HSV>(initialState.hsv);
  const alpha = ref(initialState.alpha);
  const isOpen = ref(initialState.isOpen);
  const contrastColor = ref(getContrastColor(initialState.hex));

  const unsubscribe = controller.subscribe((newState: ColorPickerState) => {
    state.value = newState;
    hex.value = newState.hex;
    rgb.value = newState.rgb;
    hsl.value = newState.hsl;
    hsv.value = newState.hsv;
    alpha.value = newState.alpha;
    isOpen.value = newState.isOpen;
    contrastColor.value = getContrastColor(newState.hex);
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return {
    state: readonly(state),
    hex,
    rgb,
    hsl,
    hsv,
    alpha,
    isOpen,
    contrastColor,
    setHex: controller.setHex.bind(controller),
    setRGB: controller.setRGB.bind(controller),
    setHSL: controller.setHSL.bind(controller),
    setHSV: controller.setHSV.bind(controller),
    setAlpha: controller.setAlpha.bind(controller),
    open: controller.open.bind(controller),
    close: controller.close.bind(controller),
    toggle: controller.toggle.bind(controller),
  };
}

// ============================================================================
// Simple Color Model
// ============================================================================

/**
 * Simple color value composable (just the value, no picker state)
 */
export function useColor(initialColor = '#000000'): {
  /** Current hex color */
  hex: Ref<string>;
  /** Current RGB values */
  rgb: Ref<RGB>;
  /** Current HSL values */
  hsl: Ref<HSL>;
  /** Contrast text color */
  contrastColor: Ref<string>;
  /** Set color from any format */
  setColor: (color: string) => void;
  /** Lighten the color */
  lighten: (percent: number) => string;
  /** Darken the color */
  darken: (percent: number) => string;
} {
  const parsedRGB = parseColor(initialColor) ?? { r: 0, g: 0, b: 0 };

  const hex = ref(rgbToHex(parsedRGB));
  const rgb = ref<RGB>(parsedRGB);
  const hsl = ref<HSL>(rgbToHSL(parsedRGB));
  const contrastColor = ref(getContrastColor(hex.value));

  function setColor(color: string) {
    const newRGB = parseColor(color);
    if (newRGB) {
      rgb.value = newRGB;
      hex.value = rgbToHex(newRGB);
      hsl.value = rgbToHSL(newRGB);
      contrastColor.value = getContrastColor(hex.value);
    }
  }

  return {
    hex,
    rgb,
    hsl,
    contrastColor,
    setColor,
    lighten: (percent: number) => lighten(hex.value, percent),
    darken: (percent: number) => darken(hex.value, percent),
  };
}
