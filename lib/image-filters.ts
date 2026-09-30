import type { FilterName } from '@/types';

// Cap for pixel-processing loop. Downsamples high-res camera frames before
// per-pixel work; the strip slot is only 260 px wide so 900 px is ample quality.
const MAX_CAPTURE_W = 900;

/** Returns the canvas dimensions to use for capture, capped for performance. */
export function getCaptureDimensions(videoW: number, videoH: number): [number, number] {
  if (videoW <= MAX_CAPTURE_W) return [videoW, videoH];
  const scale = MAX_CAPTURE_W / videoW;
  return [MAX_CAPTURE_W, Math.round(videoH * scale)];
}

/**
 * Applies the selected filter to an ImageData buffer in-place.
 * Implements the same visual intent as the CSS filter strings in filters.ts.
 * Uses getImageData/putImageData so it works in Safari, Chrome, and Firefox.
 */
export function applyPixelFilter(imageData: ImageData, filter: FilterName): void {
  if (filter === 'original') return;

  const d = imageData.data; // Uint8ClampedArray — values already clamped to 0-255 on write
  const len = d.length;

  switch (filter) {
    // CSS equivalent: grayscale(1) contrast(1.15) brightness(1.05)
    case 'bw': {
      for (let i = 0; i < len; i += 4) {
        // Luminance-weighted grayscale (ITU-R BT.601)
        let v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        // contrast(1.15)
        v = (v / 255 - 0.5) * 1.15 + 0.5;
        v *= 255;
        // brightness(1.05)
        v *= 1.05;
        const g = v < 0 ? 0 : v > 255 ? 255 : v;
        d[i] = g;
        d[i + 1] = g;
        d[i + 2] = g;
        // d[i+3] (alpha) untouched
      }
      break;
    }

    // CSS equivalent: sepia(0.25) saturate(1.35) contrast(1.05) brightness(1.05)
    case 'warm': {
      for (let i = 0; i < len; i += 4) {
        let r = d[i], g = d[i + 1], b = d[i + 2];

        // sepia(0.25) — W3C matrix interpolated by amount
        const sr = r * 0.84825 + g * 0.19225 + b * 0.04725;
        const sg = r * 0.08725 + g * 0.92150 + b * 0.04200;
        const sb = r * 0.06800 + g * 0.13350 + b * 0.78275;
        r = sr; g = sg; b = sb;

        // saturate(1.35)
        const lumS = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = lumS + (r - lumS) * 1.35;
        g = lumS + (g - lumS) * 1.35;
        b = lumS + (b - lumS) * 1.35;

        // contrast(1.05)
        r = (r / 255 - 0.5) * 1.05 + 0.5; r *= 255;
        g = (g / 255 - 0.5) * 1.05 + 0.5; g *= 255;
        b = (b / 255 - 0.5) * 1.05 + 0.5; b *= 255;

        // brightness(1.05)
        r *= 1.05; g *= 1.05; b *= 1.05;

        d[i]     = r < 0 ? 0 : r > 255 ? 255 : r;
        d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
        d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
      break;
    }

    // CSS equivalent: sepia(0.55) contrast(0.9) brightness(0.88) saturate(0.75)
    case 'vintage': {
      for (let i = 0; i < len; i += 4) {
        let r = d[i], g = d[i + 1], b = d[i + 2];

        // sepia(0.55)
        const sr = r * 0.66615 + g * 0.42295 + b * 0.10395;
        const sg = r * 0.19195 + g * 0.82730 + b * 0.09240;
        const sb = r * 0.14960 + g * 0.29370 + b * 0.52205;
        r = sr; g = sg; b = sb;

        // contrast(0.9)
        r = (r / 255 - 0.5) * 0.9 + 0.5; r *= 255;
        g = (g / 255 - 0.5) * 0.9 + 0.5; g *= 255;
        b = (b / 255 - 0.5) * 0.9 + 0.5; b *= 255;

        // brightness(0.88)
        r *= 0.88; g *= 0.88; b *= 0.88;

        // saturate(0.75)
        const lumV = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = lumV + (r - lumV) * 0.75;
        g = lumV + (g - lumV) * 0.75;
        b = lumV + (b - lumV) * 0.75;

        d[i]     = r < 0 ? 0 : r > 255 ? 255 : r;
        d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
        d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
      break;
    }

    // CSS equivalent: brightness(1.06) contrast(0.94) saturate(1.03)
    case 'soft': {
      for (let i = 0; i < len; i += 4) {
        let r = d[i], g = d[i + 1], b = d[i + 2];

        // brightness(1.06)
        r *= 1.06; g *= 1.06; b *= 1.06;

        // contrast(0.94)
        r = (r / 255 - 0.5) * 0.94 + 0.5; r *= 255;
        g = (g / 255 - 0.5) * 0.94 + 0.5; g *= 255;
        b = (b / 255 - 0.5) * 0.94 + 0.5; b *= 255;

        // saturate(1.03)
        const lumF = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = lumF + (r - lumF) * 1.03;
        g = lumF + (g - lumF) * 1.03;
        b = lumF + (b - lumF) * 1.03;

        d[i]     = r < 0 ? 0 : r > 255 ? 255 : r;
        d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
        d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
      break;
    }
  }
}
