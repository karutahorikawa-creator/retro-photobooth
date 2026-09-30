'use client';

import { useState } from 'react';
import { validateMusicUrl, detectMusicProvider } from '@/lib/music-detector';

interface Props {
  value: string;
  onChange(url: string): void;
  onSkip(): void;
  onConfirm(url: string): void;
}

export default function MusicInput({ value, onChange, onSkip, onConfirm }: Props) {
  const [touched, setTouched] = useState(false);

  const validation = touched ? validateMusicUrl(value) : { valid: true };
  const detected = value.trim() ? detectMusicProvider(value) : null;

  function handleConfirm() {
    setTouched(true);
    if (!value.trim()) { onSkip(); return; }
    const result = validateMusicUrl(value);
    if (!result.valid) return;
    onConfirm(value);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, marginBottom: 4 }}>♫</div>
        <p style={{ fontSize: 13, color: '#F5F0E8', fontFamily: '"Special Elite", serif', marginBottom: 2 }}>
          Add a song to this memory
        </p>
        <p style={{ fontSize: 10, color: '#8A7A6A', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          YouTube or Spotify
        </p>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="url"
          placeholder="Paste a music link here..."
          value={value}
          onChange={e => { onChange(e.target.value); setTouched(false); }}
          onBlur={() => value && setTouched(true)}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#0D0805',
            border: `1.5px solid ${!validation.valid ? '#C4372A' : detected ? '#6B8A4E' : '#3D2B1F'}`,
            borderRadius: 4,
            color: '#F5F0E8',
            fontFamily: '"Special Elite", "Courier New", monospace',
            fontSize: 12,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {detected && (
          <span style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 10,
            color: '#6B8A4E',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {detected.provider} ✓
          </span>
        )}
      </div>

      {!validation.valid && (
        <p style={{ fontSize: 11, color: '#C4372A', fontFamily: 'monospace', textAlign: 'center', margin: '-8px 0 0' }}>
          {validation.error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onSkip}
          style={{
            flex: 1,
            padding: '10px 0',
            backgroundColor: 'transparent',
            border: '1.5px solid #3D2B1F',
            borderRadius: 4,
            color: '#7A6A5A',
            fontFamily: '"Special Elite", serif',
            fontSize: 13,
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          Skip ↩
        </button>
        <button
          onClick={handleConfirm}
          style={{
            flex: 2,
            padding: '10px 0',
            backgroundColor: '#C4372A',
            border: 'none',
            borderRadius: 4,
            color: '#F5F0E8',
            fontFamily: '"Special Elite", serif',
            fontSize: 13,
            cursor: 'pointer',
            letterSpacing: '0.05em',
            fontWeight: 700,
          }}
        >
          Continue ♩
        </button>
      </div>
    </div>
  );
}
