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

    // Soft v2: separable box blur (radius 3) blended 40/60 with original,
    // then brightness(1.08) + contrast(0.91). No saturation adjustment.
    // Smooths skin texture and small blemishes while retaining edges
    // (eyes, hair, lips) because they carry high-contrast transitions
    // that a 7-pixel blur at 40% opacity barely attenuates.
    case 'soft': {
      const W = imageData.width;
      const H = imageData.height;
      const r = 3;      // blur radius → 7-pixel kernel
      const kw = 7;     // 2*r + 1

      // Snapshot of original pixels — read-only from here on
      const orig = new Uint8ClampedArray(d);

      // ── Horizontal box blur: orig → tmp ──────────────────────────────
      const tmp = new Uint8ClampedArray(len);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const outIdx = (y * W + x) * 4;
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            for (let k = -r; k <= r; k++) {
              // clamp-to-edge for border pixels
              const sx = x + k < 0 ? 0 : x + k >= W ? W - 1 : x + k;
              sum += orig[(y * W + sx) * 4 + c];
            }
            tmp[outIdx + c] = (sum / kw + 0.5) | 0; // round, not truncate
          }
          tmp[outIdx + 3] = orig[outIdx + 3]; // alpha unchanged
        }
      }

      // ── Vertical box blur: tmp → smooth ──────────────────────────────
      const smooth = new Uint8ClampedArray(len);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const outIdx = (y * W + x) * 4;
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            for (let k = -r; k <= r; k++) {
              const sy = y + k < 0 ? 0 : y + k >= H ? H - 1 : y + k;
              sum += tmp[(sy * W + x) * 4 + c];
            }
            smooth[outIdx + c] = (sum / kw + 0.5) | 0;
          }
          smooth[outIdx + 3] = orig[outIdx + 3];
        }
      }

      // ── Blend + tonal adjustments ─────────────────────────────────────
      for (let i = 0; i < len; i += 4) {
        for (let c = 0; c < 3; c++) {
          // 60% original + 40% blurred (cover-crop analogy for texture)
          let v = orig[i + c] * 0.6 + smooth[i + c] * 0.4;
          // brightness(1.08)
          v *= 1.08;
          // contrast(0.91)
          v = (v / 255 - 0.5) * 0.91 + 0.5;
          v *= 255;
          d[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
        }
        // d[i+3] (alpha) intentionally untouched
      }
      break;
    }
  }
}
