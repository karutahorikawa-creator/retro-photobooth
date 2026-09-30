'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Props {
  imageUrl: string;
  message: string | null;
  hasMusic: boolean;
  playing: boolean;
  onToggleMusic(): void;
}

export default function FlipStrip({ imageUrl, message, hasMusic, playing, onToggleMusic }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Photo hint */}
      {hasMusic && !flipped && (
        <p style={{
          fontSize: 11,
          color: '#8A7A6A',
          fontFamily: '"Special Elite", serif',
          letterSpacing: '0.05em',
          opacity: 0.8,
        }}>
          {playing ? '♫ now playing — click to pause' : 'click the photo to play ♫'}
        </p>
      )}

      {/* 3D flip container */}
      <div
        style={{
          perspective: 1200,
          width: '100%',
          maxWidth: 288,
        }}
      >
        <div
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front — the photo strip */}
          <div
            style={{ backfaceVisibility: 'hidden', cursor: hasMusic ? 'pointer' : 'default' }}
            onClick={hasMusic ? onToggleMusic : undefined}
            role={hasMusic ? 'button' : undefined}
            aria-label={hasMusic ? (playing ? 'Pause music' : 'Play music') : undefined}
          >
            <img
              src={imageUrl}
              alt="Photo strip"
              style={{
                width: '100%',
                maxWidth: 288,
                borderRadius: 2,
                boxShadow: playing
                  ? '0 0 0 3px #C4372A, 0 12px 40px rgba(0,0,0,0.6)'
                  : '0 8px 32px rgba(0,0,0,0.5)',
                transition: 'box-shadow 0.3s',
                display: 'block',
              }}
            />
            {playing && (
              <div style={{
                position: 'absolute',
                bottom: 12,
                right: -8,
                fontSize: 16,
                animation: 'bounce 0.8s ease-in-out infinite alternate',
              }}>
                ♪
                <style>{`
                  @keyframes bounce {
                    0% { transform: translateY(0); opacity: 0.7; }
                    100% { transform: translateY(-6px); opacity: 1; }
                  }
                `}</style>
              </div>
            )}
          </div>

          {/* Back — message */}
          {message && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                backgroundColor: '#F9F3E3',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}
            >
              <p style={{
                fontFamily: '"Special Elite", "Courier New", monospace',
                fontSize: 15,
                color: '#2A1F18',
                textAlign: 'center',
                lineHeight: 1.7,
                fontStyle: 'italic',
              }}>
                "{message}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Flip controls — clearly separate from music play */}
      {message && (
        <button
          onClick={() => setFlipped(f => !f)}
          style={{
            fontSize: 11,
            fontFamily: '"Special Elite", serif',
            color: '#8A7A6A',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            padding: '4px 8px',
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
          }}
        >
          {flipped ? 'flip back ↻' : 'flip over ↻'}
        </button>
      )}
    </div>
  );
}
