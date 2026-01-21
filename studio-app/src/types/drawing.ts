// Drawing types for 4K Studio Draw Editor

export type BrushType = 'round' | 'square' | 'spray';

export interface BrushSettings {
  type: BrushType;
  size: number;
  opacity: number;
  color: string;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  canvas: HTMLCanvasElement;
  undoStack: ImageData[];
  redoStack: ImageData[];
}

export interface DrawingState {
  layers: Layer[];
  activeLayerIndex: number;
  brush: BrushSettings;
  isDrawing: boolean;
  lastX: number;
  lastY: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface CanvasPreset {
  name: string;
  width: number;
  height: number;
}

// Default canvas presets
export const CANVAS_PRESETS: CanvasPreset[] = [
  { name: 'Square', width: 800, height: 800 },
  { name: 'Portrait', width: 800, height: 1000 },
  { name: 'Landscape', width: 1000, height: 800 },
  { name: 'HD', width: 1920, height: 1080 },
  { name: '4K', width: 3840, height: 2160 },
];

// Default color swatches
export const COLOR_SWATCHES: string[] = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#800000',
  '#808080', '#C0C0C0', '#FF69B4', '#4B0082', '#20B2AA', '#F4A460',
];

// Default brush settings
export const DEFAULT_BRUSH: BrushSettings = {
  type: 'round',
  size: 5,
  opacity: 1,
  color: '#000000',
};

// Drawing configuration
export const DRAWING_CONFIG = {
  maxUndoSteps: 30,
  minBrushSize: 1,
  maxBrushSize: 100,
};

// Generate unique layer ID
export function generateLayerId(): string {
  return `layer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Create a new layer
export function createLayer(
  width: number,
  height: number,
  name: string = 'Layer'
): Layer {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, width, height);
  }

  return {
    id: generateLayerId(),
    name,
    visible: true,
    opacity: 1.0,
    canvas,
    undoStack: [],
    redoStack: [],
  };
}

// HSL to Hex color conversion
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number): string => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Validate hex color
export function isValidHex(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}
