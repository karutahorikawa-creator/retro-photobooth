// filters.ts is not imported here — photos arrive pre-filtered from capturePhoto()
import type { FilterName } from '@/types';

const STRIP_INNER_WIDTH = 260;
const PADDING_H = 14;
const PADDING_TOP = 14;
const PADDING_BOTTOM = 16;
const PHOTO_RATIO = 3 / 4; // width:height
const PHOTO_HEIGHT = Math.round(STRIP_INNER_WIDTH / PHOTO_RATIO); // taller than wide? No: ratio 3/4 means h = w * 4/3
// Actually: width = 260, ratio width:height = 3:4, so height = 260 * 4/3 ≈ 347
// That's very tall per photo. Let me use landscape: width:height = 4:3
// Photo is landscape: 260 wide × 195 tall
const PHOTO_H = Math.round(STRIP_INNER_WIDTH * 3 / 4); // 195
const GAP = 8;
const FOOTER_H = 52;

export const STRIP_CANVAS_WIDTH = STRIP_INNER_WIDTH + PADDING_H * 2; // 288
export const STRIP_CANVAS_HEIGHT =
  PADDING_TOP + PHOTO_H * 4 + GAP * 3 + PADDING_BOTTOM + FOOTER_H; // 14 + 195*4 + 24 + 16 + 52 = 886

export async function generatePhotoStrip(
  photos: string[], // dataURLs of 4 captured photos
  filter: FilterName
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = STRIP_CANVAS_WIDTH;
  canvas.height = STRIP_CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Cream background
  ctx.fillStyle = '#F9F3E3';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle border
  ctx.strokeStyle = '#D4C8A8';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

  // Photos are pre-filtered at capture time — do not apply ctx.filter here
  // or every non-original filter would be applied twice.
  for (let i = 0; i < Math.min(photos.length, 4); i++) {
    const img = await loadImage(photos[i]);
    const y = PADDING_TOP + i * (PHOTO_H + GAP);

    ctx.drawImage(img, PADDING_H, y, STRIP_INNER_WIDTH, PHOTO_H);

    // Thin border around each photo
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(PADDING_H, y, STRIP_INNER_WIDTH, PHOTO_H);
  }

  // Footer
  const footerY = PADDING_TOP + PHOTO_H * 4 + GAP * 3 + PADDING_BOTTOM;
  drawFooter(ctx, footerY, canvas.width);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/jpeg',
      0.88
    );
  });
}

function drawFooter(ctx: CanvasRenderingContext2D, y: number, width: number) {
  const centerX = width / 2;
  const lineY = y + 16;

  ctx.fillStyle = '#8B7355';
  ctx.font = '600 11px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '2px';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).toUpperCase();

  ctx.fillText(dateStr, centerX, lineY);

  // Heart
  ctx.font = '16px serif';
  ctx.fillStyle = '#C4372A';
  ctx.fillText('♡', centerX, lineY + 22);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
