import type { FilterName } from '@/types';

export interface FilterDef {
  name: FilterName;
  label: string;
  /** Applied to the live <video> element via CSS `filter:` */
  css: string;
  /** Applied to canvas `ctx.filter` at capture time — same syntax as CSS */
  canvas: string;
}

export const FILTERS: FilterDef[] = [
  {
    name: 'original',
    label: 'Original',
    css: '',
    canvas: '',
  },
  {
    name: 'warm',
    label: 'Warm',
    css: 'sepia(0.25) saturate(1.35) contrast(1.05) brightness(1.05)',
    canvas: 'sepia(0.25) saturate(1.35) contrast(1.05) brightness(1.05)',
  },
  {
    name: 'bw',
    label: 'B&W',
    css: 'grayscale(1) contrast(1.15) brightness(1.05)',
    canvas: 'grayscale(1) contrast(1.15) brightness(1.05)',
  },
  {
    name: 'vintage',
    label: 'Vintage',
    css: 'sepia(0.55) contrast(0.9) brightness(0.88) saturate(0.75)',
    canvas: 'sepia(0.55) contrast(0.9) brightness(0.88) saturate(0.75)',
  },
  {
    name: 'soft',
    label: 'Soft',
    css: 'brightness(1.06) contrast(0.94) saturate(1.03)',
    canvas: 'brightness(1.06) contrast(0.94) saturate(1.03)',
  },
];

const FILTER_MAP = new Map<FilterName, FilterDef>(FILTERS.map(f => [f.name, f]));

/** CSS filter string for the live video preview */
export function getFilterCSS(name: FilterName): string {
  return FILTER_MAP.get(name)?.css ?? '';
}

/** Canvas ctx.filter string for baking the filter into a captured frame */
export function getFilterCanvas(name: FilterName): string {
  return FILTER_MAP.get(name)?.canvas ?? '';
}
