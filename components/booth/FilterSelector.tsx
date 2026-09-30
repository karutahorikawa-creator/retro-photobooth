'use client';

import { FILTERS } from '@/lib/filters';
import type { FilterName } from '@/types';

interface Props {
  selected: FilterName;
  onChange(filter: FilterName): void;
}

const FILTER_COLORS: Record<FilterName, string> = {
  original: '#A8A09A',
  warm: '#C4882A',
  bw: '#4A4A4A',
  vintage: '#8B6C47',
  soft: '#C4A898',
};

export default function FilterSelector({ selected, onChange }: Props) {
  return (
    <div className="flex items-center gap-3 justify-center">
      {FILTERS.map((f) => {
        const isSelected = selected === f.name;
        const color = FILTER_COLORS[f.name];
        return (
          <button
            key={f.name}
            onClick={() => onChange(f.name)}
            title={f.label}
            className="flex flex-col items-center gap-1"
            aria-pressed={isSelected}
          >
            <span
              style={{
                backgroundColor: color,
                width: 18,
                height: 18,
                borderRadius: '50%',
                display: 'block',
                boxShadow: isSelected
                  ? `0 0 0 2px #1A0F0A, 0 0 0 4px ${color}`
                  : 'inset 0 2px 4px rgba(0,0,0,0.5)',
                transition: 'box-shadow 0.15s',
              }}
            />
            <span
              style={{
                fontSize: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'monospace',
                color: isSelected ? '#F5F0E8' : '#7A6A5A',
              }}
            >
              {f.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
